"""Tender and Criteria Schemas with Strict Pydantic v2 Validations."""

from datetime import date, datetime
from typing import Any, Optional
import uuid
from pydantic import BaseModel, ConfigDict, Field, field_validator


ALLOWED_PORTALS = {"GeM", "CPPP", "CPCL_PORTAL"}
ALLOWED_TENDER_STATUSES = {"DRAFT", "ACTIVE", "EVALUATING", "CLOSED", "ARCHIVED"}


class CriterionBase(BaseModel):
    code: str = Field(..., min_length=1, max_length=50)
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    threshold: Optional[dict[str, Any]] = None
    required_doc_types: Optional[list[str]] = None
    rule_ids: Optional[list[str]] = None
    sort_order: int = 0


class CriterionOut(CriterionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    tender_id: uuid.UUID


class TenderCreate(BaseModel):
    nit_no: str = Field(..., min_length=3, max_length=100, description="Notice Inviting Tender number")
    title: str = Field(..., min_length=3, max_length=500, description="Official tender contract title")
    portal: str = Field(default="GeM", description="Source portal (GeM, CPPP, or CPCL_PORTAL)")
    status: str = Field(default="ACTIVE", description="Initial lifecycle status")
    estimated_value: Optional[float] = Field(default=None, ge=0, description="Estimated procurement budget in INR")
    bid_due_date: Optional[date] = Field(default=None, description="Bid submission deadline")
    mse_applicable: bool = Field(default=True, description="Whether MSE purchase preference applies")
    mii_class_required: Optional[str] = Field(default="Class-I", description="Make in India local content requirement")
    requires_oem: bool = Field(default=True, description="Whether OEM authorization is mandatory")
    template: Optional[str] = Field(default="cpcl_goods_v1", description="Template for requirement placeholders")
    criteria_overrides: Optional[list[CriterionBase]] = None

    @field_validator("nit_no", "title")
    @classmethod
    def validate_non_empty_strings(cls, v: str) -> str:
        cleaned = v.strip()
        if not cleaned:
            raise ValueError("Field cannot be blank or whitespace only")
        return cleaned

    @field_validator("portal")
    @classmethod
    def validate_portal(cls, v: str) -> str:
        if v not in ALLOWED_PORTALS:
            raise ValueError(f"Portal must be one of: {sorted(ALLOWED_PORTALS)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: str) -> str:
        upper_status = v.upper()
        if upper_status not in ALLOWED_TENDER_STATUSES:
            raise ValueError(f"Status must be one of: {sorted(ALLOWED_TENDER_STATUSES)}")
        return upper_status


class TenderUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=500)
    portal: Optional[str] = None
    status: Optional[str] = None
    estimated_value: Optional[float] = Field(default=None, ge=0)
    bid_due_date: Optional[date] = None
    mse_applicable: Optional[bool] = None
    mii_class_required: Optional[str] = None
    requires_oem: Optional[bool] = None

    @field_validator("portal")
    @classmethod
    def validate_portal(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in ALLOWED_PORTALS:
            raise ValueError(f"Portal must be one of: {sorted(ALLOWED_PORTALS)}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            upper_status = v.upper()
            if upper_status not in ALLOWED_TENDER_STATUSES:
                raise ValueError(f"Status must be one of: {sorted(ALLOWED_TENDER_STATUSES)}")
            return upper_status
        return v


class TenderSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nit_no: str
    title: str
    portal: str
    status: str
    estimated_value: Optional[float] = None
    bid_due_date: Optional[date] = None
    bidder_count: int = 0
    created_at: datetime


class TenderDetail(TenderSummary):
    mse_applicable: bool
    mii_class_required: Optional[str]
    requires_oem: bool
    created_by: uuid.UUID
    criteria: list[CriterionOut] = []


class TenderListResponse(BaseModel):
    items: list[TenderSummary]
    total: int
    page: int
    limit: int
    pages: int


class MatrixCell(BaseModel):
    criterion_id: uuid.UUID
    status: str  # PASS, WARN, REVIEW, FAIL, PENDING
    finding_id: Optional[uuid.UUID] = None


class BidderMatrixRow(BaseModel):
    id: uuid.UUID
    name: str
    status: str
    risk_score: int
    cells: list[MatrixCell]


class ComplianceMatrix(BaseModel):
    tender_id: uuid.UUID
    criteria: list[CriterionOut]
    bidders: list[BidderMatrixRow]
