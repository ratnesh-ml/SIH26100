"""OCR and Text Acquisition Subsystem."""

from pipeline.ocr.interface import OCRProvider, OCRResult, OCRRegion
from pipeline.ocr.unlimited_adapter import UnlimitedOCRAdapter
from pipeline.ocr.fallback_adapter import FallbackOCRAdapter
from pipeline.ocr.factory import get_ocr_provider
from pipeline.ocr.textifier import Textifier, PageTextResult

__all__ = [
    "OCRProvider",
    "OCRResult",
    "OCRRegion",
    "UnlimitedOCRAdapter",
    "FallbackOCRAdapter",
    "get_ocr_provider",
    "Textifier",
    "PageTextResult",
]
