"""Architecture-approved fallback OCR adapter for local development and CPU execution."""

import io
import logging
import time
from typing import Any, Optional
from PIL import Image
import fitz  # PyMuPDF

from pipeline.ocr.interface import OCRProvider, OCRRegion, OCRResult

logger = logging.getLogger("vigilbid.pipeline.ocr.fallback")


class FallbackOCRAdapter(OCRProvider):
    """Fallback OCR adapter combining PyMuPDF vector inspection and EasyOCR.

    Operates seamlessly on standard CPU development machines without CUDA hardware.
    """

    def __init__(self, languages: Optional[list[str]] = None):
        self.languages = languages or ["en"]
        self._easyocr_reader = None
        self._easyocr_initialized = False

    @property
    def name(self) -> str:
        return "fallback-ocr"

    def is_available(self) -> bool:
        """Fallback adapter is always available as PyMuPDF is bundled in the environment."""
        return True

    def get_device_info(self) -> dict[str, Any]:
        """Report execution environment details."""
        return {
            "provider": self.name,
            "device": "cpu",
            "cuda_available": False,
            "fallback_engines": ["pymupdf", "easyocr"],
            "ready": True,
        }

    def _get_reader(self):
        """Lazy initialization of EasyOCR reader if installed."""
        if not self._easyocr_initialized:
            try:
                import easyocr
                logger.info("Initializing EasyOCR reader for languages: %s (CPU mode)...", self.languages)
                self._easyocr_reader = easyocr.Reader(self.languages, gpu=False)
            except Exception as exc:
                logger.warning("EasyOCR could not be initialized on CPU: %s. Using vector raster fallback.", exc)
                self._easyocr_reader = None
            self._easyocr_initialized = True
        return self._easyocr_reader

    def extract_from_image(
        self,
        image_bytes: bytes,
        page: int = 1,
        document_id: Optional[str] = None,
    ) -> OCRResult:
        """Extract text and bounding box regions from raster image bytes."""
        start_time = time.perf_counter()
        regions: list[OCRRegion] = []
        text_lines: list[str] = []
        total_conf = 0.0

        try:
            reader = self._get_reader()
            if reader is not None:
                # Run EasyOCR
                results = reader.readtext(image_bytes)
                for item in results:
                    bbox_poly, text_val, conf = item
                    # Convert polygon [[x0,y0],[x1,y0],[x1,y1],[x0,y1]] to bbox (x0, y0, x1, y1)
                    x_coords = [p[0] for p in bbox_poly]
                    y_coords = [p[1] for p in bbox_poly]
                    bbox = (
                        min(x_coords),
                        min(y_coords),
                        max(x_coords),
                        max(y_coords),
                    )
                    regions.append(
                        OCRRegion(
                            text=text_val,
                            bbox=bbox,
                            confidence=float(conf),
                        )
                    )
                    text_lines.append(text_val)
                    total_conf += float(conf)

            full_text = "\n".join(text_lines)
            avg_conf = (total_conf / len(regions)) if regions else (0.85 if full_text else 0.0)

            duration = time.perf_counter() - start_time
            return OCRResult(
                document_id=document_id,
                page=page,
                text=full_text,
                confidence=avg_conf,
                regions=regions,
                processing_time=duration,
                provider=self.name,
            )

        except Exception as exc:
            duration = time.perf_counter() - start_time
            logger.error("Fallback OCR failed processing image: %s", exc)
            return OCRResult(
                document_id=document_id,
                page=page,
                text="",
                confidence=0.0,
                processing_time=duration,
                provider=self.name,
                error=f"Fallback OCR error: {exc}",
            )

    def extract_from_pdf_page(
        self,
        pdf_bytes: bytes,
        page: int = 1,
        document_id: Optional[str] = None,
    ) -> OCRResult:
        """Extract text from a PDF page, using vector text layer first or raster OCR fallback."""
        start_time = time.perf_counter()
        doc = None
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            if page < 1 or page > len(doc):
                return OCRResult(
                    document_id=document_id,
                    page=page,
                    text="",
                    confidence=0.0,
                    processing_time=time.perf_counter() - start_time,
                    provider=self.name,
                    error=f"Requested page {page} out of bounds (1..{len(doc)})",
                )

            fitz_page = doc[page - 1]
            raw_text = fitz_page.get_text()

            # If page already has rich text layer (>= 50 chars), return directly with 1.0 confidence
            if len(raw_text.strip()) >= 50:
                words_raw = fitz_page.get_text("words")
                regions = [
                    OCRRegion(
                        text=w[4],
                        bbox=(round(w[0], 2), round(w[1], 2), round(w[2], 2), round(w[3], 2)),
                        confidence=1.0,
                    )
                    for w in words_raw
                ]
                duration = time.perf_counter() - start_time
                return OCRResult(
                    document_id=document_id,
                    page=page,
                    text=raw_text,
                    confidence=1.0,
                    regions=regions,
                    processing_time=duration,
                    provider=self.name,
                )

            # Scanned page (insufficient text layer): Render to raster PNG and run image OCR
            pix = fitz_page.get_pixmap(dpi=150)
            png_bytes = pix.tobytes("png")
            return self.extract_from_image(png_bytes, page=page, document_id=document_id)

        except Exception as exc:
            return OCRResult(
                document_id=document_id,
                page=page,
                text="",
                confidence=0.0,
                processing_time=time.perf_counter() - start_time,
                provider=self.name,
                error=f"Fallback OCR failed on PDF page: {exc}",
            )
        finally:
            if doc is not None:
                doc.close()
