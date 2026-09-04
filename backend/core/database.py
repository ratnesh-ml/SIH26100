"""Database Engine, Session Management, and Health Probing for VigilBid."""

import time
import logging
from typing import Any, AsyncGenerator
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from backend.core.config import settings
from backend.models.base import Base

logger = logging.getLogger(__name__)

# Global Async Engine instance
_async_engine: AsyncEngine | None = None
_async_session_maker: async_sessionmaker[AsyncSession] | None = None


def get_async_engine() -> AsyncEngine:
    """Initialize or return existing SQLAlchemy async engine."""
    global _async_engine
    if _async_engine is None:
        db_url = settings.DATABASE_URL
        # Configure engine based on driver
        is_sqlite = db_url.startswith("sqlite")
        engine_kwargs: dict[str, Any] = {
            "echo": False,
            "future": True,
        }
        if not is_sqlite:
            engine_kwargs.update({
                "pool_size": 10,
                "max_overflow": 20,
                "pool_pre_ping": True,
                "pool_recycle": 3600,
            })
        _async_engine = create_async_engine(db_url, **engine_kwargs)
    return _async_engine


def reconfigure_engine(new_url: str) -> AsyncEngine:
    """Reconfigure the global engine with a new connection string."""
    global _async_engine, _async_session_maker
    if _async_engine is not None:
        try:
            _async_engine.sync_engine.dispose()
        except Exception:
            pass
    _async_engine = None
    _async_session_maker = None
    settings.DATABASE_URL = new_url
    return get_async_engine()


def get_session_maker() -> async_sessionmaker[AsyncSession]:
    """Return configured async session factory."""
    global _async_session_maker
    if _async_session_maker is None:
        engine = get_async_engine()
        _async_session_maker = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
    return _async_session_maker


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an isolated async database session."""
    session_maker = get_session_maker()
    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def check_database_connection() -> dict[str, Any]:
    """Probes database with SELECT 1 and measures round-trip latency."""
    engine = get_async_engine()
    start_time = time.perf_counter()
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        driver_name = engine.dialect.name
        return {
            "connected": True,
            "dialect": driver_name,
            "latency_ms": latency_ms,
            "error": None,
        }
    except Exception as exc:
        return {
            "connected": False,
            "dialect": engine.dialect.name if engine else "unknown",
            "latency_ms": None,
            "error": str(exc),
        }


async def init_database_tables():
    """Bootstrap tables defined on Base.metadata."""
    engine = get_async_engine()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables initialized successfully.")
