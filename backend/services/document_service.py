"""Document Service orchestrating file ingestion, deduplication, storage safety, and database persistence."""

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
from pipeline.document_processing.ingest import DocumentIngester

logger = logging.getLogger("vigilbid.services.document")


class DocumentService:
    """Manages document uploads, safe storage, deduplication, and persistence."""

    def __init__(self, storage_root: Optional[Path] = None):
        self.storage_root = storage_root or Path(settings.STORAGE_DIR)
        self.ingester = DocumentIngester()

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
