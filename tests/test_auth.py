"""Test authentication, JWT handling, password hashing, and RBAC enforcement."""

from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token, get_password_hash
from backend.models.entities import User
from seed.seed_users import DEV_USERS

# Pre-instantiate mock User models matching seed definitions
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


class MockAsyncSession:
    """Mock async SQLAlchemy session resolving mock users and tenders."""

    def __init__(self):
        self.tenders = {}

    def add(self, obj):
        if hasattr(obj, "id"):
            obj.criteria = getattr(obj, "criteria", [])
            obj.bidders = getattr(obj, "bidders", [])
            obj.created_at = datetime.now(timezone.utc)
            self.tenders[obj.id] = obj

    async def execute(self, stmt):
        result_mock = MagicMock()
        stmt_str = str(stmt).lower()
        matched_obj = None

        if "where users.email" in stmt_str:
            params = stmt.compile().params
            for key, val in params.items():
                if isinstance(val, str) and "@" in val:
                    matched_obj = MOCK_USERS.get(val.lower().strip())
                    break

        elif "where users.id" in stmt_str:
            params = stmt.compile().params
            for key, val in params.items():
                for u in MOCK_USERS.values():
                    if u.id == val or str(u.id) == str(val):
                        matched_obj = u
                        break

        elif "where tenders.nit_no" in stmt_str:
            matched_obj = None

        elif "where tenders.id" in stmt_str:
            params = stmt.compile().params
            for key, val in params.items():
                for t in self.tenders.values():
                    if t.id == val or str(t.id) == str(val):
                        matched_obj = t
                        break

        result_mock.scalar_one_or_none.return_value = matched_obj
        return result_mock

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def close(self):
        pass


@pytest.fixture
def auth_client():
    """TestClient with database session dependency overridden with MockAsyncSession."""
    async def override_get_db_session():
        session = MockAsyncSession()
        yield session

    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# =========================================================================
# 1. Login Tests (Valid & Invalid)
# =========================================================================

def test_login_success_all_roles(auth_client: TestClient):
    """Test successful login for each of the 4 primary roles."""
    for dev_user in DEV_USERS:
        response = auth_client.post(
            "/api/v1/auth/login",
            json={"email": dev_user["email"], "password": dev_user["password"]},
        )
        assert response.status_code == 200, f"Failed login for {dev_user['email']}: {response.text}"
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["role"] == dev_user["role"]
        assert data["user"]["email"] == dev_user["email"]
        assert data["user"]["role"] == dev_user["role"]


def test_login_invalid_password(auth_client: TestClient):
    """Test rejection when providing an incorrect password."""
    response = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "officer@cpcl.gov.in", "password": "WrongPassword123!"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Invalid email or password"


def test_login_nonexistent_user(auth_client: TestClient):
    """Test rejection when user email does not exist."""
    response = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "unknown@cpcl.gov.in", "password": "SomePassword123!"},
    )
    assert response.status_code == 401
    data = response.json()
    assert data["detail"] == "Invalid email or password"


# =========================================================================
# 2. Token Validation & Current User (/auth/me) Tests
# =========================================================================

def test_get_me_with_valid_token(auth_client: TestClient):
    """Test retrieving authenticated user profile using a valid token."""
    login_res = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "officer@cpcl.gov.in", "password": "Officer@CPCL2026!"},
    )
    token = login_res.json()["access_token"]

    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    user_data = response.json()
    assert user_data["email"] == "officer@cpcl.gov.in"
    assert user_data["role"] == "officer"
    assert "password" not in user_data
    assert "password_hash" not in user_data


def test_get_me_missing_token(auth_client: TestClient):
    """Test rejection when no Authorization header is provided."""
    response = auth_client.get("/api/v1/auth/me")
    assert response.status_code == 401
    assert "Authorization bearer token required" in response.json()["detail"]


def test_get_me_invalid_token(auth_client: TestClient):
    """Test rejection when providing a malformed / tampered token."""
    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer not-a-valid-jwt-token-string"},
    )
    assert response.status_code == 401
    assert "Invalid or expired token" in response.json()["detail"]


def test_get_me_expired_token(auth_client: TestClient):
    """Test rejection when token expiration timestamp has passed."""
    expired_token = create_access_token(
        subject=str(MOCK_USERS["officer@cpcl.gov.in"].id),
        role="officer",
        expires_delta=timedelta(minutes=-10),  # expired 10 minutes ago
    )
    response = auth_client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {expired_token}"},
    )
    assert response.status_code == 401
    assert "Invalid or expired token" in response.json()["detail"]


# =========================================================================
# 3. Role-Based Access Control (RBAC) Tests
# =========================================================================

def test_rbac_officer_allowed_tender_creation(auth_client: TestClient):
    """Officer role is authorized to access tender creation (endpoint returns 201 Created, NOT 403)."""
    login_res = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "officer@cpcl.gov.in", "password": "Officer@CPCL2026!"},
    )
    token = login_res.json()["access_token"]

    response = auth_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "nit_no": "CPCL/TEST/2026/01",
            "title": "Supply of Industrial Valves",
            "portal": "GeM",
            "estimated_value": 5000000.0,
            "mse_applicable": True,
            "mii_class_required": "Class-I",
            "requires_oem": True,
        },
    )
    # Passed RBAC check and tender created successfully
    assert response.status_code == 201
    assert response.json()["nit_no"] == "CPCL/TEST/2026/01"


def test_rbac_vigilance_forbidden_tender_creation(auth_client: TestClient):
    """Vigilance role is forbidden from creating tenders (returns 403 Forbidden)."""
    login_res = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "vigilance@cvc.gov.in", "password": "Vigilance@CVC2026!"},
    )
    token = login_res.json()["access_token"]

    response = auth_client.post(
        "/api/v1/tenders",
        headers={"Authorization": f"Bearer {token}"},
        json={
            "nit_no": "CPCL/TEST/2026/02",
            "title": "Unauthorized Tender Creation Attempt",
            "portal": "GeM",
        },
    )
    assert response.status_code == 403
    assert "Operation not permitted for role: 'vigilance'" in response.json()["detail"]


def test_rbac_vigilance_allowed_audit_verification(auth_client: TestClient):
    """Vigilance role is authorized to verify audit chain (returns 200)."""
    login_res = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "vigilance@cvc.gov.in", "password": "Vigilance@CVC2026!"},
    )
    token = login_res.json()["access_token"]

    response = auth_client.get(
        "/api/v1/audit/verify",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["ok"] is True


# =========================================================================
# 4. Logout Tests
# =========================================================================

def test_logout_with_valid_token(auth_client: TestClient):
    """Test successful logout with client token discard acknowledgment."""
    login_res = auth_client.post(
        "/api/v1/auth/login",
        json={"email": "admin@vigilbid.local", "password": "Admin@VigilBid2026!"},
    )
    token = login_res.json()["access_token"]

    response = auth_client.post(
        "/api/v1/auth/logout",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_logout_missing_token(auth_client: TestClient):
    """Test rejection when calling logout without token."""
    response = auth_client.post("/api/v1/auth/logout")
    assert response.status_code == 401
