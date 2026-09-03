"""Test Tender Management: CRUD, input validation, status lifecycles, and RBAC enforcement."""

from datetime import date, datetime, timezone
from unittest.mock import MagicMock
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token, get_password_hash
from backend.models.entities import User, Tender, Criterion
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

MOCK_TENDERS: dict[uuid.UUID, Tender] = {}
MOCK_CRITERIA: dict[uuid.UUID, Criterion] = {}


class MockTenderSession:
    """Mock async SQLAlchemy session handling User and Tender operations in-memory."""

    def __init__(self):
        self.added_objects = []

    def add(self, obj):
        self.added_objects.append(obj)
        if isinstance(obj, Tender):
            MOCK_TENDERS[obj.id] = obj
            obj.created_at = datetime.now(timezone.utc)
            obj.bidders = []
            obj.criteria = []
        elif isinstance(obj, Criterion):
            MOCK_CRITERIA[obj.id] = obj
            if obj.tender_id in MOCK_TENDERS:
                MOCK_TENDERS[obj.tender_id].criteria.append(obj)

    async def execute(self, stmt):
        result_mock = MagicMock()
        stmt_str = str(stmt).lower()

        # 1. User lookup by ID or email
        if "where users.id" in stmt_str:
            params = stmt.compile().params
            matched_user = None
            for key, val in params.items():
                for u in MOCK_USERS.values():
                    if u.id == val or str(u.id) == str(val):
                        matched_user = u
                        break
            result_mock.scalar_one_or_none.return_value = matched_user
            return result_mock

        elif "where users.email" in stmt_str:
            params = stmt.compile().params
            matched_user = None
            for key, val in params.items():
                if isinstance(val, str) and "@" in val:
                    matched_user = MOCK_USERS.get(val.lower().strip())
                    break
            result_mock.scalar_one_or_none.return_value = matched_user
            return result_mock

        # 2. Tender lookup by nit_no
        elif "where tenders.nit_no" in stmt_str:
            params = stmt.compile().params
            matched_tender = None
            for key, val in params.items():
                for t in MOCK_TENDERS.values():
                    if t.nit_no == val:
                        matched_tender = t
                        break
            result_mock.scalar_one_or_none.return_value = matched_tender
            return result_mock

        # 3. Tender lookup by ID
        elif "where tenders.id" in stmt_str:
            params = stmt.compile().params
            matched_tender = None
            for key, val in params.items():
                for t in MOCK_TENDERS.values():
                    if t.id == val or str(t.id) == str(val):
                        matched_tender = t
                        break
            result_mock.scalar_one_or_none.return_value = matched_tender
            return result_mock

        # 4. Tender count
        elif "count(tenders.id)" in stmt_str:
            result_mock.scalar.return_value = len(MOCK_TENDERS)
            return result_mock

        # 5. Tender list
        elif "from tenders" in stmt_str:
            tenders_list = list(MOCK_TENDERS.values())
            scalars_mock = MagicMock()
            scalars_mock.all.return_value = tenders_list
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
def tender_client():
    """Client configured with in-memory session override."""
    MOCK_TENDERS.clear()
    MOCK_CRITERIA.clear()

    async def override_get_db_session():
        session = MockTenderSession()
        yield session

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
# 1. Tender Creation Tests
# =========================================================================

def test_create_tender_success(tender_client: TestClient, officer_token: str):
    """Test successful tender creation by an authorized Procurement Officer."""
    payload = {
        "nit_no": "CPCL/PROC/2026/VALVES-01",
        "title": "Supply of High-Pressure Control Valves for Manali Refinery",
        "portal": "GeM",
        "status": "ACTIVE",
        "estimated_value": 45000000.0,
        "bid_due_date": "2026-11-30",
        "mse_applicable": True,
        "mii_class_required": "Class-I",
        "requires_oem": True,
        "template": "cpcl_goods_v1",
    }
    response = tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json=payload,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["nit_no"] == payload["nit_no"]
    assert data["title"] == payload["title"]
    assert data["status"] == "ACTIVE"
    assert data["estimated_value"] == 45000000.0
    assert "criteria" in data
    assert len(data["criteria"]) >= 3  # Initialized from template


def test_create_tender_duplicate_nit(tender_client: TestClient, officer_token: str):
    """Test rejection when creating a tender with a duplicate NIT number (HTTP 409)."""
    payload = {
        "nit_no": "CPCL/PROC/2026/DUP-01",
        "title": "Initial Tender",
    }
    res1 = tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json=payload,
    )
    assert res1.status_code == 201

    # Attempt duplicate
    res2 = tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json=payload,
    )
    assert res2.status_code == 409
    assert "already exists" in res2.json()["detail"]


def test_create_tender_invalid_input(tender_client: TestClient, officer_token: str):
    """Test validation errors for empty title, negative budget, and invalid portal."""
    # 1. Empty title
    res_empty_title = tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"nit_no": "CPCL/ERR/01", "title": "   "},
    )
    assert res_empty_title.status_code == 422

    # 2. Negative estimated value
    res_negative_val = tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"nit_no": "CPCL/ERR/02", "title": "Valid Title", "estimated_value": -500.0},
    )
    assert res_negative_val.status_code == 422

    # 3. Invalid portal name
    res_bad_portal = tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"nit_no": "CPCL/ERR/03", "title": "Valid Title", "portal": "INVALID_PORTAL"},
    )
    assert res_bad_portal.status_code == 422


# =========================================================================
# 2. Tender Read & List Tests
# =========================================================================

def test_list_tenders_paginated(tender_client: TestClient, officer_token: str):
    """Test paginated tender listing."""
    # Create two tenders
    tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"nit_no": "CPCL/LIST/01", "title": "Tender One"},
    )
    tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"nit_no": "CPCL/LIST/02", "title": "Tender Two"},
    )

    response = tender_client.get(
        "/api/v1/tenders?page=1&limit=10",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2
    assert data["page"] == 1


def test_get_tender_by_id_success_and_404(tender_client: TestClient, officer_token: str):
    """Test fetching a specific tender by UUID and 404 behavior."""
    create_res = tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"nit_no": "CPCL/GET/01", "title": "Specific Tender"},
    )
    tender_id = create_res.json()["id"]

    # 1. Fetch valid tender
    get_res = tender_client.get(
        f"/api/v1/tenders/{tender_id}",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["id"] == tender_id

    # 2. Fetch non-existent tender
    fake_id = str(uuid.uuid4())
    notFound_res = tender_client.get(
        f"/api/v1/tenders/{fake_id}",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert notFound_res.status_code == 404


# =========================================================================
# 3. Tender Update Tests
# =========================================================================

def test_update_tender_success(tender_client: TestClient, officer_token: str):
    """Test partial update of tender status and estimated value."""
    create_res = tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"nit_no": "CPCL/UPD/01", "title": "Original Title", "status": "DRAFT"},
    )
    tender_id = create_res.json()["id"]

    patch_res = tender_client.patch(
        f"/api/v1/tenders/{tender_id}",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"title": "Updated Official Title", "status": "EVALUATING", "estimated_value": 75000000.0},
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["title"] == "Updated Official Title"
    assert updated["status"] == "EVALUATING"
    assert updated["estimated_value"] == 75000000.0


# =========================================================================
# 4. Authorization Tests
# =========================================================================

def test_tender_unauthorized_access(tender_client: TestClient):
    """Test rejection when no authentication token is provided."""
    # List requires auth
    assert tender_client.get("/api/v1/tenders").status_code == 401
    # Create requires auth
    assert tender_client.post("/api/v1/tenders", json={"nit_no": "A", "title": "B"}).status_code == 401


def test_tender_forbidden_role_mutation(tender_client: TestClient, vigilance_token: str):
    """Test rejection when a read-only role (Vigilance) attempts to create or update a tender."""
    # Vigilance can READ tenders
    read_res = tender_client.get(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {vigilance_token}"},
    )
    assert read_res.status_code == 200

    # Vigilance is FORBIDDEN from creating a tender (HTTP 403)
    create_res = tender_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {vigilance_token}"},
        json={"nit_no": "CPCL/VIG/01", "title": "Unauthorized Create"},
    )
    assert create_res.status_code == 403
    assert "Operation not permitted" in create_res.json()["detail"]
