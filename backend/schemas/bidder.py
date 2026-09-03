"""Bidder and Risk Schemas with Pydantic v2 Validations."""

from datetime import datetime
import re
from typing import Any, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator

PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")


class BidderCreate(BaseModel):
    declared_name: str = Field(..., min_length=2, max_length=500, description="Legal registered vendor name")
    pan: Optional[str] = Field(default=None, description="10-character Permanent Account Number (PAN)")
    gstin: Optional[str] = Field(default=None, description="15-character Goods & Services Tax Identification Number")
    cin: Optional[str] = Field(default=None, description="Corporate Identification Number (MCA21)")
    udyam_no: Optional[str] = Field(default=None, description="MSME Udyam Registration Number")
    address: Optional[dict[str, Any]] = None
    contact: Optional[dict[str, Any]] = None
    tender_id: Optional[uuid.UUID] = Field(default=None, description="Optional tender ID to associate with on creation")

    @field_validator("declared_name")
    @classmethod
    def validate_declared_name(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Bidder name cannot be empty or whitespace only")
        return cleaned

    @field_validator("pan")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            upper_pan = v.strip().upper()
            if not PAN_REGEX.match(upper_pan):
                raise ValueError("Invalid PAN format (expected 5 letters, 4 digits, 1 letter, e.g. ABCDE1234F)")
            return upper_pan
        return v

    @field_validator("gstin")
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            upper_gstin = v.strip().upper()
            if not GSTIN_REGEX.match(upper_gstin):
                raise ValueError("Invalid GSTIN format (expected 15 alphanumeric characters, e.g. 33ABCDE1234F1Z5)")
            return upper_gstin
        return v


class BidderUpdate(BaseModel):
    declared_name: Optional[str] = Field(default=None, min_length=2, max_length=500)
    cin: Optional[str] = None
    udyam_no: Optional[str] = None
    address: Optional[dict[str, Any]] = None
    contact: Optional[dict[str, Any]] = None


class BidderSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tender_id: Optional[uuid.UUID] = None
    declared_name: str
    canonical_name: Optional[str] = None
    overall_status: str = "PENDING"
    risk_score: int = 0
    risk_band: str = "LOW"
    review_state: str = "PENDING"
    created_at: datetime


class BidderProfile(BidderSummary):
    masked_pan: Optional[str] = None
    masked_gstin: Optional[str] = None
    cin: Optional[str] = None
    udyam_no: Optional[str] = None
    address: Optional[dict[str, Any]] = None
    contact: Optional[dict[str, Any]] = None
    entity_confidence: Optional[float] = None
    document_count: int = 0


class BidderDetail(BidderProfile):
    """Detailed bidder representation including compliance context."""
    pass


class BidderListResponse(BaseModel):
    items: list[BidderProfile]
    total: int
    page: int
    limit: int
    pages: int


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
