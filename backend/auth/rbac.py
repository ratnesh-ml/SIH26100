"""Role-Based Access Control (RBAC) declarations for VigilBid."""

from enum import Enum
from typing import Sequence
from fastapi import HTTPException, status


class UserRole(str, Enum):
    OFFICER = "officer"
    APPROVER = "approver"
    AUDITOR = "auditor"
    ADMIN = "admin"


class RoleChecker:
    """RBAC dependency ensuring the authenticated user possesses an authorized role."""
    def __init__(self, allowed_roles: Sequence[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user_role: str) -> bool:
        if user_role not in [role.value for role in self.allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted for role: '{user_role}'. Required: {[r.value for r in self.allowed_roles]}"
            )
        return True
