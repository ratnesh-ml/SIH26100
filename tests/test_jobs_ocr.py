"""Test Job Processing: Document Upload -> Job Creation -> Worker OCR -> Persistence -> Status."""

from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import MagicMock
import uuid
import fitz
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token, get_password_hash
from backend.models.entities import User, Bidder, Document, DocumentPage, Job
from backend.schemas.job import JobState
from backend.services.job_service import JobService
from backend.workers.job_worker import JobWorker
from seed.seed_users import DEV_USERS

# In-memory stores
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
MOCK_PAGES: list[DocumentPage] = []
MOCK_JOBS: dict[uuid.UUID, Job] = {}


class MockJobSession:
    """Mock async SQLAlchemy session handling Jobs, Documents, Pages, and Bidders."""

    def __init__(self):
        self.added_objects = []

    def add(self, obj):
        self.added_objects.append(obj)
        if isinstance(obj, Job):
            MOCK_JOBS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)
        elif isinstance(obj, Document):
            MOCK_DOCUMENTS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)
        elif isinstance(obj, DocumentPage):
            MOCK_PAGES.append(obj)
        elif isinstance(obj, Bidder):
            MOCK_BIDDERS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def refresh(self, obj):
        pass

    async def execute(self, stmt):
        result_mock = MagicMock()
        stmt_str = str(stmt).lower()
        # print("DEBUG_SQL:", stmt_str, "PARAMS:", stmt.compile().params)

        # 1. User lookup
        if "where users.id" in stmt_str or "where users.email" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for u in MOCK_USERS.values():
                    if u.id == val or str(u.id) == str(val) or u.email == val:
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

        # 3. Job lookup by ID
        elif "where jobs.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for j in MOCK_JOBS.values():
                    if j.id == val or str(j.id) == str(val):
                        matched = j
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 4. Claim next queued job
        elif "where jobs.status" in stmt_str:
            queued_jobs = [j for j in MOCK_JOBS.values() if j.status == JobState.QUEUED.value]
            queued_jobs.sort(key=lambda x: x.created_at)
            matched = queued_jobs[0] if queued_jobs else None
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 5. List jobs for bidder
        elif "where jobs.bidder_id" in stmt_str or ("from jobs" in stmt_str and "bidder_id" in stmt_str):
            params = stmt.compile().params
            matched_jobs = []
            for j in MOCK_JOBS.values():
                for val in params.values():
                    if str(j.bidder_id) == str(val):
                        matched_jobs.append(j)
                        break
            matched_jobs.sort(key=lambda x: x.created_at, reverse=True)
            result_mock.scalars.return_value.all.return_value = matched_jobs
            return result_mock

        # 6. Document lookup by bidder_id
        elif "where documents.bidder_id" in stmt_str:
            params = stmt.compile().params
            b_id = None
            for key, val in params.items():
                if "bidder_id" in key:
                    b_id = val
                    break
            docs = [d for d in MOCK_DOCUMENTS.values() if str(d.bidder_id) == str(b_id)]
            result_mock.scalars.return_value.all.return_value = docs
            return result_mock

        # 7. Document lookup by doc ID
        elif "where documents.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for d in MOCK_DOCUMENTS.values():
                    if d.id == val or str(d.id) == str(val):
                        matched = d
                        break
            result_mock.scalar_one_or_none.return_value = matched
            result_mock.scalar_one.return_value = matched
            return result_mock

        # 8. DocumentPage query by document_id
        elif "where document_pages.document_id" in stmt_str:
            params = stmt.compile().params
            d_id = None
            for key, val in params.items():
                if "document_id" in key:
                    d_id = val
                    break
            pages = [p for p in MOCK_PAGES if str(p.document_id) == str(d_id)]
            result_mock.scalars.return_value.all.return_value = pages
            return result_mock

        result_mock.scalar_one_or_none.return_value = None
        result_mock.scalars.return_value.all.return_value = []
        return result_mock


class MockAsyncSessionContext:
    def __init__(self, session):
        self.session = session

    async def __aenter__(self):
        return self.session

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        pass


@pytest.fixture(autouse=True)
def reset_mock_state():
    MOCK_BIDDERS.clear()
    MOCK_DOCUMENTS.clear()
    MOCK_PAGES.clear()
    MOCK_JOBS.clear()


@pytest.fixture
def auth_headers():
    officer = next(u for u in DEV_USERS if u["role"] == "officer")
    token = create_access_token(subject=officer["id"], role="officer")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def sample_pdf_bytes() -> bytes:
    doc = fitz.open()
    page = doc.new_page(width=595, height=842)
    page.insert_text(
        (72, 100),
        "Chennai Petroleum Corporation Limited.\n"
        "Technical Evaluation Document for Tender CPCL/ENG/2026/01.\n"
        "Vendor: Apex Industrial Solutions Pvt Ltd.",
        fontsize=12,
    )
    data = doc.tobytes()
    doc.close()
    return data


# =========================================================================
# 1. Job State Transitions and Abstraction
# =========================================================================

@pytest.mark.asyncio
async def test_job_service_lifecycle():
    """Verify Job creation, queue claiming, status updates, and completion."""
    session = MockJobSession()
    job_service = JobService()

    bidder_id = uuid.uuid4()
    bidder = Bidder(id=bidder_id, declared_name="Test Bidder Corp", overall_status="PENDING")
    session.add(bidder)

    # 1. Create Job in QUEUED state
    job = await job_service.create_job(session, bidder_id)
    assert job.status == JobState.QUEUED.value
    assert job.current_step == 1
    assert len(job.steps) == 11
    assert job.steps[0]["status"] == "DONE"

    # 2. Claim next job
    claimed_job = await job_service.claim_next_job(session)
    assert claimed_job is not None
    assert claimed_job.id == job.id
    assert claimed_job.status == JobState.PROCESSING.value
    assert claimed_job.started_at is not None

    # 3. Update job status to DONE
    done_job = await job_service.update_job_status(
        session=session,
        job_id=job.id,
        new_status=JobState.DONE.value,
        current_step=3,
    )
    assert done_job.status == JobState.DONE.value
    assert done_job.ended_at is not None
    assert done_job.current_step == 3


# =========================================================================
# 2. End-to-End: Upload -> Job Created -> Worker Processes -> OCR Stored -> DONE
# =========================================================================

@pytest.mark.asyncio
async def test_end_to_end_upload_ocr_worker(sample_pdf_bytes: bytes, tmp_path: Path):
    """Test full cycle: Document uploaded -> Job created -> Worker executes OCR -> Results persisted -> Status DONE."""
    session = MockJobSession()
    session_maker = lambda: MockAsyncSessionContext(session)
    job_service = JobService()
    worker = JobWorker(session_maker=session_maker, job_service=job_service)

    bidder_id = uuid.uuid4()
    bidder = Bidder(id=bidder_id, declared_name="Omega Tech Ltd", overall_status="PENDING")
    session.add(bidder)

    # Write PDF to storage
    doc_dir = tmp_path / str(bidder_id)
    doc_dir.mkdir(parents=True, exist_ok=True)
    pdf_file = doc_dir / "test_doc.pdf"
    pdf_file.write_bytes(sample_pdf_bytes)

    # Create Document record
    doc_id = uuid.uuid4()
    doc = Document(
        id=doc_id,
        bidder_id=bidder_id,
        original_filename="test_doc.pdf",
        sha256="aabbcc112233",
        storage_path=str(pdf_file),
        mime="application/pdf",
        page_count=1,
        doc_type="TECHNICAL_SPEC",
    )
    session.add(doc)

    # 1. Create queued job
    job = await job_service.create_job(session, bidder_id)
    job_id = job.id
    assert job.status == JobState.QUEUED.value

    # 2. Worker executes OCR processing
    processed_job = await worker.process_single_job(job_id)
    assert processed_job.status == JobState.DONE.value
    assert processed_job.error is None
    assert processed_job.ended_at is not None

    # 3. Verify OCR & Page persistence in document_pages
    assert len(MOCK_PAGES) == 1
    assert MOCK_PAGES[0].page_no == 1
    assert "Chennai Petroleum Corporation Limited" in MOCK_PAGES[0].text
    assert MOCK_PAGES[0].ocr_conf == 1.0

    # 4. Verify Document metadata update
    assert doc.text_source == "text_layer"
    assert doc.ocr_conf == 1.0


# =========================================================================
# 3. Job Failure Handling Test
# =========================================================================

@pytest.mark.asyncio
async def test_job_worker_failure_handling():
    """Test that missing or corrupt document files trigger graceful job failure and FAILED status."""
    session = MockJobSession()
    session_maker = lambda: MockAsyncSessionContext(session)
    job_service = JobService()
    worker = JobWorker(session_maker=session_maker, job_service=job_service)

    bidder_id = uuid.uuid4()
    bidder = Bidder(id=bidder_id, declared_name="Faulty Bidder", overall_status="PENDING")
    session.add(bidder)

    # Add document pointing to non-existent path
    doc = Document(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        original_filename="ghost.pdf",
        sha256="deadbeef",
        storage_path="/non/existent/path/ghost.pdf",
        mime="application/pdf",
    )
    session.add(doc)

    job = await job_service.create_job(session, bidder_id)
    job_id = job.id

    # Worker processes job -> should gracefully fail
    failed_job = await worker.process_single_job(job_id)
    assert failed_job.status == JobState.FAILED.value
    assert failed_job.error is not None
    assert "missing on disk" in failed_job.error
    assert failed_job.ended_at is not None

    # Verify Step 3 is marked FAILED
    step_3 = next(s for s in failed_job.steps if s.get("step_number") == 3)
    assert step_3["status"] == "FAILED"


# =========================================================================
# 4. API Endpoints Exposing Job Status
# =========================================================================

def test_api_get_job_status_endpoints(auth_headers: dict):
    """Test GET /api/v1/jobs/{job_id} and GET /api/v1/bidders/{bidder_id}/jobs."""
    session = MockJobSession()
    app.dependency_overrides[get_db_session] = lambda: session
    client = TestClient(app)

    try:
        bidder_id = uuid.uuid4()
        bidder = Bidder(id=bidder_id, declared_name="API Test Bidder", overall_status="PENDING")
        session.add(bidder)

        job_id = uuid.uuid4()
        job = Job(
            id=job_id,
            bidder_id=bidder_id,
            status=JobState.QUEUED.value,
            current_step=1,
            steps=[{"name": "Ingestion", "step_number": 1, "status": "DONE"}],
            created_at=datetime.now(timezone.utc),
        )
        session.add(job)

        # 1. Fetch existing job status
        res = client.get(f"/api/v1/jobs/{job_id}", headers=auth_headers)
        assert res.status_code == 200
        data = res.json()
        assert data["id"] == str(job_id)
        assert data["bidder_id"] == str(bidder_id)
        assert data["status"] == "QUEUED"
        assert len(data["steps"]) == 1

        # 2. List jobs for bidder
        list_res = client.get(f"/api/v1/bidders/{bidder_id}/jobs", headers=auth_headers)
        assert list_res.status_code == 200
        jobs_data = list_res.json()
        assert len(jobs_data) == 1
        assert jobs_data[0]["id"] == str(job_id)

        # 3. Non-existent job returns 404
        random_id = str(uuid.uuid4())
        res_404 = client.get(f"/api/v1/jobs/{random_id}", headers=auth_headers)
        assert res_404.status_code == 404
        assert "not found" in res_404.json()["detail"].lower()

        # 4. Unauthorized access returns 401
        unauth = client.get(f"/api/v1/jobs/{job_id}")
        assert unauth.status_code == 401

    finally:
        app.dependency_overrides.clear()
