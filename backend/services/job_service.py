"""Job Service orchestrating processing jobs, status lifecycles, queue claims, and OCR pipeline execution."""

from datetime import datetime, timezone
import logging
from pathlib import Path
from typing import Any, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.entities import Bidder, Document, DocumentPage, Job
from backend.schemas.job import JobState, StepStatus
from pipeline.ocr.factory import get_ocr_provider
from pipeline.ocr.interface import OCRProvider
from pipeline.pdf.processor import PDFProcessor

logger = logging.getLogger("vigilbid.services.job")

DEFAULT_PIPELINE_STEPS = [
    {"name": "Ingestion & Safe Storage", "step_number": 1, "status": "DONE"},
    {"name": "Document Classification", "step_number": 2, "status": "QUEUED"},
    {"name": "Text Acquisition & OCR", "step_number": 3, "status": "QUEUED"},
    {"name": "Field Extraction", "step_number": 4, "status": "QUEUED"},
    {"name": "Data Normalization", "step_number": 5, "status": "QUEUED"},
    {"name": "Entity Resolution & Parity", "step_number": 6, "status": "QUEUED"},
    {"name": "Registry Verification", "step_number": 7, "status": "QUEUED"},
    {"name": "Compliance Rule Engine", "step_number": 8, "status": "QUEUED"},
    {"name": "Forensic Anomaly Scanning", "step_number": 9, "status": "QUEUED"},
    {"name": "Transparent Risk Scoring", "step_number": 10, "status": "QUEUED"},
    {"name": "Dossier Packaging", "step_number": 11, "status": "QUEUED"},
]


class JobService:
    """Manages lifecycle of asynchronous evaluation jobs and executes document OCR processing."""

    def __init__(self, ocr_provider: Optional[OCRProvider] = None):
        self.ocr_provider = ocr_provider or get_ocr_provider()
        self.pdf_processor = PDFProcessor()

    async def create_job(
        self,
        session: AsyncSession,
        bidder_id: uuid.UUID,
        initial_steps: Optional[list[dict[str, Any]]] = None,
    ) -> Job:
        """Create a new job in QUEUED state for a bidder."""
        # Verify bidder exists
        bidder_stmt = select(Bidder).where(Bidder.id == bidder_id)
        bidder_res = await session.execute(bidder_stmt)
        bidder = bidder_res.scalar_one_or_none()
        if not bidder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bidder with ID '{bidder_id}' not found.",
            )

        steps_data = initial_steps if initial_steps is not None else [dict(s) for s in DEFAULT_PIPELINE_STEPS]

        job = Job(
            id=uuid.uuid4(),
            bidder_id=bidder_id,
            status=JobState.QUEUED.value,
            current_step=1,
            steps=steps_data,
            created_at=datetime.now(timezone.utc),
        )
        session.add(job)
        await session.commit()
        if hasattr(session, "refresh"):
            await session.refresh(job)
        logger.info("Created processing Job %s for Bidder %s in state %s", job.id, bidder_id, job.status)
        return job

    async def get_job(self, session: AsyncSession, job_id: uuid.UUID) -> Optional[Job]:
        """Fetch job by ID."""
        stmt = select(Job).where(Job.id == job_id)
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_jobs_for_bidder(
        self,
        session: AsyncSession,
        bidder_id: uuid.UUID,
        limit: int = 20,
    ) -> list[Job]:
        """List jobs for a given bidder, newest first."""
        stmt = select(Job).where(Job.bidder_id == bidder_id).order_by(Job.created_at.desc()).limit(limit)
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def claim_next_job(self, session: AsyncSession) -> Optional[Job]:
        """Claim next QUEUED job atomically using SKIP LOCKED where supported."""
        stmt = (
            select(Job)
            .where(Job.status == JobState.QUEUED.value)
            .order_by(Job.created_at.asc())
            .limit(1)
        )
        # Attempt select with skip locked
        try:
            stmt = stmt.with_for_update(skip_locked=True)
        except Exception:
            pass  # Fallback on databases (e.g. SQLite) that don't support FOR UPDATE

        res = await session.execute(stmt)
        job = res.scalar_one_or_none()

        if job:
            job.status = JobState.PROCESSING.value
            job.started_at = datetime.now(timezone.utc)
            await session.commit()
            if hasattr(session, "refresh"):
                await session.refresh(job)
            logger.info("Claimed Job %s for processing", job.id)
            return job

        return None

    async def update_job_status(
        self,
        session: AsyncSession,
        job_id: uuid.UUID,
        new_status: str,
        current_step: Optional[int] = None,
        error: Optional[str] = None,
        steps: Optional[list[dict[str, Any]]] = None,
    ) -> Job:
        """Update job lifecycle state."""
        job = await self.get_job(session, job_id)
        if not job:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job with ID '{job_id}' not found.",
            )

        job.status = new_status
        if current_step is not None:
            job.current_step = current_step
        if error is not None:
            job.error = error
        if steps is not None:
            job.steps = steps

        now = datetime.now(timezone.utc)
        if new_status in (JobState.PROCESSING.value, JobState.RUNNING.value) and not job.started_at:
            job.started_at = now
        elif new_status in (JobState.DONE.value, JobState.FAILED.value):
            job.ended_at = now

        await session.commit()
        if hasattr(session, "refresh"):
            await session.refresh(job)
        return job

    async def process_job_ocr(
        self,
        session: AsyncSession,
        job_id: uuid.UUID,
    ) -> Job:
        """Execute the document acquisition & OCR step for all documents associated with the job's bidder."""
        job = await self.get_job(session, job_id)
        if not job:
            raise ValueError(f"Job {job_id} not found")

        # Set job state to PROCESSING
        job.status = JobState.PROCESSING.value
        job.started_at = datetime.now(timezone.utc)
        job.current_step = 3

        # Update step 3 status to RUNNING
        current_steps = list(job.steps or DEFAULT_PIPELINE_STEPS)
        for s in current_steps:
            if s.get("step_number") == 3:
                s["status"] = "RUNNING"
                s["started_at"] = datetime.now(timezone.utc).isoformat()
        job.steps = current_steps
        await session.commit()

        try:
            # Look up all documents for this bidder
            doc_stmt = select(Document).where(Document.bidder_id == job.bidder_id)
            doc_res = await session.execute(doc_stmt)
            docs = list(doc_res.scalars().all())

            if not docs:
                logger.warning("Job %s has no uploaded documents for Bidder %s", job_id, job.bidder_id)

            for doc in docs:
                storage_path = Path(doc.storage_path)
                if not storage_path.exists():
                    raise FileNotFoundError(f"Stored document file missing on disk: {doc.storage_path}")

                pdf_bytes = storage_path.read_bytes()
                process_result = self.pdf_processor.process(
                    pdf_source=pdf_bytes,
                    doc_id=str(doc.id),
                )

                if not process_result.is_valid:
                    raise ValueError(f"Corrupt or invalid PDF document {doc.id}: {process_result.error_message}")

                # Process OCR on pages requiring it
                total_conf = 0.0
                has_ocr_pages = False

                for page_res in process_result.pages:
                    needs_ocr = (
                        (page_res.metadata and not page_res.metadata.has_text_layer)
                        or (page_res.confidence == 0.0)
                        or (len(page_res.text.strip()) < 50)
                    )
                    # If page is scanned / sparse, invoke OCRProvider
                    if needs_ocr:
                        has_ocr_pages = True
                        ocr_res = self.ocr_provider.extract_from_pdf_page(
                            pdf_bytes=pdf_bytes,
                            page=page_res.page_no,
                            document_id=str(doc.id),
                        )
                        if ocr_res.error:
                            logger.warning("OCR warning on page %d of doc %s: %s", page_res.page_no, doc.id, ocr_res.error)

                        # Update page with OCR text and regions
                        page_res.text = ocr_res.text
                        page_res.confidence = ocr_res.confidence
                        from pipeline.pdf.contract import WordBox
                        page_res.words = [
                            WordBox(
                                text=r.text,
                                bbox=r.bbox,
                                block_no=0,
                                line_no=0,
                                word_no=idx,
                            )
                            for idx, r in enumerate(ocr_res.regions)
                        ]

                    total_conf += page_res.confidence

                # Persist extracted pages to database
                await self.pdf_processor.persist_to_database(
                    session=session,
                    document_id=doc.id,
                    result=process_result,
                )

                # Update document text_source and average confidence
                avg_conf = (total_conf / len(process_result.pages)) if process_result.pages else 1.0
                doc.text_source = "ocr" if has_ocr_pages else "text_layer"
                doc.ocr_conf = round(avg_conf, 3)

            # Mark step 3 and overall Job as DONE
            for s in current_steps:
                if s.get("step_number") == 3:
                    s["status"] = "DONE"
                    s["ended_at"] = datetime.now(timezone.utc).isoformat()
            job.steps = current_steps
            job.status = JobState.DONE.value
            job.ended_at = datetime.now(timezone.utc)
            await session.commit()
            if hasattr(session, "refresh"):
                await session.refresh(job)
            logger.info("Job %s successfully completed OCR processing", job.id)
            return job

        except Exception as exc:
            logger.error("Job %s failed during OCR processing: %s", job_id, exc, exc_info=True)
            for s in current_steps:
                if s.get("step_number") == 3:
                    s["status"] = "FAILED"
                    s["ended_at"] = datetime.now(timezone.utc).isoformat()
            job.steps = current_steps
            job.status = JobState.FAILED.value
            job.error = str(exc)
            job.ended_at = datetime.now(timezone.utc)
            await session.commit()
            if hasattr(session, "refresh"):
                await session.refresh(job)
            return job
