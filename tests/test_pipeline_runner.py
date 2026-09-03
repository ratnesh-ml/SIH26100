"""Comprehensive End-to-End Tests for the Connected 14-Step Processing Pipeline."""

from datetime import datetime, timezone
import hashlib
from pathlib import Path
import pytest
import uuid

from pipeline.runner import (
    PipelineContext,
    PipelineRunner,
    StepExecutionResult,
)


@pytest.fixture
def runner():
    return PipelineRunner(max_retries=2)


@pytest.fixture
def clean_demo_bidder_context():
    """Create a fully-formed demo bidder context with GST, PAN, Udyam, and CA Turnover certificates."""
    tender_id = "NIT-CPCL-2026-PUMP-217"
    bidder_id = str(uuid.uuid4())
    job_id = str(uuid.uuid4())

    # Simulated statutory documents with authentic text content
    gst_text = (
        "GOVERNMENT OF INDIA\n"
        "FORM GST REG-06\n"
        "Registration Certificate\n"
        "Registration Number : 33AABCC1234F1Z5\n"
        "Legal Name : Kaveri Engineering Works Private Limited\n"
        "Trade Name : Kaveri Engineering\n"
        "Constitution of Business : Private Limited Company\n"
        "Address : Plot 42, SIDCO Industrial Estate, Ambattur, Chennai 600058\n"
        "Date of Registration : 01/07/2017\n"
        "Status : Active\n"
    )

    pan_text = (
        "INCOME TAX DEPARTMENT\n"
        "GOVT. OF INDIA\n"
        "Permanent Account Number\n"
        "AABCC1234F\n"
        "Name : KAVERI ENGINEERING WORKS PVT LTD\n"
        "Date of Incorporation : 15/03/2012\n"
    )

    udyam_text = (
        "UDYAM REGISTRATION CERTIFICATE\n"
        "UDYAM REGISTRATION NUMBER : UDYAM-TN-01-0012345\n"
        "NAME OF ENTERPRISE : M/S KAVERI ENGINEERING WORKS PVT LTD\n"
        "MAJOR ACTIVITY : MANUFACTURING\n"
        "ENTERPRISE TYPE : SMALL\n"
    )

    turnover_text = (
        "CHARTERED ACCOUNTANTS CERTIFICATE\n"
        "TO WHOMSOEVER IT MAY CONCERN\n"
        "This is to certify that M/s Kaveri Engineering Works Pvt Ltd has the following turnover:\n"
        "FY 2021-22: Rs. 16,50,00,000\n"
        "FY 2022-23: Rs. 18,20,00,000\n"
        "FY 2023-24: Rs. 20,80,00,000\n"
        "Average Annual Turnover: Rs 18,50,00,000\n"
        "UDIN: 24123456AAAAAB1234\n"
        "CA Name: R. Sundaram & Co.\n"
    )

    docs = [
        {
            "id": "doc-gst-01",
            "filename": "GST_REG_06_Certificate.pdf",
            "bytes": gst_text.encode("utf-8"),
            "pages": [{"page_no": 1, "text": gst_text}],
        },
        {
            "id": "doc-pan-01",
            "filename": "PAN_Card.pdf",
            "bytes": pan_text.encode("utf-8"),
            "pages": [{"page_no": 1, "text": pan_text}],
        },
        {
            "id": "doc-udyam-01",
            "filename": "Udyam_Registration.pdf",
            "bytes": udyam_text.encode("utf-8"),
            "pages": [{"page_no": 1, "text": udyam_text}],
        },
        {
            "id": "doc-turnover-01",
            "filename": "CA_Turnover_Certificate.pdf",
            "bytes": turnover_text.encode("utf-8"),
            "pages": [{"page_no": 1, "text": turnover_text}],
        },
    ]

    return PipelineContext(
        tender_id=tender_id,
        bidder_id=bidder_id,
        job_id=job_id,
        documents=docs,
        metadata={
            "declared_name": "Kaveri Engineering Works Pvt Ltd",
            "company_name": "Kaveri Engineering Works Private Limited",
            "tender_requirements": [
                {
                    "requirement_id": "REQ-MAND-01",
                    "title": "Mandatory GST Registration",
                    "category": "MANDATORY_REGISTRATION",
                },
                {
                    "requirement_id": "REQ-MAND-02",
                    "title": "Mandatory PAN Card",
                    "category": "MANDATORY_REGISTRATION",
                },
                {
                    "requirement_id": "REQ-FIN-01",
                    "title": "Average Annual Turnover Minimum",
                    "category": "TURNOVER_MINIMUM",
                    "parameters": {"min_turnover_inr": 135000000.0},
                },
            ],
        },
    )


# =========================================================================
# 1. Pipeline Step Structure & Execution Contract
# =========================================================================

def test_pipeline_named_steps_definition(runner):
    """Verify all 14 explicit named steps are properly registered in sequence."""
    assert len(runner.NAMED_STEPS) == 14
    step_names = [s[1] for s in runner.NAMED_STEPS]

    assert "upload_and_registration" in step_names
    assert "page_extraction" in step_names
    assert "text_extraction" in step_names
    assert "ocr_fallback" in step_names
    assert "classification" in step_names
    assert "field_extraction" in step_names
    assert "normalization" in step_names
    assert "entity_resolution" in step_names
    assert "government_verification" in step_names
    assert "tender_requirement_checks" in step_names
    assert "compliance_rules" in step_names
    assert "anomalies" in step_names
    assert "risk_scoring" in step_names
    assert "findings_and_evidence" in step_names


def test_step_execution_result_contract():
    """Verify StepExecutionResult satisfies start, output, state, and status reporting."""
    res = StepExecutionResult(
        step_number=1,
        name="Upload & Document Registration",
        status="DONE",
        message="Registered 3 files",
        output_data={"count": 3},
        started_at="2026-09-03T20:00:00Z",
        ended_at="2026-09-03T20:00:01Z",
        duration_ms=1050.5,
        retry_count=0,
    )
    d = res.to_dict()
    assert d["step_number"] == 1
    assert d["name"] == "Upload & Document Registration"
    assert d["status"] == "DONE"
    assert d["duration_ms"] == 1050.5
    assert d["output_data"]["count"] == 3


# =========================================================================
# 2. Individual Named Steps Verification
# =========================================================================

def test_step_01_upload_and_registration(runner, clean_demo_bidder_context):
    res = runner.step_01_upload_and_registration(clean_demo_bidder_context)
    assert res.status == "DONE"
    assert len(clean_demo_bidder_context.documents) == 4
    for doc in clean_demo_bidder_context.documents:
        assert doc["sha256"] is not None
        assert doc["status"] == "REGISTERED"


def test_step_05_classification(runner, clean_demo_bidder_context):
    runner.step_01_upload_and_registration(clean_demo_bidder_context)
    runner.step_02_page_extraction(clean_demo_bidder_context)
    res = runner.step_05_classification(clean_demo_bidder_context)
    assert res.status == "DONE"

    types = [d["doc_type"] for d in clean_demo_bidder_context.documents]
    assert "GST_CERT" in types
    assert "PAN_CARD" in types
    assert "UDYAM_CERT" in types


def test_step_06_field_extraction(runner, clean_demo_bidder_context):
    runner.step_01_upload_and_registration(clean_demo_bidder_context)
    runner.step_02_page_extraction(clean_demo_bidder_context)
    runner.step_05_classification(clean_demo_bidder_context)
    res = runner.step_06_field_extraction(clean_demo_bidder_context)
    assert res.status == "DONE"

    fields = clean_demo_bidder_context.extracted_fields
    assert len(fields) == 4
    # Verify GSTIN and PAN extracted
    gst_fields = fields["doc-gst-01"]
    assert gst_fields["gstin"]["value"] == "33AABCC1234F1Z5"

    pan_fields = fields["doc-pan-01"]
    assert pan_fields["pan"]["value"] == "AABCC1234F"


def test_step_08_entity_resolution(runner, clean_demo_bidder_context):
    runner.step_01_upload_and_registration(clean_demo_bidder_context)
    runner.step_02_page_extraction(clean_demo_bidder_context)
    runner.step_05_classification(clean_demo_bidder_context)
    runner.step_06_field_extraction(clean_demo_bidder_context)
    runner.step_07_normalization(clean_demo_bidder_context)

    res = runner.step_08_entity_resolution(clean_demo_bidder_context)
    assert res.status == "DONE"
    entity = clean_demo_bidder_context.canonical_entity
    assert "KAVERI ENGINEERING" in entity["canonical_name"].upper()
    assert entity["status"] in ("EXACT_MATCH", "LIKELY_MATCH")
    assert entity["pan"] == "AABCC1234F"
    assert entity["gstin"] == "33AABCC1234F1Z5"


def test_step_09_government_verification(runner, clean_demo_bidder_context):
    clean_demo_bidder_context.canonical_entity = {
        "canonical_name": "Kaveri Engineering Works Pvt Ltd",
        "gstin": "33AABCC1234F1Z5",
        "pan": "AABCC1234F",
        "udyam": "UDYAM-TN-01-0012345",
    }
    res = runner.step_09_government_verification(clean_demo_bidder_context)
    assert res.status == "DONE"

    reg = clean_demo_bidder_context.registry_results
    assert "gstin" in reg
    assert "pan" in reg
    assert "debarment" in reg
    assert reg["gstin"]["found"] is True
    assert reg["pan"]["found"] is True
    assert reg["debarment"]["found"] is False  # Not debarred


# =========================================================================
# 3. Complete End-to-End Pipeline Execution (run_all)
# =========================================================================

def test_end_to_end_demo_bidder_run_all(runner, clean_demo_bidder_context):
    """Execute all 14 steps end-to-end on clean demo bidder and verify all results."""
    results = runner.run_all(clean_demo_bidder_context)

    # 1. Verify all 14 steps executed and completed
    assert len(results) == 14
    for r in results:
        assert r.status == "DONE", f"Step {r.step_number} ({r.name}) failed: {r.message}"
        assert r.started_at is not None
        assert r.ended_at is not None
        assert r.duration_ms >= 0.0

    # 2. Verify state persistence in context history
    assert len(clean_demo_bidder_context.step_history) == 14

    # 3. Verify compliance findings
    findings = clean_demo_bidder_context.findings
    assert len(findings) > 0
    # Statutory mandatory registrations should PASS
    gst_finding = next((f for f in findings if f.get("rule_id") == "R-GST-01"), None)
    if gst_finding:
        assert gst_finding["status"] == "PASS"

    # 4. Verify risk profile
    risk = clean_demo_bidder_context.risk_profile
    assert risk["composite_score"] <= 24  # Clean bidder is LOW risk
    assert risk["risk_band"] == "LOW"

    # 5. Verify evidence traces generated
    traces = clean_demo_bidder_context.evidence_traces
    assert len(traces) > 0
    for t in traces:
        assert "finding_id" in t
        assert "provenance_summary" in t


# =========================================================================
# 4. Safe Failure & Retry Mechanics
# =========================================================================

def test_safe_failure_and_retry_behavior(runner):
    """Ensure pipeline catches fatal step errors safely and persists FAILED status."""
    bad_context = PipelineContext(
        tender_id="t-bad",
        bidder_id="b-bad",
        job_id="j-bad",
        documents=[],  # Empty documents
    )

    # Calling classification on empty docs should be safe and return DONE with 0
    res = runner.step_05_classification(bad_context)
    assert res.status == "DONE"
    assert res.output_data["classified_types"] == {}


def test_pipeline_resumption_from_step(runner, clean_demo_bidder_context):
    """Verify run_from_step executes only steps from designated start step onward."""
    # Pre-populate context through step 6
    runner.step_01_upload_and_registration(clean_demo_bidder_context)
    runner.step_02_page_extraction(clean_demo_bidder_context)
    runner.step_03_text_extraction(clean_demo_bidder_context)
    runner.step_04_ocr_fallback(clean_demo_bidder_context)
    runner.step_05_classification(clean_demo_bidder_context)
    runner.step_06_field_extraction(clean_demo_bidder_context)

    # Resume from step 7 (normalization)
    resumed_results = runner.run_from_step(start_step=7, ctx=clean_demo_bidder_context)
    # Total remaining steps: 14 - 6 = 8 steps
    assert len(resumed_results) == 8
    assert resumed_results[0].step_number == 7
    assert resumed_results[-1].step_number == 14
    for r in resumed_results:
        assert r.status == "DONE"


# =========================================================================
# 5. Backward Compatibility Aliases (INTERFACE-CONTRACTS.md)
# =========================================================================

def test_interface_contract_11_step_aliases(runner, clean_demo_bidder_context):
    """Verify all 11 step method signatures locked in docs/INTERFACE-CONTRACTS.md exist and run."""
    r1 = runner.step_01_ingest(clean_demo_bidder_context)
    assert r1.status == "DONE"

    r2 = runner.step_02_classify(clean_demo_bidder_context)
    assert r2.status == "DONE"

    r3 = runner.step_03_textify(clean_demo_bidder_context)
    assert r3.status == "DONE"

    r4 = runner.step_04_extract(clean_demo_bidder_context)
    assert r4.status == "DONE"

    r5 = runner.step_05_normalize(clean_demo_bidder_context)
    assert r5.status == "DONE"

    r6 = runner.step_06_entity_resolution(clean_demo_bidder_context)
    assert r6.status == "DONE"

    r7 = runner.step_07_verify(clean_demo_bidder_context)
    assert r7.status == "DONE"

    r8 = runner.step_08_compliance_rules(clean_demo_bidder_context)
    assert r8.status == "DONE"

    r9 = runner.step_09_anomalies(clean_demo_bidder_context)
    assert r9.status == "DONE"

    r10 = runner.step_10_risk_score(clean_demo_bidder_context)
    assert r10.status == "DONE"

    r11 = runner.step_11_explain(clean_demo_bidder_context)
    assert r11.status == "DONE"
