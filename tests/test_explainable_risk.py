"""Test suite for Explainable Risk Engine answering WHY for every risk factor."""

import uuid
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.api.deps import get_current_user
from backend.core.security import create_access_token
from backend.models.entities import User, Bidder, Finding, AnomalySignal, RiskDriver
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


def test_explain_risk_clean_bidder(mock_auth_headers, mock_officer):
    """Verify clean bidder returns low risk explanation with zero score."""
    bidder_id = uuid.uuid4()
    mock_bidder = Bidder(
        id=bidder_id,
        declared_name="Meridian Flow Systems Pvt Ltd",
        canonical_name="MERIDIAN FLOW SYSTEMS",
        risk_score=0,
        risk_band="LOW",
        overall_status="PASS",
    )
    mock_bidder.findings = []
    mock_bidder.risk_drivers = []
    mock_bidder.anomaly_signals = []

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
            f"/api/v1/bidders/{bidder_id}/risk/explain",
            headers=mock_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["bidder_id"] == str(bidder_id)
        assert data["score"] == 0
        assert data["band"] == "LOW"
        assert "Low Risk" in data["summary"]
        assert len(data["factors"]) == 0

    app.dependency_overrides.clear()


def test_explain_risk_high_risk_answers_why(mock_auth_headers, mock_officer):
    """Verify high-risk bidder answers WHY with distinct factor contributions and evidence."""
    bidder_id = uuid.uuid4()

    finding_pan = Finding(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        rule_id="CPCL-GOODS-002",
        status="FAIL",
        title="PAN-GSTIN Identity Inconsistency",
        explanation="PAN AAACB1234F does not match GSTIN characters 3-12 (AAACB9999F).",
        citation={"clause": "GFR Rule 144"},
        evidence=[{
            "document": "gst_reg06.pdf",
            "page_no": 1,
            "field": "gstin",
            "value": "33AAACB9999F1Z5",
            "source": "PyMuPDF Text Layer",
        }],
    )

    finding_local = Finding(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        rule_id="CPCL-GOODS-003",
        status="WARN",
        title="Local Content Deficit",
        explanation="Declared local content of 45% is below Class-I threshold of 50%.",
        citation={"clause": "PPP-MII Order 2017"},
        evidence=[{
            "document": "local_content.pdf",
            "page_no": 1,
            "field": "local_content",
            "value": "45%",
            "source": "PyMuPDF Text Layer",
        }],
    )

    mock_anomaly = AnomalySignal(
        id=1,
        bidder_id=bidder_id,
        code="A-PDF-01",
        severity="HIGH",
        points=20,
        description="PDF metadata edit detected (GIMP editing tag)",
        evidence={"producer": "GIMP 2.10"},
    )

    mock_bidder = Bidder(
        id=bidder_id,
        declared_name="Bharat Hydrotech Corp",
        canonical_name="BHARAT HYDROTECH",
        risk_score=65,
        risk_band="HIGH",
        overall_status="FAIL",
    )
    mock_bidder.findings = [finding_pan, finding_local]
    mock_bidder.anomaly_signals = [mock_anomaly]
    mock_bidder.risk_drivers = []

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
            f"/api/v1/bidders/{bidder_id}/risk/explain",
            headers=mock_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert data["bidder_id"] == str(bidder_id)
        assert data["score"] == 65
        assert data["band"] == "HIGH"
        assert len(data["factors"]) == 3

        # Check factor breakdown details
        categories = {f["category"] for f in data["factors"]}
        assert "Identity" in categories
        assert "Compliance" in categories
        assert "Anomaly" in categories

        for factor in data["factors"]:
            assert factor["contribution"] > 0
            assert len(factor["reason"]) > 10
            assert factor["explanation_status"] == "EXPLAINED"
            assert factor["has_evidence"] is True
            assert len(factor["evidence"]) >= 1

    app.dependency_overrides.clear()


def test_explain_risk_missing_evidence_flagged(mock_auth_headers, mock_officer):
    """Verify finding without evidence is flagged as INSUFFICIENT_EVIDENCE."""
    bidder_id = uuid.uuid4()

    finding_no_ev = Finding(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        rule_id="CPCL-GOODS-099",
        status="FAIL",
        title="Unsubstantiated Discrepancy",
        explanation="No visual evidence attached to this assertion.",
        evidence=[],
    )

    mock_bidder = Bidder(
        id=bidder_id,
        declared_name="Nova Pumps & Systems Ltd",
        canonical_name="NOVA PUMPS",
        risk_score=35,
        risk_band="MEDIUM",
        overall_status="WARN",
    )
    mock_bidder.findings = [finding_no_ev]
    mock_bidder.anomaly_signals = []
    mock_bidder.risk_drivers = []

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
            f"/api/v1/bidders/{bidder_id}/risk/explain",
            headers=mock_auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["factors"]) == 1
        factor = data["factors"][0]
        assert factor["has_evidence"] is False
        assert factor["explanation_status"] == "INSUFFICIENT_EVIDENCE"
        assert "Insufficient visual evidence" in factor["reason"]

    app.dependency_overrides.clear()


def test_explain_risk_missing_bidder_404(mock_auth_headers, mock_officer):
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
            f"/api/v1/bidders/{random_id}/risk/explain",
            headers=mock_auth_headers,
        )
        assert response.status_code == 404

    app.dependency_overrides.clear()
