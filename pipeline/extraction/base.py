"""Base interface and DTOs for field extraction."""

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class ExtractedFieldDTO:
    field_name: str
    value: Optional[str]
    value_norm: Optional[str]
    raw: Optional[str]
    page_no: int
    bbox: Optional[dict[str, Any]]
    confidence: float
    method: str  # 'regex' | 'anchor' | 'table' | 'llm'


class BaseExtractor(ABC):
    """Abstract base class for document-specific extractors."""

    @abstractmethod
    def extract(self, pages: list[dict[str, Any]]) -> list[ExtractedFieldDTO]:
        """Extract typed fields from document pages."""
        pass
