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
    rule_version: Optional[str] = "1.0"
    status: str  # PASS, WARN, REVIEW, FAIL, INFO
    title: str
    explanation: str
    citation: Optional[dict[str, Any]] = None
    evidence: Optional[list[EvidenceItem]] = None
    confidence: Optional[float] = None
    extracted: Optional[dict[str, Any]] = None
    expected: Optional[dict[str, Any]] = None
    machine_recommendation: Optional[str] = None
    latest_decision: Optional["DecisionOut"] = None
    is_resolved: bool = False
    created_at: datetime


class DecisionCreate(BaseModel):
    action: str  # ACCEPT, REJECT, REQUEST_CLARIFICATION, OVERRIDE
    reason: Optional[str] = None
    resulting_status: Optional[str] = None


class BidDecisionCreate(BaseModel):
    action: str  # ACCEPT, REJECT, REQUEST_CLARIFICATION, OVERRIDE
    reason: Optional[str] = None
    resulting_status: Optional[str] = None


class DecisionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    finding_id: Optional[uuid.UUID] = None
    bidder_id: uuid.UUID
    bid_id: Optional[uuid.UUID] = None
    actor_id: uuid.UUID
    actor_name: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    reason: Optional[str] = None
    resulting_status: str
    machine_recommendation: Optional[str] = None
    audit_ref: Optional[str] = None
    created_at: datetime


class CompleteReviewResponse(BaseModel):
    status: str
    message: str
    bidder_id: uuid.UUID
    review_state: str
    overall_status: str
    bid_id: Optional[uuid.UUID] = None
    bid_status: Optional[str] = None
    decisions_count: int = 0


class RequirementEvidenceRow(BaseModel):
    requirement_code: str
    requirement_title: str
    requirement_description: Optional[str] = None
    status: str  # PASS, WARN, REVIEW, FAIL, PENDING
    is_satisfied: bool
    observed_value: Optional[str] = None
    required_value: Optional[str] = None
    rule_id: Optional[str] = None
    rule_clause: Optional[str] = None
    verification_source: Optional[str] = None
    reason: Optional[str] = None
    finding_id: Optional[uuid.UUID] = None
    evidence: Optional[list[EvidenceItem]] = None


class RequirementTraceabilityMatrix(BaseModel):
    bidder_id: uuid.UUID
    bidder_name: str
    tender_id: uuid.UUID
    tender_nit: str
    overall_status: str
    requirements: list[RequirementEvidenceRow]
    total_requirements: int
    satisfied_count: int
    unsatisfied_count: int


class RiskExplanationFactor(BaseModel):
    factor_name: str
    category: str  # Identity, Compliance, Financial, Anomaly
    severity: str  # HIGH, MEDIUM, LOW
    contribution: int  # Points contributed to the 0-100 score
    reason: str  # Plain language explanation
    rule_id: Optional[str] = None
    rule_clause: Optional[str] = None
    source: str
    has_evidence: bool
    evidence: Optional[list[dict[str, Any]]] = None
    explanation_status: str = "EXPLAINED"  # EXPLAINED or INSUFFICIENT_EVIDENCE


class RiskExplanationOut(BaseModel):
    bidder_id: uuid.UUID
    bidder_name: str
    score: int
    band: str  # LOW, MEDIUM, HIGH
    summary: str
    factors: list[RiskExplanationFactor]
    total_contribution: int


class HistoricalVerificationRecord(BaseModel):
    bidder_id: uuid.UUID
    bidder_name: str
    tender_id: uuid.UUID
    tender_nit: str
    verified_at: datetime
    ruleset_version: str = "1.0"
    documents_evaluated: list[dict[str, Any]]
    registry_responses: list[dict[str, Any]]
    findings_count: int
    risk_score: int
    risk_band: str
    officer_decisions: list[DecisionOut]
    audit_chain_head: Optional[str] = None
