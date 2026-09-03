"""Text acquisition engine coordinating PyMuPDF text layer and pluggable OCRProvider fallbacks."""

from dataclasses import dataclass
from pathlib import Path
from typing import Any, Optional, Union
import fitz  # PyMuPDF

from pipeline.ocr.factory import get_ocr_provider
from pipeline.ocr.interface import OCRProvider

MIN_TEXT_LAYER_CHARS = 50


@dataclass
class PageTextResult:
    page_no: int
    text: str
    words: list[dict[str, Any]]
    source: str  # 'text_layer' | 'ocr' | 'mixed'
    confidence: float
    png_path: Optional[str] = None


class Textifier:
    """Acquires text from PDFs, utilizing the vector text-layer first and falling back to OCRProvider."""

    def __init__(self, ocr_provider: Optional[OCRProvider] = None):
        self.ocr_provider = ocr_provider or get_ocr_provider()

    def process_page(
        self,
        pdf_source: Union[str, Path, bytes],
        page_no: int,
        document_id: Optional[str] = None,
    ) -> PageTextResult:
        """Acquire text and word bounding boxes for a specific page."""
        doc = None
        try:
            if isinstance(pdf_source, bytes):
                pdf_bytes = pdf_source
                doc = fitz.open(stream=pdf_source, filetype="pdf")
            else:
                path = Path(pdf_source)
                pdf_bytes = path.read_bytes()
                doc = fitz.open(path)

            if page_no < 1 or page_no > len(doc):
                raise ValueError(f"Page number {page_no} is out of bounds (1..{len(doc)})")

            page = doc[page_no - 1]
            raw_text = page.get_text()

            # 1. Text-Layer First Protocol
            if len(raw_text.strip()) >= MIN_TEXT_LAYER_CHARS:
                words_raw = page.get_text("words")
                words_list = [
                    {
                        "text": w[4],
                        "bbox": [round(w[0], 2), round(w[1], 2), round(w[2], 2), round(w[3], 2)],
                        "block_no": w[5],
                        "line_no": w[6],
                        "word_no": w[7],
                    }
                    for w in words_raw
                ]
                return PageTextResult(
                    page_no=page_no,
                    text=raw_text,
                    words=words_list,
                    source="text_layer",
                    confidence=1.0,
                )

            # 2. Fallback to OCRProvider for scanned/sparse pages
            ocr_res = self.ocr_provider.extract_from_pdf_page(
                pdf_bytes=pdf_bytes,
                page=page_no,
                document_id=document_id,
            )
            ocr_words = [
                {
                    "text": r.text,
                    "bbox": list(r.bbox),
                    "confidence": r.confidence,
                }
                for r in ocr_res.regions
            ]
            return PageTextResult(
                page_no=page_no,
                text=ocr_res.text,
                words=ocr_words,
                source="ocr",
                confidence=ocr_res.confidence,
            )

        finally:
            if doc is not None:
                doc.close()
