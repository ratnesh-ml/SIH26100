"""Findings and Decisions Schemas."""

from datetime import datetime
from typing import Any, Optional, Union
import uuid
from pydantic import BaseModel, ConfigDict


class EvidenceItem(BaseModel):
    document: Optional[str] = None
    document_id: Optional[Union[uuid.UUID, str]] = None
    page: Optional[int] = 1
    page_no: Optional[int] = 1
    field: Optional[str] = None
    field_name: Optional[str] = None
    quote: Optional[str] = None
    value: Optional[str] = None
    bounding_box: Optional[dict[str, Any]] = None
    bbox: Optional[dict[str, Any]] = None
    source: Optional[str] = "document_text_layer"
    method: Optional[str] = "anchor_regex"
    confidence: Optional[float] = 1.0
    metadata: Optional[dict[str, Any]] = None


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
