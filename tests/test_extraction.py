"""Comprehensive Tests for Structured Field Extraction, Normalization, and Statutory Validators."""

import pytest
from pipeline.document_processing.classifier import DocumentType
from pipeline.extraction.base import ExtractedFieldDTO
from pipeline.extraction.financial import FinancialExtractor
from pipeline.extraction.gst import GSTExtractor
from pipeline.extraction.pan import PANExtractor
from pipeline.extraction.registry import extract_document_fields, get_extractor
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


# =========================================================================
# 1. GST REG-06 Extraction Tests
# =========================================================================

def test_gst_extractor_complete_fields():
    sample_gst_text = (
        "Government of India\n"
        "Form GST REG-06\n"
        "[See Rule 10(1)]\n"
        "Registration Certificate\n"
        "Registration Number: 33ABCDE1234F1Z5\n"
        "Legal Name: Apex Industrial Solutions Private Limited\n"
        "Trade Name: Apex Solutions\n"
        "Constitution of Business: Private Limited Company\n"
        "Address of Principal Place of Business: Plot 45, Manali Industrial Estate, Chennai, Tamil Nadu, 600068\n"
        "Date of Validity: 01/07/2017\n"
        "Status: Active"
    )
    pages = [{"page_no": 1, "text": sample_gst_text}]
    extractor = GSTExtractor()
    fields = extractor.extract(pages=pages, source_document="apex_gst.pdf")

    field_map: dict[str, ExtractedFieldDTO] = {f.field_name: f for f in fields}

    # Verify All Required Fields Extracted
    assert "gstin" in field_map
    assert "legal_name" in field_map
    assert "trade_name" in field_map
    assert "constitution" in field_map
    assert "address" in field_map
    assert "registration_date" in field_map
    assert "status" in field_map
    assert "pan" in field_map

    # Contract Verification: Each field must retain value, normalized_value, confidence, source_document, page, extraction_method
    gstin_field = field_map["gstin"]
    assert gstin_field.value == "33ABCDE1234F1Z5"
    assert gstin_field.normalized_value == "33ABCDE1234F1Z5"
    assert gstin_field.confidence >= 0.95
    assert gstin_field.source_document == "apex_gst.pdf"
    assert gstin_field.page == 1
    assert gstin_field.extraction_method == "regex"
    assert gstin_field.is_valid is True

    # Check Embedded PAN derivation
    pan_field = field_map["pan"]
    assert pan_field.value == "ABCDE1234F"
    assert pan_field.normalized_value == "ABCDE1234F"
    assert pan_field.confidence >= 0.95
    assert pan_field.page == 1

    # Check Org Name normalization
    name_field = field_map["legal_name"]
    assert "APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED" in name_field.normalized_value

    # Check Date normalization (ISO 8601 YYYY-MM-DD)
    date_field = field_map["registration_date"]
    assert date_field.normalized_value == "2017-07-01"


# =========================================================================
# 2. PAN Card Extraction Tests
# =========================================================================

def test_pan_extractor_complete_fields():
    sample_pan_text = (
        "INCOME TAX DEPARTMENT\n"
        "GOVT. OF INDIA\n"
        "Permanent Account Number Card\n"
        "AABCC1234F\n"
        "Name: APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED\n"
        "Date of Incorporation: 15/04/2012"
    )
    pages = [{"page_no": 1, "text": sample_pan_text}]
    extractor = PANExtractor()
    fields = extractor.extract(pages=pages, source_document="pan_card.pdf")

    field_map = {f.field_name: f for f in fields}

    assert "pan" in field_map
    assert "legal_name" in field_map
    assert "registration_date" in field_map
    assert "entity_type" in field_map
    assert "status" in field_map

    pan_field = field_map["pan"]
    assert pan_field.value == "AABCC1234F"
    assert pan_field.normalized_value == "AABCC1234F"
    assert pan_field.confidence >= 0.95
    assert pan_field.source_document == "pan_card.pdf"
    assert pan_field.page == 1
    assert pan_field.is_valid is True

    # 4th char 'C' stands for Company
    entity_field = field_map["entity_type"]
    assert entity_field.value == "Company"

    date_field = field_map["registration_date"]
    assert date_field.normalized_value == "2012-04-15"


# =========================================================================
# 3. Udyam MSME Extraction Tests
# =========================================================================

def test_udyam_extractor_complete_fields():
    sample_udyam_text = (
        "MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES\n"
        "UDYAM REGISTRATION CERTIFICATE\n"
        "UDYAM REGISTRATION NUMBER: UDYAM-TN-01-0012345\n"
        "NAME OF ENTERPRISE: SRI KAVERI ENGINEERING WORKS\n"
        "TYPE OF ENTERPRISE: SMALL\n"
        "MAJOR ACTIVITY: MANUFACTURING\n"
        "DATE OF UDYAM REGISTRATION: 12/08/2020\n"
        "OFFICIAL ADDRESS: 12Ambattur Industrial Estate, Chennai 600058\n"
        "PAN: AABCS1234D"
    )
    pages = [{"page_no": 1, "text": sample_udyam_text}]
    extractor = UdyamExtractor()
    fields = extractor.extract(pages=pages, source_document="udyam.pdf")

    field_map = {f.field_name: f for f in fields}

    assert "udyam_number" in field_map
    assert "legal_name" in field_map
    assert "enterprise_type" in field_map
    assert "major_activity" in field_map
    assert "registration_date" in field_map
    assert "address" in field_map
    assert "pan" in field_map
    assert "status" in field_map

    udyam_field = field_map["udyam_number"]
    assert udyam_field.value == "UDYAM-TN-01-0012345"
    assert udyam_field.normalized_value == "UDYAM-TN-01-0012345"
    assert udyam_field.confidence >= 0.95
    assert udyam_field.source_document == "udyam.pdf"
    assert udyam_field.page == 1

    type_field = field_map["enterprise_type"]
    assert type_field.normalized_value == "SMALL"

    act_field = field_map["major_activity"]
    assert act_field.normalized_value == "MANUFACTURING"

    date_field = field_map["registration_date"]
    assert date_field.normalized_value == "2020-08-12"


# =========================================================================
# 4. Financial Statements / CA Turnover Extraction Tests
# =========================================================================

def test_financial_extractor_complete_fields():
    sample_fin_text = (
        "B. MEHTA & ASSOCIATES\n"
        "CHARTERED ACCOUNTANTS\n"
        "TO WHOMSOEVER IT MAY CONCERN\n"
        "This is to certify that the Annual Turnover of M/s Apex Industrial Solutions Private Limited\n"
        "for the past financial years is as follows:\n"
        "FY 2021-22: Rs. 6.50 Crores\n"
        "FY 2022-23: Rs. 8.42 Crores\n"
        "FY 2023-24: Rs. 11.20 Crores\n"
        "UDIN: 24123456AAAAAA1234\n"
        "Membership No: 123456"
    )
    pages = [{"page_no": 1, "text": sample_fin_text}]
    extractor = FinancialExtractor()
    fields = extractor.extract(pages=pages, source_document="ca_cert.pdf")

    field_map = {f.field_name: f for f in fields}

    assert "udin" in field_map
    assert "company_name" in field_map
    assert "turnover" in field_map
    assert "financial_year" in field_map
    assert "ca_name" in field_map
    assert "membership_no" in field_map
    assert "status" in field_map

    # UDIN Verification
    udin_field = field_map["udin"]
    assert udin_field.value == "24123456AAAAAA1234"
    assert udin_field.normalized_value == "24123456AAAAAA1234"
    assert udin_field.confidence >= 0.95
    assert udin_field.is_valid is True

    # Turnover Normalization: Rs. 6.50 Crores -> 65,000,000.0 INR
    turnover_field = field_map["turnover"]
    assert turnover_field.normalized_value == "65000000.0"

    # Multi-year turnover suffixes check
    assert "turnover_2022-23" in field_map
    assert field_map["turnover_2022-23"].normalized_value == "84200000.0"

    assert "turnover_2023-24" in field_map
    assert field_map["turnover_2023-24"].normalized_value == "112000000.0"


# =========================================================================
# 5. Registry Dispatch and Interface Compliance
# =========================================================================

def test_registry_dispatch_for_all_statutory_types():
    # GST
    gst_res = extract_document_fields(
        doc_type=DocumentType.GST_CERT,
        pages=[{"page_no": 1, "text": "Form GST REG-06 GSTIN: 33ABCDE1234F1Z5"}],
        source_document="test_gst.pdf",
    )
    assert len(gst_res) > 0
    assert any(f.field_name == "gstin" for f in gst_res)

    # PAN
    pan_res = extract_document_fields(
        doc_type=DocumentType.PAN_CARD,
        pages=[{"page_no": 1, "text": "Permanent Account Number ABCDE1234F"}],
        source_document="test_pan.pdf",
    )
    assert len(pan_res) > 0
    assert any(f.field_name == "pan" for f in pan_res)

    # Udyam
    udyam_res = extract_document_fields(
        doc_type=DocumentType.UDYAM_CERT,
        pages=[{"page_no": 1, "text": "UDYAM-TN-01-0012345"}],
        source_document="test_udyam.pdf",
    )
    assert len(udyam_res) > 0
    assert any(f.field_name == "udyam_number" for f in udyam_res)

    # Unregistered / Unknown Document Type returns empty list gracefully
    unknown_res = extract_document_fields(
        doc_type=DocumentType.UNKNOWN,
        pages=[{"page_no": 1, "text": "Random text"}],
        source_document="unknown.pdf",
    )
    assert unknown_res == []


# =========================================================================
# 6. Statutory Format Validators & Normalizers
# =========================================================================

def test_validators():
    # GSTIN
    ok, _ = validate_gstin("33ABCDE1234F1Z5")
    assert ok is True

    bad_state, err = validate_gstin("98ABCDE1234F1Z5")  # State code 98 is invalid
    assert bad_state is False
    assert "Invalid GST state code" in err

    bad_format, err = validate_gstin("INVALID_GSTIN")
    assert bad_format is False

    # PAN
    ok, _ = validate_pan("ABCDE1234F")
    assert ok is True

    bad_pan, err = validate_pan("INVALID_PAN")
    assert bad_pan is False

    # Udyam
    ok, _ = validate_udyam("UDYAM-TN-01-0012345")
    assert ok is True

    bad_udyam, _ = validate_udyam("UDYAM-1234")
    assert bad_udyam is False

    # UDIN
    ok, _ = validate_udin("24123456AAAAAA1234")
    assert ok is True

    bad_udin, _ = validate_udin("SHORT_UDIN")
    assert bad_udin is False


def test_normalizers():
    # Turnover
    assert normalize_turnover("Rs. 8.42 Crores") == 84200000.0
    assert normalize_turnover("₹ 45.5 Lakhs") == 4550000.0
    assert normalize_turnover("1,25,00,000") == 12500000.0
    assert normalize_turnover(500000) == 500000.0

    # Org Name
    assert normalize_org_name("M/s Apex Industrial Solutions Pvt. Ltd.") == "APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED"
    assert normalize_org_name("Kaveri & Co.") == "KAVERI AND COMPANY"

    # Date
    assert normalize_date("15/08/2023") == "2023-08-15"
    assert normalize_date("15-Aug-2023") == "2023-08-15"
    assert normalize_date("2023-08-15") == "2023-08-15"
