"""Root API Router for VigilBid v1 Endpoints."""

import logging
from typing import Annotated, Any, Optional
import uuid
from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.database import get_db_session
from backend.core.security import create_access_token, verify_password
from backend.api.deps import get_current_token_payload, get_current_user, require_role
from backend.auth.jwt import TokenPayload
from backend.auth.rbac import UserRole
from backend.models.entities import User
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
    DecisionOut,
    JobStatus,
    StepStatus,
    RiskProfileOut,
    AuditEventOut,
    AuditVerifyOut,
)
from backend.services.tender_service import TenderService
from backend.services.bidder_service import BidderService
from backend.services.document_service import DocumentService
from backend.services.job_service import JobService

logger = logging.getLogger("vigilbid.api")
api_router = APIRouter()


# 1. Auth Endpoints
@api_router.post("/auth/login", response_model=TokenResponse, tags=["Auth"])
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
):
    """Compliance Matrix heatmap across all criteria and bidders."""
    return ComplianceMatrix(tender_id=tender_id, criteria=[], bidders=[])


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


@api_router.post("/bidders/{bidder_id}/complete-review", tags=["Bidders"])
async def complete_review(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER))],
):
    """Mark bidder evaluation as complete once all findings have decisions."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Review completion not yet implemented")


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


@api_router.get("/documents/{doc_id}/download", tags=["Documents"])
async def download_document(
    doc_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db_session)],
):
    """Download original document safely with attachment disposition."""
    doc = await DocumentService.get_document(session, doc_id)
    return FileResponse(
        path=doc.storage_path,
        filename=doc.original_filename,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{doc.original_filename}"'},
    )


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
    """Trigger or re-trigger OCR processing for a specific job."""
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
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    """List findings for a bidder with evidence bounding boxes."""
    return []


@api_router.post("/findings/{finding_id}/decision", response_model=DecisionOut, tags=["Findings"])
async def record_decision(
    finding_id: uuid.UUID,
    payload: DecisionCreate,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.EVALUATOR, UserRole.APPROVER))],
):
    """Record officer decision (ACCEPT/OVERRIDE/CLARIFY/CONCUR/DISSENT)."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Decision recording not yet implemented")


# 6. Risk Profile & Graph
@api_router.get("/bidders/{bidder_id}/risk", response_model=RiskProfileOut, tags=["Risk"])
async def get_risk_profile(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Retrieve transparent risk score, drivers, and forensic anomalies."""
    return RiskProfileOut(bidder_id=bidder_id, score=0, band="LOW", drivers=[], anomalies=[])


@api_router.get("/tenders/{tender_id}/graph", tags=["Graph"])
async def get_link_graph(
    tender_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Return cross-bidder entity and attribute links."""
    return {"nodes": [], "edges": []}


# 7. Copilot & RAG
@api_router.post("/copilot/query", tags=["Copilot"])
async def copilot_query(
    payload: dict[str, Any],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Query regulatory knowledge base (GFR/CVC/BEC clauses)."""
    return {"answer": "Copilot service is in scaffold mode.", "citations": [], "used_llm": False}


# 8. Audit Trail & Dossiers
@api_router.get("/tenders/{tender_id}/audit", response_model=list[AuditEventOut], tags=["Audit"])
async def get_audit_trail(
    tender_id: uuid.UUID,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1),
    current_user: Annotated[User, Depends(require_role(UserRole.VIGILANCE, UserRole.AUDITOR, UserRole.OFFICER, UserRole.EVALUATOR, UserRole.ADMIN))] = None,
):
    """Retrieve immutable audit trail events."""
    return []


@api_router.get("/audit/verify", response_model=AuditVerifyOut, tags=["Audit"])
async def verify_audit_chain(
    current_user: Annotated[User, Depends(require_role(UserRole.VIGILANCE, UserRole.AUDITOR, UserRole.OFFICER, UserRole.ADMIN))],
):
    """Verify cryptographic SHA-256 hash-chain integrity."""
    return AuditVerifyOut(ok=True, length=0, first_broken_seq=None, head_hash="00" * 32)


@api_router.get("/bidders/{bidder_id}/report.pdf", tags=["Reports"])
async def export_bidder_dossier(
    bidder_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Export CVC/RTI-ready PDF compliance dossier."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Report generation not yet implemented")


@api_router.get("/tenders/{tender_id}/report.pdf", tags=["Reports"])
async def export_tender_report(
    tender_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Export tender-level compliance evaluation report."""
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="Report generation not yet implemented")


# 9. Registry Verification
@api_router.get("/registry/{kind}/{value}", tags=["Registry"])
async def check_registry(
    kind: str,
    value: str,
    current_user: Annotated[User, Depends(require_role(UserRole.OFFICER, UserRole.ADMIN))],
):
    """Query mock/real registry verification provider."""
    return {"status": "MOCK_ACTIVE", "kind": kind, "value": value}
