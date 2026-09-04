"""Root API Router for VigilBid v1 Endpoints."""

from datetime import datetime, timezone
import logging
from pathlib import Path
import re
from typing import Annotated, Any, Optional
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse, Response
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.core.database import get_db_session
from backend.core.rate_limit import create_rate_limiter_dependency, auth_login_limiter
from backend.core.security import create_access_token, verify_password
from backend.api.deps import get_current_token_payload, get_current_user, require_role
from backend.auth.jwt import TokenPayload
from backend.auth.rbac import UserRole
from backend.models.entities import User, Decision, Finding, Tender, Bidder, Document
from pipeline.registry_adapters import get_registry_provider
from pipeline.audit.hasher import verify_chain_full
from backend.services.audit_service import AuditService
from backend.schemas import (
    LoginRequest,
    TokenResponse,
    UserOut,
    TenderCreate,
    TenderUpdate,
    TenderSummary,
    TenderDetail,
    TenderListResponse,
    ComplianceMatrix,
    BidderCreate,
    BidderUpdate,
    BidderSummary,
    BidderProfile,
    BidderDetail,
    BidderListResponse,
    BidCreate,
    AttachBidderRequest,
    BidStatusUpdate,
    BidOut,
    BidListResponse,
    DocumentSummary,
    IngestionResponse,
    FindingOut,
    DecisionCreate,
    BidDecisionCreate,
    DecisionOut,
    CompleteReviewResponse,
    JobStatus,
    StepStatus,
    AnomalySignalOut,
    RiskProfileOut,
    AuditEventOut,
    AuditVerifyOut,
    BidderLinkGraphOut,
    CopilotQueryRequest,
    CopilotQueryResponse,
    RAGKnowledgeBaseStatus,
    DashboardMetricsOut,
    RequirementTraceabilityMatrix,
    RiskExplanationOut,
    HistoricalVerificationRecord,
)
from backend.services.tender_service import TenderService
from backend.services.bidder_service import BidderService
from backend.services.document_service import DocumentService
from backend.services.job_service import JobService
from backend.services.decision_service import DecisionService
from backend.services.copilot_service import CopilotService
from backend.services.dashboard_service import DashboardService
from pipeline.risk.graph import CrossBidderGraphBuilder

logger = logging.getLogger("vigilbid.api")
api_router = APIRouter()


# 0. Executive Dashboard Telemetry
@api_router.get("/dashboard/metrics", response_model=DashboardMetricsOut, tags=["Dashboard"])
async def get_dashboard_metrics(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve transparent system-wide procurement KPIs, compliance distributions, risk metrics, and processing performance."""
    metrics = await DashboardService.get_metrics(session)
    return DashboardMetricsOut(**metrics)


@api_router.post(
    "/auth/login",
    response_model=TokenResponse,
    dependencies=[Depends(create_rate_limiter_dependency(auth_login_limiter))],
    tags=["Auth"],
)
async def login(
    request: LoginRequest,
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Authenticate officer, evaluator, vigilance, or admin credentials."""
    clean_email = request.email.lower().strip()
    stmt = select(User).where(User.email == clean_email)
    result = await session.execute(stmt)
    user = result.scalar_one_or_none()

    # Never log plain passwords; constant-time check failure
    if not user or not verify_password(request.password, user.password_hash):
        logger.warning("Failed login attempt for user: %s", clean_email)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(subject=str(user.id), role=user.role)
    logger.info("User logged in successfully: %s (role: %s)", user.email, user.role)

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user=UserOut.model_validate(user),
    )


@api_router.get("/auth/me", response_model=UserOut, tags=["Auth"])
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    """Retrieve current authenticated user profile."""
    return UserOut.model_validate(current_user)


@api_router.post("/auth/logout", tags=["Auth"])
async def logout(token: Annotated[TokenPayload, Depends(get_current_token_payload)]):
    """Stateless logout endpoint acknowledging client-side token discard."""
    logger.info("User session logged out: %s (role: %s)", token.sub, token.role)
    return {
        "status": "ok",
        "message": "Logged out successfully. Please discard the access token from client storage.",
    }


# 2. Tender Endpoints
@api_router.get("/tenders", response_model=TenderListResponse, tags=["Tenders"])
async def list_tenders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db_session)] = None,
):
    """List tenders with status and bidder counts."""
    result = await TenderService.list_tenders(session, page=page, limit=limit, status_filter=status)
    items_out = []
    for t in result["items"]:
        items_out.append(
            TenderSummary(
                id=t.id,
                nit_no=t.nit_no,
                title=t.title,
                portal=t.portal,
                status=t.status,
                estimated_value=t.estimated_value,
                bid_due_date=t.bid_due_date,
                bidder_count=len(t.bidders) if hasattr(t, "bidders") and t.bidders else 0,
                created_at=t.created_at,
            )
        )
    return TenderListResponse(
        items=items_out,
        total=result["total"],
        page=result["page"],
        limit=result["limit"],
        pages=result["pages"],
    )


@api_router.post("/tenders", response_model=TenderDetail, status_code=status.HTTP_201_CREATED, tags=["Tenders"])
async def create_tender(
    payload: TenderCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Create tender and initialize criteria from CPCL template."""
    tender = await TenderService.create_tender(session, payload, current_user.id)
    return tender


@api_router.get("/tenders/{tender_id}", response_model=TenderDetail, tags=["Tenders"])
async def get_tender(
    tender_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Get tender details and criteria."""
    return await TenderService.get_tender(session, tender_id)


@api_router.patch("/tenders/{tender_id}", response_model=TenderDetail, tags=["Tenders"])
@api_router.put("/tenders/{tender_id}", response_model=TenderDetail, tags=["Tenders"])
async def update_tender(
    tender_id: uuid.UUID,
    payload: TenderUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Update tender metadata or lifecycle status."""
    return await TenderService.update_tender(session, tender_id, payload)


@api_router.get("/tenders/{tender_id}/matrix", response_model=ComplianceMatrix, tags=["Tenders"])
async def get_compliance_matrix(
    tender_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Compliance Matrix heatmap across all criteria and bidders."""
    matrix_data = await TenderService.get_compliance_matrix(session, tender_id)
    return ComplianceMatrix(**matrix_data)


# 3. Bidder & Bid Endpoints
@api_router.post("/bidders", response_model=BidderProfile, status_code=status.HTTP_201_CREATED, tags=["Bidders"])
async def create_bidder(
    payload: BidderCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Create vendor profile with encrypted PAN/GSTIN and legal canonicalization."""
    return await BidderService.create_bidder(session, payload)


@api_router.get("/bidders", response_model=BidderListResponse, tags=["Bidders"])
async def list_bidders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, description="Search by declared or canonical vendor name"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db_session)] = None,
):
    """List all registered vendor profiles with search and pagination."""
    result = await BidderService.list_bidders(session, page=page, limit=limit, search=search)
    return BidderListResponse(**result)


@api_router.get("/bidders/{bidder_id}", response_model=BidderProfile, tags=["Bidders"])
async def get_bidder(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve vendor master profile with masked PAN/GSTIN."""
    return await BidderService.get_bidder(session, bidder_id)


@api_router.patch("/bidders/{bidder_id}", response_model=BidderProfile, tags=["Bidders"])
async def update_bidder(
    bidder_id: uuid.UUID,
    payload: BidderUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Update vendor master profile contact, address, or company registration details."""
    return await BidderService.update_bidder(session, bidder_id, payload)


@api_router.post("/tenders/{tender_id}/bidders", response_model=BidOut, status_code=status.HTTP_201_CREATED, tags=["Bidders"])
async def attach_bidder_to_tender(
    tender_id: uuid.UUID,
    payload: AttachBidderRequest,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Register and attach a bidder to a tender, creating a formal Bid record."""
    return await BidderService.attach_bidder_to_tender(session, tender_id, payload)


@api_router.get("/tenders/{tender_id}/bidders", response_model=list[BidOut], tags=["Bidders"])
async def list_tender_bidders(
    tender_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """List all participating bidders and bids for a specific tender."""
    return await BidderService.list_tender_bidders(session, tender_id)


@api_router.post("/bids", response_model=BidOut, status_code=status.HTTP_201_CREATED, tags=["Bids"])
async def create_bid(
    payload: BidCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Create a bid record explicitly linking tender and bidder."""
    return await BidderService.create_bid(session, payload)


@api_router.get("/bids", response_model=BidListResponse, tags=["Bids"])
async def list_bids(
    tender_id: Optional[uuid.UUID] = Query(None),
    bidder_id: Optional[uuid.UUID] = Query(None),
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db_session)] = None,
):
    """List bids filterable by tender, bidder, and evaluation status."""
    result = await BidderService.list_bids(
        session, tender_id=tender_id, bidder_id=bidder_id, status_filter=status, page=page, limit=limit
    )
    return BidListResponse(**result)


@api_router.get("/bids/{bid_id}", response_model=BidOut, tags=["Bids"])
async def get_bid(
    bid_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve detailed bid metadata and evaluation status."""
    return await BidderService.get_bid(session, bid_id)


@api_router.patch("/bids/{bid_id}/status", response_model=BidOut, tags=["Bids"])
async def update_bid_status(
    bid_id: uuid.UUID,
    payload: BidStatusUpdate,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.EVALUATOR, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Update bid evaluation lifecycle status."""
    return await BidderService.update_bid_status(session, bid_id, payload)


@api_router.post("/bidders/{bidder_id}/documents/{doc_id}/retag", tags=["Bidders"])
async def retag_document(
    bidder_id: uuid.UUID,
    doc_id: uuid.UUID,
    doc_type: str,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER))],
):
    """Reclassify document and re-trigger pipeline from Step 4."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Retagging not yet implemented")





@api_router.post("/bidders/{bidder_id}/documents", response_model=IngestionResponse, status_code=status.HTTP_201_CREATED, tags=["Documents"])
async def upload_documents(
    bidder_id: uuid.UUID,
    files: list[UploadFile] = File(..., description="PDF or ZIP archives containing PDFs"),
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))] = None,
    session: Annotated[AsyncSession, Depends(get_db_session)] = None,
):
    """Safely ingest PDF documents or ZIP packages with zip bomb protection and deduplication."""
    doc_service = DocumentService()
    return await doc_service.ingest_uploaded_files(session, bidder_id, files)


@api_router.get("/bidders/{bidder_id}/documents", response_model=list[DocumentSummary], tags=["Documents"])
async def list_bidder_documents(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """List all ingested documents for a specific bidder."""
    return await DocumentService.list_bidder_documents(session, bidder_id)


@api_router.get("/documents/{doc_id}", response_model=DocumentSummary, tags=["Documents"])
async def get_document(
    doc_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve document metadata and fingerprint."""
    doc = await DocumentService.get_document(session, doc_id)
    return DocumentSummary(
        id=doc.id,
        bidder_id=doc.bidder_id,
        original_filename=doc.original_filename,
        sha256=doc.sha256,
        mime=doc.mime,
        page_count=doc.page_count,
        doc_type=doc.doc_type,
        storage_path=doc.storage_path,
        created_at=doc.created_at,
    )


import tempfile


def is_safe_storage_path(path: Path) -> bool:
    """Validate that file resides within storage root (or temp dir during testing)."""
    try:
        resolved = path.resolve()
        storage_root = Path(settings.STORAGE_DIR).resolve()
        if resolved.is_relative_to(storage_root):
            return True
        if settings.ENVIRONMENT.lower() in ("development", "test", "testing"):
            temp_root = Path(tempfile.gettempdir()).resolve()
            if resolved.is_relative_to(temp_root):
                return True
        return False
    except Exception:
        return False


@api_router.get("/documents/{doc_id}/download", tags=["Documents"])
async def download_document(
    doc_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Download original document safely with attachment disposition and path traversal defense."""
    doc = await DocumentService.get_document(session, doc_id)
    doc_path = Path(doc.storage_path).resolve()
    if not is_safe_storage_path(doc_path):
        logger.error("Security alert: Attempted path escape for document %s: %s", doc_id, doc.storage_path)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access outside storage root denied")
    if not doc_path.exists() or not doc_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found on disk")

    safe_filename = re.sub(r'[\r\n"\\;]', '_', doc.original_filename or f"{doc_id}.pdf")
    return FileResponse(
        path=str(doc_path),
        filename=safe_filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{safe_filename}"'},
    )


@api_router.get("/documents/{doc_id}/file", tags=["Documents"])
async def get_document_file(
    doc_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.APPROVER, UserRole.AUDITOR, UserRole.EVALUATOR, UserRole.VIGILANCE, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Fetch and stream original PDF file with inline disposition and path traversal defense."""
    doc = await DocumentService.get_document(session, doc_id)
    doc_path = Path(doc.storage_path).resolve()
    if not is_safe_storage_path(doc_path):
        logger.error("Security alert: Attempted path escape for document %s: %s", doc_id, doc.storage_path)
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access outside storage root denied")
    if not doc_path.exists() or not doc_path.is_file():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document file not found on disk")

    safe_filename = re.sub(r'[\r\n"\\;]', '_', doc.original_filename or f"{doc_id}.pdf")
    return FileResponse(
        path=str(doc_path),
        filename=safe_filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{safe_filename}"'},
    )


@api_router.get("/documents/{doc_id}/pages/{page_no}.png", tags=["Documents"])
async def get_document_page_png(
    doc_id: uuid.UUID,
    page_no: int,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    dpi: int = Query(150, ge=72, le=300),
):
    """Render and stream raster PNG image of a specific document page for evidence overlay."""
    png_bytes = await DocumentService.render_document_page(session, doc_id, page_no, dpi=dpi)
    return Response(content=png_bytes, media_type="image/png")


# 4. Jobs & Pipeline Status
@api_router.get("/jobs/{job_id}", response_model=JobStatus, tags=["Jobs"])
async def get_job_status(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve current processing status and step progress for a pipeline job."""
    job_service = JobService()
    job = await job_service.get_job(session, job_id)
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job with ID '{job_id}' not found.",
        )
    return JobStatus(
        id=job.id,
        bidder_id=job.bidder_id,
        status=job.status,
        current_step=job.current_step,
        steps=[StepStatus(**s) for s in (job.steps or [])],
        error=job.error,
        created_at=job.created_at,
        started_at=job.started_at,
        ended_at=job.ended_at,
    )


@api_router.get("/bidders/{bidder_id}/jobs", response_model=list[JobStatus], tags=["Jobs"])
async def list_bidder_jobs(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """List all processing jobs associated with a bidder."""
    job_service = JobService()
    jobs = await job_service.list_jobs_for_bidder(session, bidder_id)
    return [
        JobStatus(
            id=job.id,
            bidder_id=job.bidder_id,
            status=job.status,
            current_step=job.current_step,
            steps=[StepStatus(**s) for s in (job.steps or [])],
            error=job.error,
            created_at=job.created_at,
            started_at=job.started_at,
            ended_at=job.ended_at,
        )
        for job in jobs
    ]


@api_router.post("/jobs/{job_id}/process", response_model=JobStatus, tags=["Jobs"])
async def trigger_job_processing(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Trigger full 11-step pipeline processing for a specific job."""
    job_service = JobService()
    job = await job_service.process_job_full_pipeline(session, job_id)
    return JobStatus(
        id=job.id,
        bidder_id=job.bidder_id,
        status=job.status,
        current_step=job.current_step,
        steps=[StepStatus(**s) for s in (job.steps or [])],
        error=job.error,
        created_at=job.created_at,
        started_at=job.started_at,
        ended_at=job.ended_at,
    )


@api_router.post("/jobs/{job_id}/process-ocr", response_model=JobStatus, tags=["Jobs"])
async def trigger_job_ocr_only(
    job_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Trigger OCR-only processing (steps 1-4) for a specific job."""
    job_service = JobService()
    job = await job_service.process_job_ocr(session, job_id)
    return JobStatus(
        id=job.id,
        bidder_id=job.bidder_id,
        status=job.status,
        current_step=job.current_step,
        steps=[StepStatus(**s) for s in (job.steps or [])],
        error=job.error,
        created_at=job.created_at,
        started_at=job.started_at,
        ended_at=job.ended_at,
    )


# 5. Findings & Decisions
@api_router.get("/bidders/{bidder_id}/findings", response_model=list[FindingOut], tags=["Findings"])
async def list_findings(
    bidder_id: uuid.UUID,
    status: Optional[str] = None,
    pending: bool = Query(False, description="Filter for unresolved pending findings"),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db_session)] = None,
):
    """List findings for a bidder with evidence bounding boxes, decision history, and resolution status."""
    if pending:
        findings = await DecisionService.get_pending_findings(session, bidder_id)
    else:
        stmt = (
            select(Finding)
            .options(selectinload(Finding.decisions).selectinload(Decision.actor))
            .where(Finding.bidder_id == bidder_id)
        )
        if status:
            stmt = stmt.where(Finding.status == status.upper())
        res = await session.execute(stmt)
        findings = list(res.scalars().all())

    results = []
    for f in findings:
        decisions_list = getattr(f, "decisions", []) or []
        latest_dec = None
        if decisions_list:
            sorted_decs = sorted(decisions_list, key=lambda d: getattr(d, "created_at", None) or datetime.min)
            last = sorted_decs[-1]
            latest_dec = DecisionOut(
                id=last.id,
                finding_id=last.finding_id,
                bidder_id=last.bidder_id,
                bid_id=last.bid_id,
                actor_id=last.actor_id,
                actor_name=last.actor.full_name if getattr(last, "actor", None) else None,
                actor_role=last.actor.role if getattr(last, "actor", None) else None,
                action=last.action,
                reason=last.reason,
                resulting_status=last.resulting_status,
                machine_recommendation=last.machine_recommendation or f.status,
                audit_ref=last.audit_ref,
                created_at=last.created_at or datetime.now(timezone.utc),
            )
        is_res = (f.status == "PASS") or (latest_dec is not None and latest_dec.action in ("ACCEPT", "OVERRIDE", "REJECT"))
        results.append(
            FindingOut(
                id=f.id,
                bidder_id=f.bidder_id,
                criterion_id=f.criterion_id,
                rule_id=f.rule_id,
                rule_version=getattr(f, "rule_version", None) or "1.0",
                status=f.status,
                title=f.title,
                explanation=f.explanation,
                citation=f.citation,
                evidence=f.evidence,
                confidence=float(f.confidence) if f.confidence is not None else None,
                extracted=f.extracted,
                expected=f.expected,
                machine_recommendation=latest_dec.machine_recommendation if latest_dec else f.status,
                latest_decision=latest_dec,
                is_resolved=is_res,
                created_at=f.created_at or datetime.now(timezone.utc),
            )
        )
    return results


@api_router.get(
    "/bidders/{bidder_id}/requirement-matrix",
    response_model=RequirementTraceabilityMatrix,
    tags=["Findings"],
)
async def get_bidder_requirement_matrix(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve requirement-to-evidence matrix mapping each tender requirement to observed values and visual citations."""
    data = await BidderService.get_requirement_matrix(session, bidder_id)
    return RequirementTraceabilityMatrix(**data)


@api_router.post("/findings/{finding_id}/decision", response_model=DecisionOut, tags=["Findings"])
async def record_decision(
    finding_id: uuid.UUID,
    payload: DecisionCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.EVALUATOR, UserRole.APPROVER))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Record officer decision (ACCEPT/REJECT/REQUEST_CLARIFICATION/OVERRIDE) with reason validation."""
    return await DecisionService.record_finding_decision(session, finding_id, payload, current_user)


@api_router.get("/findings/{finding_id}/decisions", response_model=list[DecisionOut], tags=["Findings"])
async def get_finding_decisions(
    finding_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve decision history for a specific finding."""
    return await DecisionService.get_decision_history(session, finding_id=finding_id)


@api_router.get("/bidders/{bidder_id}/decisions", response_model=list[DecisionOut], tags=["Decisions"])
async def get_bidder_decisions(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve all decision history across findings and bids for a bidder."""
    return await DecisionService.get_decision_history(session, bidder_id=bidder_id)


@api_router.get(
    "/bidders/{bidder_id}/verification-history",
    response_model=HistoricalVerificationRecord,
    tags=["Decisions"],
)
async def get_historical_verification_record(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve historical verification record containing snapshot of evaluated documents, rules, findings, and decisions."""
    data = await BidderService.get_verification_history(session, bidder_id)
    return HistoricalVerificationRecord(**data)


@api_router.post("/bidders/{bidder_id}/complete-review", response_model=CompleteReviewResponse, tags=["Bidders"])
async def complete_bidder_review(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.APPROVER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Finalize bidder evaluation once all mandatory findings are decided."""
    return await DecisionService.complete_review_for_bidder(session, bidder_id, current_user)


# 5b. Bid-Level Decisions & Complete-Review
@api_router.post("/bids/{bid_id}/decision", response_model=DecisionOut, tags=["Bids"])
async def record_bid_decision(
    bid_id: uuid.UUID,
    payload: BidDecisionCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.EVALUATOR, UserRole.APPROVER))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Record officer evaluation decision on a specific bid (/api/v1/bids/{id}/decision)."""
    return await DecisionService.record_bid_decision(session, bid_id, payload, current_user)


@api_router.get("/bids/{bid_id}/decisions", response_model=list[DecisionOut], tags=["Bids"])
async def get_bid_decisions(
    bid_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve decision history for a specific bid."""
    return await DecisionService.get_decision_history(session, bid_id=bid_id)


@api_router.post("/bids/{bid_id}/complete-review", response_model=CompleteReviewResponse, tags=["Bids"])
async def complete_bid_review(
    bid_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.APPROVER, UserRole.ADMIN))],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Finalize evaluation review for a bid, ensuring no unresolved mandatory findings remain."""
    return await DecisionService.complete_review_for_bid(session, bid_id, current_user)


# 6. Risk Profile & Anomalies
@api_router.get("/bidders/{bidder_id}/risk", response_model=RiskProfileOut, tags=["Risk"])
async def get_risk_profile(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve transparent risk score, drivers, and forensic anomalies."""
    risk_data = await BidderService.get_risk_profile(session, bidder_id)
    return RiskProfileOut(**risk_data)


@api_router.get("/bidders/{bidder_id}/risk/explain", response_model=RiskExplanationOut, tags=["Risk"])
async def explain_bidder_risk(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve human-readable explainable risk breakdown answering WHY for every risk factor."""
    data = await BidderService.explain_risk(session, bidder_id)
    return RiskExplanationOut(**data)


@api_router.get("/bidders/{bidder_id}/anomalies", response_model=list[AnomalySignalOut], tags=["Risk"])
async def get_bidder_anomalies(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve document structural and forensic anomalies for a bidder."""
    risk_data = await BidderService.get_risk_profile(session, bidder_id)
    return [AnomalySignalOut(**a) for a in risk_data.get("anomalies", [])]



# 7. Procurement Copilot & RAG Knowledge Base
@api_router.post("/copilot/query", response_model=CopilotQueryResponse, tags=["Copilot"])
async def query_copilot(
    payload: CopilotQueryRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Query procurement copilot across regulatory, tender, bidder, and evidence knowledge domains."""
    return await CopilotService.answer_query(session, payload, current_user)


@api_router.get("/copilot/knowledge-domains", response_model=RAGKnowledgeBaseStatus, tags=["Copilot"])
async def get_knowledge_domains(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve status and chunk inventory for all 4 procurement knowledge domains."""
    return CopilotService.get_knowledge_base_status()


# 8. Audit Trail & Dossiers
@api_router.get("/tenders/{tender_id}/audit", response_model=list[AuditEventOut], tags=["Audit"])
async def get_audit_trail(
    tender_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db_session)] = None,
):
    """Retrieve tamper-evident audit trail events for a specific tender."""
    events = await AuditService.get_audit_trail(session, tender_id=tender_id, page=page, limit=limit)
    return [AuditEventOut.model_validate(e) for e in events]


@api_router.get("/audit/trail", response_model=list[AuditEventOut], tags=["Audit"])
async def get_global_audit_trail(
    target_type: Optional[str] = Query(None),
    target_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: Annotated[User, Depends(get_current_user)] = None,
    session: Annotated[AsyncSession, Depends(get_db_session)] = None,
):
    """Retrieve tamper-evident global audit trail events with optional filtering."""
    events = await AuditService.get_audit_trail(
        session, target_type=target_type, target_id=target_id, action=action, page=page, limit=limit
    )
    return [AuditEventOut.model_validate(e) for e in events]


@api_router.get("/audit/verify", response_model=AuditVerifyOut, tags=["Audit"])
async def verify_audit_chain(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Verify cryptographic SHA-256 hash-chain integrity for all recorded events."""
    res = await AuditService.verify_chain(session)
    return AuditVerifyOut(**res)


@api_router.post("/audit/verify", response_model=AuditVerifyOut, tags=["Audit"])
async def verify_audit_chain_post(
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
    payload: Optional[list[dict[str, Any]]] = None,
):
    """Verify cryptographic SHA-256 hash-chain integrity via POST for external payloads or database log."""
    if payload is not None:
        res = verify_chain_full(payload)
    else:
        res = await AuditService.verify_chain(session)
    return AuditVerifyOut(**res)


@api_router.get("/bidders/{bidder_id}/report.pdf", tags=["Reports"])
async def export_bidder_dossier(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Export CVC/RTI-ready PDF compliance dossier."""
    from pipeline.reports.dossier import DossierGenerator

    # 1. Fetch bidder
    b_stmt = select(Bidder).where(Bidder.id == bidder_id)
    b_res = await session.execute(b_stmt)
    bidder = b_res.scalar_one_or_none()
    if not bidder:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Bidder '{bidder_id}' not found.",
        )

    # 2. Fetch tender
    tender_dict = {"nit_number": "CPCL/TENDER/2026", "title": "Goods Procurement"}
    if bidder.tender_id:
        t_stmt = select(Tender).where(Tender.id == bidder.tender_id)
        t_res = await session.execute(t_stmt)
        tender = t_res.scalar_one_or_none()
        if tender:
            tender_dict = {
                "nit_number": getattr(tender, "nit_no", "CPCL/TENDER/2026"),
                "title": tender.title,
            }

    # 3. Fetch findings
    f_stmt = select(Finding).where(Finding.bidder_id == bidder_id)
    f_res = await session.execute(f_stmt)
    findings = f_res.scalars().all()
    findings_dicts = [
        {
            "rule_id": f.rule_id,
            "status": f.status,
            "title": f.title,
            "explanation": f.explanation,
            "evidence": f.evidence or [],
        }
        for f in findings
    ]

    # 4. Fetch decisions
    dec_stmt = select(Decision).where(Decision.bidder_id == bidder_id)
    dec_res = await session.execute(dec_stmt)
    decisions = dec_res.scalars().all()
    dec_dicts = [
        {
            "action": d.action,
            "reason": d.reason,
            "created_at": d.created_at.strftime("%Y-%m-%d %H:%M:%S UTC") if d.created_at else "",
        }
        for d in decisions
    ]

    # 5. Fetch audit head
    audit_res = await AuditService.verify_chain(session)
    chain_head = audit_res.get("chain_head", "")

    bidder_dict = {
        "canonical_name": bidder.canonical_name or bidder.declared_name,
        "declared_name": bidder.declared_name,
        "pan": getattr(bidder, "pan", None) or "NOT DECLARED",
        "gstin": getattr(bidder, "gstin", None) or "NOT DECLARED",
        "risk_score": bidder.risk_score or 0,
        "risk_band": bidder.risk_band or "LOW",
        "review_state": bidder.review_state or "PENDING",
    }

    generator = DossierGenerator()
    pdf_bytes = generator.generate_bidder_dossier(
        tender=tender_dict,
        bidder=bidder_dict,
        findings=findings_dicts,
        chain_head=chain_head,
        decisions=dec_dicts,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="dossier_{bidder_id}.pdf"'},
    )


@api_router.get("/tenders/{tender_id}/report.pdf", tags=["Reports"])
async def export_tender_report(
    tender_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Export tender-level compliance evaluation report."""
    from pipeline.reports.dossier import DossierGenerator

    t_stmt = select(Tender).where(Tender.id == tender_id)
    t_res = await session.execute(t_stmt)
    tender = t_res.scalar_one_or_none()
    if not tender:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Tender '{tender_id}' not found.",
        )

    tender_dict = {
        "nit_number": getattr(tender, "nit_no", "CPCL/TENDER/2026"),
        "title": tender.title,
        "estimated_value": float(tender.estimated_value) if tender.estimated_value else 0.0,
        "bid_due_date": str(tender.bid_due_date) if tender.bid_due_date else "",
    }

    matrix_data = await TenderService.get_compliance_matrix(session, tender_id)
    audit_res = await AuditService.verify_chain(session)
    chain_head = audit_res.get("chain_head", "")

    generator = DossierGenerator()
    pdf_bytes = generator.generate_tender_report(
        tender=tender_dict,
        matrix=matrix_data,
        chain_head=chain_head,
    )

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="tender_report_{tender_id}.pdf"'},
    )


# 9. Registry Verification & Simulation
@api_router.get("/registry/scenarios", tags=["Registry"])
async def get_registry_scenarios(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve catalog of available deterministic registry simulation scenarios."""
    return {
        "disclaimer": "DEMO / MOCK / SYNTHETIC — Statutory Registry Simulation Engine",
        "scenarios": [
            {"id": "NORMAL", "description": "Returns verified, active registered taxpayer/enterprise records from fixtures."},
            {"id": "MISMATCH", "description": "Simulates identity divergence between declared bidder and registered taxpayer."},
            {"id": "EXPIRED", "description": "Simulates cancelled GST registration or inoperative PAN under Sec 139AA."},
            {"id": "NOT_FOUND", "description": "Simulates unregistered statutory identifier absent from registry records."},
            {"id": "API_UNAVAILABLE", "description": "Simulates 503 statutory portal gateway timeout (withholds compliance to REVIEW)."},
            {"id": "DEBARRED", "description": "Simulates debarment order hit on CPPP / GeM national blacklist."},
        ],
    }


@api_router.get("/demo/failure-modes", tags=["Demo & Chaos"])
async def get_demo_failure_modes(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """List available failure modes for presenter demonstration."""
    from pipeline.demo.chaos_simulator import ChaosSimulator
    return {
        "disclaimer": "DEMO / MOCK / SYNTHETIC — Controlled Chaos & Failure Demonstration",
        "modes": ChaosSimulator.list_failure_modes(),
    }


@api_router.post("/demo/simulate-failure", tags=["Demo & Chaos"])
async def simulate_demo_failure(
    payload: dict[str, Any],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Execute a controlled synthetic failure mode for evaluator and presenter demonstration."""
    from pipeline.demo.chaos_simulator import ChaosSimulator
    mode = payload.get("failure_mode", "REGISTRY_TIMEOUT")
    context = payload.get("context", {})
    result = ChaosSimulator.simulate_failure(mode, context)
    return result.to_dict()


@api_router.get("/registry/debarment", tags=["Registry"])
async def check_registry_debarment(
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.EVALUATOR, UserRole.VIGILANCE, UserRole.ADMIN))],
    pan: Optional[str] = Query(default=None),
    name: Optional[str] = Query(default=None),
    gstin: Optional[str] = Query(default=None),
    cin: Optional[str] = Query(default=None),
    scenario: Optional[str] = Query(default=None),
):
    """Query national debarment and blacklist records."""
    provider = get_registry_provider()
    result = await provider.check_debarment(name=name, pan=pan, gstin=gstin, cin=cin, scenario=scenario)
    return result.to_dict()


@api_router.get("/registry/{kind}/{value}", tags=["Registry"])
async def check_registry(
    kind: str,
    value: str,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.EVALUATOR, UserRole.VIGILANCE, UserRole.ADMIN))],
    scenario: Optional[str] = Query(default=None),
):
    """Query statutory registry verification provider (GST, PAN, Udyam, CIN)."""
    provider = get_registry_provider()
    kind_lower = kind.strip().lower()
    if kind_lower in ("gst", "gstin"):
        res = await provider.verify_gstin(value, scenario=scenario)
    elif kind_lower == "pan":
        res = await provider.verify_pan(value, scenario=scenario)
    elif kind_lower in ("udyam", "msme"):
        res = await provider.verify_udyam(value, scenario=scenario)
    elif kind_lower in ("cin", "mca"):
        res = await provider.verify_cin(value, scenario=scenario)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported registry kind '{kind}'. Supported: gstin, pan, udyam, cin",
        )
    return res.to_dict()


# 10. Cross-Bidder Link Graph Endpoints
@api_router.get("/tenders/{tender_id}/graph", response_model=BidderLinkGraphOut, tags=["Risk & Collusion"])
async def get_tender_bidder_graph(
    tender_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Retrieve the Cross-Bidder Link Graph for all bidders attached to a tender."""
    tender = await TenderService.get_tender_by_id(session, tender_id)
    if not tender:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tender not found")

    bidders_data: list[dict[str, Any]] = []
    if hasattr(tender, "bidders") and tender.bidders:
        for b in tender.bidders:
            b_dict = {
                "bidder_id": str(b.id),
                "company_name": b.canonical_name or b.declared_name,
                "pan": b.pan,
                "gstin": b.gstin,
                "risk_score": b.risk_score or 0,
                "risk_band": b.risk_band or "LOW",
            }
            if hasattr(b, "profile") and isinstance(b.profile, dict):
                b_dict.update(b.profile)
            bidders_data.append(b_dict)

    builder = CrossBidderGraphBuilder()
    graph = builder.build_graph(bidders_data, tender_id=str(tender_id))
    return graph.to_dict()


@api_router.post("/risk/graph", response_model=BidderLinkGraphOut, tags=["Risk & Collusion"])
async def compute_cross_bidder_graph(
    payload: dict[str, Any],
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.EVALUATOR, UserRole.VIGILANCE, UserRole.ADMIN))],
):
    """Compute deterministic Cross-Bidder Link Graph from raw bidder metadata payload."""
    bidders_data = payload.get("bidders", [])
    tender_id = payload.get("tender_id")
    builder = CrossBidderGraphBuilder()
    graph = builder.build_graph(bidders_data, tender_id=tender_id)
    return graph.to_dict()




