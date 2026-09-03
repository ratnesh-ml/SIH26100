"""Test suite for Phase 27: Human-in-the-Loop Review.

Tests:
1. Decision States:
   - Accept, Reject, Request clarification, Override
   - Rejection of invalid decision states (422)
2. Override Reason Enforcement:
   - OVERRIDE requires explicit non-empty justification reason (422)
   - ACCEPT allows optional reason
3. Machine Recommendation vs Officer Decision Separation:
   - Machine status preserved in decision.machine_recommendation
   - Officer decision captures action, reason, actor, timestamp, and audit_ref
4. Decision History & Audit Attribution:
   - GET /findings/{id}/decisions
   - GET /bidders/{id}/decisions
   - GET /bids/{id}/decisions
   - Linkage to cryptographic SHA-256 audit_ref
5. Pending Findings Filtering:
   - GET /bidders/{id}/findings?pending=true returns only unresolved findings
   - Decided findings are marked is_resolved=True
6. Bid Decision Endpoint:
   - POST /api/v1/bids/{id}/decision (Accept, Reject, Request clarification, Override)
   - Reason enforcement on bid-level override
7. Complete-Review Validation:
   - Blocking review completion when mandatory unresolved findings remain (400)
   - Successful review finalization when all findings resolved
   - Verification that bid and bidder status transition cleanly to COMPLETED / QUALIFIED
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token, get_password_hash
from backend.models.entities import AuditLog, Bid, Bidder, Decision, Finding, Tender, User
from pipeline.audit.hasher import GENESIS_HASH, compute_audit_hash, verify_chain
from seed.seed_users import DEV_USERS


# ===========================================================================
# In-Memory Test Stores
# ===========================================================================

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

MOCK_AUDIT_LOGS: list[AuditLog] = []
MOCK_TENDERS: dict[uuid.UUID, Tender] = {}
MOCK_BIDDERS: dict[uuid.UUID, Bidder] = {}
MOCK_BIDS: dict[uuid.UUID, Bid] = {}
MOCK_FINDINGS: dict[uuid.UUID, Finding] = {}
MOCK_DECISIONS: dict[uuid.UUID, Decision] = {}


class MockReviewSession:
    """Mock async SQLAlchemy session for Human-in-the-Loop review testing."""

    def __init__(self):
        self.added_objects = []

    def add(self, obj):
        self.added_objects.append(obj)
        if isinstance(obj, AuditLog):
            if not getattr(obj, "seq", None):
                obj.seq = len(MOCK_AUDIT_LOGS) + 1
            MOCK_AUDIT_LOGS.append(obj)
        elif isinstance(obj, Finding):
            MOCK_FINDINGS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)
            if not hasattr(obj, "decisions") or obj.decisions is None:
                obj.decisions = []
        elif isinstance(obj, Bidder):
            MOCK_BIDDERS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)
            if not hasattr(obj, "findings") or obj.findings is None:
                obj.findings = []
            if not hasattr(obj, "decisions") or obj.decisions is None:
                obj.decisions = []
        elif isinstance(obj, Bid):
            MOCK_BIDS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)
            if obj.bidder_id in MOCK_BIDDERS:
                obj.bidder = MOCK_BIDDERS[obj.bidder_id]
        elif isinstance(obj, Decision):
            MOCK_DECISIONS[obj.id] = obj
            obj.created_at = getattr(obj, "created_at", None) or datetime.now(timezone.utc)
            # Link actor if available
            for u in MOCK_USERS.values():
                if u.id == obj.actor_id:
                    obj.actor = u
                    break
            # Link to finding if applicable
            if obj.finding_id and obj.finding_id in MOCK_FINDINGS:
                f = MOCK_FINDINGS[obj.finding_id]
                if not hasattr(f, "decisions") or f.decisions is None:
                    f.decisions = []
                f.decisions.append(obj)
            # Link to bidder
            if obj.bidder_id in MOCK_BIDDERS:
                b = MOCK_BIDDERS[obj.bidder_id]
                if not hasattr(b, "decisions") or b.decisions is None:
                    b.decisions = []
                b.decisions.append(obj)

    async def commit(self):
        pass

    async def rollback(self):
        pass

    async def refresh(self, obj):
        if isinstance(obj, AuditLog) and not getattr(obj, "seq", None):
            obj.seq = len(MOCK_AUDIT_LOGS)

    async def execute(self, stmt):
        result_mock = MagicMock()
        stmt_str = str(stmt).lower()

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

        # 2. Finding lookup
        elif "where findings.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for f in MOCK_FINDINGS.values():
                    if f.id == val or str(f.id) == str(val):
                        matched = f
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 3. Bid lookup
        elif "where bids.id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for b in MOCK_BIDS.values():
                    if b.id == val or str(b.id) == str(val):
                        matched = b
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 4. Bidder lookup by ID or tender_id
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

        # 5. Bid lookup by bidder_id
        elif "where bids.bidder_id" in stmt_str:
            params = stmt.compile().params
            matched = None
            for key, val in params.items():
                for b in MOCK_BIDS.values():
                    if b.bidder_id == val or str(b.bidder_id) == str(val):
                        matched = b
                        break
            result_mock.scalar_one_or_none.return_value = matched
            return result_mock

        # 6. Findings by bidder_id
        elif "from findings" in stmt_str:
            params = stmt.compile().params
            matched_findings = list(MOCK_FINDINGS.values())
            if "where findings.bidder_id" in stmt_str and params:
                target_bidder = list(params.values())[0]
                matched_findings = [
                    f for f in matched_findings
                    if str(f.bidder_id) == str(target_bidder)
                ]
            scalars_mock = MagicMock()
            scalars_mock.all.return_value = matched_findings
            result_mock.scalars.return_value = scalars_mock
            return result_mock

        # 7. Decisions lookup / listing
        elif "from decisions" in stmt_str:
            params = stmt.compile().params
            filtered = list(MOCK_DECISIONS.values())
            if "where decisions.finding_id" in stmt_str and params:
                target_fid = list(params.values())[0]
                filtered = [d for d in filtered if str(d.finding_id) == str(target_fid)]
            elif "where decisions.bidder_id" in stmt_str and params:
                target_bid = list(params.values())[0]
                filtered = [d for d in filtered if str(d.bidder_id) == str(target_bid)]
            elif "where decisions.bid_id" in stmt_str and params:
                target_bidid = list(params.values())[0]
                filtered = [d for d in filtered if str(d.bid_id) == str(target_bidid)]

            # Order by created_at desc
            filtered.sort(key=lambda d: getattr(d, "created_at", None) or datetime.min, reverse=True)
            scalars_mock = MagicMock()
            scalars_mock.all.return_value = filtered
            result_mock.scalars.return_value = scalars_mock
            return result_mock

        # 8. Audit log latest query: order by seq desc limit 1
        elif "order by audit_log.seq desc" in stmt_str:
            latest = MOCK_AUDIT_LOGS[-1] if MOCK_AUDIT_LOGS else None
            result_mock.scalar_one_or_none.return_value = latest
            return result_mock

        # 9. Audit log all
        elif "from audit_log" in stmt_str:
            scalars_mock = MagicMock()
            scalars_mock.all.return_value = list(MOCK_AUDIT_LOGS)
            result_mock.scalars.return_value = scalars_mock
            return result_mock

        result_mock.scalar_one_or_none.return_value = None
        scalars_mock = MagicMock()
        scalars_mock.all.return_value = []
        result_mock.scalars.return_value = scalars_mock
        return result_mock


@pytest.fixture
def review_client():
    """Client configured with in-memory MockReviewSession."""
    MOCK_AUDIT_LOGS.clear()
    MOCK_TENDERS.clear()
    MOCK_BIDDERS.clear()
    MOCK_BIDS.clear()
    MOCK_FINDINGS.clear()
    MOCK_DECISIONS.clear()

    async def override_get_db_session():
        session = MockReviewSession()
        yield session

    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


@pytest.fixture
def officer_auth():
    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    return {"Authorization": f"Bearer {token}"}


# ===========================================================================
# 1. Decision States & Validation Tests
# ===========================================================================

def test_decision_states_accept(review_client, officer_auth):
    """Test ACCEPT decision on a finding preserves machine status and resulting_status."""
    bidder_id = uuid.uuid4()
    finding_id = uuid.uuid4()

    finding = Finding(
        id=finding_id,
        bidder_id=bidder_id,
        rule_id="R-ID-01",
        rule_version="1.0",
        status="PASS",
        title="GSTIN Validity",
        explanation="Valid GSTIN",
        evidence=[],
    )
    MOCK_FINDINGS[finding_id] = finding

    resp = review_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json={"action": "ACCEPT", "reason": "Confirmed automated pass"},
        headers=officer_auth,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "ACCEPT"
    assert data["resulting_status"] == "PASS"
    assert data["machine_recommendation"] == "PASS"
    assert data["actor_id"] == str(DEV_USERS[0]["id"])
    assert data["audit_ref"] is not None


def test_decision_states_reject(review_client, officer_auth):
    """Test REJECT decision sets resulting status to FAIL."""
    bidder_id = uuid.uuid4()
    finding_id = uuid.uuid4()

    finding = Finding(
        id=finding_id,
        bidder_id=bidder_id,
        rule_id="R-FIN-01",
        rule_version="1.0",
        status="WARN",
        title="Turnover Proximity",
        explanation="Turnover barely meets threshold",
        evidence=[],
    )
    MOCK_FINDINGS[finding_id] = finding

    resp = review_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json={"action": "REJECT", "reason": "Audited accounts do not support claim"},
        headers=officer_auth,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "REJECT"
    assert data["resulting_status"] == "FAIL"
    assert data["machine_recommendation"] == "WARN"


def test_decision_states_request_clarification(review_client, officer_auth):
    """Test REQUEST_CLARIFICATION sets status to REVIEW."""
    bidder_id = uuid.uuid4()
    finding_id = uuid.uuid4()

    finding = Finding(
        id=finding_id,
        bidder_id=bidder_id,
        rule_id="R-MSE-01",
        rule_version="1.0",
        status="REVIEW",
        title="MSE Certificate Classification",
        explanation="Classification unclear",
        evidence=[],
    )
    MOCK_FINDINGS[finding_id] = finding

    resp = review_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json={"action": "REQUEST_CLARIFICATION", "reason": "Seek Udyam NIC code clarification from bidder"},
        headers=officer_auth,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "REQUEST_CLARIFICATION"
    assert data["resulting_status"] == "REVIEW"


def test_decision_invalid_state_rejected(review_client, officer_auth):
    """Test invalid decision state is rejected with 422 Unprocessable Entity."""
    finding_id = uuid.uuid4()
    finding = Finding(
        id=finding_id,
        bidder_id=uuid.uuid4(),
        rule_id="R-TEST-01",
        status="REVIEW",
        title="Test",
        explanation="Test",
    )
    MOCK_FINDINGS[finding_id] = finding

    resp = review_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json={"action": "INVALID_STATE", "reason": "Some reason"},
        headers=officer_auth,
    )
    assert resp.status_code == 422
    assert "Invalid decision action" in resp.json()["detail"]


# ===========================================================================
# 2. Override Reason Enforcement
# ===========================================================================

def test_override_strictly_requires_reason(review_client, officer_auth):
    """Test OVERRIDE without a justification reason raises 422."""
    finding_id = uuid.uuid4()
    finding = Finding(
        id=finding_id,
        bidder_id=uuid.uuid4(),
        rule_id="R-FIN-01",
        status="FAIL",
        title="Turnover Deficit",
        explanation="Turnover below threshold",
    )
    MOCK_FINDINGS[finding_id] = finding

    # Empty reason
    resp = review_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json={"action": "OVERRIDE", "reason": ""},
        headers=officer_auth,
    )
    assert resp.status_code == 422
    assert "reason is strictly required" in resp.json()["detail"]

    # Whitespace-only reason
    resp2 = review_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json={"action": "OVERRIDE", "reason": "   "},
        headers=officer_auth,
    )
    assert resp2.status_code == 422
    assert "reason is strictly required" in resp2.json()["detail"]


def test_override_with_valid_reason_succeeds(review_client, officer_auth):
    """Test OVERRIDE with a valid reason turns FAIL finding into PASS."""
    finding_id = uuid.uuid4()
    finding = Finding(
        id=finding_id,
        bidder_id=uuid.uuid4(),
        rule_id="R-FIN-01",
        status="FAIL",
        title="Turnover Deficit",
        explanation="Turnover below threshold",
    )
    MOCK_FINDINGS[finding_id] = finding

    reason_text = "Verified audited balance sheet directly with ICAI portal via valid UDIN; threshold satisfied."
    resp = review_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json={"action": "OVERRIDE", "reason": reason_text},
        headers=officer_auth,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["action"] == "OVERRIDE"
    assert data["resulting_status"] == "PASS"
    assert data["machine_recommendation"] == "FAIL"
    assert data["reason"] == reason_text
    assert finding.status == "PASS"


# ===========================================================================
# 3. Decision History & Audit Attribution
# ===========================================================================

def test_decision_history_retrieval(review_client, officer_auth):
    """Test retrieving decision history for finding and bidder."""
    bidder_id = uuid.uuid4()
    finding_id = uuid.uuid4()

    finding = Finding(
        id=finding_id,
        bidder_id=bidder_id,
        rule_id="R-ID-02",
        status="WARN",
        title="Trade Name Mismatch",
        explanation="Trade name varies slightly",
    )
    MOCK_FINDINGS[finding_id] = finding

    # 1. Post first decision: Clarification
    review_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json={"action": "REQUEST_CLARIFICATION", "reason": "Requested clarification from vendor"},
        headers=officer_auth,
    )

    # 2. Post second decision: Override after receiving clarification
    review_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json={"action": "OVERRIDE", "reason": "Certificate of incorporation confirms trade name is an alias."},
        headers=officer_auth,
    )

    # Query finding decision history
    f_hist_resp = review_client.get(f"/api/v1/findings/{finding_id}/decisions", headers=officer_auth)
    assert f_hist_resp.status_code == 200
    f_history = f_hist_resp.json()
    assert len(f_history) == 2
    assert f_history[0]["action"] == "OVERRIDE"
    assert f_history[1]["action"] == "REQUEST_CLARIFICATION"

    # Query bidder decision history
    b_hist_resp = review_client.get(f"/api/v1/bidders/{bidder_id}/decisions", headers=officer_auth)
    assert b_hist_resp.status_code == 200
    assert len(b_hist_resp.json()) == 2


# ===========================================================================
# 4. Pending Findings Filtering
# ===========================================================================

def test_pending_findings_filtering(review_client, officer_auth):
    """Test GET /bidders/{id}/findings?pending=true filters out resolved findings."""
    bidder_id = uuid.uuid4()

    # Finding 1: PASS (automated -> not pending)
    f1 = Finding(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        rule_id="R-ID-01",
        status="PASS",
        title="GST Passed",
        explanation="Passed",
    )
    MOCK_FINDINGS[f1.id] = f1

    # Finding 2: FAIL (unresolved -> pending)
    f2 = Finding(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        rule_id="R-FIN-01",
        status="FAIL",
        title="Turnover Failed",
        explanation="Deficit",
    )
    MOCK_FINDINGS[f2.id] = f2

    # Finding 3: REVIEW (unresolved -> pending)
    f3 = Finding(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        rule_id="R-MSE-01",
        status="REVIEW",
        title="MSE Review Needed",
        explanation="Unclear",
    )
    MOCK_FINDINGS[f3.id] = f3

    # Initial query for pending findings: should return f2 and f3
    resp = review_client.get(f"/api/v1/bidders/{bidder_id}/findings?pending=true", headers=officer_auth)
    assert resp.status_code == 200
    pending_items = resp.json()
    assert len(pending_items) == 2
    pending_ids = [item["id"] for item in pending_items]
    assert str(f2.id) in pending_ids
    assert str(f3.id) in pending_ids
    assert str(f1.id) not in pending_ids

    # Decide f2 with OVERRIDE
    review_client.post(
        f"/api/v1/findings/{f2.id}/decision",
        json={"action": "OVERRIDE", "reason": "Physical turnover proof accepted."},
        headers=officer_auth,
    )

    # Query pending findings again: only f3 should remain pending
    resp2 = review_client.get(f"/api/v1/bidders/{bidder_id}/findings?pending=true", headers=officer_auth)
    assert resp2.status_code == 200
    pending_items2 = resp2.json()
    assert len(pending_items2) == 1
    assert pending_items2[0]["id"] == str(f3.id)


# ===========================================================================
# 5. Bid Decision Endpoint (/api/v1/bids/{id}/decision)
# ===========================================================================

def test_bid_decision_endpoint(review_client, officer_auth):
    """Test POST /api/v1/bids/{id}/decision records officer bid-level decision."""
    bidder_id = uuid.uuid4()
    bid_id = uuid.uuid4()
    tender_id = uuid.uuid4()

    bidder = Bidder(id=bidder_id, declared_name="Adani Gas Ltd", overall_status="REVIEW")
    MOCK_BIDDERS[bidder_id] = bidder

    bid = Bid(
        id=bid_id,
        tender_id=tender_id,
        bidder_id=bidder_id,
        bid_number="BID-CPCL-2026-001",
        status="UNDER_EVALUATION",
    )
    MOCK_BIDS[bid_id] = bid

    # 1. Override without reason -> fails
    resp_fail = review_client.post(
        f"/api/v1/bids/{bid_id}/decision",
        json={"action": "OVERRIDE", "reason": ""},
        headers=officer_auth,
    )
    assert resp_fail.status_code == 422

    # 2. Accept bid evaluation
    resp = review_client.post(
        f"/api/v1/bids/{bid_id}/decision",
        json={"action": "ACCEPT", "reason": "All criteria met to officer satisfaction."},
        headers=officer_auth,
    )
    assert resp.status_code == 200
    dec = resp.json()
    assert dec["action"] == "ACCEPT"
    assert dec["resulting_status"] == "QUALIFIED"
    assert dec["bid_id"] == str(bid_id)
    assert bid.status == "QUALIFIED"
    assert bidder.overall_status == "PASS"

    # 3. Retrieve bid decision history
    hist_resp = review_client.get(f"/api/v1/bids/{bid_id}/decisions", headers=officer_auth)
    assert hist_resp.status_code == 200
    assert len(hist_resp.json()) >= 1


# ===========================================================================
# 6. Complete-Review Validation
# ===========================================================================

def test_complete_review_blocked_by_unresolved_findings(review_client, officer_auth):
    """Test complete-review is blocked when mandatory unresolved findings remain."""
    bidder_id = uuid.uuid4()
    bid_id = uuid.uuid4()

    bidder = Bidder(id=bidder_id, declared_name="Test Corp", review_state="PENDING")
    MOCK_BIDDERS[bidder_id] = bidder

    bid = Bid(id=bid_id, tender_id=uuid.uuid4(), bidder_id=bidder_id, bid_number="BID-001", status="UNDER_EVALUATION")
    MOCK_BIDS[bid_id] = bid

    # Add an unresolved FAIL finding
    f = Finding(
        id=uuid.uuid4(),
        bidder_id=bidder_id,
        rule_id="R-FIN-01",
        status="FAIL",
        title="Mandatory Turnover Failure",
        explanation="Below minimum",
    )
    MOCK_FINDINGS[f.id] = f

    # Attempt to complete review via bidder endpoint -> must fail with 400
    resp1 = review_client.post(f"/api/v1/bidders/{bidder_id}/complete-review", headers=officer_auth)
    assert resp1.status_code == 400
    detail1 = resp1.json()["detail"]
    assert "mandatory unresolved" in detail1["message"].lower()
    assert len(detail1["unresolved_findings"]) == 1

    # Attempt to complete review via bid endpoint -> must also fail with 400
    resp2 = review_client.post(f"/api/v1/bids/{bid_id}/complete-review", headers=officer_auth)
    assert resp2.status_code == 400


def test_complete_review_succeeds_when_all_findings_resolved(review_client, officer_auth):
    """Test complete-review succeeds when all mandatory findings have been decided."""
    bidder_id = uuid.uuid4()
    bid_id = uuid.uuid4()

    bidder = Bidder(id=bidder_id, declared_name="Reliance Petroleum", review_state="PENDING")
    MOCK_BIDDERS[bidder_id] = bidder

    bid = Bid(id=bid_id, tender_id=uuid.uuid4(), bidder_id=bidder_id, bid_number="BID-REL-01", status="UNDER_EVALUATION")
    MOCK_BIDS[bid_id] = bid

    # Finding 1: PASS
    f1 = Finding(id=uuid.uuid4(), bidder_id=bidder_id, rule_id="R-ID-01", status="PASS", title="GST Pass", explanation="OK")
    MOCK_FINDINGS[f1.id] = f1

    # Finding 2: FAIL, but overridden by officer
    f2 = Finding(id=uuid.uuid4(), bidder_id=bidder_id, rule_id="R-FIN-01", status="FAIL", title="Turnover Deficit", explanation="Low")
    MOCK_FINDINGS[f2.id] = f2

    # Override finding 2
    review_client.post(
        f"/api/v1/findings/{f2.id}/decision",
        json={"action": "OVERRIDE", "reason": "Physical bank balance certificate verified and approved."},
        headers=officer_auth,
    )

    # Now complete review -> must succeed!
    resp = review_client.post(f"/api/v1/bidders/{bidder_id}/complete-review", headers=officer_auth)
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["review_state"] == "COMPLETED"
    assert data["overall_status"] == "PASS"
    assert data["bid_status"] == "QUALIFIED"

    # Verify bidder and bid models updated
    assert bidder.review_state == "COMPLETED"
    assert bidder.overall_status == "PASS"
    assert bid.status == "QUALIFIED"

    # Verify audit event recorded for complete-review
    assert len(MOCK_AUDIT_LOGS) >= 2
    complete_events = [e for e in MOCK_AUDIT_LOGS if e.action == "REVIEW_COMPLETED"]
    assert len(complete_events) == 1
    assert complete_events[0].target_id == str(bidder_id)
