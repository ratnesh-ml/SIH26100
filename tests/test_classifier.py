"""Tests for Document Classification: Statutory Anchors, Filename Heuristics, Multi-Page Evidence, and Fallbacks."""

import pytest
from pipeline.document_processing.classifier import (
    ClassificationResult,
    DocumentClassifier,
    DocumentType,
    RuleBasedDocumentClassifier,
)


@pytest.fixture
def classifier() -> RuleBasedDocumentClassifier:
    return RuleBasedDocumentClassifier()


# =========================================================================
# 1. Deterministic Statutory Anchor Tests for Canonical Document Types
# =========================================================================

def test_classify_gst_certificate(classifier: RuleBasedDocumentClassifier):
    text = (
        "Government of India\n"
        "Form GST REG-06\n"
        "[See Rule 10(1)]\n"
        "Registration Certificate\n"
        "Registration Number: 33ABCDE1234F1Z5\n"
        "Legal Name: Apex Industrial Solutions Pvt Ltd\n"
        "Goods and Services Tax Act, 2017\n"
        "Jurisdiction: Chennai Central Division"
    )
    result = classifier.classify(filename="doc1.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.GST_CERT
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"
    assert any("form gst reg-06" in ev.lower() or "gst" in ev.lower() for ev in result.evidence)


def test_classify_pan_card(classifier: RuleBasedDocumentClassifier):
    text = (
        "INCOME TAX DEPARTMENT\n"
        "GOVT. OF INDIA\n"
        "Permanent Account Number Card\n"
        "ABCDE1234F\n"
        "Name: RAJESH SHARMA\n"
        "Father's Name: SURESH SHARMA\n"
        "Date of Birth: 15/08/1982"
    )
    result = classifier.classify(filename="scan_01.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.PAN_CARD
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"
    assert any("permanent account number" in ev.lower() for ev in result.evidence)


def test_classify_udyam_certificate(classifier: RuleBasedDocumentClassifier):
    text = (
        "MINISTRY OF MICRO, SMALL & MEDIUM ENTERPRISES\n"
        "UDYAM REGISTRATION CERTIFICATE\n"
        "UDYAM REGISTRATION NUMBER: UDYAM-TN-01-0012345\n"
        "NAME OF ENTERPRISE: SRI KAVERI ENGINEERING WORKS\n"
        "TYPE OF ENTERPRISE: SMALL\n"
        "MAJOR ACTIVITY: MANUFACTURING"
    )
    result = classifier.classify(filename="cert.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.UDYAM_CERT
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"
    assert any("udyam registration certificate" in ev.lower() for ev in result.evidence)


def test_classify_ca_turnover_certificate(classifier: RuleBasedDocumentClassifier):
    text = (
        "B. MEHTA & ASSOCIATES\n"
        "CHARTERED ACCOUNTANTS\n"
        "TO WHOMSOEVER IT MAY CONCERN\n"
        "ANNUAL TURNOVER CERTIFICATE\n"
        "This is to certify that the Annual Turnover of M/s Apex Industrial Solutions\n"
        "for the last 3 financial years is as follows:\n"
        "FY 2022-23: Rs. 8.42 Crores\n"
        "UDIN: 24123456AAAAAA1234\n"
        "Membership No: 123456"
    )
    result = classifier.classify(filename="financial_cert.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.CA_TURNOVER_CERT
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"
    assert any("udin" in ev.lower() or "chartered accountant" in ev.lower() for ev in result.evidence)


def test_classify_itr_acknowledgement(classifier: RuleBasedDocumentClassifier):
    text = (
        "INDIAN INCOME TAX RETURN ACKNOWLEDGEMENT\n"
        "FORM ITR-V\n"
        "Assessment Year: 2024-25\n"
        "Name: DELTA AUTOMATION CORP\n"
        "PAN: ABCDE5678G\n"
        "Acknowledgement Number: 123456789012345\n"
        "Total Income: Rs. 65,40,000"
    )
    result = classifier.classify(filename="tax.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.ITR_ACK
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


def test_classify_oem_authorization(classifier: RuleBasedDocumentClassifier):
    text = (
        "MANUFACTURER'S AUTHORIZATION FORM\n"
        "ANNEXURE-I\n"
        "To: Chennai Petroleum Corporation Limited\n"
        "We, Siemens Energy India Ltd, bonafide manufacturer of control valves,\n"
        "hereby authorize M/s Apex Industrial Solutions to submit bid\n"
        "against Tender No CPCL/2026/01 and guarantee warranty."
    )
    result = classifier.classify(filename="annexure.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.OEM_AUTH
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


def test_classify_integrity_pact(classifier: RuleBasedDocumentClassifier):
    text = (
        "CHENNAI PETROLEUM CORPORATION LIMITED\n"
        "PRE-CONTRACT INTEGRITY PACT\n"
        "Between CPCL (hereinafter referred to as The Principal)\n"
        "and M/s Apex Industrial Solutions (hereinafter referred to as The Bidder)\n"
        "Commitments of the Bidder / Sanctions for Violations / IEM"
    )
    result = classifier.classify(filename="ip.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.INTEGRITY_PACT
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


def test_classify_mii_declaration(classifier: RuleBasedDocumentClassifier):
    text = (
        "SELF-DECLARATION CERTIFICATE\n"
        "PUBLIC PROCUREMENT (PREFERENCE TO MAKE IN INDIA) ORDER 2017\n"
        "We hereby declare that our Local Content percentage is 68.5%.\n"
        "We qualify as a Class-I Local Supplier under PPP-MII guidelines.\n"
        "Location of value addition: Manali Industrial Area, Chennai."
    )
    result = classifier.classify(filename="mii_cert.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.MII_DECLARATION
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


def test_classify_land_border_declaration(classifier: RuleBasedDocumentClassifier):
    text = (
        "DECLARATION REGARDING COMPLIANCE WITH RULE 144(XI)\n"
        "OF GENERAL FINANCIAL RULES (GFR) 2017\n"
        "We have read the clause regarding restrictions on procurement from a bidder\n"
        "of a country which shares a land border with India.\n"
        "We certify that we are not from such a country."
    )
    result = classifier.classify(filename="rule144.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.LAND_BORDER_DECL
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


def test_classify_startup_certificate(classifier: RuleBasedDocumentClassifier):
    text = (
        "DEPARTMENT FOR PROMOTION OF INDUSTRY AND INTERNAL TRADE\n"
        "MINISTRY OF COMMERCE & INDUSTRY\n"
        "CERTIFICATE OF RECOGNITION\n"
        "This is to certify that M/s SmartFlow AI Pvt Ltd is recognized as a Startup\n"
        "by DPIIT Recognition Number: DIPP123456\n"
        "Startup India Initiative."
    )
    result = classifier.classify(filename="startup.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.STARTUP_CERT
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


def test_classify_non_blacklisting_affidavit(classifier: RuleBasedDocumentClassifier):
    text = (
        "NON-BLACKLISTING / DEBARMENT AFFIDAVIT\n"
        "BEFORE THE NOTARY PUBLIC\n"
        "I, Rajesh Kumar, Director of Apex Industrial Solutions Pvt Ltd,\n"
        "do hereby solemnly affirm and declare that our firm has not been blacklisted\n"
        "or debarred by any government department, PSU, or CPCL."
    )
    result = classifier.classify(filename="affidavit.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.NON_BLACKLISTING
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


def test_classify_emd_proof(classifier: RuleBasedDocumentClassifier):
    text = (
        "STATE BANK OF INDIA\n"
        "BANK GUARANTEE FOR EARNEST MONEY DEPOSIT (EMD)\n"
        "BG Number: SBIN2026090123\n"
        "In consideration of Chennai Petroleum Corporation Limited...\n"
        "Security Deposit Amount: Rs. 2,00,000"
    )
    result = classifier.classify(filename="bg_emd.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.EMD_PROOF
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


def test_classify_audited_financials(classifier: RuleBasedDocumentClassifier):
    text = (
        "INDEPENDENT AUDITOR'S REPORT\n"
        "To the Members of Apex Industrial Solutions Private Limited\n"
        "Report on the Audit of the Standalone Financial Statements\n"
        "BALANCE SHEET AS AT 31ST MARCH 2024\n"
        "STATEMENT OF PROFIT AND LOSS FOR THE YEAR ENDED"
    )
    result = classifier.classify(filename="audit_report.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.AUDITED_FINANCIALS
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


def test_classify_work_order(classifier: RuleBasedDocumentClassifier):
    text = (
        "INDIAN OIL CORPORATION LIMITED\n"
        "PURCHASE ORDER / WORK ORDER\n"
        "PO No: 4500123456\n"
        "Scope of Work: Supply and Maintenance of High Pressure Valves\n"
        "Order Value: Rs. 1,25,00,000\n"
        "Completion Certificate: Work completed satisfactorily."
    )
    result = classifier.classify(filename="po_order.pdf", first_page_text=text)

    assert result.doc_type == DocumentType.WORK_ORDER
    assert result.confidence >= 0.95
    assert result.method == "deterministic_anchor"


# =========================================================================
# 2. Filename Heuristic Fallback (For Degraded Scans / Missing OCR)
# =========================================================================

def test_filename_heuristic_when_text_empty(classifier: RuleBasedDocumentClassifier):
    """When OCR returns 0 characters, filename heuristics classify with 0.85 confidence."""
    res_gst = classifier.classify(filename="GST_Certificate_Apex.pdf", first_page_text="")
    assert res_gst.doc_type == DocumentType.GST_CERT
    assert res_gst.method == "filename_heuristic"
    assert res_gst.confidence == 0.85

    res_pan = classifier.classify(filename="scan_pancard_director.pdf", first_page_text="")
    assert res_pan.doc_type == DocumentType.PAN_CARD
    assert res_pan.method == "filename_heuristic"

    res_udyam = classifier.classify(filename="udyam_registration_final.pdf", first_page_text="")
    assert res_udyam.doc_type == DocumentType.UDYAM_CERT
    assert res_udyam.method == "filename_heuristic"

    res_turnover = classifier.classify(filename="ca_turnover_certificate_fy24.pdf", first_page_text="")
    assert res_turnover.doc_type == DocumentType.CA_TURNOVER_CERT
    assert res_turnover.method == "filename_heuristic"


# =========================================================================
# 3. Multi-Page Document Inspection
# =========================================================================

def test_multi_page_document_classification(classifier: RuleBasedDocumentClassifier):
    """If page 1 is a generic cover letter, check subsequent pages to classify correctly."""
    page_1_cover = (
        "APEX INDUSTRIAL SOLUTIONS\n"
        "To, The Procurement Officer, CPCL\n"
        "Sub: Submission of Tender Documents for Ref No CPCL/2026/01\n"
        "Please find enclosed the statutory certificates as requested in the NIT."
    )
    page_2_gst = (
        "GOVERNMENT OF INDIA\n"
        "FORM GST REG-06\n"
        "REGISTRATION CERTIFICATE\n"
        "GSTIN: 33ABCDE1234F1Z5\n"
        "GOODS AND SERVICES TAX"
    )

    res = classifier.classify_document(
        filename="document_bundle.pdf",
        pages_text=[page_1_cover, page_2_gst],
    )
    assert res.doc_type == DocumentType.GST_CERT
    assert res.confidence >= 0.95
    assert res.matched_page == 2


# =========================================================================
# 4. Unknown Fallback for Unrelated Content
# =========================================================================

def test_unrelated_content_returns_unknown(classifier: RuleBasedDocumentClassifier):
    """Random text unrelated to procurement returns UNKNOWN with 0.0 confidence."""
    junk_text = (
        "Once upon a midnight dreary, while I pondered, weak and weary,\n"
        "Over many a quaint and curious volume of forgotten lore—\n"
        "While I nodded, nearly napping, suddenly there came a tapping."
    )
    result = classifier.classify(filename="poem.pdf", first_page_text=junk_text)

    assert result.doc_type == DocumentType.UNKNOWN
    assert result.confidence == 0.0
    assert result.method == "fallback"
