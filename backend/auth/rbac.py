"""Role-Based Access Control (RBAC) declarations and enforcement for VigilBid."""

from enum import Enum
from typing import Sequence
from fastapi import HTTPException, status


class UserRole(str, Enum):
    OFFICER = "officer"        # Procurement Officer
    EVALUATOR = "evaluator"    # Evaluator (TEC Member)
    APPROVER = "approver"      # Evaluator alias
    VIGILANCE = "vigilance"    # Vigilance / CVC Auditor
    AUDITOR = "auditor"        # Vigilance alias
    ADMIN = "admin"            # Administrator


# Synonym mapping for cross-compatibility
ROLE_ALIASES: dict[str, set[str]] = {
    "officer": {"officer", "procurement_officer"},
    "evaluator": {"evaluator", "approver"},
    "approver": {"evaluator", "approver"},
    "vigilance": {"vigilance", "auditor"},
    "auditor": {"vigilance", "auditor"},
    "admin": {"admin", "administrator"},
}


class RoleChecker:
    """RBAC dependency ensuring the authenticated user possesses an authorized role."""

    def __init__(self, allowed_roles: Sequence[UserRole | str]):
        self.allowed_roles = [r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles]

    def __call__(self, user_role: str) -> bool:
        user_role_norm = user_role.lower().strip()
        user_equivalents = ROLE_ALIASES.get(user_role_norm, {user_role_norm})

        # Match if any equivalent role matches any allowed role or its aliases
        for allowed in self.allowed_roles:
            allowed_equivalents = ROLE_ALIASES.get(allowed, {allowed})
            if user_equivalents & allowed_equivalents:
                return True

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not permitted for role: '{user_role}'. Required one of: {self.allowed_roles}",
        )
