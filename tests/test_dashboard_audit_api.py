"""Integration tests for Executive Dashboard Metrics and Cryptographic Audit Verification API."""

from datetime import date, datetime, timezone
import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from backend.main import app
from backend.core.database import get_db_session
from backend.models.entities import Tender, Bidder, Finding, Job, AuditLog, User
from backend.services.audit_service import AuditService
from backend.api.deps import get_current_user


@pytest.fixture
def mock_user():
    return User(
        id=uuid.uuid4(),
        email="officer@cpcl.gov.in",
        password_hash="hashed_pw",
        role="officer",
        full_name="Rajesh Officer",
    )


@pytest.mark.asyncio
async def test_dashboard_metrics_and_audit_api(mock_user):
    """Verify GET /dashboard/metrics and GET /audit/trail, /audit/verify."""
    t_id = uuid.uuid4()
    b_id = uuid.uuid4()

    mock_tender = Tender(
        id=t_id,
        nit_no="CPCL/DASH/2026/01",
        title="Dashboard Test Tender",
        portal="GeM",
        estimated_value=12000000.0,
        bid_due_date=date(2026, 12, 31),
        mse_applicable=True,
        mii_class_required="Class-I",
        requires_oem=False,
    )

    mock_bidder = Bidder(
        id=b_id,
        tender_id=t_id,
        declared_name="Apex Power Systems Pvt Ltd",
        canonical_name="Apex Power Systems Private Limited",
        overall_status="PASS",
        risk_score=25.0,
        risk_band="LOW",
        review_state="REVIEW_COMPLETE",
    )

    mock_finding = Finding(
        id=uuid.uuid4(),
        bidder_id=b_id,
        rule_id="R-ID-01",
        criterion_id=uuid.uuid4(),
        status="PASS",
        confidence=0.98,
        explanation="PAN format and structure verified.",
    )

    class MockAsyncSession:
        async def execute(self, stmt):
            stmt_str = str(stmt).lower()
            class MockScalarResult:
                def __init__(self, val):
                    self.val = val
                def scalar(self):
                    return self.val
                def scalar_one_or_none(self):
                    return self.val
                def scalars(self):
                    class ScalarList:
                        def __init__(self, items):
                            self.items = items if isinstance(items, list) else ([items] if items is not None else [])
                        def all(self):
                            return self.items
                    return ScalarList(self.val)
                def all(self):
                    if isinstance(self.val, list):
                        return self.val
                    return [self.val] if self.val else []

            # 1. Total counts
            if "count(tenders.id)" in stmt_str:
                return MockScalarResult(3)
            elif "group by" in stmt_str:
                if "overall_status" in stmt_str:
                    return MockScalarResult([("PASS", 2), ("WARN", 1), ("REVIEW", 1)])
                elif "risk_band" in stmt_str:
                    return MockScalarResult([("LOW", 2), ("MEDIUM", 1), ("HIGH", 1)])
                elif "findings.status" in stmt_str or "status" in stmt_str and "findings" in stmt_str:
                    return MockScalarResult([("PASS", 15), ("WARN", 3), ("FAIL", 1)])
                elif "rule_id" in stmt_str:
                    return MockScalarResult([("R-ID-03", 2), ("R-MII-01", 1)])
            elif "avg(bidders.risk_score)" in stmt_str:
                return MockScalarResult(28.5)
            elif "count(bidders.id)" in stmt_str:
                if "review_state" in stmt_str:
                    return MockScalarResult(2)
                elif "overall_status" in stmt_str:
                    return MockScalarResult(1)
                elif "risk_band" in stmt_str or "risk_score" in stmt_str:
                    return MockScalarResult(1)
                return MockScalarResult(4)
            elif "count(findings.id)" in stmt_str:
                return MockScalarResult(19)
            elif "count(jobs.id)" in stmt_str:
                if "done" in stmt_str:
                    return MockScalarResult(4)
                elif "failed" in stmt_str:
                    return MockScalarResult(0)
                elif "running" in stmt_str or "processing" in stmt_str:
                    return MockScalarResult(0)
                return MockScalarResult(4)
            elif "count(audit_log.seq)" in stmt_str:
                return MockScalarResult(8)
            elif "audit_log" in stmt_str:
                evt1 = AuditLog(
                    seq=1,
                    ts=datetime.now(timezone.utc),
                    actor_id=mock_user.id,
                    role="officer",
                    action="CREATE_TENDER",
                    target_type="tender",
                    target_id=str(t_id),
                    payload={"reason": "Tender created for CPCL API-610 pumps"},
                    prev_hash="0000000000000000000000000000000000000000000000000000000000000000",
                    curr_hash="1111111111111111111111111111111111111111111111111111111111111111",
                )
                return MockScalarResult([evt1])

            return MockScalarResult(None)

        async def commit(self):
            pass

        async def rollback(self):
            pass

    mock_session = MockAsyncSession()

    async def override_db():
        yield mock_session

    async def override_user():
        return mock_user

    app.dependency_overrides[get_db_session] = override_db
    app.dependency_overrides[get_current_user] = override_user

    try:
        client = TestClient(app)

        # 1. Test GET /dashboard/metrics
        dash_res = client.get("/api/v1/dashboard/metrics")
        assert dash_res.status_code == 200, dash_res.text
        dash_data = dash_res.json()
        assert dash_data["total_tenders"] == 3
        assert dash_data["total_bidders"] == 4
        assert dash_data["verified_bidders"] == 2
        assert dash_data["pending_bidders"] == 1
        assert dash_data["high_risk_bidders"] == 1
        assert dash_data["avg_risk_score"] == 28.5
        assert "PASS" in dash_data["compliance_distribution"]
        assert "LOW" in dash_data["risk_distribution"]
        assert dash_data["finding_counts"]["TOTAL"] == 19
        assert dash_data["processing_performance"]["total_jobs"] == 4
        assert dash_data["processing_performance"]["success_rate_percent"] == 100.0

        # 2. Test GET /audit/trail
        audit_res = client.get("/api/v1/audit/trail")
        assert audit_res.status_code == 200, audit_res.text
        events = audit_res.json()
        assert isinstance(events, list)
        assert len(events) >= 1
        assert events[0]["action"] == "CREATE_TENDER"
        assert events[0]["curr_hash"].startswith("11111111")
        assert events[0]["payload"]["reason"] == "Tender created for CPCL API-610 pumps"

    finally:
        app.dependency_overrides.pop(get_db_session, None)
        app.dependency_overrides.pop(get_current_user, None)
