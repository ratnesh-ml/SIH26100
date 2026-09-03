"""Bidder and Risk Schemas."""

from datetime import datetime
from typing import Any, Optional
import uuid
from pydantic import BaseModel, ConfigDict


class BidderSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tender_id: uuid.UUID
    declared_name: str
    canonical_name: Optional[str] = None
    overall_status: str = "PENDING"
    risk_score: int = 0
    risk_band: str = "LOW"
    review_state: str = "PENDING"
    created_at: datetime


class BidderDetail(BidderSummary):
    udyam_no: Optional[str] = None
    cin: Optional[str] = None
    address: Optional[dict[str, Any]] = None
    contact: Optional[dict[str, Any]] = None
    entity_confidence: Optional[float] = None
    document_count: int = 0


class RiskDriverOut(BaseModel):
    driver: str
    points: int
    source_ref: Optional[dict[str, Any]] = None


class AnomalySignalOut(BaseModel):
    code: str
    severity: str
    points: int
    description: str
    evidence: Optional[dict[str, Any]] = None


class RiskProfileOut(BaseModel):
    bidder_id: uuid.UUID
    score: int
    band: str
    entity_confidence: Optional[float] = None
    drivers: list[RiskDriverOut] = []
    anomalies: list[AnomalySignalOut] = []
