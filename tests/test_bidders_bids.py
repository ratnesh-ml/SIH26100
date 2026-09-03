"""Test Bidder and Bid Management: Creation, profiles, tender attachment, bid listing, status transitions, and RBAC."""

from datetime import datetime, timezone
from unittest.mock import MagicMock
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token, get_password_hash, encrypt_identifier
from backend.models.entities import User, Tender, Bidder, Bid
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
MOCK_BIDDERS: dict[uuid.UUID, Bidder] = {}
MOCK_BIDS: dict[uuid.UUID, Bid] = {}


class MockBidderSession:
    """Mock async SQLAlchemy session handling User, Tender, Bidder, and Bid entities in-memory."""

    def __init__(self):
        self.added_objects = []

    def add(self, obj):
        self.added_objects.append(obj)
        if isinstance(obj, Tender):
            MOCK_TENDERS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)
            obj.bidders = []
            obj.bids = []
            obj.criteria = []
        elif isinstance(obj, Bidder):
            MOCK_BIDDERS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)
            obj.documents = []
            obj.bids = []
            if obj.tender_id and obj.tender_id in MOCK_TENDERS:
                MOCK_TENDERS[obj.tender_id].bidders.append(obj)
        elif isinstance(obj, Bid):
            MOCK_BIDS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)
            obj.bidder = MOCK_BIDDERS.get(obj.bidder_id)
            obj.tender = MOCK_TENDERS.get(obj.tender_id)
            if obj.bidder:
                obj.bidder.bids.append(obj)
            if obj.tender:
                obj.tender.bids.append(obj)

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

        # 2. Tender lookup by ID
        elif "where tenders.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for t in MOCK_TENDERS.values():
                    if t.id == val or str(t.id) == str(val):
                        matched = t
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 3. Bidder lookup by ID
        elif "where bidders.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for b in MOCK_BIDDERS.values():
                    if b.id == val or str(b.id) == str(val):
                        matched = b
                        break
            result_mock.scalar_one_or_none.return_value = matched
            result_mock.scalar_one.return_value = matched
            return result_mock

        # 4. Bid lookup by ID
        elif "where bids.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for bid in MOCK_BIDS.values():
                    if bid.id == val or str(bid.id) == str(val):
                        matched = bid
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 5. Bid lookup by tender_id & bidder_id
        elif "where bids.tender_id" in stmt_str and "and bids.bidder_id" in stmt_str:
            params = stmt.compile().params
            t_id = None
            b_id = None
            for key, val in params.items():
                if "tender_id" in key:
                    t_id = val
                elif "bidder_id" in key:
                    b_id = val
            matched = None
            for bid in MOCK_BIDS.values():
                if (bid.tender_id == t_id or str(bid.tender_id) == str(t_id)) and (
                    bid.bidder_id == b_id or str(bid.bidder_id) == str(b_id)
                ):
                    matched = bid
                    break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 6. Bid lookup by bid_number
        elif "where bids.bid_number" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for bid in MOCK_BIDS.values():
                    if bid.bid_number == val:
                        matched = bid
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 7. Count queries
        elif "count(bidders.id)" in stmt_str:
            result_mock.scalar.return_value = len(MOCK_BIDDERS)
            return result_mock
        elif "count(bids.id)" in stmt_str:
            result_mock.scalar.return_value = len(MOCK_BIDS)
            return result_mock

        # 8. List queries
        elif "from bidders" in stmt_str:
            bidders_list = list(MOCK_BIDDERS.values())
            scalars_mock = MagicMock()
            scalars_mock.all.return_value = bidders_list
            result_mock.scalars.return_value = scalars_mock
            return result_mock

        elif "from bids" in stmt_str:
            params = stmt.compile().params
            t_id = None
            for key, val in params.items():
                if "tender" in key or "id" in key:
                    t_id = val
                    break
            if t_id:
                bids_list = [b for b in MOCK_BIDS.values() if b.tender_id == t_id or str(b.tender_id) == str(t_id)]
            else:
                bids_list = list(MOCK_BIDS.values())
            if not bids_list and MOCK_BIDS:
                bids_list = list(MOCK_BIDS.values())
            scalars_mock = MagicMock()
            scalars_mock.all.return_value = bids_list
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
def bidder_client():
    """TestClient configured with in-memory MockBidderSession."""
    MOCK_TENDERS.clear()
    MOCK_BIDDERS.clear()
    MOCK_BIDS.clear()

    # Create a baseline tender in mock store
    test_tender_id = uuid.UUID("99999999-9999-4999-8999-999999999999")
    tender = Tender(
        id=test_tender_id,
        nit_no="CPCL/PROC/2026/PUMPS-01",
        title="Centrifugal Pumps for CPCL Refinery",
        portal="GeM",
        status="ACTIVE",
        estimated_value=12000000.0,
        created_by=MOCK_USERS["officer@cpcl.gov.in"].id,
    )
    tender.created_at = datetime.now(timezone.utc)
    tender.bidders = []
    tender.bids = []
    MOCK_TENDERS[test_tender_id] = tender

    async def override_get_db_session():
        yield MockBidderSession()

    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def officer_token():
    user = MOCK_USERS["officer@cpcl.gov.in"]
    return create_access_token(subject=str(user.id), role="officer")


@pytest.fixture
def evaluator_token():
    user = MOCK_USERS["evaluator@cpcl.gov.in"]
    return create_access_token(subject=str(user.id), role="evaluator")


@pytest.fixture
def vigilance_token():
    user = MOCK_USERS["vigilance@cvc.gov.in"]
    return create_access_token(subject=str(user.id), role="vigilance")


# =========================================================================
# 1. Bidder Creation & Profile Tests
# =========================================================================

def test_create_bidder_success(bidder_client: TestClient, officer_token: str):
    """Test creating a vendor profile with encrypted credentials and masked response."""
    payload = {
        "declared_name": "Apex Engineering Solutions Pvt Ltd",
        "pan": "ABCDE1234F",
        "gstin": "33ABCDE1234F1Z5",
        "cin": "U12345TN2020PTC123456",
        "udyam_no": "UDYAM-TN-02-0012345",
        "address": {"city": "Chennai", "state": "Tamil Nadu"},
        "contact": {"email": "info@apexeng.in", "phone": "+919876543210"},
    }
    response = bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json=payload,
    )
    assert response.status_code == 201, response.text
    data = response.json()
    assert data["declared_name"] == payload["declared_name"]
    assert data["canonical_name"] == "APEX ENGINEERING SOLUTIONS"
    # Verify masking
    assert data["masked_pan"] == "ABCDE****F"
    assert data["masked_gstin"] == "33ABC*******1Z5"
    assert data["overall_status"] == "PENDING"
    assert data["risk_score"] == 0


def test_create_bidder_validation_errors(bidder_client: TestClient, officer_token: str):
    """Test validation errors for invalid PAN, GSTIN, or blank name."""
    # 1. Bad PAN
    res_pan = bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"declared_name": "Test Vendor", "pan": "BADPAN12"},
    )
    assert res_pan.status_code == 422

    # 2. Bad GSTIN
    res_gstin = bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"declared_name": "Test Vendor", "gstin": "123INVALIDGSTIN"},
    )
    assert res_gstin.status_code == 422

    # 3. Empty name
    res_empty = bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"declared_name": "   "},
    )
    assert res_empty.status_code == 422


def test_get_and_update_bidder_profile(bidder_client: TestClient, officer_token: str):
    """Test fetching and updating a bidder profile."""
    # Create
    create_res = bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"declared_name": "Southern Valves Limited", "pan": "AAAAA1111A"},
    )
    bidder_id = create_res.json()["id"]

    # Get
    get_res = bidder_client.get(
        f"/api/v1/bidders/{bidder_id}",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert get_res.status_code == 200
    assert get_res.json()["id"] == bidder_id

    # Update
    patch_res = bidder_client.patch(
        f"/api/v1/bidders/{bidder_id}",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"contact": {"email": "contracts@southernvalves.com"}, "udyam_no": "UDYAM-TN-01-9999999"},
    )
    assert patch_res.status_code == 200
    updated = patch_res.json()
    assert updated["contact"]["email"] == "contracts@southernvalves.com"
    assert updated["udyam_no"] == "UDYAM-TN-01-9999999"


def test_list_bidders_paginated(bidder_client: TestClient, officer_token: str):
    """Test paginated bidder listing and legal name search."""
    bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"declared_name": "Alpha Valves Pvt Ltd"},
    )
    bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"declared_name": "Beta Piping Systems"},
    )

    # List all
    res = bidder_client.get(
        "/api/v1/bidders?page=1&limit=10",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res.status_code == 200
    data = res.json()
    assert data["total"] == 2
    assert len(data["items"]) == 2


# =========================================================================
# 2. Attach Bidder to Tender Tests
# =========================================================================

def test_attach_bidder_to_tender_and_duplicate(bidder_client: TestClient, officer_token: str):
    """Test registering a bidder to a tender and rejecting duplicate attachments."""
    tender_id = "99999999-9999-4999-8999-999999999999"

    # Create bidder
    b_res = bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"declared_name": "Gamma Heavy Industries"},
    )
    bidder_id = b_res.json()["id"]

    # 1. Attach bidder to tender
    attach_res = bidder_client.post(
        f"/api/v1/tenders/{tender_id}/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"bidder_id": bidder_id, "financial_quote": 11500000.0},
    )
    assert attach_res.status_code == 201, attach_res.text
    bid_data = attach_res.json()
    assert bid_data["tender_id"] == tender_id
    assert bid_data["bidder_id"] == bidder_id
    assert bid_data["status"] == "SUBMITTED"
    assert bid_data["financial_quote"] == 11500000.0

    # 2. Attempt duplicate attachment (HTTP 409 Conflict)
    dup_res = bidder_client.post(
        f"/api/v1/tenders/{tender_id}/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"bidder_id": bidder_id},
    )
    assert dup_res.status_code == 409
    assert "already submitted a bid" in dup_res.json()["detail"]


def test_list_tender_bidders(bidder_client: TestClient, officer_token: str):
    """Test listing all bidders/bids attached to a specific tender."""
    tender_id = "99999999-9999-4999-8999-999999999999"

    # Attach bidder directly by name
    post_res = bidder_client.post(
        f"/api/v1/tenders/{tender_id}/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"declared_name": "Delta Automation Corp"},
    )
    assert post_res.status_code == 201, post_res.text

    res = bidder_client.get(
        f"/api/v1/tenders/{tender_id}/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert res.status_code == 200
    bids = res.json()
    assert len(bids) >= 1
    assert bids[0]["tender_id"] == tender_id


# =========================================================================
# 3. Direct Bid Creation & Status Lifecycle Tests
# =========================================================================

def test_direct_bid_crud_and_status_transitions(
    bidder_client: TestClient, officer_token: str, evaluator_token: str
):
    """Test direct bid creation, retrieval, and status updates."""
    tender_id = "99999999-9999-4999-8999-999999999999"

    # Create bidder
    b_res = bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"declared_name": "Epsilon Turbo Systems"},
    )
    bidder_id = b_res.json()["id"]

    # 1. Create Bid
    create_bid_res = bidder_client.post(
        "/api/v1/bids",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={
            "tender_id": tender_id,
            "bidder_id": bidder_id,
            "bid_number": "BID-CPCL-PUMPS-001",
            "status": "SUBMITTED",
            "technical_score": 88.5,
        },
    )
    assert create_bid_res.status_code == 201
    bid = create_bid_res.json()
    bid_id = bid["id"]
    assert bid["status"] == "SUBMITTED"
    assert bid["bid_number"] == "BID-CPCL-PUMPS-001"

    # 2. Get Bid
    get_bid_res = bidder_client.get(
        f"/api/v1/bids/{bid_id}",
        headers={"Authorization": f"Bearer {officer_token}"},
    )
    assert get_bid_res.status_code == 200
    assert get_bid_res.json()["id"] == bid_id

    # 3. Update Status (by Evaluator)
    patch_status_res = bidder_client.patch(
        f"/api/v1/bids/{bid_id}/status",
        headers={"Authorization": f"Bearer {evaluator_token}"},
        json={"status": "UNDER_EVALUATION", "remarks": "Documents under technical verification"},
    )
    assert patch_status_res.status_code == 200
    assert patch_status_res.json()["status"] == "UNDER_EVALUATION"

    # 4. Update Status to QUALIFIED
    patch_qual_res = bidder_client.patch(
        f"/api/v1/bids/{bid_id}/status",
        headers={"Authorization": f"Bearer {officer_token}"},
        json={"status": "QUALIFIED"},
    )
    assert patch_qual_res.status_code == 200
    assert patch_qual_res.json()["status"] == "QUALIFIED"


# =========================================================================
# 4. Authorization Tests
# =========================================================================

def test_bidder_and_bid_unauthorized(bidder_client: TestClient):
    """Test rejection when no auth token is provided."""
    assert bidder_client.get("/api/v1/bidders").status_code == 401
    assert bidder_client.post("/api/v1/bidders", json={"declared_name": "Anon"}).status_code == 401
    assert bidder_client.get("/api/v1/bids").status_code == 401


def test_bidder_and_bid_rbac_forbidden_mutations(
    bidder_client: TestClient, vigilance_token: str
):
    """Test that Vigilance role can read bidders/bids but is forbidden from mutating."""
    # Vigilance can READ bidders & bids
    assert bidder_client.get("/api/v1/bidders", headers={"Authorization": f"Bearer {vigilance_token}"}).status_code == 200
    assert bidder_client.get("/api/v1/bids", headers={"Authorization": f"Bearer {vigilance_token}"}).status_code == 200

    # Vigilance is FORBIDDEN from creating a bidder (HTTP 403)
    res_b = bidder_client.post(
        "/api/v1/bidders",
        headers={"Authorization": f"Bearer {vigilance_token}"},
        json={"declared_name": "Unauthorized Corp"},
    )
    assert res_b.status_code == 403

    # Vigilance is FORBIDDEN from creating a bid (HTTP 403)
    res_bid = bidder_client.post(
        "/api/v1/bids",
        headers={"Authorization": f"Bearer {vigilance_token}"},
        json={
            "tender_id": "99999999-9999-4999-8999-999999999999",
            "bidder_id": "88888888-8888-4888-8888-888888888888",
        },
    )
    assert res_bid.status_code == 403
