"""Service layer interfaces for Tender management."""

from typing import Any, Optional
import uuid


class TenderService:
    """Orchestrates tender CRUD, template importing, and matrix computation."""

    async def get_tender(self, tender_id: uuid.UUID) -> Optional[dict[str, Any]]:
        raise NotImplementedError("TenderService will be implemented in future phase")

    async def list_tenders(self, page: int, limit: int) -> dict[str, Any]:
        raise NotImplementedError("TenderService will be implemented in future phase")

    async def create_tender_from_template(self, template_name: str, payload: dict[str, Any]) -> dict[str, Any]:
        raise NotImplementedError("TenderService will be implemented in future phase")
