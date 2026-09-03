"""SQLAlchemy 2.0 Models for the 17 VigilBid Database Tables."""

from datetime import date, datetime, timezone
from typing import Any, Optional
import uuid
from sqlalchemy import (
    BigInteger,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin


class User(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "users"

    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(50), nullable=False)  # officer, approver, auditor, admin


class Tender(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "tenders"

    nit_no: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    portal: Mapped[str] = mapped_column(String(50), default="GeM")
    estimated_value: Mapped[Optional[float]] = mapped_column(Numeric(16, 2), nullable=True)
    bid_due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    mse_applicable: Mapped[bool] = mapped_column(Boolean, default=True)
    mii_class_required: Mapped[Optional[str]] = mapped_column(String(50), default="Class-I")
    requires_oem: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    criteria: Mapped[list["Criterion"]] = relationship("Criterion", back_populates="tender", cascade="all, delete-orphan")
    bidders: Mapped[list["Bidder"]] = relationship("Bidder", back_populates="tender", cascade="all, delete-orphan")


class Criterion(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "criteria"
    __table_args__ = (UniqueConstraint("tender_id", "code", name="uq_tender_criterion_code"),)

    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    threshold: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    required_doc_types: Mapped[Optional[list[str]]] = mapped_column(JSONB, nullable=True)
    rule_ids: Mapped[Optional[list[str]]] = mapped_column(JSONB, nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

    tender: Mapped["Tender"] = relationship("Tender", back_populates="criteria")


class Bidder(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "bidders"

    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False)
    declared_name: Mapped[str] = mapped_column(String(500), nullable=False)
    canonical_name: Mapped[Optional[str]] = mapped_column(String(500), index=True, nullable=True)
    pan_enc: Mapped[Optional[bytes]] = mapped_column(nullable=True)
    gstin_enc: Mapped[Optional[bytes]] = mapped_column(nullable=True)
    udyam_no: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    cin: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    contact: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    entity_confidence: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    overall_status: Mapped[str] = mapped_column(String(50), default="PENDING")
    risk_score: Mapped[int] = mapped_column(Integer, default=0)
    risk_band: Mapped[str] = mapped_column(String(50), default="LOW")
    review_state: Mapped[str] = mapped_column(String(50), default="PENDING")

    tender: Mapped["Tender"] = relationship("Tender", back_populates="bidders")
    documents: Mapped[list["Document"]] = relationship("Document", back_populates="bidder", cascade="all, delete-orphan")
    findings: Mapped[list["Finding"]] = relationship("Finding", back_populates="bidder", cascade="all, delete-orphan")


class Document(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "documents"
    __table_args__ = (UniqueConstraint("bidder_id", "sha256", name="uq_bidder_document_sha"),)

    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(500), nullable=False)
    sha256: Mapped[str] = mapped_column(String(64), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(1000), nullable=False)
    mime: Mapped[str] = mapped_column(String(100), default="application/pdf")
    page_count: Mapped[int] = mapped_column(Integer, default=0)
    doc_type: Mapped[str] = mapped_column(String(100), default="UNKNOWN")
    doc_type_conf: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    doc_type_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    text_source: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    metadata_fields: Mapped[Optional[dict[str, Any]]] = mapped_column("metadata", JSONB, nullable=True)
    forensic: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="documents")
    pages: Mapped[list["DocumentPage"]] = relationship("DocumentPage", back_populates="document", cascade="all, delete-orphan")


class DocumentPage(Base):
    __tablename__ = "document_pages"
    __table_args__ = (UniqueConstraint("document_id", "page_no", name="uq_document_page"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    page_no: Mapped[int] = mapped_column(Integer, nullable=False)
    text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    words: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    ocr_conf: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    png_path: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)

    document: Mapped["Document"] = relationship("Document", back_populates="pages")


class ExtractedField(Base):
    __tablename__ = "extracted_fields"
    __table_args__ = (UniqueConstraint("document_id", "field_name", name="uq_doc_field"),)

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    field_name: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    value_norm: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    raw: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    page_no: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bbox: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    method: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    value_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)


class VerificationEvent(Base):
    __tablename__ = "verification_events"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=False)
    document_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=True)
    verifier: Mapped[str] = mapped_column(String(100), nullable=False)
    provider: Mapped[str] = mapped_column(String(50), default="mock")
    request: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    response: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    checked_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))


class Finding(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "findings"

    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=False)
    criterion_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("criteria.id"), nullable=True)
    rule_id: Mapped[str] = mapped_column(String(100), nullable=False)
    rule_version: Mapped[str] = mapped_column(String(20), default="1.0")
    status: Mapped[str] = mapped_column(String(20), nullable=False)  # PASS, WARN, REVIEW, FAIL, INFO
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    explanation: Mapped[str] = mapped_column(Text, nullable=False)
    citation: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    evidence: Mapped[Optional[list[dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    extracted: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    expected: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)

    bidder: Mapped["Bidder"] = relationship("Bidder", back_populates="findings")


class AnomalySignal(Base):
    __tablename__ = "anomaly_signals"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    evidence: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)


class RiskDriver(Base):
    __tablename__ = "risk_drivers"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=False)
    driver: Mapped[str] = mapped_column(String(255), nullable=False)
    points: Mapped[int] = mapped_column(Integer, default=0)
    source_ref: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)


class Decision(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "decisions"

    finding_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("findings.id"), nullable=False)
    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=False)
    actor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action: Mapped[str] = mapped_column(String(50), nullable=False)  # ACCEPT, OVERRIDE, CLARIFY, CONCUR, DISSENT
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    resulting_status: Mapped[str] = mapped_column(String(50), nullable=False)


class BidderLink(Base):
    __tablename__ = "bidder_links"

    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False)
    bidder_a: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=False)
    bidder_b: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=False)
    link_type: Mapped[str] = mapped_column(String(100), nullable=False)
    weight: Mapped[int] = mapped_column(Integer, default=1)
    evidence: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)


class Job(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "jobs"

    bidder_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(50), default="QUEUED")  # QUEUED, RUNNING, DONE, FAILED
    current_step: Mapped[int] = mapped_column(Integer, default=0)
    steps: Mapped[Optional[list[dict[str, Any]]]] = mapped_column(JSONB, nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    started_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class AuditLog(Base):
    __tablename__ = "audit_log"

    seq: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    ts: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    actor_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), nullable=True)
    role: Mapped[str] = mapped_column(String(50), nullable=False)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    target_type: Mapped[str] = mapped_column(String(100), nullable=False)
    target_id: Mapped[str] = mapped_column(String(255), nullable=False)
    payload: Mapped[Optional[dict[str, Any]]] = mapped_column(JSONB, nullable=True)
    prev_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    curr_hash: Mapped[str] = mapped_column(String(64), unique=True, nullable=False)


class Report(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "reports"

    tender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenders.id"), nullable=False)
    bidder_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("bidders.id"), nullable=True)
    path: Mapped[str] = mapped_column(String(1000), nullable=False)
    chain_head: Mapped[str] = mapped_column(String(64), nullable=False)
    generated_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)


class KBChunk(Base):
    __tablename__ = "kb_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    source: Mapped[str] = mapped_column(String(255), nullable=False)
    clause: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    url: Mapped[Optional[str]] = mapped_column(String(1000), nullable=True)
    effective_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)
