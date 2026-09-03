"""Bounding box normalization, stable evidence modeling, and provenance tracing."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional, Union


@dataclass
class BoundingBox:
    """Absolute coordinates (x0, y0, x1, y1) in PDF points (72 DPI)."""
    x0: float
    y0: float
    x1: float
    y1: float

    def to_percentages(self, page_width: float, page_height: float) -> dict[str, float]:
        """Convert absolute coordinates to responsive CSS percentage values for UI overlays."""
        if page_width <= 0 or page_height <= 0:
            return {"left": 0.0, "top": 0.0, "width": 0.0, "height": 0.0}

        return {
            "left": round((self.x0 / page_width) * 100, 2),
            "top": round((self.y0 / page_height) * 100, 2),
            "width": round((max(0.0, self.x1 - self.x0) / page_width) * 100, 2),
            "height": round((max(0.0, self.y1 - self.y0) / page_height) * 100, 2),
        }

    def to_dict(self) -> dict[str, float]:
        return {
            "x0": round(self.x0, 2),
            "y0": round(self.y0, 2),
            "x1": round(self.x1, 2),
            "y1": round(self.y1, 2),
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "BoundingBox":
        return cls(
            x0=float(data.get("x0", 0.0)),
            y0=float(data.get("y0", 0.0)),
            x1=float(data.get("x1", 0.0)),
            y1=float(data.get("y1", 0.0)),
        )


@dataclass
class EvidenceItem:
    """Stable, comprehensive evidence record ensuring complete provenance and auditability.
    
    Enables the frontend to answer: 'Show me exactly where this result came from.'
    """
    document: str
    page: int
    field: str
    quote: Optional[str] = None
    bounding_box: Optional[BoundingBox] = None
    source: str = "document_text_layer"  # document_text_layer, document_ocr, simulated_registry, pdf_metadata, cross_bidder
    method: str = "anchor_regex"         # anchor_regex, ocr, api_lookup, visual_font_forensics, etc.
    confidence: float = 1.0
    metadata: dict[str, Any] = field(default_factory=dict)

    @property
    def page_no(self) -> int:
        return self.page

    @property
    def document_id(self) -> str:
        return self.document

    @property
    def bbox(self) -> Optional[dict[str, float]]:
        return self.bounding_box.to_dict() if self.bounding_box else None

    def to_dict(self) -> dict[str, Any]:
        return {
            "document": self.document,
            "document_id": self.document,
            "page": self.page,
            "page_no": self.page,
            "field": self.field,
            "quote": self.quote,
            "bounding_box": self.bounding_box.to_dict() if self.bounding_box else None,
            "bbox": self.bounding_box.to_dict() if self.bounding_box else None,
            "source": self.source,
            "method": self.method,
            "confidence": round(self.confidence, 4),
            "metadata": self.metadata,
        }


# Backward-compatible alias
EvidenceRecord = EvidenceItem


@dataclass
class EvidenceTrace:
    """Trace container aggregating multiple evidence items for multi-document findings."""
    finding_id: str
    title: str
    status: str
    items: list[EvidenceItem] = field(default_factory=list)
    explanation: str = ""
    is_multi_document: bool = False

    def add_evidence(self, item: EvidenceItem) -> None:
        self.items.append(item)
        docs = {i.document for i in self.items}
        self.is_multi_document = len(docs) > 1

    def get_provenance_summary(self) -> str:
        """Human-readable trace answering 'Where did this result come from?'"""
        if not self.items:
            return "No primary document evidence recorded."
        parts = []
        for i in self.items:
            q_part = f" ('{i.quote[:35]}...')" if i.quote else ""
            parts.append(
                f"{i.document} p.{i.page} [{i.field}]{q_part} via {i.method} ({i.source}, conf: {i.confidence:.2f})"
            )
        return "; ".join(parts)

    def to_dict(self) -> dict[str, Any]:
        return {
            "finding_id": self.finding_id,
            "title": self.title,
            "status": self.status,
            "items": [i.to_dict() for i in self.items],
            "item_count": len(self.items),
            "explanation": self.explanation,
            "is_multi_document": self.is_multi_document,
            "provenance_summary": self.get_provenance_summary(),
        }


class EvidencePackager:
    """Packages evidence regions, highlights, and provenance traces for frontend rendering."""

    def package_evidence(
        self,
        document_name: str,
        page_no: int,
        field_name: str,
        quote: Optional[str] = None,
        bbox: Optional[Union[BoundingBox, dict[str, float]]] = None,
        source: str = "document_text_layer",
        method: str = "anchor_regex",
        confidence: float = 1.0,
        page_width: float = 595.0,
        page_height: float = 842.0,
        metadata: Optional[dict[str, Any]] = None,
    ) -> dict[str, Any]:
        """Produce a complete UI-ready evidence package with absolute and responsive percentage overlays."""
        if isinstance(bbox, dict):
            bbox_obj = BoundingBox.from_dict(bbox)
        else:
            bbox_obj = bbox

        item = EvidenceItem(
            document=document_name,
            page=page_no,
            field=field_name,
            quote=quote,
            bounding_box=bbox_obj,
            source=source,
            method=method,
            confidence=confidence,
            metadata=metadata or {},
        )

        percentages = (
            bbox_obj.to_percentages(page_width, page_height)
            if bbox_obj
            else {"left": 0.0, "top": 0.0, "width": 0.0, "height": 0.0}
        )

        res = item.to_dict()
        res["overlay"] = {
            "page_width": page_width,
            "page_height": page_height,
            "percentages": percentages,
            "highlight_style": "solid" if confidence >= 0.85 else "dashed",
        }
        return res

    def package_finding_trace(
        self,
        finding_id: str,
        title: str,
        status: str,
        items: list[EvidenceItem],
        explanation: str = "",
    ) -> EvidenceTrace:
        """Package multiple evidence items into a unified provenance trace."""
        trace = EvidenceTrace(
            finding_id=finding_id,
            title=title,
            status=status,
            items=[],
            explanation=explanation,
        )
        for itm in items:
            trace.add_evidence(itm)
        return trace
