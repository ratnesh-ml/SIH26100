"""Findings and Decisions Schemas."""

from datetime import datetime
from typing import Any, Optional
import uuid
from pydantic import BaseModel, ConfigDict


class EvidenceItem(BaseModel):
    document_id: uuid.UUID
    page_no: int
    bbox: Optional[dict[str, Any]] = None
    field_name: Optional[str] = None
    value: Optional[str] = None


class FindingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    bidder_id: uuid.UUID
    criterion_id: Optional[uuid.UUID] = None
    rule_id: str
    rule_version: str
    status: str  # PASS, WARN, REVIEW, FAIL, INFO
    title: str
    explanation: str
    citation: Optional[dict[str, Any]] = None
    evidence: Optional[list[EvidenceItem]] = None
    confidence: Optional[float] = None
    extracted: Optional[dict[str, Any]] = None
    expected: Optional[dict[str, Any]] = None
    created_at: datetime


class DecisionCreate(BaseModel):
    action: str  # ACCEPT, OVERRIDE, CLARIFY, CONCUR, DISSENT
    reason: str


class DecisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    finding_id: uuid.UUID
    bidder_id: uuid.UUID
    actor_id: uuid.UUID
    action: str
    reason: str
    resulting_status: str
    created_at: datetime
