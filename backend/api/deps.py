"""FastAPI Dependencies for Authentication, Database, and RBAC."""

import uuid
from typing import Annotated, Sequence
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.security import decode_access_token
from backend.core.database import get_db_session
from backend.auth.jwt import TokenPayload
from backend.auth.rbac import UserRole, RoleChecker
from backend.models.entities import User

security_bearer = HTTPBearer(auto_error=False)


async def get_current_token_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_bearer)]
) -> TokenPayload:
    """Validate Bearer JWT and return decoded payload."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(credentials.credentials)
        token_data = TokenPayload(**payload)
        return token_data
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    token: Annotated[TokenPayload, Depends(get_current_token_payload)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> User:
    """Resolve database User model from verified JWT claims."""
    try:
        user_uuid = uuid.UUID(token.sub)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed user identifier in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(User).where(User.id == user_uuid)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authenticated user no longer exists",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


def require_role(*roles: UserRole | str):
    """Factory dependency enforcing specific user roles."""
    checker = RoleChecker(roles)

    async def _role_dependency(
        user: Annotated[User, Depends(get_current_user)],
    ) -> User:
        checker(user.role)
        return user

    return _role_dependency
