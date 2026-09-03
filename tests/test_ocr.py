"""Test OCR Abstraction: OCRProvider interface, UnlimitedOCRAdapter, FallbackOCRAdapter, and Textifier integration."""

import io
from pathlib import Path
from unittest.mock import MagicMock
import fitz
import pytest

from pipeline.ocr.interface import OCRProvider, OCRRegion, OCRResult
from pipeline.ocr.factory import get_ocr_provider
from pipeline.ocr.fallback_adapter import FallbackOCRAdapter
from pipeline.ocr.interface import OCRProvider, OCRRegion, OCRResult
from pipeline.ocr.textifier import Textifier
from pipeline.ocr.unlimited_adapter import UnlimitedOCRAdapter


@pytest.fixture
def sample_pdf_with_text() -> bytes:
    """PDF with a vector text layer."""
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text(
        (72, 100),
        "Chennai Petroleum Corporation Limited (CPCL) Evaluation.\n"
        "Tender Criteria: Turnover >= 6 Crore, Local Content >= 50%.\n"
        "Vendor GSTIN: 33ABCDE1234F1Z5.",
        fontsize=12,
    )
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture
def sample_scanned_pdf() -> bytes:
    """Image-only PDF with 0 extractable text characters."""
    doc = fitz.open()
    page = doc.new_page(width=300, height=300)
    pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 100, 100), 0)
    pix.clear_with(240)
    page.insert_image(page.rect, pixmap=pix)
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture
def sample_image_bytes() -> bytes:
    """Simple 100x100 PNG image."""
    pix = fitz.Pixmap(fitz.csRGB, fitz.IRect(0, 0, 100, 100), 0)
    pix.clear_with(255)
    return pix.tobytes("png")


# =========================================================================
# 1. Interface & Data Contract Tests
# =========================================================================

def test_ocr_result_contract():
    """Test OCRResult and OCRRegion contract serialization."""
    region = OCRRegion(
        text="INSPECTION",
        bbox=(10.0, 20.0, 100.0, 40.0),
        confidence=0.985,
    )
    result = OCRResult(
        document_id="doc-12345",
        page=1,
        text="INSPECTION PASS",
        confidence=0.95,
        regions=[region],
        processing_time=0.1245,
        provider="test-provider",
    )

    data = result.to_dict()
    assert data["document_id"] == "doc-12345"
    assert data["page"] == 1
    assert data["text"] == "INSPECTION PASS"
    assert data["confidence"] == 0.95
    assert len(data["regions"]) == 1
    assert data["regions"][0]["text"] == "INSPECTION"
    assert data["regions"][0]["bbox"] == [10.0, 20.0, 100.0, 40.0]
    assert data["provider"] == "test-provider"


# =========================================================================
# 2. UnlimitedOCRAdapter Tests (Hardware Awareness, Retries, Failure Handling)
# =========================================================================

def test_unlimited_adapter_device_awareness():
    """Test that UnlimitedOCRAdapter inspects and reports hardware environment."""
    adapter = UnlimitedOCRAdapter()
    info = adapter.get_device_info()

    assert info["provider"] == "unlimited-ocr"
    assert "device" in info
    assert "cuda_available" in info
    assert isinstance(info["cuda_available"], bool)
    assert "recommended_precision" in info


def test_unlimited_adapter_graceful_missing_dependency_reporting(sample_image_bytes: bytes):
    """Test that Unlimited-OCR does NOT fake success when dependencies are missing."""
    adapter = UnlimitedOCRAdapter()
    # If transformers is missing, extracting from image should report error in OCRResult
    if not adapter.is_available():
        res = adapter.extract_from_image(sample_image_bytes, page=1)
        assert res.confidence == 0.0
        assert res.error is not None
        assert "Unlimited-OCR unavailable" in res.error


def test_unlimited_adapter_mock_model_inference_and_normalization(sample_image_bytes: bytes):
    """Test model inference, output normalization, and region parsing with mock model."""
    mock_model = MagicMock()
    mock_model.infer.return_value = {
        "text": "<image>GST REG-06 CERTIFICATE OF REGISTRATION",
        "confidence": 0.94,
        "regions": [
            {"text": "GST", "bbox": (50, 50, 90, 70), "confidence": 0.96},
            {"text": "REG-06", "bbox": (95, 50, 150, 70), "confidence": 0.92},
        ],
    }
    mock_tokenizer = MagicMock()

    adapter = UnlimitedOCRAdapter(
        model_loader=lambda: (mock_model, mock_tokenizer),
    )

    result = adapter.extract_from_image(sample_image_bytes, page=1, document_id="doc-test-99")
    assert result.error is None
    assert result.text == "GST REG-06 CERTIFICATE OF REGISTRATION"
    assert result.confidence == 0.94
    assert len(result.regions) == 2
    assert result.regions[0].text == "GST"
    assert result.provider == "unlimited-ocr"


def test_unlimited_adapter_retry_behavior_on_transient_failure(sample_image_bytes: bytes):
    """Test that transient inference errors trigger retry loop before succeeding."""
    mock_model = MagicMock()
    # Fail on first call, succeed on second call
    mock_model.infer.side_effect = [
        RuntimeError("Transient CUDA stream synchronization error"),
        {"text": "Retried Text Success", "confidence": 0.91},
    ]

    adapter = UnlimitedOCRAdapter(
        max_retries=2,
        backoff_factor=0.01,  # Fast backoff for tests
        model_loader=lambda: (mock_model, MagicMock()),
    )

    result = adapter.extract_from_image(sample_image_bytes, page=1)
    assert result.error is None
    assert result.text == "Retried Text Success"
    assert mock_model.infer.call_count == 2


def test_unlimited_adapter_failure_handling_after_max_retries(sample_image_bytes: bytes):
    """Test that persistent inference failures return an error result without crashing."""
    mock_model = MagicMock()
    mock_model.infer.side_effect = RuntimeError("Persistent OOM")

    adapter = UnlimitedOCRAdapter(
        max_retries=1,
        backoff_factor=0.01,
        model_loader=lambda: (mock_model, MagicMock()),
    )

    result = adapter.extract_from_image(sample_image_bytes, page=1)
    assert result.text == ""
    assert result.confidence == 0.0
    assert "inference failed after 2 attempts" in result.error


# =========================================================================
# 3. FallbackOCRAdapter Tests (Development Fallback)
# =========================================================================

def test_fallback_adapter_availability():
    """Test that FallbackOCRAdapter is always available for local dev."""
    adapter = FallbackOCRAdapter()
    assert adapter.is_available() is True
    assert adapter.name == "fallback-ocr"
    info = adapter.get_device_info()
    assert info["device"] == "cpu"
    assert info["ready"] is True


def test_fallback_adapter_pdf_text_layer_extraction(sample_pdf_with_text: bytes):
    """Test extracting from a PDF with a text layer using FallbackOCRAdapter."""
    adapter = FallbackOCRAdapter()
    result = adapter.extract_from_pdf_page(sample_pdf_with_text, page=1, document_id="doc-text")

    assert result.error is None
    assert result.confidence == 1.0
    assert "Chennai Petroleum Corporation Limited" in result.text
    assert len(result.regions) > 5
    assert result.provider == "fallback-ocr"


def test_fallback_adapter_out_of_bounds_page(sample_pdf_with_text: bytes):
    """Test out of bounds page request handling."""
    adapter = FallbackOCRAdapter()
    result = adapter.extract_from_pdf_page(sample_pdf_with_text, page=99)
    assert result.confidence == 0.0
    assert "out of bounds" in result.error


# =========================================================================
# 4. OCR Factory Resolution Tests
# =========================================================================

def test_ocr_factory_resolution():
    """Test resolving providers through get_ocr_provider factory."""
    # 1. Default resolution returns FallbackOCRAdapter
    provider = get_ocr_provider()
    assert isinstance(provider, FallbackOCRAdapter)

    # 2. Requesting fallback explicitly
    provider_fallback = get_ocr_provider("fallback")
    assert isinstance(provider_fallback, FallbackOCRAdapter)

    # 3. Requesting unlimited when unavailable gracefully degrades to FallbackOCRAdapter
    provider_unlimited = get_ocr_provider("unlimited")
    assert isinstance(provider_unlimited, (UnlimitedOCRAdapter, FallbackOCRAdapter))


# =========================================================================
# 5. Textifier Integration Tests
# =========================================================================

def test_textifier_prioritizes_text_layer(sample_pdf_with_text: bytes):
    """Test that Textifier routes text-layer PDFs directly with 1.0 confidence."""
    mock_ocr = MagicMock(spec=OCRProvider)
    textifier = Textifier(ocr_provider=mock_ocr)

    page_res = textifier.process_page(sample_pdf_with_text, page_no=1)
    assert page_res.source == "text_layer"
    assert page_res.confidence == 1.0
    assert "Chennai Petroleum Corporation Limited" in page_res.text
    # mock_ocr should NOT have been invoked
    mock_ocr.extract_from_pdf_page.assert_not_called()


def test_textifier_falls_back_to_ocr_for_scanned_page(sample_scanned_pdf: bytes):
    """Test that Textifier delegates to OCRProvider when page text is sparse/scanned."""
    mock_ocr = MagicMock(spec=OCRProvider)
    mock_ocr.extract_from_pdf_page.return_value = OCRResult(
        document_id=None,
        page=1,
        text="SCANNED OCR RESULT",
        confidence=0.88,
        regions=[OCRRegion(text="SCANNED", bbox=(10, 10, 50, 30), confidence=0.88)],
        processing_time=0.4,
        provider="mock-ocr",
    )

    textifier = Textifier(ocr_provider=mock_ocr)
    page_res = textifier.process_page(sample_scanned_pdf, page_no=1)

    assert page_res.source == "ocr"
    assert page_res.text == "SCANNED OCR RESULT"
    assert page_res.confidence == 0.88
    mock_ocr.extract_from_pdf_page.assert_called_once()
