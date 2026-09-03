"""FastAPI Dependencies for Authentication, Database, and RBAC."""

from typing import Annotated, Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from backend.core.security import decode_access_token
from backend.auth.jwt import TokenPayload
from backend.auth.rbac import UserRole, RoleChecker

security_bearer = HTTPBearer(auto_error=False)


async def get_current_token_payload(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security_bearer)]
) -> TokenPayload:
    """Validate Bearer JWT and return decoded payload."""
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization bearer token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_access_token(credentials.credentials)
        return TokenPayload(**payload)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired token: {str(exc)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def require_role(*roles: UserRole):
    """Factory dependency enforcing specific user roles."""
    checker = RoleChecker(roles)

    async def _role_dependency(token: Annotated[TokenPayload, Depends(get_current_token_payload)]):
        checker(token.role)
        return token

    return _role_dependency
