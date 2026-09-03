"""Test PDF Processing Layer: Text extraction, metadata, forensics, page rendering cache, CLI, and persistence."""

from datetime import datetime, timezone
from pathlib import Path
import subprocess
import sys
from unittest.mock import AsyncMock, MagicMock
import uuid
import fitz  # PyMuPDF
import pytest

from backend.models.entities import Document, DocumentPage
from pipeline.pdf.processor import PDFProcessor
from pipeline.pdf.renderer import PDFRenderer


@pytest.fixture
def single_page_pdf() -> bytes:
    """Generate a single-page PDF with embedded text layer and metadata."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text(
        (72, 100),
        "Chennai Petroleum Corporation Limited (CPCL) Tender Document for Process Pumps.\n"
        "Technical Eligibility Criteria: Minimum turnover INR 6 Crore in last 3 financial years.\n"
        "Permanent Account Number: AAACB1234F and GSTIN: 33AAACB1234F1Z5.",
        fontsize=11,
    )
    doc.set_metadata({
        "title": "CPCL Centrifugal Pump Criteria",
        "author": "Chief Procurement Officer, CPCL",
        "producer": "PyMuPDF Test Suite",
    })
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture
def multi_page_pdf() -> bytes:
    """Generate a 3-page PDF with varied text content on each page."""
    doc = fitz.open()
    for i in range(3):
        page = doc.new_page(width=595, height=842)
        page.insert_text(
            (72, 100),
            f"Section {i + 1}: General Conditions of Contract (CPCL Ref: GCC-2026).\n"
            f"Detailed sub-clause {i + 1}.1 requires compliance with Rule 144(xi) of GFR 2017.",
            fontsize=11,
        )
    doc.set_metadata({"title": "Multi-Page Contract Terms"})
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture
def scanned_image_pdf() -> bytes:
    """Generate an image-only PDF with 0 extractable text characters (simulating a scanned document)."""
    doc = fitz.open()
    page = doc.new_page(width=400, height=400)
    # Create a 200x200 dummy pixmap image and insert it
    pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 200, 200), 0)
    pix.clear_with(200)  # Light gray image
    page.insert_image(page.rect, pixmap=pix)
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture
def empty_pdf() -> bytes:
    """Generate a valid PDF document byte stream with 0 pages."""
    return (
        b"%PDF-1.4\n"
        b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n"
        b"2 0 obj\n<< /Type /Pages /Count 0 >>\nendobj\n"
        b"xref\n0 3\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n"
        b"trailer\n<< /Root 1 0 R /Size 3 >>\nstartxref\n103\n%%EOF"
    )


@pytest.fixture
def blank_page_pdf() -> bytes:
    """Generate a PDF document with 1 page containing 0 characters."""
    doc = fitz.open()
    doc.new_page(width=595, height=842)
    data = doc.tobytes()
    doc.close()
    return data


# =========================================================================
# 1. Single-Page & Multi-Page Extraction Tests
# =========================================================================

def test_single_page_pdf_processing(single_page_pdf: bytes):
    """Test text extraction, word bounding boxes, and metadata on a single-page PDF."""
    processor = PDFProcessor()
    result = processor.process(single_page_pdf)

    assert result.is_valid is True
    assert result.page_count == 1
    assert result.overall_text_source == "TEXT_LAYER"
    assert result.doc_metadata.title == "CPCL Centrifugal Pump Criteria"
    assert result.doc_metadata.author == "Chief Procurement Officer, CPCL"

    page = result.pages[0]
    assert page.page_no == 1
    assert "Chennai Petroleum Corporation Limited" in page.text
    assert "AAACB1234F" in page.text
    assert page.confidence == 1.0
    assert page.metadata.char_count > 50
    assert page.metadata.has_text_layer is True
    assert page.metadata.text_source == "TEXT_LAYER"

    # Verify bounding boxes
    assert len(page.words) > 10
    first_word = page.words[0]
    assert first_word.text == "Chennai"
    assert first_word.x0 > 0
    assert first_word.y0 > 0


def test_multi_page_pdf_processing(multi_page_pdf: bytes):
    """Test multi-page iteration, page numbering, and text capture."""
    processor = PDFProcessor()
    result = processor.process(multi_page_pdf)

    assert result.is_valid is True
    assert result.page_count == 3
    assert result.overall_text_source == "TEXT_LAYER"
    assert len(result.pages) == 3

    for idx, page in enumerate(result.pages):
        assert page.page_no == idx + 1
        assert f"Section {idx + 1}" in page.text
        assert page.metadata.text_source == "TEXT_LAYER"


# =========================================================================
# 2. Scanned, Empty, and Blank Page Tests
# =========================================================================

def test_scanned_pdf_flags_need_ocr(scanned_image_pdf: bytes):
    """Test that image-only PDFs extract 0 text chars and are marked as SCANNED."""
    processor = PDFProcessor()
    result = processor.process(scanned_image_pdf)

    assert result.is_valid is True
    assert result.page_count == 1
    assert result.overall_text_source == "SCANNED"

    page = result.pages[0]
    assert page.text.strip() == ""
    assert page.metadata.char_count == 0
    assert page.metadata.has_text_layer is False
    assert page.metadata.text_source == "SCANNED"
    assert page.confidence == 0.0
    assert page.metadata.image_count >= 1


def test_empty_zero_page_pdf(empty_pdf: bytes):
    """Test handling of an empty PDF with 0 pages without raising errors."""
    processor = PDFProcessor()
    result = processor.process(empty_pdf)

    assert result.is_valid is True
    assert result.page_count == 0
    assert result.overall_text_source == "EMPTY"
    assert len(result.pages) == 0


def test_blank_single_page_pdf(blank_page_pdf: bytes):
    """Test handling of a PDF with 1 blank page."""
    processor = PDFProcessor()
    result = processor.process(blank_page_pdf)

    assert result.is_valid is True
    assert result.page_count == 1
    assert result.overall_text_source == "SCANNED"
    assert result.pages[0].metadata.char_count == 0


# =========================================================================
# 3. Corrupt PDF Handling Tests
# =========================================================================

def test_corrupt_pdf_returns_invalid_result():
    """Test that arbitrary non-PDF bytes return an invalid result with error details."""
    processor = PDFProcessor()
    bad_bytes = b"NOT_A_PDF_STREAM_RANDOM_GARBAGE_12345"
    result = processor.process(bad_bytes)

    assert result.is_valid is False
    assert "Invalid PDF header" in result.error_message


def test_truncated_pdf_stream():
    """Test that a truncated PDF with valid header but incomplete trailer returns an error."""
    processor = PDFProcessor()
    truncated_bytes = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n"
    result = processor.process(truncated_bytes)

    # Either detected as corrupt or parsed as 0-page
    assert result.is_valid is False or result.page_count == 0


# =========================================================================
# 4. Cached Page Rendering Tests
# =========================================================================

def test_cached_page_rendering(single_page_pdf: bytes, tmp_path: Path):
    """Test that page rendering generates PNG and subsequent call hits cache."""
    cache_dir = tmp_path / "rendered_cache"
    processor = PDFProcessor()

    # First run (renders and writes cache)
    res1 = processor.process(
        single_page_pdf,
        render_pages=True,
        cache_dir=cache_dir,
        doc_id="doc_test_101",
    )
    assert res1.is_valid is True
    png_path = Path(res1.pages[0].png_path)
    assert png_path.exists()
    assert png_path.stat().st_size > 0
    initial_mtime = png_path.stat().st_mtime_ns

    # Second run with same doc_id (should hit cache without re-rendering)
    res2 = processor.process(
        single_page_pdf,
        render_pages=True,
        cache_dir=cache_dir,
        doc_id="doc_test_101",
    )
    assert res2.is_valid is True
    cached_path = Path(res2.pages[0].png_path)
    assert cached_path == png_path
    # Mod time should be identical (cache hit)
    assert cached_path.stat().st_mtime_ns == initial_mtime


# =========================================================================
# 5. CLI Execution Test
# =========================================================================

def test_cli_execution(single_page_pdf: bytes, tmp_path: Path):
    """Test executing the PDF processor via python -m pipeline.pdf.cli."""
    test_file = tmp_path / "sample.pdf"
    test_file.write_bytes(single_page_pdf)

    # 1. Summary CLI output
    cmd = [sys.executable, "-m", "pipeline.pdf.cli", str(test_file)]
    res = subprocess.run(cmd, capture_output=True, text=True, check=True)
    assert "VIGILBID PDF PROCESSING SUMMARY" in res.stdout
    assert "Page Count:      1" in res.stdout
    assert "Text Source:     TEXT_LAYER" in res.stdout

    # 2. JSON CLI output
    cmd_json = [sys.executable, "-m", "pipeline.pdf.cli", str(test_file), "--json"]
    res_json = subprocess.run(cmd_json, capture_output=True, text=True, check=True)
    assert '"is_valid": true' in res_json.stdout
    assert '"page_count": 1' in res_json.stdout


# =========================================================================
# 6. Database Persistence Test
# =========================================================================

@pytest.mark.asyncio
async def test_persist_to_database(single_page_pdf: bytes):
    """Test persisting extracted pages and metadata into Document and DocumentPage models."""
    processor = PDFProcessor()
    process_result = processor.process(single_page_pdf)

    doc_id = uuid.uuid4()
    mock_doc = Document(
        id=doc_id,
        bidder_id=uuid.uuid4(),
        original_filename="sample_cert.pdf",
        sha256="abcdef1234567890",
        storage_path="/data/sample_cert.pdf",
    )

    mock_session = AsyncMock()
    mock_session.add = MagicMock()
    # Mock Document lookup
    exec_result_mock = MagicMock()
    exec_result_mock.scalar_one_or_none.return_value = mock_doc
    mock_session.execute.return_value = exec_result_mock

    # Run persistence
    pages = await PDFProcessor.persist_to_database(mock_session, doc_id, process_result)

    assert len(pages) == 1
    assert mock_doc.page_count == 1
    assert mock_doc.text_source == "TEXT_LAYER"
    assert mock_doc.metadata_fields["title"] == "CPCL Centrifugal Pump Criteria"
    assert pages[0].document_id == doc_id
    assert pages[0].page_no == 1
    assert "AAACB1234F" in pages[0].text
    assert pages[0].words["count"] > 10
    mock_session.commit.assert_called_once()
