"""Domain models and data contracts for Procurement-Specific RAG."""

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Optional


class GroundingStatus(str, Enum):
    """Grounding status indicating corroboration level of evidence."""
    GROUNDED = "GROUNDED"
    PARTIALLY_GROUNDED = "PARTIALLY_GROUNDED"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class KnowledgeDomain(str, Enum):
    """The four distinct procurement knowledge domains."""
    TENDER = "tender"                    # Clauses, NIT specifications, turnover/experience criteria, EMD terms
    BIDDER_DOCUMENT = "bidder_document"  # Extracted text from uploaded bidder documents with page numbers
    REGULATORY = "regulatory"            # GFR 2017, CVC Manual, MSE Order 2012, PPP-MII, ICAI UDIN
    EVIDENCE = "evidence"                # Findings, anomalies, risk drivers, verification results


@dataclass
class KnowledgeChunk:
    """A granular chunk of knowledge with strict provenance metadata."""
    chunk_id: str
    domain: KnowledgeDomain
    text: str
    document_name: str
    page_no: Optional[int] = 1
    clause: Optional[str] = None
    section: Optional[str] = None
    bidder_id: Optional[str] = None
    tender_id: Optional[str] = None
    rule_id: Optional[str] = None
    metadata: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "chunk_id": self.chunk_id,
            "domain": self.domain.value if isinstance(self.domain, KnowledgeDomain) else str(self.domain),
            "text": self.text,
            "document_name": self.document_name,
            "page_no": self.page_no,
            "clause": self.clause,
            "section": self.section,
            "bidder_id": self.bidder_id,
            "tender_id": self.tender_id,
            "rule_id": self.rule_id,
            "metadata": self.metadata,
        }


@dataclass
class RetrievedClause:
    """Standardized citation contract for retrieved procurement knowledge."""
    source: str
    clause: str
    content: str
    score: float
    page_no: Optional[int] = 1
    domain: Optional[str] = "regulatory"
    exact_quote: Optional[str] = None
    document_name: Optional[str] = None
    url: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "source": self.source,
            "clause": self.clause,
            "content": self.content,
            "score": round(self.score, 4),
            "page_no": self.page_no,
            "domain": self.domain,
            "exact_quote": self.exact_quote or self.content[:150],
            "document_name": self.document_name or self.source,
            "url": self.url,
        }


@dataclass
class CopilotResponse:
    """Structured response from the procurement copilot carrying mandatory citations."""
    answer: str
    citations: list[RetrievedClause]
    domains_searched: list[str]
    used_llm: bool = False
    confidence: float = 1.0
    grounding_status: GroundingStatus = GroundingStatus.GROUNDED
    facts: list[str] = field(default_factory=list)
    explanations: list[str] = field(default_factory=list)
    injection_detected: bool = False
    is_conclusive: bool = True
    category: str = "GENERAL"

    def to_dict(self) -> dict[str, Any]:
        return {
            "answer": self.answer,
            "citations": [c.to_dict() for c in self.citations],
            "domains_searched": self.domains_searched,
            "used_llm": self.used_llm,
            "confidence": round(self.confidence, 4),
            "grounding_status": self.grounding_status.value if isinstance(self.grounding_status, GroundingStatus) else str(self.grounding_status),
            "facts": self.facts,
            "explanations": self.explanations,
            "injection_detected": self.injection_detected,
            "is_conclusive": self.is_conclusive,
            "category": self.category,
        }


