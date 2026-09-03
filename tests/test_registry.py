"""Comprehensive Tests for Statutory Government Registry Abstraction and Mock Providers."""

import pytest
from httpx import ASGITransport, AsyncClient

import uuid
from backend.api.deps import get_current_user
from backend.core.security import create_access_token
from backend.main import app
from backend.models.entities import User
from pipeline.registry_adapters.base import RegistryProvider, RegistryResult
from pipeline.registry_adapters.factory import get_registry_provider
from pipeline.registry_adapters.mock_adapter import MockRegistryProvider


# =========================================================================
# 1. Standard Result Shape & Interface Contract Tests
# =========================================================================

def test_registry_result_standard_shape():
    res = RegistryResult(
        found=True,
        status="ACTIVE",
        data={"test_key": "test_val"},
        source="Simulated registry (demo)",
        latency_ms=450,
    )
    d = res.to_dict()

    # Exact required keys per specification
    assert "found" in d
    assert "status" in d
    assert "data" in d
    assert "source" in d
    assert "fetched_at" in d
    assert "latency_ms" in d

    assert d["found"] is True
    assert d["status"] == "ACTIVE"
    assert d["source"] == "Simulated registry (demo)"
    assert d["latency_ms"] == 450


# =========================================================================
# 2. Mock Registry Provider GSTIN Verifications
# =========================================================================

@pytest.mark.asyncio
async def test_mock_registry_gstin_active():
    provider = MockRegistryProvider(simulate_latency=False)
    res = await provider.verify_gstin("33AABCC1234F1Z5")

    assert res.found is True
    assert res.status == "ACTIVE"
    assert res.source == "Simulated registry (demo)"
    assert res.data["legal_name"] == "APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED"
    assert res.data["state"] == "Tamil Nadu"


@pytest.mark.asyncio
async def test_mock_registry_gstin_cancelled():
    provider = MockRegistryProvider(simulate_latency=False)
    res = await provider.verify_gstin("33AAACD9876K1Z9")

    assert res.found is True
    assert res.status == "CANCELLED"
    assert "cancellation_reason" in res.data
    assert res.data["cancellation_date"] == "2023-03-12"


@pytest.mark.asyncio
async def test_mock_registry_gstin_not_found():
    provider = MockRegistryProvider(simulate_latency=False)
    res = await provider.verify_gstin("99XXXXX0000X1Z0")

    assert res.found is False
    assert res.status == "NOT_FOUND"


# =========================================================================
# 3. Mock Registry Provider PAN Verifications
# =========================================================================

@pytest.mark.asyncio
async def test_mock_registry_pan_valid():
    provider = MockRegistryProvider(simulate_latency=False)
    res = await provider.verify_pan("AABCC1234F")

    assert res.found is True
    assert res.status == "VALID"
    assert res.data["entity_type"] == "Company"
    assert res.data["name"] == "APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED"


@pytest.mark.asyncio
async def test_mock_registry_pan_not_found():
    provider = MockRegistryProvider(simulate_latency=False)
    res = await provider.verify_pan("ZZZZZ9999Z")

    assert res.found is False
    assert res.status == "NOT_FOUND"


# =========================================================================
# 4. Mock Registry Provider Udyam MSME Verifications
# =========================================================================

@pytest.mark.asyncio
async def test_mock_registry_udyam_small_and_medium():
    provider = MockRegistryProvider(simulate_latency=False)

    # SMALL category
    res_small = await provider.verify_udyam("UDYAM-TN-01-0012345")
    assert res_small.found is True
    assert res_small.data["enterprise_type"] == "SMALL"
    assert res_small.data["major_activity"] == "MANUFACTURING"

    # MEDIUM category (ineligible for MSE EMD exemption)
    res_med = await provider.verify_udyam("UDYAM-MH-02-0044556")
    assert res_med.found is True
    assert res_med.data["enterprise_type"] == "MEDIUM"


@pytest.mark.asyncio
async def test_mock_registry_udyam_not_found():
    provider = MockRegistryProvider(simulate_latency=False)
    res = await provider.verify_udyam("UDYAM-XX-99-9999999")

    assert res.found is False
    assert res.status == "NOT_FOUND"


# =========================================================================
# 5. Mock Registry Provider MCA CIN Verifications
# =========================================================================

@pytest.mark.asyncio
async def test_mock_registry_cin_active():
    provider = MockRegistryProvider(simulate_latency=False)
    res = await provider.verify_cin("U29100TN2012PTC085412")

    assert res.found is True
    assert res.status == "ACTIVE"
    assert res.data["roc"] == "RoC-Chennai"
    assert res.data["paid_up_capital"] == 2500000.0


# =========================================================================
# 6. National Debarment / Blacklist Verifications
# =========================================================================

@pytest.mark.asyncio
async def test_mock_registry_debarment_hit_by_pan_and_name():
    provider = MockRegistryProvider(simulate_latency=False)

    # By PAN
    res_pan = await provider.check_debarment(pan="AAACD9876K")
    assert res_pan.found is True
    assert res_pan.status == "DEBARRED"
    assert res_pan.data["debarred"] is True
    assert res_pan.data["hit_count"] >= 1
    assert "CPPP/DEB/2023/881" in res_pan.data["hits"][0]["order_number"]

    # By Name
    res_name = await provider.check_debarment(name="Coromandel Engineering Works")
    assert res_name.found is True
    assert res_name.status == "DEBARRED"


@pytest.mark.asyncio
async def test_mock_registry_debarment_clear():
    provider = MockRegistryProvider(simulate_latency=False)
    res = await provider.check_debarment(pan="AABCC1234F", name="Apex Industrial Solutions")

    assert res.found is False
    assert res.status == "CLEAR"
    assert res.data["debarred"] is False
    assert res.data["hit_count"] == 0


# =========================================================================
# 7. Artificial Latency Simulation Test
# =========================================================================

@pytest.mark.asyncio
async def test_artificial_latency_simulation():
    # Configure tiny 10-30ms window to test latency execution without slowing suite
    provider = MockRegistryProvider(
        simulate_latency=True,
        min_latency_ms=10,
        max_latency_ms=30,
    )
    res = await provider.verify_gstin("33AABCC1234F1Z5")

    assert res.found is True
    assert res.latency_ms >= 10


# =========================================================================
# 8. REST API Endpoints Verification
# =========================================================================

@pytest.fixture
def override_user():
    officer_user = User(
        id=uuid.uuid4(),
        email="officer@cpcl.in",
        role="officer",
        full_name="Test Officer",
    )
    app.dependency_overrides[get_current_user] = lambda: officer_user
    yield officer_user
    app.dependency_overrides.clear()


@pytest.fixture
def officer_auth_headers(override_user):
    token = create_access_token(subject=str(override_user.id), role="officer")
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_api_registry_verification_routes(officer_auth_headers):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. GSTIN route
        r_gst = await ac.get("/api/v1/registry/gstin/33AABCC1234F1Z5", headers=officer_auth_headers)
        assert r_gst.status_code == 200
        data_gst = r_gst.json()
        assert data_gst["found"] is True
        assert data_gst["source"] == "Simulated registry (demo)"

        # 2. PAN route
        r_pan = await ac.get("/api/v1/registry/pan/AABCC1234F", headers=officer_auth_headers)
        assert r_pan.status_code == 200
        assert r_pan.json()["found"] is True

        # 3. Udyam route
        r_udy = await ac.get("/api/v1/registry/udyam/UDYAM-TN-01-0012345", headers=officer_auth_headers)
        assert r_udy.status_code == 200
        assert r_udy.json()["data"]["enterprise_type"] == "SMALL"

        # 4. Debarment route
        r_deb = await ac.get("/api/v1/registry/debarment?pan=AAACD9876K", headers=officer_auth_headers)
        assert r_deb.status_code == 200
        assert r_deb.json()["status"] == "DEBARRED"

        # 5. Unsupported kind route returns 400
        r_bad = await ac.get("/api/v1/registry/unsupported_registry/123", headers=officer_auth_headers)
        assert r_bad.status_code == 400
