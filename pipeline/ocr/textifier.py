"""Text acquisition engine supporting text layer and OCR fallbacks."""

from dataclasses import dataclass
from typing import Optional


@dataclass
class PageTextResult:
    page_no: int
    text: str
    words: list[dict]
    source: str  # 'text_layer' | 'ocr' | 'mixed'
    confidence: float
    png_path: Optional[str] = None


class Textifier:
    """Acquires text from PDFs, falling back to OCR if character density is low (<50 chars)."""

    def process_page(self, pdf_path: str, page_no: int) -> PageTextResult:
        """Acquire text and word bounding boxes for a page."""
        raise NotImplementedError("Text acquisition will be implemented in future phase")
