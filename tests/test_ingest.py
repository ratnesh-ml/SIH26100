"""Test Document Ingestion: PDF/ZIP validation, path traversal defense, duplicate detection, size limits, and RBAC."""

from datetime import datetime, timezone
import io
from unittest.mock import MagicMock
import uuid
import zipfile
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token, get_password_hash
from backend.models.entities import User, Bidder, Document
from seed.seed_users import DEV_USERS

# In-memory test stores
MOCK_USERS: dict[str, User] = {}
for u_data in DEV_USERS:
    user_obj = User(
        id=u_data["id"],
        email=u_data["email"],
        password_hash=get_password_hash(u_data["password"]),
        full_name=u_data["full_name"],
        role=u_data["role"],
        created_at=datetime.now(timezone.utc),
    )
    MOCK_USERS[u_data["email"]] = user_obj

MOCK_BIDDERS: dict[uuid.UUID, Bidder] = {}
MOCK_DOCUMENTS: dict[uuid.UUID, Document] = {}

TEST_BIDDER_ID = uuid.UUID("77777777-7777-4777-8777-777777777777")
VALID_PDF_BYTES = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page >>\nendobj\nxref\ntrailer\n<< /Root 1 0 R >>\n%%EOF"


class MockIngestSession:
    """Mock async SQLAlchemy session handling User, Bidder, and Document operations in-memory."""

    def __init__(self):
        self.added_objects = []

    def add(self, obj):
        self.added_objects.append(obj)
        if isinstance(obj, Document):
            MOCK_DOCUMENTS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)

    async def execute(self, stmt):
        result_mock = MagicMock()
        stmt_str = str(stmt).lower()

        # 1. User lookup
        if "where users.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for u in MOCK_USERS.values():
                    if u.id == val or str(u.id) == str(val):
                        matched = u
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 2. Bidder lookup by ID
        elif "where bidders.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for b in MOCK_BIDDERS.values():
                    if b.id == val or str(b.id) == str(val):
                        matched = b
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 3. Document lookup by bidder_id & sha256
        elif "where documents.bidder_id" in stmt_str and "and documents.sha256" in stmt_str:
            params = stmt.compile().params
            b_id = None
            sha = None
            for key, val in params.items():
                if "bidder_id" in key:
                    b_id = val
                elif "sha256" in key:
                    sha = val
            matched = None
            for doc in MOCK_DOCUMENTS.values():
                if (doc.bidder_id == b_id or str(doc.bidder_id) == str(b_id)) and doc.sha256 == sha:
                    matched = doc
                    break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 4. Document lookup by ID
        elif "where documents.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for doc in MOCK_DOCUMENTS.values():
                    if doc.id == val or str(doc.id) == str(val):
                        matched = doc
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 5. List documents for bidder
        elif "from documents" in stmt_str:
            params = stmt.compile().params
            b_id = None
            for key, val in params.items():
                if "bidder_id" in key or "id" in key:
                    b_id = val
                    break
            if b_id:
                docs = [d for d in MOCK_DOCUMENTS.values() if d.bidder_id == b_id or str(d.bidder_id) == str(b_id)]
            else:
                docs = list(MOCK_DOCUMENTS.values())
            scalars_mock = MagicMock()
            scalars_mock.all.return_value = docs
            result_mock.scalars.return_value = scalars_mock
            return result_mock

        result_mock.scalar_one_or_none.return_value = None
        result_mock.scalar.return_value = 0
        return result_mock

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def close(self):
        pass


@pytest.fixture
def ingest_client(tmp_path):
    """Client configured with in-memory session override and temp storage directory."""
    MOCK_BIDDERS.clear()
    MOCK_DOCUMENTS.clear()

    # Create baseline bidder
    bidder = Bidder(
        id=TEST_BIDDER_ID,
        declared_name="Standard Valves Manufacturing Ltd",
        canonical_name="STANDARD VALVES MANUFACTURING",
        overall_status="PENDING",
        risk_score=0,
        risk_band="LOW",
        review_state="PENDING",
    )
    bidder.created_at = datetime.now(timezone.utc)
    bidder.documents = []
    MOCK_BIDDERS[TEST_BIDDER_ID] = bidder

    async def override_get_db_session():
        yield MockIngestSession()

    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def officer_token():
    user = MOCK_USERS["officer@cpcl.gov.in"]
    return create_access_token(subject=str(user.id), role="officer")


@pytest.fixture
def vigilance_token():
    user = MOCK_USERS["vigilance@cvc.gov.in"]
    return create_access_token(subject=str(user.id), role="vigilance")


# =========================================================================
# 1. Valid PDF & Invalid PDF Tests
# =========================================================================

def test_upload_valid_pdf(ingest_client: TestClient, officer_token: str):
    """Test uploading a valid PDF document."""
    files = [("files", ("gst_cert.pdf", VALID_PDF_BYTES, "application/pdf"))]
    response = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {officer_token}"},
        files=files,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["bidder_id"] == str(TEST_BIDDER_ID)
    assert data["total_files"] == 1
    assert len(data["accepted"]) == 1
    assert data["accepted"][0]["original_filename"] == "gst_cert.pdf"
    assert len(data["accepted"][0]["sha256"]) == 64
    assert data["accepted"][0]["page_count"] >= 1


def test_upload_invalid_pdf_magic_bytes(ingest_client: TestClient, officer_token: str):
    """Test uploading a file claiming to be a PDF but missing '%PDF-' magic bytes."""
    corrupted_data = b"This is plain text pretending to be a PDF"
    files = [("files", ("fake.pdf", corrupted_data, "application/pdf"))]
    response = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {officer_token}"},
        files=files,
    )
    # Rejection status 422
    assert response.status_code == 422
    assert "magic bytes" in response.json()["detail"].lower()


# =========================================================================
# 2. ZIP Archive Ingestion Tests
# =========================================================================

def test_upload_valid_zip_archive(ingest_client: TestClient, officer_token: str):
    """Test uploading a ZIP archive containing multiple valid PDFs."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("pan_card.pdf", VALID_PDF_BYTES)
        zf.writestr("ca_cert.pdf", VALID_PDF_BYTES + b"\n% secondary unique content")

    zip_bytes = zip_buffer.getvalue()
    files = [("files", ("bid_package.zip", zip_bytes, "application/zip"))]

    response = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {officer_token}"},
        files=files,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert len(data["accepted"]) == 2
    filenames = {d["original_filename"] for d in data["accepted"]}
    assert filenames == {"pan_card.pdf", "ca_cert.pdf"}


def test_upload_zip_with_non_pdf_skipped(ingest_client: TestClient, officer_token: str):
    """Test that non-PDF files within a ZIP archive are listed and safely skipped."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("udyam.pdf", VALID_PDF_BYTES)
        zf.writestr("readme.txt", b"Please read instructions before evaluating")
        zf.writestr("script.sh", b"#!/bin/bash\necho hello")

    zip_bytes = zip_buffer.getvalue()
    files = [("files", ("package.zip", zip_bytes, "application/zip"))]

    response = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {officer_token}"},
        files=files,
    )
    assert response.status_code == 201
    data = response.json()
    assert len(data["accepted"]) == 1
    assert data["accepted"][0]["original_filename"] == "udyam.pdf"
    assert len(data["rejected"]) == 2  # txt and sh skipped


# =========================================================================
# 3. Path Traversal & Zip Bomb Defenses
# =========================================================================

def test_malicious_path_traversal_zip_blocked(ingest_client: TestClient, officer_token: str):
    """Test blocking of ZIP archives with path traversal entries ('../' or absolute)."""
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w") as zf:
        # Malicious traversal path
        zf.writestr("../../etc/passwd.pdf", VALID_PDF_BYTES)

    zip_bytes = zip_buffer.getvalue()
    files = [("files", ("malicious.zip", zip_bytes, "application/zip"))]

    response = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {officer_token}"},
        files=files,
    )
    assert response.status_code == 400
    assert "path traversal" in response.json()["detail"].lower()


# =========================================================================
# 4. Duplicate Detection & Size Limits
# =========================================================================

def test_duplicate_document_upload(ingest_client: TestClient, officer_token: str):
    """Test duplicate upload detection with identical SHA-256 (HTTP 409)."""
    files1 = [("files", ("cert.pdf", VALID_PDF_BYTES, "application/pdf"))]
    res1 = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {officer_token}"},
        files=files1,
    )
    assert res1.status_code == 201

    # Attempt duplicate
    files2 = [("files", ("cert_duplicate.pdf", VALID_PDF_BYTES, "application/pdf"))]
    res2 = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {officer_token}"},
        files=files2,
    )
    assert res2.status_code == 409
    assert "duplicate" in res2.json()["detail"].lower()


def test_oversized_pdf_upload(ingest_client: TestClient, officer_token: str):
    """Test that files exceeding size limits are rejected (HTTP 413)."""
    # 26 MB (exceeds 25 MB limit)
    oversized_data = VALID_PDF_BYTES + (b"0" * (26 * 1024 * 1024))
    files = [("files", ("huge.pdf", oversized_data, "application/pdf"))]

    response = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {officer_token}"},
        files=files,
    )
    assert response.status_code == 413
    assert "maximum allowed size" in response.json()["detail"].lower()


# =========================================================================
# 5. Authorization & Document Retrieval Tests
# =========================================================================

def test_ingest_unauthorized_and_forbidden(ingest_client: TestClient, vigilance_token: str):
    """Test RBAC enforcement: 401 without auth and 403 for read-only roles."""
    files = [("files", ("test.pdf", VALID_PDF_BYTES, "application/pdf"))]

    # 1. Unauthenticated (401)
    res_unauth = ingest_client.post(f"/api/v1/bidders/{TEST_BIDDER_ID}/documents", files=files)
    assert res_unauth.status_code == 401

    # 2. Vigilance role is forbidden from uploading (403)
    res_forbid = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {vigilance_token}"},
        files=files,
    )
    assert res_forbid.status_code == 403


def test_list_and_get_document(ingest_client: TestClient, officer_token: str, vigilance_token: str):
    """Test listing and retrieving document metadata."""
    files = [("files", ("iso_cert.pdf", VALID_PDF_BYTES, "application/pdf"))]
    upload_res = ingest_client.post(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {officer_token}"},
        files=files,
    )
    assert upload_res.status_code == 201
    doc_id = upload_res.json()["accepted"][0]["id"]

    # List documents
    list_res = ingest_client.get(
        f"/api/v1/bidders/{TEST_BIDDER_ID}/documents",
        headers={"Authorization": f"Bearer {vigilance_token}"},
    )
    assert list_res.status_code == 200
    docs = list_res.json()
    assert len(docs) >= 1
    assert docs[0]["original_filename"] == "iso_cert.pdf"

    # Get single document
    get_res = ingest_client.get(
        f"/api/v1/documents/{doc_id}",
        headers={"Authorization": f"Bearer {vigilance_token}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["id"] == doc_id
