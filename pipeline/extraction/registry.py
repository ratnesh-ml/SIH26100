"""Registry of extractors for each document type."""

from typing import Optional
from pipeline.document_processing.classifier import DocumentType
from pipeline.extraction.base import BaseExtractor

_EXTRACTOR_REGISTRY: dict[DocumentType, BaseExtractor] = {}


def register_extractor(doc_type: DocumentType, extractor: BaseExtractor) -> None:
    """Register an extractor for a document type."""
    _EXTRACTOR_REGISTRY[doc_type] = extractor


def get_extractor(doc_type: DocumentType) -> Optional[BaseExtractor]:
    """Retrieve extractor for given document type."""
    return _EXTRACTOR_REGISTRY.get(doc_type)
