"""Comprehensive Tests for Tender Requirement Extraction."""

import json
from pathlib import Path
import pytest

from pipeline.extraction.tender import TenderRequirement, TenderRequirementExtractor

FIXTURES_DIR = Path(__file__).resolve().parent.parent / "data" / "fixtures" / "tenders"
SEED_DIR = Path(__file__).resolve().parent.parent / "seed"


# =========================================================================
# 1. TenderRequirement DTO Contract Test
# =========================================================================

def test_tender_requirement_schema_contract():
    req = TenderRequirement(
        requirement_id="TREQ-TEST-01",
        title="Test Requirement",
        category="FINANCIAL",
        condition="Turnover >= Rs. 10,00,000",
        source_document="test_nit.pdf",
        page=2,
        clause_reference="Clause 3.1",
        mandatory=True,
        structured_parameters={"min_amount": 1000000.0},
        confidence=1.0,
        raw_text="Raw clause snippet",
    )
    d = req.to_dict()

    # Exact required fields per task prompt
    assert "requirement_id" in d
    assert "title" in d
    assert "category" in d
    assert "condition" in d
    assert "source_document" in d
    assert "page" in d
    assert "clause_reference" in d
    assert "mandatory" in d
    assert "structured_parameters" in d
    assert "confidence" in d
    assert "raw_text" in d

    assert d["requirement_id"] == "TREQ-TEST-01"
    assert d["mandatory"] == "MANDATORY"
    assert d["structured_parameters"]["min_amount"] == 1000000.0


# =========================================================================
# 2. Demo Tender NIT Document Extraction Test
# =========================================================================

def test_extract_from_demo_tender_nit_document():
    extractor = TenderRequirementExtractor()
    demo_path = FIXTURES_DIR / "demo_tender_nit.txt"
    assert demo_path.exists(), "demo_tender_nit.txt must exist"

    with open(demo_path, "r", encoding="utf-8") as f:
        text = f.read()

    requirements = extractor.extract_from_text(text, source_document="demo_tender_nit.txt", page=1)

    assert len(requirements) >= 9

    req_by_id = {r.requirement_id: r for r in requirements}

    # 1. Turnover Minimum
    assert "TREQ-FIN-01" in req_by_id
    r_turnover = req_by_id["TREQ-FIN-01"]
    assert r_turnover.category == "FINANCIAL"
    assert r_turnover.structured_parameters["min_turnover_inr"] == 13500000.0
    assert r_turnover.structured_parameters["years"] == 3
    assert "Clause 3.1" in r_turnover.clause_reference
    assert r_turnover.mandatory is True

    # 2. Net Worth Solvency
    assert "TREQ-FIN-02" in req_by_id
    r_nw = req_by_id["TREQ-FIN-02"]
    assert r_nw.category == "FINANCIAL"
    assert r_nw.structured_parameters["must_be_positive"] is True

    # 3. Mandatory Registrations (GST & PAN)
    assert "TREQ-ID-01" in req_by_id
    r_id = req_by_id["TREQ-ID-01"]
    assert r_id.category == "IDENTITY"
    assert r_id.structured_parameters["requires_gstin"] is True
    assert r_id.structured_parameters["requires_pan"] is True

    # 4. OEM Authorization
    assert "TREQ-TEC-01" in req_by_id
    r_oem = req_by_id["TREQ-TEC-01"]
    assert r_oem.category == "TECHNICAL"
    assert r_oem.structured_parameters["format_required"] == "Annexure-I"
    assert "Clause 4.1" in r_oem.clause_reference

    # 5. Technical Past Performance
    assert "TREQ-TEC-02" in req_by_id
    r_tech = req_by_id["TREQ-TEC-02"]
    assert r_tech.category == "TECHNICAL"
    assert r_tech.structured_parameters["min_order_value_inr"] == 15000000.0

    # 6. Make in India (PPP-MII)
    assert "TREQ-REG-01" in req_by_id
    r_mii = req_by_id["TREQ-REG-01"]
    assert r_mii.category == "REGULATORY"
    assert r_mii.structured_parameters["min_local_content_pct"] == 50.0
    assert r_mii.structured_parameters["class_required"] == "Class-I"

    # 7. Land Border Rule 144(xi)
    assert "TREQ-REG-02" in req_by_id
    r_lb = req_by_id["TREQ-REG-02"]
    assert r_lb.category == "REGULATORY"
    assert "144(xi)" in r_lb.condition

    # 8. EMD Guarantee
    assert "TREQ-COM-01" in req_by_id
    r_emd = req_by_id["TREQ-COM-01"]
    assert r_emd.category == "COMMERCIAL"
    assert r_emd.structured_parameters["emd_amount_inr"] == 900000.0
    assert "BG" in r_emd.structured_parameters["acceptable_modes"]

    # 9. MSE Policy Conditions
    assert "TREQ-COM-02" in req_by_id
    r_mse = req_by_id["TREQ-COM-02"]
    assert r_mse.category == "COMMERCIAL"
    assert "MICRO" in r_mse.structured_parameters["eligible_categories"]

    # 10. Validity & Expiry Constraints
    assert "TREQ-VAL-01" in req_by_id
    r_val = req_by_id["TREQ-VAL-01"]
    assert r_val.category == "VALIDITY"
    assert r_val.structured_parameters["min_validity_days"] == 120

    # 11. Document Checklist
    assert "TREQ-DOC-01" in req_by_id
    r_doc = req_by_id["TREQ-DOC-01"]
    assert r_doc.category == "DOCUMENTATION"
    assert len(r_doc.structured_parameters["mandatory_document_list"]) >= 8


# =========================================================================
# 3. Seed Template Tender JSON Extraction Test
# =========================================================================

def test_extract_from_seed_template_tender():
    extractor = TenderRequirementExtractor()
    template_path = SEED_DIR / "template_tender.json"
    assert template_path.exists(), "template_tender.json must exist"

    with open(template_path, "r", encoding="utf-8") as f:
        template_data = json.load(f)

    requirements = extractor.extract_from_template(template_data, source_document="template_tender.json")

    assert len(requirements) == 7
    codes = [r.requirement_id for r in requirements]
    assert "TREQ-C-01" in codes
    assert "TREQ-C-02" in codes
    assert "TREQ-C-06" in codes
    assert "TREQ-C-07" in codes

    # Test parameters in C-02 (Turnover)
    r_c02 = next(r for r in requirements if r.requirement_id == "TREQ-C-02")
    assert r_c02.structured_parameters["min_turnover_inr"] == 13500000.00
    assert r_c02.structured_parameters["years"] == 3


# =========================================================================
# 4. Multi-Page Document Extraction Test
# =========================================================================

def test_extract_from_multi_page_document():
    extractor = TenderRequirementExtractor()
    pages = [
        {"page_no": 1, "text": "NOTICE INVITING TENDER\nNIT No: CPCL/2026/01\nEstimated Value: Rs. 10,00,00,000\nClause 3.1: Minimum average annual turnover Rs. 3,00,00,000 in last 3 years."},
        {"page_no": 2, "text": "Clause 4.1: OEM authorization letter per Annexure-I mandatory.\nClause 2.1: EMD of Rs. 20,00,000 required."},
    ]

    reqs = extractor.extract_from_pages(pages, source_document="sample_tender.pdf")
    req_ids = [r.requirement_id for r in reqs]

    assert "TREQ-FIN-01" in req_ids
    assert "TREQ-TEC-01" in req_ids
    assert "TREQ-COM-01" in req_ids

    r_turnover = next(r for r in reqs if r.requirement_id == "TREQ-FIN-01")
    assert r_turnover.structured_parameters["min_turnover_inr"] == 30000000.0
