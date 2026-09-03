"""Registry of extractors for each document type."""

from typing import Any, Optional

from pipeline.document_processing.classifier import DocumentType
from pipeline.extraction.base import BaseExtractor, ExtractedFieldDTO
from pipeline.extraction.financial import FinancialExtractor
from pipeline.extraction.gst import GSTExtractor
from pipeline.extraction.pan import PANExtractor
from pipeline.extraction.udyam import UdyamExtractor

_EXTRACTOR_REGISTRY: dict[DocumentType, BaseExtractor] = {}


def register_extractor(doc_type: DocumentType, extractor: BaseExtractor) -> None:
    """Register an extractor for a document type."""
    _EXTRACTOR_REGISTRY[doc_type] = extractor


def get_extractor(doc_type: DocumentType) -> Optional[BaseExtractor]:
    """Retrieve extractor for given document type."""
    return _EXTRACTOR_REGISTRY.get(doc_type)


def initialize_default_extractors() -> None:
    """Register canonical extractors for statutory public procurement document types."""
    gst_ext = GSTExtractor()
    pan_ext = PANExtractor()
    udyam_ext = UdyamExtractor()
    fin_ext = FinancialExtractor()

    register_extractor(DocumentType.GST_CERT, gst_ext)
    register_extractor(DocumentType.PAN_CARD, pan_ext)
    register_extractor(DocumentType.UDYAM_CERT, udyam_ext)
    register_extractor(DocumentType.CA_TURNOVER_CERT, fin_ext)
    register_extractor(DocumentType.AUDITED_FINANCIALS, fin_ext)
    register_extractor(DocumentType.ITR_ACK, fin_ext)


# Auto-initialize standard extractors on import
initialize_default_extractors()


def extract_document_fields(
    doc_type: DocumentType,
    pages: list[dict[str, Any]],
    source_document: Optional[str] = None,
) -> list[ExtractedFieldDTO]:
    """Dispatch extraction to appropriate registered extractor based on document type."""
    extractor = get_extractor(doc_type)
    if not extractor:
        return []
    return extractor.extract(pages=pages, source_document=source_document)
