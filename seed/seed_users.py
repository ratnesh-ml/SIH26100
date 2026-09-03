"""Seed Development Users for VigilBid (SIH26100)."""

import asyncio
import logging
import sys
import uuid
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select
from sqlalchemy.orm import Session
from sqlalchemy.ext.asyncio import AsyncSession
from backend.core.security import get_password_hash
from backend.models.entities import User
from backend.core.database import get_session_maker

logger = logging.getLogger("vigilbid.seed")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

DEV_USERS = [
    {
        "id": uuid.UUID("11111111-1111-4111-8111-111111111111"),
        "email": "officer@cpcl.gov.in",
        "full_name": "A. Ramanathan, Senior Manager (Contracts & Materials)",
        "role": "officer",
        "password": "Officer@CPCL2026!",
    },
    {
        "id": uuid.UUID("22222222-2222-4222-8222-222222222222"),
        "email": "evaluator@cpcl.gov.in",
        "full_name": "Dr. K. Swaminathan, Chief General Manager (Refinery Projects)",
        "role": "evaluator",
        "password": "Evaluator@CPCL2026!",
    },
    {
        "id": uuid.UUID("33333333-3333-4333-8333-333333333333"),
        "email": "vigilance@cvc.gov.in",
        "full_name": "R. Venkatram, Independent External Monitor / Vigilance Officer",
        "role": "vigilance",
        "password": "Vigilance@CVC2026!",
    },
    {
        "id": uuid.UUID("44444444-4444-4444-8444-444444444444"),
        "email": "admin@vigilbid.local",
        "full_name": "VigilBid System Administrator",
        "role": "admin",
        "password": "Admin@VigilBid2026!",
    },
]


def seed_users_sync(session: Session) -> list[User]:
    """Synchronous seeding helper for Alembic or sync sessions."""
    created = []
    for user_data in DEV_USERS:
        existing = session.query(User).filter_by(email=user_data["email"]).first()
        if not existing:
            user = User(
                id=user_data["id"],
                email=user_data["email"],
                password_hash=get_password_hash(user_data["password"]),
                full_name=user_data["full_name"],
                role=user_data["role"],
            )
            session.add(user)
            created.append(user)
            logger.info("Created user: %s (%s)", user_data["email"], user_data["role"])
        else:
            logger.info("User already exists: %s", user_data["email"])
    session.commit()
    return created


async def seed_users_async() -> list[User]:
    """Asynchronous seeding helper using configured async engine."""
    session_maker = get_session_maker()
    created = []
    async with session_maker() as session:
        for user_data in DEV_USERS:
            stmt = select(User).where(User.email == user_data["email"])
            res = await session.execute(stmt)
            existing = res.scalar_one_or_none()
            if not existing:
                user = User(
                    id=user_data["id"],
                    email=user_data["email"],
                    password_hash=get_password_hash(user_data["password"]),
                    full_name=user_data["full_name"],
                    role=user_data["role"],
                )
                session.add(user)
                created.append(user)
                logger.info("Created user: %s (%s)", user_data["email"], user_data["role"])
            else:
                logger.info("User already exists: %s", user_data["email"])
        await session.commit()
    return created


if __name__ == "__main__":
    logger.info("Starting VigilBid development user seeding...")
    try:
        asyncio.run(seed_users_async())
        logger.info("User seeding completed successfully.")
    except Exception as exc:
        logger.error("User seeding failed: %s", exc)
        sys.exit(1)
