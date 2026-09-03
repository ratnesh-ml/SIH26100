"""Bid and Tender Attachment Schemas."""

from datetime import datetime
from typing import Any, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator


ALLOWED_BID_STATUSES = {
    "PENDING",
    "SUBMITTED",
    "UNDER_EVALUATION",
    "QUALIFIED",
    "NOT_QUALIFIED",
    "DISQUALIFIED",
    "WITHDRAWN",
}


class BidCreate(BaseModel):
    tender_id: uuid.UUID = Field(..., description="Target tender UUID")
    bidder_id: uuid.UUID = Field(..., description="Participating vendor UUID")
    bid_number: Optional[str] = Field(default=None, min_length=3, max_length=100, description="GeM/CPPP bid number")
    status: str = Field(default="SUBMITTED", description="Initial bid lifecycle status")
    submission_date: Optional[datetime] = Field(default=None, description="Bid submission timestamp")
    technical_score: Optional[float] = Field(default=None, ge=0, le=100)
    financial_quote: Optional[float] = Field(default=None, ge=0)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        upper_status = v.upper()
        if upper_status not in ALLOWED_BID_STATUSES:
            raise ValueError(f"Bid status must be one of: {sorted(ALLOWED_BID_STATUSES)}")
        return upper_status


class AttachBidderRequest(BaseModel):
    """Payload to register and attach a bidder to a tender."""
    bidder_id: Optional[uuid.UUID] = Field(default=None, description="Existing bidder UUID to link")
    declared_name: Optional[str] = Field(default=None, min_length=2, max_length=500, description="Name to create new bidder if bidder_id omitted")
    pan: Optional[str] = Field(default=None, description="Optional PAN for new bidder")
    gstin: Optional[str] = Field(default=None, description="Optional GSTIN for new bidder")
    bid_number: Optional[str] = Field(default=None, description="Bid ID/number for this submission")
    financial_quote: Optional[float] = Field(default=None, ge=0)


class BidStatusUpdate(BaseModel):
    status: str = Field(..., description="New bid evaluation status")
    remarks: Optional[str] = Field(default=None, max_length=500)

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        upper_status = v.upper()
        if upper_status not in ALLOWED_BID_STATUSES:
            raise ValueError(f"Bid status must be one of: {sorted(ALLOWED_BID_STATUSES)}")
        return upper_status


class BidOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tender_id: uuid.UUID
    bidder_id: uuid.UUID
    bid_number: str
    status: str
    submission_date: Optional[datetime] = None
    technical_score: Optional[float] = None
    financial_quote: Optional[float] = None
    created_at: datetime
    bidder_name: Optional[str] = None
    tender_title: Optional[str] = None


class BidListResponse(BaseModel):
    items: list[BidOut]
    total: int
    page: int
    limit: int
    pages: int
