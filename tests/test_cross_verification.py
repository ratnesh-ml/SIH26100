"""Comprehensive Unit and Integration Tests for Cross-Document Verification Engine."""

import pytest

from pipeline.compliance.cross_verifier import CrossDocumentVerifier, VerificationFinding
from pipeline.compliance.engine import ComplianceEngine
from pipeline.registry_adapters.mock_adapter import MockRegistryProvider


# =========================================================================
# 1. PAN <-> GSTIN Verification Tests (R-GST-02 & R-PAN-02)
# =========================================================================

def test_pan_gstin_parity_authoritative_match():
    verifier = CrossDocumentVerifier()
    findings = verifier.verify_pan_gstin_parity(
        pan_value="AABCC1234F",
        gstin_value="33AABCC1234F1Z5",
        pan_name="Apex Industrial Solutions Private Limited",
        gst_name="Apex Industrial Solutions Pvt Ltd",
    )

    assert len(findings) == 2

    # Finding 1: Hard Identifier Linkage
    f_id = findings[0]
    assert f_id.check_id == "XDOC-PAN-GST-01"
    assert f_id.status == "PASS"
    assert f_id.confidence == 1.0
    assert "AABCC1234F" in f_id.actual_values["declared_pan"]
    assert "exactly matches" in f_id.explanation
    assert f_id.potential_anomaly_detected is False

    # Finding 2: Name Parity
    f_name = findings[1]
    assert f_name.check_id == "XDOC-PAN-GST-02"
    assert f_name.status == "PASS"
    assert f_name.confidence >= 0.85


def test_pan_gstin_parity_mismatch_anomaly():
    verifier = CrossDocumentVerifier()
    findings = verifier.verify_pan_gstin_parity(
        pan_value="AABCC1234F",
        gstin_value="33AAACD9876K1Z9",  # Embedded PAN is AAACD9876K
    )

    assert len(findings) == 1
    f_id = findings[0]
    assert f_id.check_id == "XDOC-PAN-GST-01"
    assert f_id.status == "FAIL"
    assert f_id.confidence == 1.0
    assert f_id.potential_anomaly_detected is True
    # Verify conservative non-fraud vocabulary
    assert "fraud" not in f_id.explanation.lower()
    assert "Potential anomaly detected" in f_id.explanation
    assert "Human verification required" in f_id.explanation


def test_pan_gstin_missing_document_triggers_review():
    verifier = CrossDocumentVerifier()
    findings = verifier.verify_pan_gstin_parity(
        pan_value=None,
        gstin_value="33AABCC1234F1Z5",
    )
    assert len(findings) == 1
    assert findings[0].status == "REVIEW"
    assert "Missing PAN or GSTIN" in findings[0].explanation


# =========================================================================
# 2. GST <-> Udyam Parity Tests (R-UDY-03)
# =========================================================================

def test_gst_udyam_parity_positive():
    verifier = CrossDocumentVerifier()
    findings = verifier.verify_gst_udyam_parity(
        gstin="33AABCC1234F1Z5",
        udyam_no="UDYAM-TN-01-0012345",
        udyam_pan="AABCC1234F",
        gst_name="Apex Industrial Solutions Pvt Ltd",
        udyam_name="Apex Industrial Solutions Private Limited",
    )

    assert len(findings) == 2
    assert findings[0].check_id == "XDOC-GST-UDY-01"
    assert findings[0].status == "PASS"
    assert findings[1].check_id == "XDOC-GST-UDY-02"
    assert findings[1].status == "PASS"


def test_gst_udyam_identifier_conflict_fails():
    verifier = CrossDocumentVerifier()
    findings = verifier.verify_gst_udyam_parity(
        gstin="33AABCC1234F1Z5",
        udyam_no="UDYAM-TN-01-0012345",
        udyam_pan="XYZAB9999F",  # Mismatch against GSTIN PAN AABCC1234F
    )

    assert len(findings) == 1
    f = findings[0]
    assert f.check_id == "XDOC-GST-UDY-01"
    assert f.status == "FAIL"
    assert f.potential_anomaly_detected is True
    assert "conflict" in f.explanation.lower()


# =========================================================================
# 3. Declared Company Name <-> GST / Udyam Tests (R-GST-03 / R-UDY-04)
# =========================================================================

def test_company_name_parity_positive_and_review():
    verifier = CrossDocumentVerifier()

    # Positive match (Pvt Ltd vs Private Limited)
    f_pass = verifier.verify_company_name_parity(
        declared_bidder_name="ABC Engineering Pvt Ltd",
        target_name="ABC Engineering Private Limited",
        target_doc_type="GST",
    )
    assert f_pass.check_id == "XDOC-COMP-GST-01"
    assert f_pass.status == "PASS"
    assert f_pass.confidence >= 0.85

    # Discrepancy / Unrelated entity
    f_fail = verifier.verify_company_name_parity(
        declared_bidder_name="ABC Engineering Pvt Ltd",
        target_name="Zenith Petroleum Supplies LLP",
        target_doc_type="GST",
    )
    assert f_fail.status == "FAIL"
    assert f_fail.potential_anomaly_detected is True


# =========================================================================
# 4. Identity Fields <-> Government Registry Tests
# =========================================================================

@pytest.mark.asyncio
async def test_identity_against_registry_clean_bidder():
    verifier = CrossDocumentVerifier()
    reg = MockRegistryProvider(simulate_latency=False)

    findings = await verifier.verify_identity_against_registry(
        registry_provider=reg,
        gstin="33AABCC1234F1Z5",
        pan="AABCC1234F",
        udyam_no="UDYAM-TN-01-0012345",
        company_name="Apex Industrial Solutions Private Limited",
        claims_mse_benefits=True,
    )

    statuses = {f.check_id: f.status for f in findings}
    assert statuses["XDOC-REG-GST-01"] == "PASS"
    assert statuses["XDOC-REG-PAN-01"] == "PASS"
    assert statuses["XDOC-REG-UDY-01"] == "PASS"
    assert statuses["XDOC-REG-DEB-01"] == "PASS"


@pytest.mark.asyncio
async def test_identity_against_registry_cancelled_gst():
    verifier = CrossDocumentVerifier()
    reg = MockRegistryProvider(simulate_latency=False)

    findings = await verifier.verify_identity_against_registry(
        registry_provider=reg,
        gstin="33AAACD9876K1Z9",  # Cancelled GSTIN in fixture
    )

    f_gst = next(f for f in findings if f.check_id == "XDOC-REG-GST-01")
    assert f_gst.status == "FAIL"
    assert f_gst.actual_values["status"] == "CANCELLED"
    assert "CANCELLED" in f_gst.explanation
    assert f_gst.potential_anomaly_detected is True


@pytest.mark.asyncio
async def test_identity_against_registry_medium_enterprise_claiming_mse_benefits():
    verifier = CrossDocumentVerifier()
    reg = MockRegistryProvider(simulate_latency=False)

    findings = await verifier.verify_identity_against_registry(
        registry_provider=reg,
        udyam_no="UDYAM-MH-02-0044556",  # MEDIUM enterprise in fixture
        claims_mse_benefits=True,
    )

    f_udy = next(f for f in findings if f.check_id == "XDOC-REG-UDY-01")
    assert f_udy.status == "FAIL"
    assert "MEDIUM" in f_udy.explanation
    assert "Ineligible for MSE exemptions" in f_udy.explanation


@pytest.mark.asyncio
async def test_identity_against_registry_debarred_entity():
    verifier = CrossDocumentVerifier()
    reg = MockRegistryProvider(simulate_latency=False)

    findings = await verifier.verify_identity_against_registry(
        registry_provider=reg,
        pan="AAACD9876K",  # Debarred PAN in fixture
        company_name="Coromandel Engineering Works",
    )

    f_deb = next(f for f in findings if f.check_id == "XDOC-REG-DEB-01")
    assert f_deb.status == "FAIL"
    assert f_deb.actual_values["debarred"] is True
    assert "CPPP/DEB/2023/881" in f_deb.explanation
    assert f_deb.potential_anomaly_detected is True


# =========================================================================
# 5. Registration Status <-> Document Dates Tests (R-DATE-01)
# =========================================================================

def test_dates_verification_issued_on_time():
    verifier = CrossDocumentVerifier()
    findings = verifier.verify_registration_and_dates(
        document_type="FORM_GST_REG_06",
        issue_date_str="2023-01-15",
        tender_due_date_str="2023-05-15",
    )
    assert len(findings) == 1
    assert findings[0].check_id == "XDOC-DATE-POST-DUE-01"
    assert findings[0].status == "PASS"


def test_dates_verification_post_due_date_fails():
    verifier = CrossDocumentVerifier()
    findings = verifier.verify_registration_and_dates(
        document_type="EXPERIENCE_CERTIFICATE",
        issue_date_str="2023-06-01",  # Issued after due date
        tender_due_date_str="2023-05-15",
    )
    assert len(findings) == 1
    assert findings[0].check_id == "XDOC-DATE-POST-DUE-01"
    assert findings[0].status == "FAIL"
    assert findings[0].potential_anomaly_detected is True
    assert "post-dates" in findings[0].explanation


def test_dates_verification_expired_certificate_fails():
    verifier = CrossDocumentVerifier()
    findings = verifier.verify_registration_and_dates(
        document_type="OEM_AUTHORIZATION",
        issue_date_str="2022-01-01",
        tender_due_date_str="2023-05-15",
        valid_until_str="2023-04-01",  # Expired before tender due date
    )
    assert len(findings) == 2
    f_exp = next(f for f in findings if f.check_id == "XDOC-DATE-EXPIRED-01")
    assert f_exp.status == "FAIL"
    assert "expired" in f_exp.explanation


# =========================================================================
# 6. ComplianceEngine Full Cross-Document Integration Test
# =========================================================================

@pytest.mark.asyncio
async def test_compliance_engine_cross_document_evaluation_suite():
    engine = ComplianceEngine()
    reg = MockRegistryProvider(simulate_latency=False)

    bidder_package = {
        "company_name": "Apex Industrial Solutions Private Limited",
        "pan": "AABCC1234F",
        "gstin": "33AABCC1234F1Z5",
        "gst_legal_name": "Apex Industrial Solutions Private Limited",
        "udyam_no": "UDYAM-TN-01-0012345",
        "udyam_pan": "AABCC1234F",
        "udyam_enterprise_name": "Apex Industrial Solutions Private Limited",
        "cin": "U29100TN2012PTC085412",
        "documents": [
            {
                "type": "FORM_GST_REG_06",
                "issue_date": "2017-07-01",
                "evidence": {"page": 1, "field": "gstin"},
            },
            {
                "type": "OEM_AUTHORIZATION",
                "issue_date": "2023-01-10",
                "valid_until": "2024-12-31",
                "evidence": {"page": 1, "field": "validity"},
            },
        ],
    }

    findings = await engine.evaluate_cross_document_checks(
        bidder_data=bidder_package,
        tender_due_date="2023-09-01",
        registry_provider=reg,
        claims_mse=True,
    )

    assert len(findings) >= 8

    # All required check types represented
    check_ids = [f.check_id for f in findings]
    assert "XDOC-PAN-GST-01" in check_ids
    assert "XDOC-GST-UDY-01" in check_ids
    assert "XDOC-COMP-GST-01" in check_ids
    assert "XDOC-COMP-UDYAM-01" in check_ids
    assert "XDOC-REG-GST-01" in check_ids
    assert "XDOC-REG-PAN-01" in check_ids
    assert "XDOC-REG-UDY-01" in check_ids
    assert "XDOC-REG-DEB-01" in check_ids
    assert "XDOC-DATE-POST-DUE-01" in check_ids
    assert "XDOC-DATE-EXPIRED-01" in check_ids

    # Validate output contract schema
    for f in findings:
        d = f.to_dict()
        assert "check_id" in d
        assert "input_fields" in d
        assert "expected_relationship" in d
        assert "actual_values" in d
        assert "status" in d
        assert d["status"] in ("PASS", "FAIL", "WARN", "REVIEW")
        assert "confidence" in d
        assert "evidence_references" in d
        assert "explanation" in d
