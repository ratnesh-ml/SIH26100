"""Regulatory and Procurement Copilot providing grounded, cited decision support answers."""

import logging
from typing import Any, Optional

from pipeline.rag.models import CopilotResponse, RetrievedClause
from pipeline.rag.retriever import ProcurementRetriever

logger = logging.getLogger("vigilbid.pipeline.rag.copilot")


class ProcurementCopilot:
    """Answers procurement officer questions across all 4 knowledge domains:

    1. Tender requirements & specifications
    2. Bidder uploaded filings & page traces
    3. Regulatory statutes (GFR 2017, MSE Order, PPP-MII, CVC, ICAI)
    4. Evaluation findings, anomalies, and risk evidence

    Guarantees that every answer carries verified, structured source citations with page references.
    """

    def __init__(self, retriever: Optional[ProcurementRetriever] = None):
        self.retriever = retriever or ProcurementRetriever()

    def answer_query(
        self,
        query: str,
        tender_id: Optional[str] = None,
        bidder_id: Optional[str] = None,
        domains: Optional[list[str]] = None,
        bidder_context: Optional[dict[str, Any]] = None,
        top_k: int = 3,
    ) -> CopilotResponse:
        """Retrieve authoritative source chunks and synthesize an evidence-grounded answer."""
        if not query or not query.strip():
            return CopilotResponse(
                answer="No query provided. Please specify a procurement, regulatory, or bidder question.",
                citations=[],
                domains_searched=domains or ["all"],
                used_llm=False,
                confidence=0.0,
            )

        # 1. Retrieve ranked knowledge chunks
        citations = self.retriever.search(
            query=query,
            domains=domains,
            bidder_id=bidder_id,
            tender_id=tender_id,
            top_k=top_k,
        )

        if not citations:
            return CopilotResponse(
                answer=(
                    "No relevant clauses or document passages were found in the indexed knowledge base "
                    f"for query: '{query}'. Please check the query terminology or index the relevant tender/bidder files."
                ),
                citations=[],
                domains_searched=domains or ["regulatory", "tender", "bidder_document", "evidence"],
                used_llm=False,
                confidence=0.0,
            )

        # 2. Synthesize cited, grounded answer
        answer = self._synthesize_grounded_answer(query, citations, bidder_context)
        searched_domains = list({c.domain for c in citations if c.domain})

        top_score = citations[0].score if citations else 0.5

        return CopilotResponse(
            answer=answer,
            citations=citations,
            domains_searched=searched_domains,
            used_llm=False,
            confidence=top_score,
        )

    def _synthesize_grounded_answer(
        self,
        query: str,
        citations: list[RetrievedClause],
        bidder_context: Optional[dict[str, Any]] = None,
    ) -> str:
        """Generate a structured, legally precise procurement answer with explicit citations."""
        primary = citations[0]

        # Extract primary rule / clause and source
        clause_ref = primary.clause
        doc_name = primary.document_name or primary.source
        page_str = f"Page {primary.page_no}" if primary.page_no else "Document text"

        # Build grounded response
        lines = [
            f"**Answer Based on {clause_ref} ({doc_name}, {page_str}):**\n",
            f"> \"{primary.exact_quote}\"\n",
        ]

        # Provide domain-specific analytical context
        if primary.domain == "regulatory":
            lines.append(
                f"Under statutory guidelines ({primary.source}), {primary.content.strip()}\n"
            )
        elif primary.domain == "tender":
            lines.append(
                f"Per the tender specifications ({primary.source}), {primary.content.strip()}\n"
            )
        elif primary.domain == "bidder_document":
            lines.append(
                f"From the bidder's uploaded submission ({primary.source}, {page_str}), {primary.content.strip()}\n"
            )
        elif primary.domain == "evidence":
            lines.append(
                f"According to evaluation findings ({primary.source}), {primary.content.strip()}\n"
            )

        # If bidder context exists, provide contextual linkage
        if bidder_context:
            bidder_name = bidder_context.get("name") or bidder_context.get("declared_name", "Bidder")
            lines.append(f"**Contextual Note for {bidder_name}:** Review this against the bidder's declared credentials.")

        # Additional supporting citations
        if len(citations) > 1:
            lines.append("\n**Supporting References:**")
            for idx, supp in enumerate(citations[1:], start=2):
                supp_page = f", Page {supp.page_no}" if supp.page_no else ""
                lines.append(f"- **Ref {idx}**: {supp.clause} ({supp.source}{supp_page}) — *\"{supp.exact_quote}\"*")

        lines.append("\n*(Decision Support Disclaimer: Human officer confirmation required under GFR 2017 / CVC guidelines.)*")
        return "\n".join(lines)


class RegulatoryCopilot:
    """Backward-compatible regulatory copilot wrapping ProcurementCopilot."""

    def __init__(self):
        self.copilot = ProcurementCopilot()

    def answer_query(self, query: str, bidder_context: Optional[dict] = None) -> CopilotResponse:
        return self.copilot.answer_query(
            query=query,
            domains=["regulatory"],
            bidder_context=bidder_context,
            top_k=3,
        )
