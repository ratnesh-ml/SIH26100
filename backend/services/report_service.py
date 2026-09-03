"""Service layer interfaces for CVC Dossier and Summary Report generation."""

from typing import Any, Optional
import uuid


class ReportService:
    """Generates immutable CVC/RTI-ready PDF dossiers and tender evaluation summaries."""

    async def generate_bidder_dossier(self, bidder_id: uuid.UUID) -> str:
        raise NotImplementedError("ReportService will be implemented in future phase")

    async def generate_tender_summary(self, tender_id: uuid.UUID) -> str:
        raise NotImplementedError("ReportService will be implemented in future phase")
