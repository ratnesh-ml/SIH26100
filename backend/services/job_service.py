"""Job Service orchestrating processing jobs, status lifecycles, queue claims, and full pipeline execution."""

from datetime import datetime, timezone
import hashlib
import logging
from pathlib import Path
from typing import Any, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.entities import (
    AnomalySignal,
    Bidder,
    Document,
    DocumentPage,
    ExtractedField,
    Finding,
    Job,
    RiskDriver,
    VerificationEvent,
)
from backend.schemas.job import JobState, StepStatus
from pipeline.document_processing.classifier import DocumentType, RuleBasedDocumentClassifier
from pipeline.extraction.registry import extract_document_fields
from pipeline.ocr.factory import get_ocr_provider
from pipeline.ocr.interface import OCRProvider
from pipeline.pdf.processor import PDFProcessor
from pipeline.runner import PipelineContext, PipelineRunner, StepExecutionResult
from pipeline.registry_adapters import get_registry_provider
from pipeline.registry_adapters.base import RegistryProvider

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
        self.classifier = RuleBasedDocumentClassifier()

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

                # Run classification on extracted pages
                pages_text = [p.text for p in process_result.pages if p.text]
                class_res = self.classifier.classify_document(
                    filename=doc.original_filename,
                    pages_text=pages_text,
                )
                doc.doc_type = class_res.doc_type.value

                # Update document text_source and average confidence
                avg_conf = (total_conf / len(process_result.pages)) if process_result.pages else 1.0
                doc.text_source = "ocr" if has_ocr_pages else "text_layer"
                doc.ocr_conf = round(avg_conf, 3)

                # Step 4: Extract structured fields if document type is supported
                try:
                    doc_type_enum = DocumentType(doc.doc_type)
                    extracted_fields = extract_document_fields(
                        doc_type=doc_type_enum,
                        pages=[p.to_dict() for p in process_result.pages],
                        source_document=doc.original_filename,
                    )
                    for dto in extracted_fields:
                        val_to_hash = dto.normalized_value or dto.value or ""
                        val_hash = hashlib.sha256(val_to_hash.encode("utf-8")).hexdigest()
                        field_rec = ExtractedField(
                            document_id=doc.id,
                            field_name=dto.field_name,
                            value=dto.value,
                            value_norm=dto.normalized_value,
                            raw=dto.raw,
                            page_no=dto.page,
                            bbox=dto.bbox,
                            confidence=dto.confidence,
                            method=dto.extraction_method,
                            value_hash=val_hash,
                        )
                        session.add(field_rec)
                    logger.info("Extracted %d structured fields from doc %s (%s)", len(extracted_fields), doc.id, doc.doc_type)
                except Exception as field_err:
                    logger.warning("Field extraction warning on doc %s: %s", doc.id, field_err)

            # Mark Step 2 (Classification), Step 3 (OCR), and Step 4 (Field Extraction) as DONE
            now_iso = datetime.now(timezone.utc).isoformat()
            for s in current_steps:
                if s.get("step_number") in (2, 3, 4):
                    s["status"] = "DONE"
                    s["ended_at"] = now_iso
            job.steps = current_steps
            job.current_step = 4
            # NOTE: Do not mark DONE here — full pipeline continues in process_job_full_pipeline
            job.status = JobState.PROCESSING.value
            await session.commit()
            if hasattr(session, "refresh"):
                await session.refresh(job)
            logger.info("Job %s successfully completed Classification, OCR, and Field Extraction", job.id)
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

    async def process_job_full_pipeline(
        self,
        session: AsyncSession,
        job_id: uuid.UUID,
    ) -> Job:
        """Execute all 11 pipeline steps: OCR + normalization + entity resolution + verification + compliance + anomalies + risk + evidence.

        This is the primary entry point for complete bidder evaluation.
        Steps 1-4 are handled by process_job_ocr.
        Steps 5-11 run via PipelineRunner and persist results to the database.
        """
        # Step 1-4: Run OCR pipeline first
        job = await self.process_job_ocr(session, job_id)
        if job.status == JobState.FAILED.value:
            return job

        current_steps = list(job.steps or DEFAULT_PIPELINE_STEPS)

        try:
            # ---- Build PipelineContext from DB state ----
            doc_stmt = select(Document).where(Document.bidder_id == job.bidder_id)
            doc_res = await session.execute(doc_stmt)
            docs = list(doc_res.scalars().all())

            bidder_stmt = select(Bidder).where(Bidder.id == job.bidder_id)
            bidder_res = await session.execute(bidder_stmt)
            bidder = bidder_res.scalar_one_or_none()

            # Collect extracted fields from DB
            all_extracted_fields: dict[str, dict[str, Any]] = {}
            pipeline_docs: list[dict[str, Any]] = []

            for doc in docs:
                doc_id_str = str(doc.id)

                # Load extracted fields
                field_stmt = select(ExtractedField).where(ExtractedField.document_id == doc.id)
                field_res = await session.execute(field_stmt)
                fields = list(field_res.scalars().all())

                doc_fields: dict[str, Any] = {}
                for f in fields:
                    doc_fields[f.field_name] = {
                        "value": f.value,
                        "normalized_value": f.value_norm,
                        "confidence": float(f.confidence) if f.confidence else 1.0,
                        "page": f.page_no,
                        "bbox": f.bbox,
                        "method": f.method,
                        "raw": f.raw,
                    }
                all_extracted_fields[doc_id_str] = doc_fields

                # Load pages text for pipeline context
                page_stmt = select(DocumentPage).where(
                    DocumentPage.document_id == doc.id
                ).order_by(DocumentPage.page_no)
                page_res = await session.execute(page_stmt)
                pages = list(page_res.scalars().all())

                pages_data = []
                for p in pages:
                    pages_data.append({
                        "page_no": p.page_no,
                        "text": p.text or "",
                    })

                pipeline_docs.append({
                    "id": doc_id_str,
                    "filename": doc.original_filename,
                    "doc_type": doc.doc_type or "UNKNOWN",
                    "page_count": doc.page_count,
                    "pages_data": pages_data,
                    "metadata": doc.metadata_fields or {},
                    "sha256": doc.sha256,
                    "text_source": doc.text_source or "text_layer",
                })

            ctx = PipelineContext(
                tender_id=str(bidder.tender_id) if bidder and bidder.tender_id else "unknown",
                bidder_id=str(job.bidder_id),
                job_id=str(job_id),
                documents=pipeline_docs,
                extracted_fields=all_extracted_fields,
                metadata={
                    "declared_name": bidder.declared_name if bidder else "Bidder",
                    "company_name": bidder.canonical_name or (bidder.declared_name if bidder else "Bidder"),
                },
            )

            # ---- Initialize PipelineRunner ----
            registry_provider = get_registry_provider()
            runner = PipelineRunner(
                ocr_provider=self.ocr_provider,
                registry_provider=registry_provider,
            )

            # ---- Step 5: Normalization ----
            self._update_step_status(current_steps, 5, "RUNNING")
            job.steps = current_steps
            job.current_step = 5
            await session.commit()

            norm_result = runner.step_07_normalization(ctx)
            self._update_step_status(current_steps, 5, norm_result.status)

            # ---- Step 6: Entity Resolution ----
            self._update_step_status(current_steps, 6, "RUNNING")
            job.steps = current_steps
            job.current_step = 6
            await session.commit()

            er_result = runner.step_08_entity_resolution(ctx)
            self._update_step_status(current_steps, 6, er_result.status)

            # Persist canonical entity to bidder record
            if bidder and ctx.canonical_entity:
                bidder.canonical_name = ctx.canonical_entity.get("canonical_name", bidder.declared_name)
                bidder.entity_confidence = ctx.canonical_entity.get("confidence", 0.0)

            # ---- Step 7: Government Registry Verification ----
            self._update_step_status(current_steps, 7, "RUNNING")
            job.steps = current_steps
            job.current_step = 7
            await session.commit()

            gov_result = runner.step_09_government_verification(ctx)
            self._update_step_status(current_steps, 7, gov_result.status)

            # Persist verification events to DB
            for reg_key, reg_data in ctx.registry_results.items():
                if isinstance(reg_data, dict):
                    ve = VerificationEvent(
                        bidder_id=job.bidder_id,
                        verifier=reg_key,
                        provider=reg_data.get("source", "mock"),
                        request={"identifier": reg_key},
                        response=reg_data,
                        status="FOUND" if reg_data.get("found") else "NOT_FOUND",
                    )
                    session.add(ve)

            # ---- Step 8: Compliance Rules ----
            self._update_step_status(current_steps, 8, "RUNNING")
            job.steps = current_steps
            job.current_step = 8
            await session.commit()

            # Run tender requirement checks first (step 10 of runner)
            runner.step_10_tender_requirement_checks(ctx)
            # Then compliance rules (step 11 of runner)
            compliance_result = runner.step_11_compliance_rules(ctx)
            self._update_step_status(current_steps, 8, compliance_result.status)

            # Persist findings to DB
            for f_data in ctx.findings:
                finding = Finding(
                    id=uuid.uuid4(),
                    bidder_id=job.bidder_id,
                    rule_id=f_data.get("rule_id", "UNKNOWN"),
                    rule_version=f_data.get("rule_version", "1.0"),
                    status=f_data.get("status", "REVIEW"),
                    title=f_data.get("title", "Compliance Finding"),
                    explanation=f_data.get("explanation", ""),
                    citation=f_data.get("citation"),
                    evidence=f_data.get("evidence"),
                    confidence=f_data.get("confidence"),
                    extracted=f_data.get("extracted"),
                    expected=f_data.get("expected"),
                )
                session.add(finding)

            # ---- Step 9: Anomaly Scanning ----
            self._update_step_status(current_steps, 9, "RUNNING")
            job.steps = current_steps
            job.current_step = 9
            await session.commit()

            anomaly_result = runner.step_12_anomalies(ctx)
            self._update_step_status(current_steps, 9, anomaly_result.status)

            # Persist anomaly signals to DB
            for a_data in ctx.anomalies:
                if isinstance(a_data, dict):
                    anomaly = AnomalySignal(
                        bidder_id=job.bidder_id,
                        code=a_data.get("type", "UNKNOWN"),
                        severity=a_data.get("severity", "LOW"),
                        points=a_data.get("points", 0),
                        description=a_data.get("description", ""),
                        evidence=a_data.get("evidence"),
                    )
                    session.add(anomaly)

            # ---- Step 10: Risk Scoring ----
            self._update_step_status(current_steps, 10, "RUNNING")
            job.steps = current_steps
            job.current_step = 10
            await session.commit()

            risk_result = runner.step_13_risk_scoring(ctx)
            self._update_step_status(current_steps, 10, risk_result.status)

            # Persist risk to bidder and risk drivers
            if bidder and ctx.risk_profile:
                bidder.risk_score = int(ctx.risk_profile.get("composite_score", 0))
                bidder.risk_band = ctx.risk_profile.get("risk_band", "LOW")

                for driver in ctx.risk_profile.get("drivers", []):
                    if isinstance(driver, dict):
                        rd = RiskDriver(
                            bidder_id=job.bidder_id,
                            driver=driver.get("description", driver.get("driver", "Risk factor")),
                            points=driver.get("points", 0),
                            source_ref=driver.get("source_ref"),
                        )
                        session.add(rd)

            # ---- Step 11: Evidence Packaging ----
            self._update_step_status(current_steps, 11, "RUNNING")
            job.steps = current_steps
            job.current_step = 11
            await session.commit()

            evidence_result = runner.step_14_findings_and_evidence(ctx)
            self._update_step_status(current_steps, 11, evidence_result.status)

            # Derive overall bidder status from compliance findings
            if bidder:
                statuses = [f.get("status", "REVIEW") for f in ctx.findings]
                if any(s == "FAIL" for s in statuses):
                    bidder.overall_status = "FAIL"
                elif any(s == "REVIEW" for s in statuses):
                    bidder.overall_status = "REVIEW"
                elif any(s == "WARN" for s in statuses):
                    bidder.overall_status = "WARN"
                elif statuses:
                    bidder.overall_status = "PASS"

            # Mark job as DONE
            job.steps = current_steps
            job.current_step = 11
            job.status = JobState.DONE.value
            job.ended_at = datetime.now(timezone.utc)
            await session.commit()
            if hasattr(session, "refresh"):
                await session.refresh(job)

            logger.info(
                "Job %s full pipeline complete: %d findings, %d anomalies, risk=%d/%s",
                job.id,
                len(ctx.findings),
                len(ctx.anomalies),
                ctx.risk_profile.get("composite_score", 0),
                ctx.risk_profile.get("risk_band", "?"),
            )
            return job

        except Exception as exc:
            logger.error("Job %s failed during full pipeline: %s", job_id, exc, exc_info=True)
            for s in current_steps:
                if s.get("status") == "RUNNING":
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

    @staticmethod
    def _update_step_status(steps: list[dict[str, Any]], step_number: int, status: str) -> None:
        """Update a step's status in the steps list."""
        now_iso = datetime.now(timezone.utc).isoformat()
        for s in steps:
            if s.get("step_number") == step_number:
                s["status"] = status
                if status == "RUNNING":
                    s["started_at"] = now_iso
                elif status in ("DONE", "FAILED"):
                    s["ended_at"] = now_iso
                break
