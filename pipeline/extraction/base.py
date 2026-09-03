"""Base interface and DTOs for field extraction."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any, Optional


@dataclass
class ExtractedFieldDTO:
    """Standardized extracted field DTO carrying value, normalization, confidence, and provenance."""
    field_name: str
    value: Optional[str]
    normalized_value: Optional[str]
    confidence: float
    source_document: Optional[str] = None
    page: int = 1
    extraction_method: str = "deterministic_anchor"  # 'regex' | 'anchor' | 'table' | 'llm'
    
    raw: Optional[str] = None
    bbox: Optional[dict[str, Any]] = None
    is_valid: bool = True
    validation_error: Optional[str] = None

    # Backward-compatible property aliases
    @property
    def value_norm(self) -> Optional[str]:
        return self.normalized_value

    @property
    def page_no(self) -> int:
        return self.page

    @property
    def method(self) -> str:
        return self.extraction_method

    def to_dict(self) -> dict[str, Any]:
        return {
            "field_name": self.field_name,
            "value": self.value,
            "normalized_value": self.normalized_value,
            "confidence": round(self.confidence, 4),
            "source_document": self.source_document,
            "page": self.page,
            "extraction_method": self.extraction_method,
            "raw": self.raw,
            "bbox": self.bbox,
            "is_valid": self.is_valid,
            "validation_error": self.validation_error,
        }


class BaseExtractor(ABC):
    """Abstract base class for document-specific structured extractors."""

    @abstractmethod
    def extract(
        self,
        pages: list[dict[str, Any]],
        source_document: Optional[str] = None,
    ) -> list[ExtractedFieldDTO]:
        """Extract structured, typed fields from document pages."""
        pass
