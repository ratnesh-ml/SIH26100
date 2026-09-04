"""Document Service orchestrating file ingestion, deduplication, storage safety, and database persistence."""

from collections import OrderedDict
import logging
from pathlib import Path
from typing import BinaryIO, Optional
import uuid
from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.models.entities import Bidder, Document
from backend.schemas.document import DocumentSummary, RejectedFileOut, IngestionResponse
from backend.services.audit_service import AuditService
from backend.services.job_service import JobService
from pipeline.document_processing.ingest import DocumentIngester

logger = logging.getLogger("vigilbid.services.document")

# Two-tier LRU Page Image Cache for instant PDF viewer page rendering
_PAGE_IMAGE_CACHE: OrderedDict[tuple[str, int, int], bytes] = OrderedDict()
_MAX_PAGE_CACHE_ITEMS = 256


def get_cached_page_image(sha256: str, page_no: int, dpi: int) -> Optional[bytes]:
    """Retrieve rendered page bytes from LRU memory cache."""
    key = (sha256, page_no, dpi)
    if key in _PAGE_IMAGE_CACHE:
        _PAGE_IMAGE_CACHE.move_to_end(key)
        return _PAGE_IMAGE_CACHE[key]
    return None


def put_cached_page_image(sha256: str, page_no: int, dpi: int, data: bytes) -> None:
    """Store rendered page bytes into LRU memory cache."""
    key = (sha256, page_no, dpi)
    _PAGE_IMAGE_CACHE[key] = data
    _PAGE_IMAGE_CACHE.move_to_end(key)
    if len(_PAGE_IMAGE_CACHE) > _MAX_PAGE_CACHE_ITEMS:
        _PAGE_IMAGE_CACHE.popitem(last=False)


class DocumentService:
    """Manages document uploads, safe storage, deduplication, and persistence."""

    def __init__(self, storage_root: Optional[Path] = None):
        self.storage_root = storage_root or Path(settings.STORAGE_DIR)
        self.ingester = DocumentIngester()
        self.job_service = JobService()

    async def ingest_uploaded_files(
        self,
        session: AsyncSession,
        bidder_id: uuid.UUID,
        uploaded_files: list[UploadFile],
    ) -> IngestionResponse:
        """Ingest multiple uploaded files (PDF/ZIP) for a specific bidder."""
        # 1. Verify bidder exists
        bidder_stmt = select(Bidder).where(Bidder.id == bidder_id)
        bidder_res = await session.execute(bidder_stmt)
        bidder = bidder_res.scalar_one_or_none()
        if not bidder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bidder with ID '{bidder_id}' not found.",
            )

        accepted_docs: list[DocumentSummary] = []
        rejected_files: list[RejectedFileOut] = []
        total_files = 0

        # Ensure target storage directory exists
        bidder_dir = self.storage_root / str(bidder_id)
        bidder_dir.mkdir(parents=True, exist_ok=True)

        for up_file in uploaded_files:
            try:
                content = await up_file.read()
                filename = up_file.filename or "unknown_file"

                # Parse and validate via DocumentIngester
                ingest_res = self.ingester.ingest_bytes(filename, content)
                total_files += ingest_res.total_files

                # Forward in-archive rejections
                for rej in ingest_res.rejected:
                    rejected_files.append(RejectedFileOut(filename=rej.filename, reason=rej.reason))

                # Process accepted files
                for item in ingest_res.accepted:
                    # 2. Duplicate Detection (check by bidder_id and sha256)
                    dup_stmt = select(Document).where(
                        Document.bidder_id == bidder_id,
                        Document.sha256 == item.sha256,
                    )
                    dup_res = await session.execute(dup_stmt)
                    if dup_res.scalar_one_or_none():
                        rejected_files.append(
                            RejectedFileOut(
                                filename=item.original_filename,
                                reason=f"Duplicate document: SHA-256 ({item.sha256[:12]}...) already ingested for this bidder",
                            )
                        )
                        continue

                    # 3. Secure Write-Once Content-Addressable Storage
                    dest_path = bidder_dir / f"{item.sha256}.pdf"
                    if not dest_path.exists():
                        dest_path.write_bytes(item.content)

                    # 4. Create Document Record
                    doc_id = uuid.uuid4()
                    doc = Document(
                        id=doc_id,
                        bidder_id=bidder_id,
                        original_filename=item.original_filename,
                        sha256=item.sha256,
                        storage_path=str(dest_path),
                        mime=item.mime_type,
                        page_count=item.page_count,
                        doc_type="UNKNOWN",
                    )
                    session.add(doc)

                    accepted_docs.append(
                        DocumentSummary(
                            id=doc_id,
                            bidder_id=bidder_id,
                            original_filename=item.original_filename,
                            sha256=item.sha256,
                            mime=item.mime_type,
                            page_count=item.page_count,
                            doc_type="UNKNOWN",
                            storage_path=str(dest_path),
                            created_at=doc.created_at if hasattr(doc, "created_at") and doc.created_at else None,
                        )
                    )

            except Exception as exc:
                logger.error("Error processing file %s: %s", up_file.filename, exc)
                rejected_files.append(
                    RejectedFileOut(filename=up_file.filename or "unknown", reason=f"Server error: {str(exc)}")
                )

        await session.commit()

        # Record audit events for accepted documents
        for doc_item in accepted_docs:
            try:
                await AuditService.record_event(
                    session=session,
                    action="DOCUMENT_UPLOADED",
                    target_type="document",
                    target_id=str(doc_item.id),
                    actor_id=None,
                    role="officer",
                    previous_state=None,
                    new_state={"filename": doc_item.original_filename, "sha256": doc_item.sha256, "page_count": doc_item.page_count},
                    reason="Document ingested with SHA-256 CAS verification",
                    evidence_reference=f"sha256:{doc_item.sha256}",
                    payload={"bidder_id": str(bidder_id), "original_filename": doc_item.original_filename},
                )
            except Exception as exc:
                logger.warning("Audit logging warning on document %s: %s", doc_item.id, exc)

        # If files were accepted, create a processing Job in QUEUED state
        job_id = None
        if accepted_docs:
            job = await self.job_service.create_job(session=session, bidder_id=bidder_id)
            job_id = job.id

        # If a single file was uploaded and rejected, raise appropriate HTTP status code
        if len(uploaded_files) == 1 and not accepted_docs and rejected_files:
            rej_reason = rejected_files[0].reason.lower()
            if "duplicate" in rej_reason:
                raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=rejected_files[0].reason)
            elif "exceeds maximum allowed size" in rej_reason or "exceeds maximum size" in rej_reason:
                raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail=rejected_files[0].reason)
            elif "path traversal" in rej_reason:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=rejected_files[0].reason)
            elif "invalid pdf header" in rej_reason or "invalid '%pdf-'" in rej_reason:
                raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=rejected_files[0].reason)

        return IngestionResponse(
            bidder_id=bidder_id,
            job_id=job_id,
            total_files=total_files,
            accepted=accepted_docs,
            rejected=rejected_files,
        )

    @staticmethod
    async def list_bidder_documents(
        session: AsyncSession,
        bidder_id: uuid.UUID,
    ) -> list[DocumentSummary]:
        """List all documents registered under a bidder."""
        stmt = select(Document).where(Document.bidder_id == bidder_id).order_by(Document.created_at.asc())
        res = await session.execute(stmt)
        docs = res.scalars().all()
        return [
            DocumentSummary(
                id=d.id,
                bidder_id=d.bidder_id,
                original_filename=d.original_filename,
                sha256=d.sha256,
                mime=d.mime,
                page_count=d.page_count,
                doc_type=d.doc_type,
                storage_path=d.storage_path,
                created_at=d.created_at,
            )
            for d in docs
        ]

    @staticmethod
    async def get_document(session: AsyncSession, doc_id: uuid.UUID) -> Document:
        """Fetch a specific document record by UUID."""
        stmt = select(Document).where(Document.id == doc_id)
        res = await session.execute(stmt)
        doc = res.scalar_one_or_none()
        if not doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID '{doc_id}' not found.",
            )
        return doc

    @staticmethod
    async def render_document_page(
        session: AsyncSession,
        doc_id: uuid.UUID,
        page_no: int,
        dpi: int = 150,
    ) -> bytes:
        """Render a specific 1-indexed page of a PDF document to raster PNG bytes (with LRU & disk caching)."""
        doc = await DocumentService.get_document(session, doc_id)

        # 1. Check in-memory LRU cache
        cached_mem = get_cached_page_image(doc.sha256, page_no, dpi)
        if cached_mem is not None:
            return cached_mem

        # 2. Check on-disk cache under storage root
        storage_root = Path(settings.STORAGE_DIR).resolve()
        cache_dir = storage_root / "_page_cache"
        cache_file = cache_dir / f"{doc.sha256}_p{page_no}_{dpi}.png"
        if cache_file.exists() and cache_file.is_file():
            try:
                data = cache_file.read_bytes()
                if data:
                    put_cached_page_image(doc.sha256, page_no, dpi, data)
                    return data
            except Exception as exc:
                logger.warning("Failed to read disk page cache %s: %s", cache_file, exc)

        # 3. Cache miss: Validate storage path and render
        doc_path = Path(doc.storage_path).resolve()
        is_safe = doc_path.is_relative_to(storage_root)
        if not is_safe and settings.ENVIRONMENT.lower() in ("development", "test", "testing"):
            import tempfile
            is_safe = doc_path.is_relative_to(Path(tempfile.gettempdir()).resolve())

        if not is_safe:
            logger.error("Security alert: Attempted path escape for render_document_page on doc %s: %s", doc_id, doc.storage_path)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access outside storage root denied",
            )
        if not doc_path.exists() or not doc_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document storage file not found at '{doc.storage_path}'.",
            )

        try:
            import fitz
            from pipeline.pdf.renderer import PDFRenderer

            doc_fitz = fitz.open(str(doc_path))
            total_pages = len(doc_fitz)
            if page_no < 1 or page_no > total_pages:
                doc_fitz.close()
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Page {page_no} out of bounds for document with {total_pages} pages.",
                )
            page = doc_fitz[page_no - 1]
            renderer = PDFRenderer(default_dpi=dpi)
            png_bytes = renderer.render_page_bytes(page, dpi=dpi)
            doc_fitz.close()

            # Store in both disk cache and memory cache
            try:
                cache_dir.mkdir(parents=True, exist_ok=True)
                cache_file.write_bytes(png_bytes)
            except Exception as exc:
                logger.warning("Failed to write disk page cache %s: %s", cache_file, exc)

            put_cached_page_image(doc.sha256, page_no, dpi, png_bytes)
            return png_bytes
        except HTTPException:
            raise
        except Exception as exc:
            logger.error("Error rendering page %d of document %s: %s", page_no, doc_id, exc, exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to render document page: {exc}",
            )

