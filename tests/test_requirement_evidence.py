"""Test suite for Requirement -> Result -> Evidence Traceability Matrix and Verification History."""

import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.api.deps import get_current_user
from backend.core.security import create_access_token
from backend.models.entities import User, Tender, Bidder, Criterion, Finding, Document, VerificationEvent, Decision, AuditLog
from backend.auth.rbac import UserRole


@pytest.fixture
def mock_auth_headers():
    token = create_access_token(subject="test-officer-id", role=UserRole.OFFICER.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_officer():
    return User(
        id=uuid.uuid4(),
        email="officer@cpcl.gov.in",
        full_name="Ravi Kumar",
        role=UserRole.OFFICER.value,
        password_hash="mock_hash",
    )


def test_requirement_matrix_retrieval(mock_auth_headers, mock_officer):
    """Verify GET /api/v1/bidders/{id}/requirement-matrix returns all criteria mapped to results & evidence."""
    bidder_id = uuid.uuid4()
    tender_id = uuid.uuid4()

    mock_tender = Tender(
        id=tender_id,
        nit_no="CPCL/MM/2026/PUMP-217",
        title="12 API-610 Centrifugal Process Pumps",
        status="ACTIVE",
    )
    crit_c01 = Criterion(
        id=uuid.uuid4(),
        tender_id=tender_id,
        code="C-01",
        title="Average Annual Turnover",
        description="Minimum 3-year turnover >= ₹5.52 Cr",
        threshold={"min_inr": 55200000},
        sort_order=1,
    )
    crit_c02 = Criterion(
        id=uuid.uuid4(),
        tender_id=tender_id,
        code="C-02",
        title="Statutory Identity Consistency",
        description="PAN must match GSTIN embedded entity",
        sort_order=2,
    )
    mock_tender.criteria = [crit_c01, crit_c02]

    finding_c01 = Finding(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        criterion_id=crit_c01.id,
        rule_id="CPCL-GOODS-001",
        status="PASS",
        title="Turnover Threshold Satisfied",
        explanation="Average 3-year turnover of ₹6.10 Cr exceeds mandatory requirement of ₹5.52 Cr.",
        extracted={"average_turnover_inr": 61000000},
        expected={"min_turnover_inr": 55200000},
        citation={"clause": "GFR Rule 144(i)"},
        evidence=[{
            "document": "turnover_ca.pdf",
            "page_no": 1,
            "field": "turnover",
            "value": "6.10 Cr",
            "bbox": {"x": 120, "y": 240, "w": 180, "h": 25},
            "source": "PyMuPDF Text Layer",
        }],
    )

    mock_bidder = Bidder(
        id=bidder_id,
        tender_id=tender_id,
        declared_name="Bharat Hydrotech Corp",
        canonical_name="BHARAT HYDROTECH",
        overall_status="WARN",
        risk_score=65,
        risk_band="HIGH",
    )
    mock_bidder.tender = mock_tender
    mock_bidder.findings = [finding_c01]

    class MockSession:
        async def execute(self, stmt):
            class ScalarResult:
                def scalar_one_or_none(self):
                    return mock_bidder
            return ScalarResult()

    async def override_get_db():
        yield MockSession()

    async def override_user():
        return mock_officer

    app.dependency_overrides[get_db_session] = override_get_db
    app.dependency_overrides[get_current_user] = override_user

    with TestClient(app) as client:
        response = client.get(
            f"/api/v1/bidders/{bidder_id}/requirement-matrix",
            headers=mock_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["bidder_id"] == str(bidder_id)
        assert data["bidder_name"] == "Bharat Hydrotech Corp"
        assert data["total_requirements"] == 2
        assert data["satisfied_count"] == 1
        assert data["unsatisfied_count"] == 1

        # Check C-01 (Satisfied with evidence)
        c01 = [r for r in data["requirements"] if r["requirement_code"] == "C-01"][0]
        assert c01["is_satisfied"] is True
        assert c01["status"] == "PASS"
        assert len(c01["evidence"]) == 1
        assert c01["evidence"][0]["document"] == "turnover_ca.pdf"
        assert c01["evidence"][0]["page_no"] == 1

        # Check C-02 (Pending without finding)
        c02 = [r for r in data["requirements"] if r["requirement_code"] == "C-02"][0]
        assert c02["is_satisfied"] is False
        assert c02["status"] == "PENDING"

    app.dependency_overrides.clear()


def test_requirement_matrix_missing_bidder_404(mock_auth_headers, mock_officer):
    """Verify non-existent bidder returns 404."""
    class MockSession:
        async def execute(self, stmt):
            class ScalarResult:
                def scalar_one_or_none(self):
                    return None
            return ScalarResult()

    async def override_get_db():
        yield MockSession()

    async def override_user():
        return mock_officer

    app.dependency_overrides[get_db_session] = override_get_db
    app.dependency_overrides[get_current_user] = override_user

    with TestClient(app) as client:
        random_id = uuid.uuid4()
        response = client.get(
            f"/api/v1/bidders/{random_id}/requirement-matrix",
            headers=mock_auth_headers,
        )
        assert response.status_code == 404

    app.dependency_overrides.clear()


def test_historical_verification_record(mock_auth_headers, mock_officer):
    """Verify GET /api/v1/bidders/{id}/verification-history returns complete verification snapshot."""
    bidder_id = uuid.uuid4()
    tender_id = uuid.uuid4()

    mock_tender = Tender(
        id=tender_id,
        nit_no="CPCL/MM/2026/PUMP-217",
        title="12 API-610 Centrifugal Process Pumps",
    )
    mock_doc = Document(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        original_filename="gst_reg06.pdf",
        sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        doc_type="GST_CERTIFICATE",
        storage_path="/storage/gst_reg06.pdf",
    )
    mock_doc.created_at = datetime.now(timezone.utc)

    mock_finding = Finding(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        rule_id="CPCL-GOODS-002",
        status="PASS",
        title="GST Active",
        explanation="GSTIN verified active.",
    )

    mock_dec = Decision(
        id=uuid.uuid4(),
        finding_id=mock_finding.id,
        bidder_id=bidder_id,
        actor_id=mock_officer.id,
        action="ACCEPT",
        reason="Verified against GSTN",
        resulting_status="PASS",
        machine_recommendation="PASS",
        audit_ref="484601cbd608e00302488a09...",
    )
    mock_dec.actor = mock_officer
    mock_dec.created_at = datetime.now(timezone.utc)

    mock_bidder = Bidder(
        id=bidder_id,
        tender_id=tender_id,
        declared_name="Meridian Flow Systems Pvt Ltd",
        canonical_name="MERIDIAN FLOW SYSTEMS",
        overall_status="PASS",
        risk_score=0,
        risk_band="LOW",
    )
    mock_bidder.tender = mock_tender
    mock_bidder.documents = [mock_doc]
    mock_bidder.findings = [mock_finding]
    mock_bidder.verification_events = []
    mock_bidder.decisions = [mock_dec]

    class MockSession:
        async def execute(self, stmt):
            class ScalarResult:
                def scalar_one_or_none(self):
                    stmt_str = str(stmt).lower()
                    if "audit_log" in stmt_str:
                        mock_audit = AuditLog(
                            seq=10,
                            curr_hash="484601cbd608e00302488a09fc18a101f8d839bb2733d02a061c47a0016e7f53",
                            prev_hash="0000000000000000000000000000000000000000000000000000000000000000",
                            role="officer",
                            action="DECISION_ACCEPT",
                            target_type="finding",
                            target_id=str(mock_finding.id),
                        )
                        return mock_audit
                    return mock_bidder
            return ScalarResult()

    async def override_get_db():
        yield MockSession()

    async def override_user():
        return mock_officer

    app.dependency_overrides[get_db_session] = override_get_db
    app.dependency_overrides[get_current_user] = override_user

    with TestClient(app) as client:
        response = client.get(
            f"/api/v1/bidders/{bidder_id}/verification-history",
            headers=mock_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["bidder_id"] == str(bidder_id)
        assert len(data["documents_evaluated"]) == 1
        assert data["documents_evaluated"][0]["filename"] == "gst_reg06.pdf"
        assert len(data["officer_decisions"]) == 1
        assert data["officer_decisions"][0]["action"] == "ACCEPT"
        assert data["audit_chain_head"] is not None

    app.dependency_overrides.clear()
