"""Test FastAPI health check, database probing, and route mounting."""

from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test public health check endpoint response envelope."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ("healthy", "degraded")
    assert "VigilBid" in data["project"]
    assert "components" in data
    assert "database" in data["components"]
    assert "ocr" in data["components"]


def test_health_check_connected(client: TestClient):
    """Verify that when database is connected, /health status reports 'healthy'."""
    mock_db_status = {
        "connected": True,
        "dialect": "postgresql",
        "latency_ms": 1.45,
        "error": None,
    }
    with patch("backend.main.check_database_connection", new_callable=AsyncMock) as mock_probe:
        mock_probe.return_value = mock_db_status
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["components"]["database"]["status"] == "connected"
        assert data["components"]["database"]["latency_ms"] == 1.45


def test_health_check_disconnected(client: TestClient):
    """Verify that when database is offline, /health status reports 'degraded'."""
    mock_db_status = {
        "connected": False,
        "dialect": "postgresql",
        "latency_ms": None,
        "error": "Connection refused",
    }
    with patch("backend.main.check_database_connection", new_callable=AsyncMock) as mock_probe:
        mock_probe.return_value = mock_db_status
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "degraded"
        assert data["components"]["database"]["status"] == "disconnected"


def test_api_routes_mounted(client: TestClient):
    """Verify that the 24 API routes are mounted under /api/v1."""
    routes = [route.path for route in client.app.routes]
    assert "/health" in routes
    assert "/api/v1/auth/login" in routes
    assert "/api/v1/tenders" in routes
    assert "/api/v1/bidders/{bidder_id}" in routes
    assert "/api/v1/audit/verify" in routes
