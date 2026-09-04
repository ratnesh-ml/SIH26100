"""Pytest fixtures for VigilBid test suites."""

import pytest
from fastapi.testclient import TestClient
from backend.main import app


@pytest.fixture
def client():
    """FastAPI test client fixture."""
    return TestClient(app)


@pytest.fixture(autouse=True)
def reset_rate_limiters():
    """Reset rate limiter state before each test to ensure test isolation."""
    from backend.core.rate_limit import auth_login_limiter, general_api_limiter
    auth_login_limiter.reset()
    general_api_limiter.reset()
    yield
    auth_login_limiter.reset()
    general_api_limiter.reset()
