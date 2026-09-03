"""Service layer interfaces for Bidder package intake and evaluation."""

from typing import Any, Optional
import uuid


class BidderService:
    """Manages bidder document intake, status transitions, and review completions."""

    async def get_bidder(self, bidder_id: uuid.UUID) -> Optional[dict[str, Any]]:
        raise NotImplementedError("BidderService will be implemented in future phase")

    async def enqueue_package(self, tender_id: uuid.UUID, declared_name: str, files: list[Any]) -> dict[str, Any]:
        raise NotImplementedError("BidderService will be implemented in future phase")
