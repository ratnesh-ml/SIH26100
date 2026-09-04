import os
import sys
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy import engine_from_config, pool, inspect
from alembic import context

# Add repository root to path
ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))

from backend.core.config import settings
from backend.models.base import Base
import backend.models.entities  # Ensure all models are registered on metadata

# Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Model metadata for autogenerate support
target_metadata = Base.metadata


def get_sync_url() -> str:
    """Retrieve synchronous database URL for Alembic runner with resilient fallback."""
    url = os.getenv("DATABASE_SYNC_URL", settings.DATABASE_SYNC_URL)
    if not url:
        url = settings.DATABASE_URL
    # Ensure sync driver for standard Alembic execution
    if "+asyncpg" in url:
        url = url.replace("+asyncpg", "")
    elif "+aiosqlite" in url:
        url = url.replace("+aiosqlite", "")

    # Resilient check: If targeting PostgreSQL, probe if the database is reachable
    if url.startswith("postgresql"):
        try:
            import psycopg2
            conn = psycopg2.connect(url, connect_timeout=1)
            conn.close()
        except Exception:
            data_dir = ROOT_DIR / "data"
            data_dir.mkdir(parents=True, exist_ok=True)
            sqlite_path = (data_dir / "vigilbid.db").resolve()
            return f"sqlite:///{sqlite_path}"

    return url


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = get_sync_url()
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    configuration = config.get_section(config.config_ini_section) or {}
    configuration["sqlalchemy.url"] = get_sync_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )

        insp = inspect(connection)
        tables = insp.get_table_names()
        if "users" in tables and "alembic_version" not in tables:
            from alembic.migration import MigrationContext
            m_ctx = MigrationContext.configure(connection)
            m_ctx.stamp(context.script, "head")
            return

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
