"""Service layer interfaces for Cryptographic Audit Logging."""

from typing import Any, Optional
import uuid


class AuditService:
    """Records tamper-evident hash-chained audit events and verifies chain continuity."""

    async def log_event(
        self,
        actor_id: Optional[uuid.UUID],
        role: str,
        action: str,
        target_type: str,
        target_id: str,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        raise NotImplementedError("AuditService will be implemented in future phase")

    async def verify_chain(self) -> dict[str, Any]:
        raise NotImplementedError("AuditService will be implemented in future phase")
