"""Test database engine, sessionmaker, and connection probing."""

import pytest
from backend.core.database import (
    get_async_engine,
    get_session_maker,
    check_database_connection,
)


def test_engine_initialization():
    """Verify engine and sessionmaker can be initialized with configured URL."""
    engine = get_async_engine()
    assert engine is not None
    assert engine.dialect.name == "postgresql"

    session_maker = get_session_maker()
    assert session_maker is not None


@pytest.mark.asyncio
async def test_database_connection_probe_structure():
    """Verify probe returns structured status dictionary with required keys."""
    status = await check_database_connection()
    assert isinstance(status, dict)
    assert "connected" in status
    assert "dialect" in status
    assert "latency_ms" in status
    assert "error" in status
