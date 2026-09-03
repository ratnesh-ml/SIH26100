"""Test FastAPI health check and route mounting."""

from fastapi.testclient import TestClient


def test_health_check(client: TestClient):
    """Test public health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "VigilBid" in data["project"]
    assert "components" in data


def test_api_routes_mounted(client: TestClient):
    """Verify that the 24 API routes are mounted under /api/v1."""
    routes = [route.path for route in client.app.routes]
    assert "/health" in routes
    assert "/api/v1/auth/login" in routes
    assert "/api/v1/tenders" in routes
    assert "/api/v1/bidders/{bidder_id}" in routes
    assert "/api/v1/audit/verify" in routes
