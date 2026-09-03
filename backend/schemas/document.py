"""Document Ingestion Schemas."""

from datetime import datetime
from typing import Any, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field


class DocumentSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bidder_id: uuid.UUID
    original_filename: str
    sha256: str
    mime: str = "application/pdf"
    page_count: int = 0
    doc_type: str = "UNKNOWN"
    storage_path: str
    created_at: datetime


class RejectedFileOut(BaseModel):
    filename: str
    reason: str


class IngestionResponse(BaseModel):
    bidder_id: uuid.UUID
    job_id: Optional[uuid.UUID] = None
    total_files: int
    accepted: list[DocumentSummary]
    rejected: list[RejectedFileOut]
