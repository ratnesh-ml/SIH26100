"""Comprehensive Test Suite for Synthetic Government Registry Simulator and Failure Demo Engine.

Validates:
- Explicit scenario execution (NORMAL, MISMATCH, EXPIRED, NOT_FOUND, API_UNAVAILABLE, DEBARRED).
- Source labeling invariant: All results MUST clearly state 'DEMO / Simulated'.
- Statutory failure handling: API_UNAVAILABLE (503) NEVER marks compliant; sets REVIEW / PENDING_VERIFICATION.
- Token suffix triggers (_UNAVAILABLE, _MISMATCH, _EXPIRED, _NOTFOUND, _DEBARRED).
- Demo failure chaos simulator modes (OCR_FAILURE, REGISTRY_TIMEOUT, MISSING_DOCUMENT, MALFORMED_PDF, MISMATCHED_IDENTITY).
- API routes for scenarios and failure simulation.
"""

import pytest
import uuid
from httpx import ASGITransport, AsyncClient

from backend.api.deps import get_current_user
from backend.core.security import create_access_token
from backend.main import app
from backend.models.entities import User
from pipeline.compliance.cross_verifier import CrossDocumentVerifier
from pipeline.demo.chaos_simulator import ChaosSimulator, FailureMode
from pipeline.registry_adapters.base import RegistryScenario
from pipeline.registry_adapters.mock_adapter import MockRegistryProvider


# =============================================================================
# 1. Simulator Deterministic Scenario Tests (GST, PAN, Udyam, CIN, Debarment)
# =============================================================================

@pytest.mark.asyncio
async def test_simulator_gstin_scenarios():
    provider = MockRegistryProvider(simulate_latency=False)
    gstin = "33AABCC1234F1Z5"

    # 1. NORMAL scenario (from fixture)
    res_normal = await provider.verify_gstin(gstin, scenario=RegistryScenario.NORMAL)
    assert res_normal.found is True
    assert res_normal.status == "ACTIVE"
    assert "DEMO" in res_normal.source
    assert res_normal.data["legal_name"] == "APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED"

    # 2. MISMATCH scenario
    res_mismatch = await provider.verify_gstin(gstin, scenario=RegistryScenario.MISMATCH)
    assert res_mismatch.found is True
    assert "DIVERGENT" in res_mismatch.data["legal_name"] or "DIFFERENT" in res_mismatch.data["legal_name"]
    assert "DEMO" in res_mismatch.source

    # 3. EXPIRED scenario
    res_expired = await provider.verify_gstin(gstin, scenario=RegistryScenario.EXPIRED)
    assert res_expired.found is True
    assert res_expired.status == "CANCELLED"
    assert "cancellation_date" in res_expired.data

    # 4. NOT_FOUND scenario
    res_not_found = await provider.verify_gstin(gstin, scenario=RegistryScenario.NOT_FOUND)
    assert res_not_found.found is False
    assert res_not_found.status == "NOT_FOUND"

    # 5. API_UNAVAILABLE scenario (503 Service Unavailable)
    res_unavail = await provider.verify_gstin(gstin, scenario=RegistryScenario.API_UNAVAILABLE)
    assert res_unavail.found is False
    assert res_unavail.status == "API_UNAVAILABLE"
    assert "503" in res_unavail.data["error"]


@pytest.mark.asyncio
async def test_simulator_pan_scenarios():
    provider = MockRegistryProvider(simulate_latency=False)
    pan = "AABCC1234F"

    # 1. NORMAL
    res_normal = await provider.verify_pan(pan, scenario=RegistryScenario.NORMAL)
    assert res_normal.found is True
    assert res_normal.status == "VALID"
    assert "DEMO" in res_normal.source

    # 2. MISMATCH
    res_mismatch = await provider.verify_pan(pan, scenario=RegistryScenario.MISMATCH)
    assert res_mismatch.found is True
    assert "DIVERGENT" in res_mismatch.data["name"]

    # 3. EXPIRED (INOPERATIVE)
    res_expired = await provider.verify_pan(pan, scenario=RegistryScenario.EXPIRED)
    assert res_expired.found is True
    assert res_expired.status == "INOPERATIVE"
    assert "inoperative" in res_expired.data["message"].lower()

    # 4. NOT_FOUND
    res_nf = await provider.verify_pan(pan, scenario=RegistryScenario.NOT_FOUND)
    assert res_nf.found is False
    assert res_nf.status == "NOT_FOUND"

    # 5. API_UNAVAILABLE
    res_unavail = await provider.verify_pan(pan, scenario=RegistryScenario.API_UNAVAILABLE)
    assert res_unavail.found is False
    assert res_unavail.status == "API_UNAVAILABLE"


@pytest.mark.asyncio
async def test_simulator_udyam_and_cin_scenarios():
    provider = MockRegistryProvider(simulate_latency=False)
    udyam_no = "UDYAM-TN-01-0012345"
    cin = "U29100TN2012PTC085412"

    # Udyam unavailable
    res_u_unavail = await provider.verify_udyam(udyam_no, scenario=RegistryScenario.API_UNAVAILABLE)
    assert res_u_unavail.found is False
    assert res_u_unavail.status == "API_UNAVAILABLE"

    # CIN unavailable
    res_c_unavail = await provider.verify_cin(cin, scenario=RegistryScenario.API_UNAVAILABLE)
    assert res_c_unavail.found is False
    assert res_c_unavail.status == "API_UNAVAILABLE"


@pytest.mark.asyncio
async def test_simulator_debarment_scenarios():
    provider = MockRegistryProvider(simulate_latency=False)

    # 1. DEBARRED explicit
    res_deb = await provider.check_debarment(pan="AABCC1234F", scenario=RegistryScenario.DEBARRED)
    assert res_deb.found is True
    assert res_deb.status == "DEBARRED"
    assert res_deb.data["debarred"] is True

    # 2. API_UNAVAILABLE
    res_unavail = await provider.check_debarment(pan="AABCC1234F", scenario=RegistryScenario.API_UNAVAILABLE)
    assert res_unavail.found is False
    assert res_unavail.status == "API_UNAVAILABLE"


# =============================================================================
# 2. Token Suffix Trigger Tests
# =============================================================================

@pytest.mark.asyncio
async def test_token_suffix_trigger_detection():
    provider = MockRegistryProvider(simulate_latency=False)

    # Input with suffix triggers
    res_unavail = await provider.verify_gstin("33AABCC1234F1Z5_UNAVAILABLE")
    assert res_unavail.status == "API_UNAVAILABLE"

    res_mismatch = await provider.verify_pan("AABCC1234F_MISMATCH")
    assert res_mismatch.status == "VALID"
    assert "DIVERGENT" in res_mismatch.data["name"]

    res_expired = await provider.verify_gstin("33AABCC1234F1Z5_EXPIRED")
    assert res_expired.status == "CANCELLED"

    res_notfound = await provider.verify_udyam("UDYAM-TN-01-0012345_NOTFOUND")
    assert res_notfound.status == "NOT_FOUND"


# =============================================================================
# 3. Non-Compliance Invariant: Registry Unavailable Withholds Compliance
# =============================================================================

@pytest.mark.asyncio
async def test_unavailable_registry_never_grants_compliance():
    provider = MockRegistryProvider(simulate_latency=False)
    verifier = CrossDocumentVerifier()

    # When GST portal returns 503 API_UNAVAILABLE
    findings = await verifier.verify_identity_against_registry(
        registry_provider=provider,
        gstin="33AABCC1234F1Z5_UNAVAILABLE",
        pan="AABCC1234F_UNAVAILABLE",
    )

    assert len(findings) >= 2
    gst_finding = next(f for f in findings if f.check_id == "XDOC-REG-GST-01")
    pan_finding = next(f for f in findings if f.check_id == "XDOC-REG-PAN-01")

    # Invariant: Must NOT be PASS
    assert gst_finding.status == "REVIEW"
    assert gst_finding.actual_values["status"] == "API_UNAVAILABLE"
    assert "PENDING_VERIFICATION" in gst_finding.explanation
    assert "Compliance cannot be automatically granted" in gst_finding.explanation

    assert pan_finding.status == "REVIEW"
    assert pan_finding.actual_values["status"] == "API_UNAVAILABLE"
    assert "PENDING_VERIFICATION" in pan_finding.explanation


# =============================================================================
# 4. Chaos Demo Failure Engine Modes
# =============================================================================

def test_chaos_simulator_all_modes():
    modes = ChaosSimulator.list_failure_modes()
    assert len(modes) == 5

    # 1. OCR Failure
    sim_ocr = ChaosSimulator.simulate_failure(FailureMode.OCR_FAILURE)
    assert sim_ocr.failure_mode == "OCR_FAILURE"
    assert sim_ocr.system_status == "REVIEW"
    assert sim_ocr.compliance_granted is False
    assert "DEMO" in sim_ocr.disclaimer

    # 2. Registry Timeout
    sim_to = ChaosSimulator.simulate_failure(FailureMode.REGISTRY_TIMEOUT)
    assert sim_to.failure_mode == "REGISTRY_TIMEOUT"
    assert sim_to.system_status == "PENDING_VERIFICATION"
    assert sim_to.compliance_granted is False
    assert sim_to.graceful_handling["auto_compliance_withheld"] is True

    # 3. Missing Document
    sim_md = ChaosSimulator.simulate_failure(FailureMode.MISSING_DOCUMENT)
    assert sim_md.failure_mode == "MISSING_DOCUMENT"
    assert sim_md.system_status == "NON_COMPLIANT"
    assert sim_md.compliance_granted is False

    # 4. Malformed PDF
    sim_pdf = ChaosSimulator.simulate_failure(FailureMode.MALFORMED_PDF)
    assert sim_pdf.failure_mode == "MALFORMED_PDF"
    assert sim_pdf.system_status == "QUARANTINED"
    assert sim_pdf.compliance_granted is False
    assert sim_pdf.graceful_handling["crash_prevented"] is True

    # 5. Mismatched Identity
    sim_id = ChaosSimulator.simulate_failure(FailureMode.MISMATCHED_IDENTITY)
    assert sim_id.failure_mode == "MISMATCHED_IDENTITY"
    assert sim_id.system_status == "ANOMALY_DETECTED"
    assert sim_id.compliance_granted is False


# =============================================================================
# 5. REST API Endpoints for Registry Scenarios & Chaos Simulation
# =============================================================================

@pytest.fixture
def override_user():
    officer_user = User(
        id=uuid.uuid4(),
        email="officer@cpcl.in",
        role="officer",
        full_name="Sim Test Officer",
    )
    app.dependency_overrides[get_current_user] = lambda: officer_user
    yield officer_user
    app.dependency_overrides.clear()


@pytest.fixture
def officer_auth_headers(override_user):
    token = create_access_token(subject=str(override_user.id), role="officer")
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_api_registry_scenarios_and_chaos_endpoints(officer_auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. GET /api/v1/registry/scenarios
        r_scenarios = await ac.get("/api/v1/registry/scenarios", headers=officer_auth_headers)
        assert r_scenarios.status_code == 200
        data_scenarios = r_scenarios.json()
        assert len(data_scenarios["scenarios"]) == 6
        assert "DEMO" in data_scenarios["disclaimer"]

        # 2. GET /api/v1/demo/failure-modes
        r_modes = await ac.get("/api/v1/demo/failure-modes", headers=officer_auth_headers)
        assert r_modes.status_code == 200
        assert len(r_modes.json()["modes"]) == 5

        # 3. POST /api/v1/demo/simulate-failure (Registry Timeout)
        r_sim = await ac.post(
            "/api/v1/demo/simulate-failure",
            json={"failure_mode": "REGISTRY_TIMEOUT", "context": {"registry": "GST Registry — DEMO"}},
            headers=officer_auth_headers,
        )
        assert r_sim.status_code == 200
        data_sim = r_sim.json()
        assert data_sim["system_status"] == "PENDING_VERIFICATION"
        assert data_sim["compliance_granted"] is False

        # 4. GET /api/v1/registry/gstin/33AABCC1234F1Z5?scenario=API_UNAVAILABLE
        r_gst_unavail = await ac.get(
            "/api/v1/registry/gstin/33AABCC1234F1Z5?scenario=API_UNAVAILABLE",
            headers=officer_auth_headers,
        )
        assert r_gst_unavail.status_code == 200
        data_gst_unavail = r_gst_unavail.json()
        assert data_gst_unavail["found"] is False
        assert data_gst_unavail["status"] == "API_UNAVAILABLE"
