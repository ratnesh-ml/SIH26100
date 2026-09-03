"""Pipeline Job Schemas."""

from datetime import datetime
from typing import Any, Optional
import uuid
from enum import Enum
from pydantic import BaseModel, ConfigDict


class JobState(str, Enum):
    QUEUED = "QUEUED"
    PROCESSING = "PROCESSING"
    RUNNING = "RUNNING"  # Backwards compatibility alias
    DONE = "DONE"
    FAILED = "FAILED"


class StepStatus(BaseModel):
    name: str
    step_number: int
    status: str  # QUEUED, RUNNING, DONE, FAILED, SKIPPED
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    meta: Optional[dict[str, Any]] = None


class JobStatus(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bidder_id: uuid.UUID
    status: str  # QUEUED, RUNNING, DONE, FAILED
    current_step: int
    steps: list[StepStatus] = []
    error: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
