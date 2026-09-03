"""PDF Page image rendering and on-disk caching layer."""

import logging
from pathlib import Path
from typing import Optional
import fitz  # PyMuPDF

logger = logging.getLogger("vigilbid.pipeline.pdf.renderer")

DEFAULT_RENDER_DPI = 150


class PDFRenderer:
    """Renders PDF pages to raster PNG images with on-disk caching."""

    def __init__(self, default_dpi: int = DEFAULT_RENDER_DPI):
        self.default_dpi = default_dpi

    def render_page_bytes(self, page: fitz.Page, dpi: Optional[int] = None) -> bytes:
        """Render a single PyMuPDF page to PNG image bytes in memory."""
        active_dpi = dpi or self.default_dpi
        pix = page.get_pixmap(dpi=active_dpi)
        return pix.tobytes("png")

    def get_or_render_page_image(
        self,
        page: fitz.Page,
        page_no: int,
        cache_dir: Path,
        doc_prefix: str,
        dpi: Optional[int] = None,
    ) -> Path:
        """Fetch cached page PNG or render and persist to disk if not yet cached."""
        cache_dir.mkdir(parents=True, exist_ok=True)
        active_dpi = dpi or self.default_dpi
        image_filename = f"{doc_prefix}_page_{page_no}.png"
        target_path = cache_dir / image_filename

        # Cache hit: Return existing image if present and non-empty
        if target_path.exists() and target_path.stat().st_size > 0:
            logger.debug("Page rendering cache HIT for: %s", target_path.name)
            return target_path

        # Cache miss: Render and save
        logger.debug("Page rendering cache MISS for: %s (rendering at %d DPI)", target_path.name, active_dpi)
        png_bytes = self.render_page_bytes(page, dpi=active_dpi)
        target_path.write_bytes(png_bytes)
        return target_path
