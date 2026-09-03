"""Test database engine, sessionmaker, Alembic migrations, and user seeding."""

import os
import tempfile
import pytest
from sqlalchemy import create_engine, inspect
from sqlalchemy.orm import Session
from alembic.config import Config
from alembic import command

from backend.core.database import (
    get_async_engine,
    get_session_maker,
    check_database_connection,
)
from backend.models.base import Base
from backend.models.entities import User
from backend.core.security import verify_password
from seed.seed_users import seed_users_sync, DEV_USERS

EXPECTED_TABLES = {
    "users",
    "tenders",
    "criteria",
    "bidders",
    "bids",
    "documents",
    "document_pages",
    "extracted_fields",
    "verification_events",
    "findings",
    "anomaly_signals",
    "risk_drivers",
    "decisions",
    "bidder_links",
    "jobs",
    "audit_log",
    "reports",
    "kb_chunks",
}


def test_metadata_contains_all_18_tables():
    """Verify that SQLAlchemy metadata defines precisely the 18 locked tables."""
    table_names = set(Base.metadata.tables.keys())
    assert table_names == EXPECTED_TABLES, f"Missing tables: {EXPECTED_TABLES - table_names}"


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


def test_alembic_migration_and_user_seeding():
    """Test running Alembic upgrade head, validating tables, and seeding users in a fresh DB."""
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp_file:
        tmp_db_path = tmp_file.name

    try:
        db_url = f"sqlite:///{tmp_db_path.replace('\\', '/')}"
        
        # Configure Alembic
        cfg = Config("alembic.ini")
        cfg.set_main_option("sqlalchemy.url", db_url)
        os.environ["DATABASE_SYNC_URL"] = db_url

        # 1. Run migrations against fresh DB
        command.upgrade(cfg, "head")

        # 2. Inspect created tables
        engine = create_engine(db_url)
        inspector = inspect(engine)
        created_tables = set(inspector.get_table_names()) - {"alembic_version"}
        assert created_tables == EXPECTED_TABLES, f"Migrated tables mismatch: {EXPECTED_TABLES - created_tables}"

        # 3. Test user seeding
        with Session(engine) as session:
            seeded = seed_users_sync(session)
            assert len(seeded) == 4

            # Verify all 4 roles exist
            users = session.query(User).all()
            assert len(users) == 4
            roles = {u.role for u in users}
            assert roles == {"officer", "evaluator", "vigilance", "admin"}

            # Verify password hashing
            for dev_user in DEV_USERS:
                db_user = session.query(User).filter_by(email=dev_user["email"]).first()
                assert db_user is not None
                assert verify_password(dev_user["password"], db_user.password_hash)

        # 4. Test Alembic downgrade and re-upgrade
        command.downgrade(cfg, "base")
        inspector_after_downgrade = inspect(engine)
        remaining_tables = set(inspector_after_downgrade.get_table_names()) - {"alembic_version"}
        assert len(remaining_tables) == 0, f"Tables not dropped on downgrade: {remaining_tables}"

        command.upgrade(cfg, "head")
        inspector_reup = inspect(engine)
        reup_tables = set(inspector_reup.get_table_names()) - {"alembic_version"}
        assert reup_tables == EXPECTED_TABLES

    finally:
        if os.path.exists(tmp_db_path):
            try:
                os.remove(tmp_db_path)
            except OSError:
                pass
