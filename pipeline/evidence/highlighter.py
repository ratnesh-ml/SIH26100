"""Bounding box normalization and responsive overlay percentage calculations."""

from dataclasses import dataclass
from typing import Any


@dataclass
class BoundingBox:
    x0: float
    y0: float
    x1: float
    y1: float

    def to_percentages(self, page_width: float, page_height: float) -> dict[str, float]:
        """Convert absolute coordinates to responsive CSS percentage values."""
        return {
            "left": round((self.x0 / page_width) * 100, 2),
            "top": round((self.y0 / page_height) * 100, 2),
            "width": round(((self.x1 - self.x0) / page_width) * 100, 2),
            "height": round(((self.y1 - self.y0) / page_height) * 100, 2),
        }


class EvidencePackager:
    """Extracts page snapshot PNGs and packages evidence regions for frontend rendering."""

    def package_evidence(self, pdf_path: str, page_no: int, bbox: BoundingBox) -> dict[str, Any]:
        raise NotImplementedError("Evidence packaging will be implemented in future phase")
