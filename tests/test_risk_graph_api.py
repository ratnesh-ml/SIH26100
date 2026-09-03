"""Test Risk, Anomalies, and Cross-Bidder Graph endpoints."""

import uuid
from datetime import datetime, timezone
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token
from backend.models.entities import User, Tender, Bidder, RiskDriver, AnomalySignal
from backend.auth.rbac import UserRole


@pytest.fixture
def mock_auth_headers():
    token = create_access_token(subject="test-user-id", role=UserRole.OFFICER.value)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_officer_user():
    return User(
        id=uuid.uuid4(),
        email="officer@vigilbid.gov.in",
        full_name="Rajesh Kumar",
        role=UserRole.OFFICER.value,
        password_hash="mock_hash",
    )


def test_get_bidder_risk_and_anomalies(mock_auth_headers, mock_officer_user):
    bidder_id = uuid.uuid4()
    mock_bidder = Bidder(
        id=bidder_id,
        declared_name="Alpha Tech Infra Pvt Ltd",
        canonical_name="ALPHA TECH INFRA",
        risk_score=65,
        risk_band="HIGH",
        overall_status="WARN",
        entity_confidence=0.92,
    )

    mock_driver = RiskDriver(
        id=1,
        bidder_id=bidder_id,
        driver="PAN checksum or formatting discrepancy",
        points=30,
        source_ref={"field": "pan", "document": "pan_card.pdf"},
    )
    mock_bidder.risk_drivers = [mock_driver]

    mock_anomaly = AnomalySignal(
        id=1,
        bidder_id=bidder_id,
        code="PDF-MOD-01",
        severity="HIGH",
        points=25,
        description="PDF producer identified as image editing software (Photoshop)",
        evidence={"producer": "Adobe Photoshop CC 2019"},
    )
    mock_bidder.anomaly_signals = [mock_anomaly]

    class MockSession:
        async def execute(self, stmt):
            class ScalarResult:
                def scalar_one_or_none(self):
                    return mock_bidder
            return ScalarResult()

    async def override_get_db():
        yield MockSession()

    from backend.api.deps import get_current_user
    async def override_user():
        return mock_officer_user

    app.dependency_overrides[get_db_session] = override_get_db
    app.dependency_overrides[get_current_user] = override_user

    with TestClient(app) as client:
        # Test 1: GET /api/v1/bidders/{bidder_id}/risk
        risk_resp = client.get(f"/api/v1/bidders/{bidder_id}/risk", headers=mock_auth_headers)
        assert risk_resp.status_code == 200
        risk_data = risk_resp.json()
        assert risk_data["score"] == 65
        assert risk_data["band"] == "HIGH"
        assert len(risk_data["drivers"]) == 1
        assert risk_data["drivers"][0]["driver"] == "PAN checksum or formatting discrepancy"
        assert risk_data["drivers"][0]["points"] == 30
        assert len(risk_data["anomalies"]) == 1
        assert risk_data["anomalies"][0]["code"] == "PDF-MOD-01"

        # Test 2: GET /api/v1/bidders/{bidder_id}/anomalies
        anom_resp = client.get(f"/api/v1/bidders/{bidder_id}/anomalies", headers=mock_auth_headers)
        assert anom_resp.status_code == 200
        anom_data = anom_resp.json()
        assert isinstance(anom_data, list)
        assert len(anom_data) == 1
        assert anom_data[0]["code"] == "PDF-MOD-01"
        assert anom_data[0]["severity"] == "HIGH"
        assert anom_data[0]["points"] == 25

    app.dependency_overrides.clear()


def test_get_tender_cross_bidder_graph(mock_auth_headers, mock_officer_user):
    tender_id = uuid.uuid4()
    bidder_1_id = uuid.uuid4()
    bidder_2_id = uuid.uuid4()

    mock_b1 = Bidder(
        id=bidder_1_id,
        tender_id=tender_id,
        declared_name="Bidder One Solutions",
        canonical_name="BIDDER ONE",
        risk_score=20,
        risk_band="LOW",
    )
    mock_b1.pan = "ABCDE1234F"
    mock_b1.gstin = "27ABCDE1234F1Z5"
    mock_b1.profile = {"phone": "+919876543210", "email": "contact@bidderone.in"}

    mock_b2 = Bidder(
        id=bidder_2_id,
        tender_id=tender_id,
        declared_name="Bidder Two Ventures",
        canonical_name="BIDDER TWO",
        risk_score=75,
        risk_band="HIGH",
    )
    mock_b2.pan = "FGHIJ5678K"
    mock_b2.gstin = "27FGHIJ5678K1Z3"
    mock_b2.profile = {"phone": "+919876543210", "email": "info@biddertwo.in"}  # Shared phone!

    mock_tender = Tender(
        id=tender_id,
        nit_no="NIT-GRAPH-TEST-001",
        title="Cross-Bidder Graph Verification Tender",
        portal="GeM",
        created_by=uuid.uuid4(),
    )
    mock_tender.bidders = [mock_b1, mock_b2]

    class MockSession:
        async def execute(self, stmt):
            class ScalarResult:
                def scalar_one_or_none(self):
                    return mock_tender
            return ScalarResult()

    async def override_get_db():
        yield MockSession()

    from backend.api.deps import get_current_user
    async def override_user():
        return mock_officer_user

    from backend.services.tender_service import TenderService
    async def mock_get_tender_by_id(session, t_id):
        return mock_tender

    TenderService.get_tender_by_id = staticmethod(mock_get_tender_by_id)
    app.dependency_overrides[get_db_session] = override_get_db
    app.dependency_overrides[get_current_user] = override_user

    with TestClient(app) as client:
        graph_resp = client.get(f"/api/v1/tenders/{tender_id}/graph", headers=mock_auth_headers)
        assert graph_resp.status_code == 200
        graph_data = graph_resp.json()

        assert "nodes" in graph_data
        assert "edges" in graph_data
        assert "summary" in graph_data

        # Verify bidder nodes exist
        bidder_nodes = [n for n in graph_data["nodes"] if (n.get("type") or n.get("node_type")) == "BIDDER"]
        assert len(bidder_nodes) == 2

        # Verify shared phone node was created
        phone_nodes = [n for n in graph_data["nodes"] if (n.get("type") or n.get("node_type")) == "PHONE"]
        assert len(phone_nodes) >= 1

        # Verify summary reflects bidders and links
        summary = graph_data["summary"]
        assert summary["total_bidders"] == 2
        assert summary["linked_bidders_count"] >= 1

    app.dependency_overrides.clear()
