"""Copilot Service Layer orchestrating dynamic knowledge indexing and grounded Q&A."""

import logging
from typing import Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.entities import Bidder, Criterion, Document, Finding, Tender, User
from backend.schemas.copilot import (
    CitationOut,
    CopilotQueryRequest,
    CopilotQueryResponse,
    RAGDomainInfo,
    RAGKnowledgeBaseStatus,
)
from pipeline.rag.copilot import ProcurementCopilot
from pipeline.rag.models import KnowledgeDomain
from pipeline.rag.retriever import ProcurementRetriever

logger = logging.getLogger("vigilbid.services.copilot")


class CopilotService:
    """Singleton service providing multi-domain procurement copilot Q&A."""

    _retriever: Optional[ProcurementRetriever] = None
    _copilot: Optional[ProcurementCopilot] = None
    _indexed_tenders: set[str] = set()
    _indexed_bidders: set[str] = set()

    @classmethod
    def get_retriever(cls) -> ProcurementRetriever:
        if cls._retriever is None:
            cls._retriever = ProcurementRetriever()
        return cls._retriever

    @classmethod
    def get_copilot(cls) -> ProcurementCopilot:
        if cls._copilot is None:
            cls._copilot = ProcurementCopilot(retriever=cls.get_retriever())
        return cls._copilot

    @classmethod
    async def ensure_tender_indexed(cls, session: AsyncSession, tender_id: uuid.UUID) -> None:
        """Dynamically index tender specifications and criteria if not already in index."""
        t_id_str = str(tender_id)
        if t_id_str in cls._indexed_tenders:
            return

        stmt = select(Tender).options(selectinload(Tender.criteria)).where(Tender.id == tender_id)
        res = await session.execute(stmt)
        tender = res.scalar_one_or_none()
        if not tender:
            return

        crit_dicts = []
        for crit in getattr(tender, "criteria", []) or []:
            crit_dicts.append({
                "code": crit.code,
                "name": crit.name,
                "description": crit.description,
                "category": crit.category,
                "weight": float(crit.weight) if crit.weight is not None else 1.0,
            })

        retriever = cls.get_retriever()
        retriever.index_tender(
            tender_id=t_id_str,
            nit_number=tender.nit_number,
            title=tender.title,
            criteria=crit_dicts,
        )
        cls._indexed_tenders.add(t_id_str)
        logger.info("Indexed tender %s (%s) into RAG knowledge base", tender.nit_number, t_id_str)

    @classmethod
    async def ensure_bidder_indexed(cls, session: AsyncSession, bidder_id: uuid.UUID) -> None:
        """Dynamically index bidder uploaded documents and findings if not already in index."""
        b_id_str = str(bidder_id)
        if b_id_str in cls._indexed_bidders:
            return

        # 1. Fetch bidder
        b_stmt = select(Bidder).where(Bidder.id == bidder_id)
        b_res = await session.execute(b_stmt)
        bidder = b_res.scalar_one_or_none()
        if not bidder:
            return

        retriever = cls.get_retriever()

        # 2. Fetch documents
        doc_stmt = select(Document).where(Document.bidder_id == bidder_id)
        doc_res = await session.execute(doc_stmt)
        docs = doc_res.scalars().all()

        doc_dicts = []
        for d in docs:
            doc_dicts.append({
                "filename": d.original_filename,
                "doc_type": d.doc_type or "DOCUMENT",
                "page_no": 1,
                "text": f"Document {d.original_filename} ({d.doc_type}). SHA-256: {d.sha256}. Pages: {d.page_count or 1}.",
            })
        if doc_dicts:
            retriever.index_bidder_documents(
                bidder_id=b_id_str,
                bidder_name=bidder.declared_name,
                documents=doc_dicts,
            )

        # 3. Fetch findings
        f_stmt = select(Finding).where(Finding.bidder_id == bidder_id)
        f_res = await session.execute(f_stmt)
        findings = f_res.scalars().all()

        f_dicts = []
        for f in findings:
            f_dicts.append({
                "id": str(f.id),
                "rule_id": f.rule_id,
                "status": f.status,
                "title": f.title,
                "explanation": f.explanation,
                "citation": f.citation or {},
                "evidence": f.evidence or [],
            })
        if f_dicts:
            retriever.index_evidence_findings(
                bidder_id=b_id_str,
                findings=f_dicts,
            )

        cls._indexed_bidders.add(b_id_str)
        logger.info("Indexed bidder %s documents (%d) and findings (%d) into RAG", b_id_str, len(doc_dicts), len(f_dicts))

    @classmethod
    async def answer_query(
        cls,
        session: AsyncSession,
        request: CopilotQueryRequest,
        actor: User,
    ) -> CopilotQueryResponse:
        """Handle incoming copilot query with dynamic multi-domain context resolution."""
        # Index on-demand if specific tender or bidder requested
        if request.tender_id:
            await cls.ensure_tender_indexed(session, request.tender_id)
        if request.bidder_id:
            await cls.ensure_bidder_indexed(session, request.bidder_id)

        copilot = cls.get_copilot()
        resp = copilot.answer_query(
            query=request.question,
            tender_id=str(request.tender_id) if request.tender_id else None,
            bidder_id=str(request.bidder_id) if request.bidder_id else None,
            domains=request.domains,
            top_k=request.top_k,
        )

        citations_out = [
            CitationOut(
                source=c.source,
                clause=c.clause,
                content=c.content,
                score=c.score,
                page_no=c.page_no,
                domain=c.domain,
                exact_quote=c.exact_quote,
                document_name=c.document_name,
                url=c.url,
            )
            for c in resp.citations
        ]

        return CopilotQueryResponse(
            answer=resp.answer,
            citations=citations_out,
            domains_searched=resp.domains_searched,
            used_llm=resp.used_llm,
            confidence=resp.confidence,
        )

    @classmethod
    def get_knowledge_base_status(cls) -> RAGKnowledgeBaseStatus:
        """Return inventory of all indexed chunks per domain."""
        retriever = cls.get_retriever()
        domain_counts: dict[str, int] = {
            KnowledgeDomain.TENDER.value: 0,
            KnowledgeDomain.BIDDER_DOCUMENT.value: 0,
            KnowledgeDomain.REGULATORY.value: 0,
            KnowledgeDomain.EVIDENCE.value: 0,
        }

        for chunk in retriever.chunks:
            d_val = chunk.domain.value if isinstance(chunk.domain, KnowledgeDomain) else str(chunk.domain)
            domain_counts[d_val] = domain_counts.get(d_val, 0) + 1

        descriptions = {
            KnowledgeDomain.TENDER.value: "Tender NIT requirements, technical specifications, and BEC criteria",
            KnowledgeDomain.BIDDER_DOCUMENT.value: "Text and metadata extracted from uploaded bidder filings",
            KnowledgeDomain.REGULATORY.value: "GFR 2017, MSE Order 2012, PPP-MII, CVC Manual, and ICAI UDIN guidelines",
            KnowledgeDomain.EVIDENCE.value: "Evaluation findings, anomaly signals, and risk verification traces",
        }

        domain_infos = [
            RAGDomainInfo(
                domain=d,
                description=descriptions.get(d, "Knowledge domain"),
                total_chunks=count,
            )
            for d, count in domain_counts.items()
        ]

        return RAGKnowledgeBaseStatus(
            total_chunks=len(retriever.chunks),
            domains=domain_infos,
        )
