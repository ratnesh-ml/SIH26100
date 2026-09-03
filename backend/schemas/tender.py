"""Tender and Criteria Schemas."""

from datetime import date, datetime
from typing import Any, Optional
import uuid
from pydantic import BaseModel, ConfigDict


class CriterionBase(BaseModel):
    code: str
    title: str
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
    nit_no: str
    title: str
    portal: str = "GeM"
    estimated_value: Optional[float] = None
    bid_due_date: Optional[date] = None
    mse_applicable: bool = True
    mii_class_required: Optional[str] = "Class-I"
    requires_oem: bool = True
    template: Optional[str] = "cpcl_goods_v1"
    criteria_overrides: Optional[list[CriterionBase]] = None


class TenderSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    nit_no: str
    title: str
    portal: str
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
