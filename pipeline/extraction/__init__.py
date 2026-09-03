"""Document Field Extraction Subsystem."""

from pipeline.extraction.base import BaseExtractor, ExtractedFieldDTO
from pipeline.extraction.financial import FinancialExtractor
from pipeline.extraction.gst import GSTExtractor
from pipeline.extraction.pan import PANExtractor
from pipeline.extraction.tender import TenderRequirement, TenderRequirementExtractor
from pipeline.extraction.registry import (
    extract_document_fields,
    get_extractor,
    register_extractor,
)
from pipeline.extraction.udyam import UdyamExtractor
from pipeline.extraction.validators import (
    normalize_date,
    normalize_gstin,
    normalize_org_name,
    normalize_pan,
    normalize_turnover,
    normalize_udyam,
    validate_gstin,
    validate_pan,
    validate_udin,
    validate_udyam,
)

__all__ = [
    "BaseExtractor",
    "ExtractedFieldDTO",
    "GSTExtractor",
    "PANExtractor",
    "UdyamExtractor",
    "FinancialExtractor",
    "register_extractor",
    "get_extractor",
    "extract_document_fields",
    "validate_gstin",
    "validate_pan",
    "validate_udyam",
    "validate_udin",
    "normalize_gstin",
    "normalize_pan",
    "normalize_udyam",
    "normalize_org_name",
    "normalize_date",
    "normalize_turnover",
    "TenderRequirement",
    "TenderRequirementExtractor",
]
