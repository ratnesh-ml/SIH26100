"""Audit Trail and Verification Schemas."""

from datetime import datetime
from typing import Any, Optional
import uuid
from pydantic import BaseModel, ConfigDict


class AuditEventOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    seq: int
    ts: datetime
    actor_id: Optional[uuid.UUID] = None
    role: str
    action: str
    target_type: str
    target_id: str
    payload: Optional[dict[str, Any]] = None
    prev_hash: str
    curr_hash: str


class AuditVerifyOut(BaseModel):
    ok: bool
    length: int
    first_broken_seq: Optional[int] = None
    head_hash: Optional[str] = None
