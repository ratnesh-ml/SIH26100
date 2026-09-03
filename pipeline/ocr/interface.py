"""Stable OCR Provider Interface and Result Contracts for VigilBid."""

from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass, field
from typing import Any, Optional


@dataclass
class OCRRegion:
    """Detected bounding box region with extracted token and confidence."""
    text: str
    bbox: tuple[float, float, float, float]  # (x0, y0, x1, y1) in points/pixels
    confidence: float

    def to_dict(self) -> dict[str, Any]:
        return {
            "text": self.text,
            "bbox": list(self.bbox),
            "confidence": round(self.confidence, 4),
        }


@dataclass
class OCRResult:
    """Stable standard result contract returned by any OCRProvider."""
    document_id: Optional[str]
    page: int
    text: str
    confidence: float
    regions: list[OCRRegion] = field(default_factory=list)
    processing_time: float = 0.0  # seconds
    provider: str = "unknown"
    error: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "document_id": self.document_id,
            "page": self.page,
            "text": self.text,
            "confidence": round(self.confidence, 4),
            "regions": [r.to_dict() for r in self.regions],
            "processing_time": round(self.processing_time, 4),
            "provider": self.provider,
            "error": self.error,
        }


class OCRProvider(ABC):
    """Abstract interface defining standard OCR lifecycle and extraction methods."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name identifier."""
        pass

    @abstractmethod
    def is_available(self) -> bool:
        """Check if provider dependencies and model weights are installed and operational."""
        pass

    @abstractmethod
    def get_device_info(self) -> dict[str, Any]:
        """Return CPU/GPU awareness details (device, CUDA status, precision)."""
        pass

    @abstractmethod
    def extract_from_image(
        self,
        image_bytes: bytes,
        page: int = 1,
        document_id: Optional[str] = None,
    ) -> OCRResult:
        """Extract text and bounding box regions from raster image bytes (PNG/JPEG)."""
        pass

    @abstractmethod
    def extract_from_pdf_page(
        self,
        pdf_bytes: bytes,
        page: int = 1,
        document_id: Optional[str] = None,
    ) -> OCRResult:
        """Extract text from a specific PDF page byte stream (1-indexed)."""
        pass
