"""OCR Provider Factory and Dependency Resolution."""

import logging
import os
from typing import Optional

from pipeline.ocr.fallback_adapter import FallbackOCRAdapter
from pipeline.ocr.interface import OCRProvider
from pipeline.ocr.unlimited_adapter import UnlimitedOCRAdapter

logger = logging.getLogger("vigilbid.pipeline.ocr.factory")


def get_ocr_provider(provider_name: Optional[str] = None) -> OCRProvider:
    """Resolve and return an operational OCRProvider instance.

    Selection priority:
    1. Explicit provider_name parameter
    2. OCR_PROVIDER environment variable
    3. Default to FallbackOCRAdapter for guaranteed development stability
    """
    selected = (provider_name or os.getenv("OCR_PROVIDER", "fallback")).lower().strip()

    if selected in ("unlimited", "unlimited-ocr", "baidu"):
        adapter = UnlimitedOCRAdapter()
        if adapter.is_available():
            logger.info("Selected OCR Provider: UnlimitedOCRAdapter")
            return adapter
        logger.warning(
            "Unlimited-OCR requested but dependencies/hardware are unavailable. "
            "Falling back to architecture-approved FallbackOCRAdapter."
        )
        return FallbackOCRAdapter()

    return FallbackOCRAdapter()
