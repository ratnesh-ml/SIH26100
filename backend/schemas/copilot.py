"""Schemas for Procurement Copilot Q&A and RAG knowledge endpoints."""

from typing import Any, Optional
import uuid
from pydantic import BaseModel, Field


class CitationOut(BaseModel):
    source: str
    clause: str
    content: str
    score: float
    page_no: Optional[int] = 1
    domain: Optional[str] = "regulatory"
    exact_quote: Optional[str] = None
    document_name: Optional[str] = None
    url: Optional[str] = None


class CopilotQueryRequest(BaseModel):
    question: str = Field(..., min_length=2, description="Procurement, regulatory, or bidder question")
    tender_id: Optional[uuid.UUID] = None
    bidder_id: Optional[uuid.UUID] = None
    domains: Optional[list[str]] = Field(
        None,
        description="Optional domain filter: ['regulatory', 'tender', 'bidder_document', 'evidence']",
    )
    top_k: int = Field(3, ge=1, le=10)


class CopilotQueryResponse(BaseModel):
    answer: str
    citations: list[CitationOut]
    domains_searched: list[str]
    used_llm: bool = False
    confidence: float = 1.0


class RAGDomainInfo(BaseModel):
    domain: str
    description: str
    total_chunks: int


class RAGKnowledgeBaseStatus(BaseModel):
    total_chunks: int
    domains: list[RAGDomainInfo]
