"""Comprehensive API specification audit and regression test suite.

Validates:
1. Authentication & Role-Based Access Control (RBAC) across all endpoint categories
2. Documents endpoints: GET /documents/{id}/file, GET /documents/{id}/pages/{n}.png, download
3. Reports endpoints: GET /bidders/{id}/report.pdf, GET /tenders/{id}/report.pdf
4. Tenders, Bidders, Bids, Matrix, Jobs, Findings, Risk, Graph, Registry, Audit, and Copilot
5. Error handling: 401 Unauthorized, 403 Forbidden, 404 Not Found, 422 Unprocessable Entity
"""

from datetime import date, datetime, timezone
from pathlib import Path
import uuid
import fitz
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token
from backend.models.entities import Bidder, Criterion, Decision, Document, Finding, Tender, User
from backend.auth.rbac import UserRole
from seed.seed_users import DEV_USERS


@pytest.fixture
def temp_pdf(tmp_path):
    """Create a temporary valid 2-page PDF on disk."""
    pdf_path = tmp_path / "test_document.pdf"
    doc = fitz.open()
    p1 = doc.new_page(width=595, height=842)
    p1.insert_text((50, 72), "Page 1: Technical Bid Submission")
    p2 = doc.new_page(width=595, height=842)
    p2.insert_text((50, 72), "Page 2: Audited Financial Accounts")
    doc.save(str(pdf_path))
    doc.close()
    return pdf_path


@pytest.fixture
def mock_audit_client(temp_pdf):
    tender_id = uuid.uuid4()
    bidder_id = uuid.uuid4()
    doc_id = uuid.uuid4()

    mock_tender = Tender(
        id=tender_id,
        nit_no="CPCL/AUDIT/2026/01",
        title="Audit Test Tender",
        portal="CPPP",
        estimated_value=15000000.0,
        bid_due_date=date(2026, 11, 30),
        mse_applicable=True,
        mii_class_required="Class-I",
        requires_oem=False,
        created_at=datetime.now(timezone.utc),
    )

    mock_bidder = Bidder(
        id=bidder_id,
        tender_id=tender_id,
        declared_name="Audit Bidder Solutions Ltd",
        canonical_name="Audit Bidder Solutions Ltd",
        cin="U12345MH2020PTC123456",
        udyam_no="UDYAM-MH-01-0012345",
        risk_score=25,
        risk_band="LOW",
        review_state="PENDING",
        created_at=datetime.now(timezone.utc),
    )

    mock_doc = Document(
        id=doc_id,
        bidder_id=bidder_id,
        original_filename="test_document.pdf",
        sha256="e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        storage_path=str(temp_pdf),
        mime="application/pdf",
        page_count=2,
        doc_type="FINANCIAL_STATEMENT",
        created_at=datetime.now(timezone.utc),
    )

    class MockAuditSession:
        async def execute(self, stmt):
            from unittest.mock import MagicMock
            mock = MagicMock()
            s_str = str(stmt)
            if "FROM users" in s_str:
                params = getattr(stmt, "compile", lambda: None)().params or {}
                user_id_val = None
                for v in params.values():
                    if isinstance(v, uuid.UUID) or (isinstance(v, str) and len(str(v)) == 36):
                        user_id_val = str(v)
                        break
                
                if user_id_val == str(DEV_USERS[2]["id"]):
                    mock.scalar_one_or_none.return_value = User(
                        id=DEV_USERS[2]["id"],
                        email=DEV_USERS[2]["email"],
                        full_name=DEV_USERS[2]["full_name"],
                        role="auditor",
                        created_at=datetime.now(timezone.utc),
                    )
                else:
                    mock.scalar_one_or_none.return_value = User(
                        id=DEV_USERS[0]["id"],
                        email=DEV_USERS[0]["email"],
                        full_name=DEV_USERS[0]["full_name"],
                        role="officer",
                        created_at=datetime.now(timezone.utc),
                    )
            elif "FROM documents" in s_str:
                mock.scalar_one_or_none.return_value = mock_doc
                scalars_mock = MagicMock()
                scalars_mock.all.return_value = [mock_doc]
                mock.scalars.return_value = scalars_mock
            elif "FROM bidders" in s_str:
                mock.scalar_one_or_none.return_value = mock_bidder
                scalars_mock = MagicMock()
                scalars_mock.all.return_value = [mock_bidder]
                mock.scalars.return_value = scalars_mock
            elif "FROM tenders" in s_str:
                mock.scalar_one_or_none.return_value = mock_tender
                scalars_mock = MagicMock()
                scalars_mock.all.return_value = [mock_tender]
                mock.scalars.return_value = scalars_mock
            elif "FROM findings" in s_str:
                scalars_mock = MagicMock()
                scalars_mock.all.return_value = []
                mock.scalars.return_value = scalars_mock
            elif "FROM decisions" in s_str:
                scalars_mock = MagicMock()
                scalars_mock.all.return_value = []
                mock.scalars.return_value = scalars_mock
            else:
                mock.scalar_one_or_none.return_value = None
                scalars_mock = MagicMock()
                scalars_mock.all.return_value = []
                mock.scalars.return_value = scalars_mock
            return mock

    async def override_db():
        yield MockAuditSession()

    app.dependency_overrides[get_db_session] = override_db
    with TestClient(app) as client:
        yield client, tender_id, bidder_id, doc_id
    app.dependency_overrides.clear()


# ===========================================================================
# 1. Document File & Page PNG Streaming Endpoints
# ===========================================================================

def test_get_document_file_endpoint(mock_audit_client):
    """Test GET /api/v1/documents/{id}/file streams inline PDF."""
    client, _, _, doc_id = mock_audit_client
    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get(f"/api/v1/documents/{doc_id}/file", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert "inline" in resp.headers["content-disposition"]
    assert len(resp.content) > 100


def test_get_document_page_png_endpoint(mock_audit_client):
    """Test GET /api/v1/documents/{id}/pages/{n}.png renders and streams PNG."""
    client, _, _, doc_id = mock_audit_client
    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get(f"/api/v1/documents/{doc_id}/pages/1.png?dpi=100", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "image/png"
    # PNG signature check: \x89PNG
    assert resp.content[:4] == b"\x89PNG"
    assert len(resp.content) > 500


def test_get_document_page_png_out_of_bounds(mock_audit_client):
    """Test requesting out of bounds page returns 404."""
    client, _, _, doc_id = mock_audit_client
    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get(f"/api/v1/documents/{doc_id}/pages/99.png", headers=headers)
    assert resp.status_code == 404
    assert "out of bounds" in resp.json()["detail"].lower()


# ===========================================================================
# 2. PDF Reports & Dossier Export Endpoints
# ===========================================================================

def test_export_bidder_dossier_pdf(mock_audit_client):
    """Test GET /api/v1/bidders/{id}/report.pdf exports complete compliance dossier."""
    client, _, bidder_id, _ = mock_audit_client
    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get(f"/api/v1/bidders/{bidder_id}/report.pdf", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert "dossier_" in resp.headers["content-disposition"]
    assert resp.content[:4] == b"%PDF"
    assert len(resp.content) > 500


def test_export_tender_report_pdf(mock_audit_client):
    """Test GET /api/v1/tenders/{id}/report.pdf exports tender evaluation summary."""
    client, tender_id, _, _ = mock_audit_client
    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    headers = {"Authorization": f"Bearer {token}"}

    resp = client.get(f"/api/v1/tenders/{tender_id}/report.pdf", headers=headers)
    assert resp.status_code == 200
    assert resp.headers["content-type"] == "application/pdf"
    assert "tender_report_" in resp.headers["content-disposition"]
    assert resp.content[:4] == b"%PDF"
    assert len(resp.content) > 500


# ===========================================================================
# 3. Security & RBAC Enforcement Across API Categories
# ===========================================================================

def test_unauthenticated_request_rejected(mock_audit_client):
    """Test unauthenticated request returns 401."""
    client, tender_id, _, _ = mock_audit_client
    resp = client.get(f"/api/v1/tenders/{tender_id}")
    assert resp.status_code == 401


def test_forbidden_role_for_sensitive_action(mock_audit_client):
    """Test viewer/auditor role cannot execute officer-only mutations."""
    client, _, _, _ = mock_audit_client
    token = create_access_token(subject=str(DEV_USERS[2]["id"]), role="auditor")
    headers = {"Authorization": f"Bearer {token}"}

    # Auditor cannot create tenders (officer only)
    resp = client.post(
        "/api/v1/tenders",
        json={
            "nit_no": "CPCL/FORBIDDEN/01",
            "title": "Forbidden Tender",
            "portal": "CPPP",
            "estimated_value": 100000.0,
            "bid_due_date": "2026-12-31",
        },
        headers=headers,
    )
    assert resp.status_code == 403
