"""Comprehensive test suite for Cryptographic Audit Trail and Hash-Chain Verification.

Tests:
1. Normal Chain:
   - Valid sequential events starting from GENESIS_HASH
   - Forward SHA-256 chaining continuity
   - verify_chain returns (True, length, None)
2. Tampered Event:
   - Modification of payload in middle of chain
   - verify_chain identifies exact first_broken_seq
3. Broken Previous Hash:
   - Corrupted prev_hash pointer (e.g. deletion or insertion out of order)
   - verify_chain detects break and identifies first_broken_seq
4. Valid Chain (Genesis & Database):
   - Empty chain handling
   - Single event chain
   - Database persistence via AuditService.record_event
   - In-database tamper detection
   - API endpoints: GET /audit/trail, GET /tenders/{id}/audit, GET /audit/verify, POST /audit/verify
"""

from datetime import datetime, timezone
from unittest.mock import MagicMock
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token, get_password_hash
from backend.models.entities import AuditLog, Bidder, Finding, Decision, Tender, User
from backend.services.audit_service import AuditService
from pipeline.audit.hasher import (
    GENESIS_HASH,
    compute_audit_hash,
    get_chain_head,
    verify_chain,
    verify_chain_full,
)
from seed.seed_users import DEV_USERS


# ===========================================================================
# In-Memory Mock Session
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
MOCK_FINDINGS: dict[uuid.UUID, Finding] = {}
MOCK_BIDDERS: dict[uuid.UUID, Bidder] = {}
MOCK_DECISIONS: dict[uuid.UUID, Decision] = {}


class MockAuditSession:
    """Mock async SQLAlchemy session handling AuditLog, Findings, Decisions, and Users in-memory."""

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
            obj.created_at = datetime.now(timezone.utc)
        elif isinstance(obj, Bidder):
            MOCK_BIDDERS[obj.id] = obj
            obj.created_at = datetime.now(timezone.utc)
        elif isinstance(obj, Decision):
            MOCK_DECISIONS[obj.id] = obj
            obj.created_at = datetime.now(timezone.utc)

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

        # 3. Audit log latest query: order by seq desc limit 1
        elif "order by audit_log.seq desc" in stmt_str:
            latest = MOCK_AUDIT_LOGS[-1] if MOCK_AUDIT_LOGS else None
            result_mock.scalar_one_or_none.return_value = latest
            return result_mock

        # 4. Audit log all / order by seq asc
        elif "from audit_log" in stmt_str:
            # Check for target_type or target_id filter
            filtered = list(MOCK_AUDIT_LOGS)
            params = stmt.compile().params
            target_type_val = params.get("target_type_1")
            target_id_val = params.get("target_id_1")

            if target_type_val:
                filtered = [e for e in filtered if e.target_type == target_type_val]
            if target_id_val:
                filtered = [e for e in filtered if e.target_id == str(target_id_val)]

            scalars_mock = MagicMock()
            scalars_mock.all.return_value = filtered
            result_mock.scalars.return_value = scalars_mock
            return result_mock

        # 5. Finding list by bidder_id
        elif "from findings" in stmt_str:
            scalars_mock = MagicMock()
            scalars_mock.all.return_value = list(MOCK_FINDINGS.values())
            result_mock.scalars.return_value = scalars_mock
            return result_mock

        result_mock.scalar_one_or_none.return_value = None
        scalars_mock = MagicMock()
        scalars_mock.all.return_value = []
        result_mock.scalars.return_value = scalars_mock
        return result_mock


@pytest.fixture
def audit_client():
    """Client with in-memory MockAuditSession override."""
    MOCK_AUDIT_LOGS.clear()
    MOCK_FINDINGS.clear()
    MOCK_BIDDERS.clear()
    MOCK_DECISIONS.clear()

    async def override_get_db_session():
        session = MockAuditSession()
        yield session

    app.dependency_overrides[get_db_session] = override_get_db_session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# ===========================================================================
# 1. Normal Chain Tests
# ===========================================================================

def test_hasher_compute_audit_hash_deterministic():
    """Verify hash computation is pure, deterministic, and serializes datetimes/UUIDs."""
    prev = GENESIS_HASH
    payload = {
        "action": "CREATE_TENDER",
        "actor": "officer-01",
        "timestamp": "2026-09-04T00:00:00Z",
        "entity": "tender:t-01",
        "previous_state": None,
        "new_state": {"status": "ACTIVE"},
        "reason": "Initial tender creation",
        "evidence_reference": None,
    }

    hash1 = compute_audit_hash(prev, payload)
    hash2 = compute_audit_hash(prev, payload)
    assert hash1 == hash2
    assert len(hash1) == 64

    # Different payload must produce different hash
    alt_payload = dict(payload, reason="Alternative reason")
    hash3 = compute_audit_hash(prev, alt_payload)
    assert hash1 != hash3


def test_normal_chain_verification():
    """Verify a valid multi-step hash-chain passes verification."""
    prev = GENESIS_HASH
    events = []

    actions = [
        ("CREATE_TENDER", "tender", "t-001"),
        ("CREATE_BIDDER", "bidder", "b-001"),
        ("UPLOAD_DOCUMENT", "document", "d-001"),
        ("DECISION_ACCEPT", "finding", "f-001"),
    ]

    for idx, (action, target_type, target_id) in enumerate(actions, start=1):
        payload = {
            "seq": idx,
            "action": action,
            "target_type": target_type,
            "target_id": target_id,
            "reason": f"Execution of {action}",
        }
        curr = compute_audit_hash(prev, payload)
        events.append({
            "seq": idx,
            "prev_hash": prev,
            "curr_hash": curr,
            "payload": payload,
        })
        prev = curr

    ok, length, broken_seq = verify_chain(events)
    assert ok is True
    assert length == 4
    assert broken_seq is None

    full_res = verify_chain_full(events)
    assert full_res["ok"] is True
    assert full_res["length"] == 4
    assert full_res["first_broken_seq"] is None
    assert full_res["head_hash"] == events[-1]["curr_hash"]
    assert get_chain_head(events) == events[-1]["curr_hash"]


# ===========================================================================
# 2. Tampered Event Tests
# ===========================================================================

def test_tampered_event_payload_detected():
    """Verify tampering any event's payload breaks the chain at that exact sequence."""
    prev = GENESIS_HASH
    events = []

    for i in range(1, 5):
        payload = {"seq": i, "action": f"ACTION_{i}", "value": i * 100}
        curr = compute_audit_hash(prev, payload)
        events.append({
            "seq": i,
            "prev_hash": prev,
            "curr_hash": curr,
            "payload": payload,
        })
        prev = curr

    # Baseline: verify intact
    assert verify_chain(events)[0] is True

    # Tamper event 2 payload
    events[1]["payload"]["value"] = 9999

    ok, length, broken_seq = verify_chain(events)
    assert ok is False
    assert length == 4
    assert broken_seq == 2

    full_res = verify_chain_full(events)
    assert full_res["ok"] is False
    assert full_res["first_broken_seq"] == 2


def test_tampered_first_event_detected():
    """Verify tampering the genesis/first event is detected at sequence 1."""
    prev = GENESIS_HASH
    events = []

    for i in range(1, 4):
        payload = {"seq": i, "action": f"ACT_{i}"}
        curr = compute_audit_hash(prev, payload)
        events.append({
            "seq": i,
            "prev_hash": prev,
            "curr_hash": curr,
            "payload": payload,
        })
        prev = curr

    # Tamper first event
    events[0]["payload"]["action"] = "TAMPERED_ACTION"

    ok, length, broken_seq = verify_chain(events)
    assert ok is False
    assert broken_seq == 1


# ===========================================================================
# 3. Broken Previous Hash Tests
# ===========================================================================

def test_broken_previous_hash_detected():
    """Verify modifying prev_hash (simulating row deletion or out-of-order insert) breaks chain."""
    prev = GENESIS_HASH
    events = []

    for i in range(1, 5):
        payload = {"seq": i, "action": f"STEP_{i}"}
        curr = compute_audit_hash(prev, payload)
        events.append({
            "seq": i,
            "prev_hash": prev,
            "curr_hash": curr,
            "payload": payload,
        })
        prev = curr

    # Corrupt prev_hash of event 3
    events[2]["prev_hash"] = "f" * 64

    ok, length, broken_seq = verify_chain(events)
    assert ok is False
    assert broken_seq == 3

    full_res = verify_chain_full(events)
    assert full_res["ok"] is False
    assert full_res["first_broken_seq"] == 3


def test_missing_event_causes_broken_previous_hash():
    """Simulate deletion of event 2: event 3 points to deleted event 2's hash, but previous is event 1."""
    prev = GENESIS_HASH
    events = []

    for i in range(1, 4):
        payload = {"seq": i, "step": i}
        curr = compute_audit_hash(prev, payload)
        events.append({
            "seq": i,
            "prev_hash": prev,
            "curr_hash": curr,
            "payload": payload,
        })
        prev = curr

    # Delete event 2 from sequence
    deleted_chain = [events[0], events[2]]

    ok, length, broken_seq = verify_chain(deleted_chain)
    assert ok is False
    assert broken_seq == 3


# ===========================================================================
# 4. Valid Chain & Edge Cases
# ===========================================================================

def test_empty_chain_is_valid():
    """Empty chain is trivially valid with length 0 and GENESIS_HASH head."""
    ok, length, broken_seq = verify_chain([])
    assert ok is True
    assert length == 0
    assert broken_seq is None

    full_res = verify_chain_full([])
    assert full_res["ok"] is True
    assert full_res["length"] == 0
    assert full_res["head_hash"] == GENESIS_HASH
    assert get_chain_head([]) == GENESIS_HASH


def test_single_event_valid_chain():
    """Single event with GENESIS_HASH previous hash is valid."""
    payload = {"seq": 1, "action": "INIT"}
    curr = compute_audit_hash(GENESIS_HASH, payload)
    event = [{"seq": 1, "prev_hash": GENESIS_HASH, "curr_hash": curr, "payload": payload}]

    ok, length, broken = verify_chain(event)
    assert ok is True
    assert length == 1
    assert broken is None
    assert get_chain_head(event) == curr


# ===========================================================================
# 5. Database Service Layer Tests (In-Memory Session)
# ===========================================================================

@pytest.mark.asyncio
async def test_audit_service_record_event_and_chain_continuity():
    """Verify AuditService records events with correct hash-chaining and queries them."""
    MOCK_AUDIT_LOGS.clear()
    session = MockAuditSession()
    t_id = str(uuid.uuid4())
    actor_id = uuid.uuid4()

    # Record event 1
    e1 = await AuditService.record_event(
        session=session,
        action="CREATE_TENDER",
        target_type="tender",
        target_id=t_id,
        actor_id=actor_id,
        role="officer",
        previous_state=None,
        new_state={"status": "ACTIVE"},
        reason="Test tender creation",
        evidence_reference=None,
    )

    assert e1.seq == 1
    assert e1.prev_hash == GENESIS_HASH
    assert e1.curr_hash is not None
    assert len(e1.curr_hash) == 64

    # Record event 2
    e2 = await AuditService.record_event(
        session=session,
        action="UPLOAD_DOCUMENT",
        target_type="document",
        target_id=str(uuid.uuid4()),
        actor_id=actor_id,
        role="officer",
        previous_state=None,
        new_state={"filename": "GST.pdf"},
        reason="Uploaded GST certificate",
        evidence_reference="sha256:abc123",
        payload={"tender_id": t_id},
    )

    # Verify chaining: e2.prev_hash must be e1.curr_hash
    assert e2.prev_hash == e1.curr_hash
    assert e2.seq == 2

    # Verify DB chain
    verify_res = await AuditService.verify_chain(session)
    assert verify_res["ok"] is True
    assert verify_res["length"] == 2
    assert verify_res["first_broken_seq"] is None
    assert verify_res["head_hash"] == e2.curr_hash

    # Verify head hash method
    head = await AuditService.get_chain_head(session)
    assert head == e2.curr_hash

    # Verify audit trail query
    trail = await AuditService.get_audit_trail(session, tender_id=uuid.UUID(t_id))
    assert len(trail) >= 1
    actions = [x.action for x in trail]
    assert "CREATE_TENDER" in actions


@pytest.mark.asyncio
async def test_audit_service_db_tamper_detection():
    """Verify tampering with a row in the audit log is caught by verify_chain."""
    MOCK_AUDIT_LOGS.clear()
    session = MockAuditSession()

    # Record 3 events
    e1 = await AuditService.record_event(
        session=session,
        action="EVENT_1",
        target_type="test",
        target_id="id-1",
        reason="Initial",
    )
    e2 = await AuditService.record_event(
        session=session,
        action="EVENT_2",
        target_type="test",
        target_id="id-2",
        reason="Legitimate",
    )
    e3 = await AuditService.record_event(
        session=session,
        action="EVENT_3",
        target_type="test",
        target_id="id-3",
        reason="Third",
    )

    # Verify chain passes before tampering
    res_before = await AuditService.verify_chain(session)
    assert res_before["ok"] is True
    assert res_before["length"] == 3

    # Tamper event 2 payload in-memory
    MOCK_AUDIT_LOGS[1].payload["reason"] = "MALICIOUSLY_ALTERED_REASON"

    # Chain verification must now fail on sequence 2!
    res_after = await AuditService.verify_chain(session)
    assert res_after["ok"] is False
    assert res_after["first_broken_seq"] == 2


# ===========================================================================
# 6. REST API Endpoints Tests
# ===========================================================================

def test_api_audit_verify_get(audit_client):
    """GET /api/v1/audit/verify verifies database audit chain."""
    token = create_access_token(subject=str(DEV_USERS[2]["id"]), role="auditor")
    headers = {"Authorization": f"Bearer {token}"}

    resp = audit_client.get("/api/v1/audit/verify", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "ok" in data
    assert "length" in data
    assert "head_hash" in data
    assert data["ok"] is True


def test_api_audit_verify_post_valid_payload(audit_client):
    """POST /api/v1/audit/verify with valid custom chain payload."""
    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    headers = {"Authorization": f"Bearer {token}"}

    prev = GENESIS_HASH
    payload1 = {"seq": 1, "action": "ACT_1", "reason": "Test"}
    curr1 = compute_audit_hash(prev, payload1)

    payload2 = {"seq": 2, "action": "ACT_2", "reason": "Test 2"}
    curr2 = compute_audit_hash(curr1, payload2)

    events_payload = [
        {"seq": 1, "prev_hash": prev, "curr_hash": curr1, "payload": payload1},
        {"seq": 2, "prev_hash": curr1, "curr_hash": curr2, "payload": payload2},
    ]

    resp = audit_client.post("/api/v1/audit/verify", json=events_payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is True
    assert data["length"] == 2
    assert data["first_broken_seq"] is None
    assert data["head_hash"] == curr2


def test_api_audit_verify_post_tampered_payload(audit_client):
    """POST /api/v1/audit/verify with tampered payload detects invalid chain."""
    token = create_access_token(subject=str(DEV_USERS[3]["id"]), role="admin")
    headers = {"Authorization": f"Bearer {token}"}

    prev = GENESIS_HASH
    payload1 = {"seq": 1, "action": "ACT_1"}
    curr1 = compute_audit_hash(prev, payload1)

    payload2 = {"seq": 2, "action": "ACT_2"}
    curr2 = compute_audit_hash(curr1, payload2)

    # Tamper payload2 without updating curr_hash
    tampered_payload = [
        {"seq": 1, "prev_hash": prev, "curr_hash": curr1, "payload": payload1},
        {"seq": 2, "prev_hash": curr1, "curr_hash": curr2, "payload": {"seq": 2, "action": "FORGED"}},
    ]

    resp = audit_client.post("/api/v1/audit/verify", json=tampered_payload, headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["ok"] is False
    assert data["first_broken_seq"] == 2


def test_api_global_audit_trail(audit_client):
    """GET /api/v1/audit/trail returns audit events."""
    token = create_access_token(subject=str(DEV_USERS[2]["id"]), role="vigilance")
    headers = {"Authorization": f"Bearer {token}"}

    # Add a mock entry to list
    entry = AuditLog(
        seq=1,
        ts=datetime.now(timezone.utc),
        role="officer",
        action="TEST_ACTION",
        target_type="tender",
        target_id="t-1",
        prev_hash=GENESIS_HASH,
        curr_hash=compute_audit_hash(GENESIS_HASH, {"test": 1}),
        payload={"test": 1},
    )
    MOCK_AUDIT_LOGS.append(entry)

    resp = audit_client.get("/api/v1/audit/trail?limit=10", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["action"] == "TEST_ACTION"


def test_api_tender_audit_trail(audit_client):
    """GET /api/v1/tenders/{id}/audit returns audit events for a tender."""
    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    headers = {"Authorization": f"Bearer {token}"}
    fake_tender_id = str(uuid.uuid4())

    entry = AuditLog(
        seq=1,
        ts=datetime.now(timezone.utc),
        role="officer",
        action="CREATE_TENDER",
        target_type="tender",
        target_id=fake_tender_id,
        prev_hash=GENESIS_HASH,
        curr_hash=compute_audit_hash(GENESIS_HASH, {"tender": 1}),
        payload={"tender": 1},
    )
    MOCK_AUDIT_LOGS.append(entry)

    resp = audit_client.get(f"/api/v1/tenders/{fake_tender_id}/audit", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, list)
    assert len(data) >= 1


# ===========================================================================
# 7. Finding Decision Audit Logging Integration
# ===========================================================================

def test_finding_decision_produces_audit_event(audit_client):
    """Verify recording an officer decision updates finding and logs an audit event."""
    bidder_id = uuid.uuid4()
    finding_id = uuid.uuid4()

    finding = Finding(
        id=finding_id,
        bidder_id=bidder_id,
        rule_id="R-TEST-01",
        rule_version="1.0",
        status="REVIEW",
        title="Test Finding for Decision Audit",
        explanation="Initial test finding explanation",
        evidence=[{"quote": "Test quote"}],
    )
    MOCK_FINDINGS[finding_id] = finding

    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    headers = {"Authorization": f"Bearer {token}"}

    # Post decision
    decision_payload = {
        "action": "OVERRIDE",
        "reason": "Document verified offline via physical statutory registrar copy.",
    }
    resp = audit_client.post(
        f"/api/v1/findings/{finding_id}/decision",
        json=decision_payload,
        headers=headers,
    )
    assert resp.status_code == 200
    dec_data = resp.json()
    assert dec_data["action"] == "OVERRIDE"
    assert dec_data["resulting_status"] == "PASS"

    # Verify finding status updated
    assert finding.status == "PASS"

    # Verify audit event recorded in MOCK_AUDIT_LOGS
    assert len(MOCK_AUDIT_LOGS) >= 1
    decision_event = MOCK_AUDIT_LOGS[-1]
    assert decision_event.action == "DECISION_OVERRIDE"
    assert decision_event.target_type == "finding"
    assert decision_event.target_id == str(finding_id)
    assert decision_event.payload["previous_state"]["status"] == "REVIEW"
    assert decision_event.payload["new_state"]["status"] == "PASS"
    assert decision_event.payload["reason"] == decision_payload["reason"]
    assert decision_event.curr_hash is not None

    # Verify full chain integrity remains valid
    ok, length, broken = verify_chain([
        {"seq": e.seq, "prev_hash": e.prev_hash, "curr_hash": e.curr_hash, "payload": e.payload}
        for e in MOCK_AUDIT_LOGS
    ])
    assert ok is True
