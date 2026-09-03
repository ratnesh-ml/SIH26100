"""PDF Processing Engine: Text-layer extraction, metadata analysis, forensics, and database persistence."""

import hashlib
import io
import logging
from pathlib import Path
from typing import Optional, Union
import uuid
import fitz  # PyMuPDF
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.entities import Document, DocumentPage
from pipeline.pdf.contract import (
    DocumentMetadata,
    ForensicSignals,
    PDFProcessResult,
    PageMetadata,
    PageProcessResult,
    WordBox,
)
from pipeline.pdf.renderer import PDFRenderer

logger = logging.getLogger("vigilbid.pipeline.pdf.processor")

# Text-layer density threshold from architecture specification (docs/02 Section 06.1)
MIN_TEXT_LAYER_CHARS = 50


class PDFProcessor:
    """Extracts text layers, words, bounding boxes, document metadata, and forensic anomalies."""

    def __init__(self, renderer: Optional[PDFRenderer] = None):
        self.renderer = renderer or PDFRenderer()

    def process(
        self,
        pdf_source: Union[str, Path, bytes],
        render_pages: bool = False,
        cache_dir: Optional[Path] = None,
        doc_id: Optional[str] = None,
    ) -> PDFProcessResult:
        """Process a PDF from a filepath or in-memory bytes."""
        doc: Optional[fitz.Document] = None
        try:
            # 1. Open Document safely
            if isinstance(pdf_source, bytes):
                if not pdf_source.startswith(b"%PDF-"):
                    return PDFProcessResult(
                        is_valid=False,
                        error_message="Invalid PDF header: File does not begin with '%PDF-' magic bytes",
                    )
                doc = fitz.open(stream=pdf_source, filetype="pdf")
                doc_hash = doc_id or hashlib.sha256(pdf_source).hexdigest()[:16]
            else:
                source_path = Path(pdf_source)
                if not source_path.exists():
                    return PDFProcessResult(
                        is_valid=False,
                        error_message=f"PDF file does not exist at path: {source_path}",
                    )
                content = source_path.read_bytes()
                if not content.startswith(b"%PDF-"):
                    return PDFProcessResult(
                        is_valid=False,
                        error_message="Invalid PDF header: File does not begin with '%PDF-' magic bytes",
                    )
                doc = fitz.open(source_path)
                doc_hash = doc_id or hashlib.sha256(content).hexdigest()[:16]

            # 2. Check for empty document (0 pages)
            page_count = len(doc)
            if page_count == 0:
                return PDFProcessResult(
                    is_valid=True,
                    page_count=0,
                    overall_text_source="EMPTY",
                    doc_metadata=self._extract_metadata(doc),
                    forensic=self._extract_forensics(doc),
                )

            # 3. Extract Document Metadata & Forensic Signals
            doc_meta = self._extract_metadata(doc)
            forensics = self._extract_forensics(doc)

            # 4. Process individual pages
            page_results: list[PageProcessResult] = []
            text_sources_seen: set[str] = set()

            for page_idx in range(page_count):
                page_no = page_idx + 1
                page = doc[page_idx]

                # (a) Text layer extraction BEFORE OCR whenever possible
                raw_text = page.get_text()
                stripped_text = raw_text.strip()
                char_count = len(stripped_text)

                # Extract word bounding boxes: (x0, y0, x1, y1, word, block_no, line_no, word_no)
                raw_words = page.get_text("words")
                word_boxes: list[WordBox] = []
                for w in raw_words:
                    word_boxes.append(
                        WordBox(
                            x0=round(w[0], 2),
                            y0=round(w[1], 2),
                            x1=round(w[2], 2),
                            y1=round(w[3], 2),
                            text=w[4],
                            block_no=w[5],
                            line_no=w[6],
                            word_no=w[7],
                        )
                    )

                # Determine text layer availability
                # If char_count >= 50: TEXT_LAYER path
                # Else: SCANNED path (requires downstream OCR)
                if char_count >= MIN_TEXT_LAYER_CHARS:
                    page_text_source = "TEXT_LAYER"
                    confidence = 1.0
                    has_text_layer = True
                elif char_count > 0:
                    page_text_source = "TEXT_LAYER"
                    confidence = 0.8
                    has_text_layer = True
                else:
                    page_text_source = "SCANNED"
                    confidence = 0.0
                    has_text_layer = False

                text_sources_seen.add(page_text_source)

                # (b) Page metadata
                rect = page.rect
                page_meta = PageMetadata(
                    page_no=page_no,
                    width=round(rect.width, 2),
                    height=round(rect.height, 2),
                    rotation=page.rotation,
                    char_count=char_count,
                    word_count=len(word_boxes),
                    image_count=len(page.get_images()),
                    has_text_layer=has_text_layer,
                    text_source=page_text_source,
                )

                # (c) Page image rendering (cached if cache_dir provided)
                png_path_str: Optional[str] = None
                if render_pages and cache_dir:
                    rendered_file = self.renderer.get_or_render_page_image(
                        page=page,
                        page_no=page_no,
                        cache_dir=cache_dir,
                        doc_prefix=doc_hash,
                    )
                    png_path_str = str(rendered_file)

                page_results.append(
                    PageProcessResult(
                        page_no=page_no,
                        text=raw_text,
                        words=word_boxes,
                        metadata=page_meta,
                        png_path=png_path_str,
                        confidence=confidence,
                    )
                )

            # 5. Compute overall document text source classification
            if not text_sources_seen:
                overall_source = "EMPTY"
            elif text_sources_seen == {"TEXT_LAYER"}:
                overall_source = "TEXT_LAYER"
            elif text_sources_seen == {"SCANNED"}:
                overall_source = "SCANNED"
            else:
                overall_source = "HYBRID"

            return PDFProcessResult(
                is_valid=True,
                page_count=page_count,
                doc_metadata=doc_meta,
                forensic=forensics,
                pages=page_results,
                overall_text_source=overall_source,
            )

        except fitz.FileDataError as exc:
            return PDFProcessResult(
                is_valid=False,
                error_message=f"Corrupt or unreadable PDF data: {exc}",
            )
        except Exception as exc:
            logger.error("Unexpected error parsing PDF: %s", exc)
            return PDFProcessResult(
                is_valid=False,
                error_message=f"PDF processing failed: {exc}",
            )
        finally:
            if doc is not None:
                doc.close()

    def _extract_metadata(self, doc: fitz.Document) -> DocumentMetadata:
        """Extract metadata from PDF trailer and catalog dictionary."""
        meta = doc.metadata or {}
        return DocumentMetadata(
            title=meta.get("title") or None,
            author=meta.get("author") or None,
            subject=meta.get("subject") or None,
            keywords=meta.get("keywords") or None,
            creator=meta.get("creator") or None,
            producer=meta.get("producer") or None,
            creation_date=meta.get("creationDate") or None,
            mod_date=meta.get("modDate") or None,
            format=meta.get("format") or None,
            encryption=meta.get("encryption") or None,
        )

    def _extract_forensics(self, doc: fitz.Document) -> ForensicSignals:
        """Scan PDF catalog and objects for executable scripts or active elements."""
        signals = ForensicSignals()

        # Check catalog / root dictionary for active actions
        try:
            catalog_xref = doc.pdf_catalog()
            catalog_keys = doc.xref_get_keys(catalog_xref)

            if "JavaScript" in catalog_keys or "JS" in catalog_keys:
                signals.has_javascript = True
                signals.suspicious_flags.append("Catalog contains JavaScript actions")

            if "OpenAction" in catalog_keys:
                signals.has_open_action = True
                signals.suspicious_flags.append("Catalog contains automated OpenAction")

            if "EmbeddedFiles" in catalog_keys:
                signals.has_embedded_files = True
                signals.suspicious_flags.append("Catalog contains EmbeddedFiles")

        except Exception:
            pass

        # Scan objects for Launch actions
        try:
            for xref_id in range(1, min(doc.xref_length(), 500)):
                obj_str = doc.xref_object(xref_id)
                if "/Launch" in obj_str:
                    signals.has_launch = True
                    signals.suspicious_flags.append("Object contains /Launch executable action")
                    break
        except Exception:
            pass

        return signals

    @staticmethod
    async def persist_to_database(
        session: AsyncSession,
        document_id: uuid.UUID,
        result: PDFProcessResult,
    ) -> list[DocumentPage]:
        """Persist extracted pages, bounding box words, and metadata to PostgreSQL tables."""
        # 1. Fetch parent Document
        doc_stmt = select(Document).where(Document.id == document_id)
        doc_res = await session.execute(doc_stmt)
        document = doc_res.scalar_one_or_none()
        if not document:
            raise ValueError(f"Document with ID '{document_id}' not found in database.")

        # 2. Update Document summary fields
        document.page_count = result.page_count
        document.text_source = result.overall_text_source
        document.metadata_fields = result.doc_metadata.to_dict()
        document.forensic = result.forensic.to_dict()

        # 3. Create DocumentPage records
        persisted_pages: list[DocumentPage] = []
        for page_res in result.pages:
            # Format word bounding boxes as JSON-serializable structure
            words_data = [w.to_dict() for w in page_res.words]

            doc_page = DocumentPage(
                document_id=document_id,
                page_no=page_res.page_no,
                text=page_res.text,
                words={"items": words_data, "count": len(words_data)},
                ocr_conf=page_res.confidence,
                png_path=page_res.png_path,
            )
            session.add(doc_page)
            persisted_pages.append(doc_page)

        await session.commit()
        return persisted_pages
