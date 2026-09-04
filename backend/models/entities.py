"""SQLAlchemy 2.0 Models for the 17 VigilBid Database Tables."""

from datetime import date, datetime, timezone
from typing import Any, Optional
import uuid
from sqlalchemy import (
    BigInteger,
    Boolean,
    CheckConstraint,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    LargeBinary,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    Uuid,
    JSON,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin

# Dialect-adaptive types: native on PostgreSQL, compatible on SQLite
JSON_TYPE = JSON().with_variant(JSONB, "postgresql")
UUID_TYPE = Uuid(as_uuid=True)


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint(
            "role IN ('officer', 'evaluator', 'approver', 'vigilance', 'auditor', 'admin')",
            name="check_user_role",
        ),
    )

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # officer, approver, auditor, admin

    created_tenders: Mapped[list["Tender"]] = relationship("Tender", back_populates="creator")
    decisions: Mapped[list["Decision"]] = relationship("Decision", back_populates="actor")
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="generator")


class Tender(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "tenders"
    __table_args__ = (
        CheckConstraint(
            "status IN ('DRAFT', 'ACTIVE', 'EVALUATING', 'CLOSED', 'ARCHIVED')",
            name="check_tender_status",
        ),
    )

    nit_no: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    portal: Mapped[str] = mapped_column(String(50), default="GeM")
    status: Mapped[str] = mapped_column(String(50), default="ACTIVE", server_default="ACTIVE")
    estimated_value: Mapped[Optional[float]] = mapped_column(Numeric(16, 2), nullable=True)
    bid_due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    mse_applicable: Mapped[bool] = mapped_column(Boolean, default=True)
    mii_class_required: Mapped[Optional[str]] = mapped_column(String(50), default="Class-I")
    requires_oem: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("users.id"), nullable=False)

    creator: Mapped["User"] = relationship("User", back_populates="created_tenders")
    criteria: Mapped[list["Criterion"]] = relationship("Criterion", back_populates="tender", cascade="all, delete-orphan")
    bidders: Mapped[list["Bidder"]] = relationship("Bidder", back_populates="tender", cascade="all, delete-orphan")
    bids: Mapped[list["Bid"]] = relationship("Bid", back_populates="tender", cascade="all, delete-orphan")
    links: Mapped[list["BidderLink"]] = relationship("BidderLink", back_populates="tender", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="tender", cascade="all, delete-orphan")


class Criterion(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "criteria"
    __table_args__ = (UniqueConstraint("tender_id", "code", name="uq_tender_criterion_code"),)

    tender_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("tenders.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    threshold: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    required_doc_types: Mapped[Optional[list[str]]] = mapped_column(JSON_TYPE, nullable=True)
    rule_ids: Mapped[Optional[list[str]]] = mapped_column(JSON_TYPE, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    tender: Mapped["Tender"] = relationship("Tender", back_populates="criteria")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="criterion")


class Bidder(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "bidders"
    __table_args__ = (
        Index("ix_bidders_tender_id", "tender_id"),
        Index("ix_bidders_canonical_name", "canonical_name"),
        Index("ix_bidders_overall_status", "overall_status"),
        Index("ix_bidders_risk_band", "risk_band"),
        CheckConstraint(
            "overall_status IN ('PENDING', 'PASS', 'WARN', 'REVIEW', 'FAIL')",
            name="check_bidder_status",
        ),
        CheckConstraint(
            "risk_band IN ('LOW', 'MEDIUM', 'HIGH')",
            name="check_bidder_risk_band",
        ),
    )

    tender_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("tenders.id"), nullable=True)
    declared_name: Mapped[str] = mapped_column(String(500), nullable=False)
    canonical_name: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    pan_enc: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    gstin_enc: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    udyam_no: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    cin: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    contact: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    entity_confidence: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    overall_status: Mapped[str] = mapped_column(String(50), default="PENDING")
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_band: Mapped[str] = mapped_column(String(50), default="LOW")
    review_state: Mapped[str] = mapped_column(String(50), default="PENDING")

    tender: Mapped[Optional["Tender"]] = relationship("Tender", back_populates="bidders")
    bids: Mapped[list["Bid"]] = relationship("Bid", back_populates="bidder", cascade="all, delete-orphan")
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="bidder", cascade="all, delete-orphan")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="bidder", cascade="all, delete-orphan")
    verification_events: Mapped[list["VerificationEvent"]] = relationship("VerificationEvent", back_populates="bidder", cascade="all, delete-orphan")
    anomaly_signals: Mapped[list["AnomalySignal"]] = relationship("AnomalySignal", back_populates="bidder", cascade="all, delete-orphan")
    risk_drivers: Mapped[list["RiskDriver"]] = relationship("RiskDriver", back_populates="bidder", cascade="all, delete-orphan")
    decisions: Mapped[list["Decision"]] = relationship("Decision", back_populates="bidder", cascade="all, delete-orphan")
    jobs: Mapped[list["Job"]] = relationship("Job", back_populates="bidder", cascade="all, delete-orphan")
    reports: Mapped[list["Report"]] = relationship("Report", back_populates="bidder")


class Bid(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "bids"
    __table_args__ = (
        UniqueConstraint("tender_id", "bidder_id", name="uq_tender_bidder_bid"),
        Index("ix_bids_tender_id", "tender_id"),
        Index("ix_bids_bidder_id", "bidder_id"),
        CheckConstraint(
            "status IN ('PENDING', 'SUBMITTED', 'UNDER_EVALUATION', 'QUALIFIED', 'NOT_QUALIFIED', 'DISQUALIFIED', 'WITHDRAWN')",
            name="check_bid_status",
        ),
    )

    tender_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("tenders.id", ondelete="CASCADE"), nullable=False)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id", ondelete="CASCADE"), nullable=False)
    bid_number: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="SUBMITTED", server_default="SUBMITTED")
    submission_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    technical_score: Mapped[Optional[float]] = mapped_column(Numeric(5, 2), nullable=True)
    financial_quote: Mapped[Optional[float]] = mapped_column(Numeric(16, 2), nullable=True)

    tender: Mapped["Tender"] = relationship("Tender", back_populates="bids")
    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="bids")


class Document(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "documents"
    __table_args__ = (
        UniqueConstraint("bidder_id", "sha256", name="uq_bidder_document_sha"),
        Index("ix_documents_bidder_id", "bidder_id"),
        Index("ix_documents_doc_type", "doc_type"),
    )

    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime: Mapped[str] = mapped_column(String(100), default="application/pdf")
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    doc_type: Mapped[str] = mapped_column(String(100), default="UNKNOWN")
    doc_type_conf: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    doc_type_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    text_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    metadata_fields: Mapped[Optional[dict[str, Any]]] = mapped_column("metadata", JSON_TYPE, nullable=True)
    forensic: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)

    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="documents")
    pages: Mapped[list["DocumentPage"]] = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")
    fields: Mapped[list["ExtractedField"]] = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")


class DocumentPage(Base):
    __tablename__ = "document_pages"
    __table_args__ = (
        UniqueConstraint("document_id", "page_no", name="uq_document_page"),
        Index("ix_document_pages_doc_id", "document_id"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("documents.id"), nullable=False)
    page_no: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    words: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    ocr_conf: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    png_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    document: Mapped["Document"] = relationship("Document", back_populates="pages")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"
    __table_args__ = (
        UniqueConstraint("document_id", "field_name", name="uq_doc_field"),
        Index("ix_extracted_fields_doc_id", "document_id"),
        Index("ix_extracted_fields_field_name", "field_name"),
    )

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("documents.id"), nullable=False)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    value_norm: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_no: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bbox: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    value_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    document: Mapped["Document"] = relationship("Document", back_populates="fields")


class VerificationEvent(Base):
    __tablename__ = "verification_events"
    __table_args__ = (Index("ix_verification_events_bidder_id", "bidder_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=False)
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("documents.id"), nullable=True)
    verifier: Mapped[str] = mapped_column(String(100), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), default="mock")
    request: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    response: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="verification_events")


class Finding(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "findings"
    __table_args__ = (
        Index("ix_findings_bidder_id", "bidder_id"),
        Index("ix_findings_rule_id", "rule_id"),
        Index("ix_findings_status", "status"),
        Index("ix_findings_bidder_status", "bidder_id", "status"),
        CheckConstraint(
            "status IN ('PASS', 'WARN', 'REVIEW', 'FAIL', 'INFO')",
            name="check_finding_status",
        ),
    )

    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=False)
    criterion_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("criteria.id"), nullable=True)
    rule_id: Mapped[str] = mapped_column(String(100), nullable=False)
    rule_version: Mapped[str] = mapped_column(String(20), default="1.0")
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # PASS, WARN, REVIEW, FAIL, INFO
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    citation: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    evidence: Mapped[Optional[list[dict[str, Any]]]] = mapped_column(JSON_TYPE, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    extracted: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    expected: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)

    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="findings")
    criterion: Mapped[Optional["Criterion"]] = relationship("Criterion", back_populates="findings")
    decisions: Mapped[list["Decision"]] = relationship("Decision", back_populates="finding", cascade="all, delete-orphan")


class AnomalySignal(Base):
    __tablename__ = "anomaly_signals"
    __table_args__ = (Index("ix_anomaly_signals_bidder_id", "bidder_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)

    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="anomaly_signals")


class RiskDriver(Base):
    __tablename__ = "risk_drivers"
    __table_args__ = (Index("ix_risk_drivers_bidder_id", "bidder_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=False)
    driver: Mapped[str] = mapped_column(String(255), nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0)
    source_ref: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)

    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="risk_drivers")


class Decision(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "decisions"
    __table_args__ = (
        Index("ix_decisions_bidder_id", "bidder_id"),
        Index("ix_decisions_finding_id", "finding_id"),
        CheckConstraint(
            "action IN ('ACCEPT', 'REJECT', 'OVERRIDE', 'CLARIFY', 'REQUEST_CLARIFICATION', 'CONCUR', 'DISSENT')",
            name="check_decision_action",
        ),
    )

    finding_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("findings.id"), nullable=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=False)
    bid_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("bids.id"), nullable=True)
    actor_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # ACCEPT, REJECT, OVERRIDE, CLARIFY, REQUEST_CLARIFICATION, CONCUR, DISSENT
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    resulting_status: Mapped[str] = mapped_column(String(50), nullable=False)
    machine_recommendation: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    audit_ref: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    finding: Mapped[Optional["Finding"]] = relationship("Finding", back_populates="decisions")
    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="decisions")
    bid: Mapped[Optional["Bid"]] = relationship("Bid")
    actor: Mapped["User"] = relationship("User", back_populates="decisions")


class BidderLink(Base):
    __tablename__ = "bidder_links"
    __table_args__ = (Index("ix_bidder_links_tender_id", "tender_id"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("tenders.id"), nullable=False)
    bidder_a: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=False)
    bidder_b: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=False)
    link_type: Mapped[str] = mapped_column(String(100), nullable=False)
    weight: Mapped[int] = mapped_column(Integer, default=1)
    evidence: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)

    tender: Mapped["Tender"] = relationship("Tender", back_populates="links")


class Job(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "jobs"
    __table_args__ = (
        Index("ix_jobs_status_created_at", "status", "created_at"),
        Index("ix_jobs_bidder_id", "bidder_id"),
    )

    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="QUEUED")  # QUEUED, RUNNING, DONE, FAILED
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    steps: Mapped[Optional[list[dict[str, Any]]]] = mapped_column(JSON_TYPE, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)

    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="jobs")


class AuditLog(Base):
    __tablename__ = "audit_log"
    __table_args__ = (
        Index("ix_audit_log_seq", "seq"),
        Index("ix_audit_log_ts", "ts"),
        Index("ix_audit_log_target", "target_type", "target_id"),
        Index("ix_audit_log_action", "action"),
    )

    seq: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    target_type: Mapped[str] = mapped_column(String(100), nullable=False)
    target_id: Mapped[str] = mapped_column(String(255), nullable=False)
    payload: Mapped[Optional[dict[str, Any]]] = mapped_column(JSON_TYPE, nullable=True)
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    curr_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)


class Report(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reports"
    __table_args__ = (Index("ix_reports_tender_id", "tender_id"),)

    tender_id: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("tenders.id"), nullable=False)
    bidder_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID_TYPE, ForeignKey("bidders.id"), nullable=True)
    path: Mapped[str] = mapped_column(String(1000), nullable=False)
    chain_head: Mapped[str] = mapped_column(String(64), nullable=False)
    generated_by: Mapped[uuid.UUID] = mapped_column(UUID_TYPE, ForeignKey("users.id"), nullable=False)

    tender: Mapped["Tender"] = relationship("Tender", back_populates="reports")
    bidder: Mapped[Optional["Bidder"]] = relationship("Bidder", back_populates="reports")
    generator: Mapped["User"] = relationship("User", back_populates="reports")


class KBChunk(Base):
    __tablename__ = "kb_chunks"
    __table_args__ = (Index("ix_kb_chunks_source", "source"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    clause: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    effective_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
