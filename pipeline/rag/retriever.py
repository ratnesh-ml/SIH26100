"""Procurement-Specific RAG Retriever with BM25 Ranking and Domain Filtering."""

from collections import Counter
import math
import re
from typing import Any, Optional

from pipeline.rag.chunker import DocumentChunker
from pipeline.rag.guardrails import PromptInjectionGuard
from pipeline.rag.kb_corpus import get_default_regulatory_chunks
from pipeline.rag.models import (
    KnowledgeChunk,
    KnowledgeDomain,
    RetrievedClause,
)


class ProcurementRetriever:
    """Multi-domain in-memory retriever for public procurement decision support.

    Separates and indexes knowledge across 4 domains:
    1. TENDER: Tender NIT requirements, technical specifications, BEC criteria
    2. BIDDER_DOCUMENT: Extracted text and pages from uploaded bidder filings
    3. REGULATORY: GFR 2017, MSE Policy, PPP-MII, CVC Manual, ICAI UDIN
    4. EVIDENCE: System findings, anomalies, risk drivers, and verification traces
    """

    STOPWORDS = {
        "a", "about", "above", "after", "again", "against", "all", "am", "an", "and",
        "any", "are", "aren't", "as", "at", "be", "because", "been", "before", "being",
        "below", "between", "both", "but", "by", "can", "cannot", "could", "did", "do",
        "does", "doing", "down", "during", "each", "few", "for", "from", "further", "had",
        "has", "have", "having", "he", "her", "here", "hers", "herself", "him", "himself",
        "his", "how", "i", "if", "in", "into", "is", "it", "its", "itself", "me", "more",
        "most", "my", "myself", "no", "nor", "not", "of", "off", "on", "once", "only",
        "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same",
        "she", "should", "so", "some", "such", "than", "that", "the", "their", "theirs",
        "them", "themselves", "then", "there", "these", "they", "this", "those", "through",
        "to", "too", "under", "until", "up", "very", "was", "we", "were", "what", "when",
        "where", "which", "while", "who", "whom", "why", "with", "would", "you", "your",
    }

    def __init__(self, k1: float = 1.5, b: float = 0.75):
        self.k1 = k1
        self.b = b
        self.chunker = DocumentChunker()
        self.chunks: list[KnowledgeChunk] = []
        self._doc_tokens: list[list[str]] = []
        self._df: Counter[str] = Counter()
        self._avgdl: float = 0.0

        # Pre-load regulatory knowledge base
        self.index_chunks(get_default_regulatory_chunks())

    def tokenize(self, text: str) -> list[str]:
        """Normalize and tokenize text into keywords, preserving clause patterns."""
        if not text:
            return []
        cleaned = re.sub(r"[^\w\s\.\-]", " ", text.lower())
        tokens = [t.strip(".") for t in cleaned.split() if len(t.strip(".")) > 1]
        return [t for t in tokens if t not in self.STOPWORDS]

    def index_chunk(self, chunk: KnowledgeChunk) -> None:
        """Add a single chunk to the in-memory index."""
        self.index_chunks([chunk])

    def index_chunks(self, chunks: list[KnowledgeChunk]) -> None:
        """Batch index chunks and recompute BM25 statistics."""
        for chunk in chunks:
            self.chunks.append(chunk)
            tokens = self.tokenize(chunk.text)
            self._doc_tokens.append(tokens)
            unique_terms = set(tokens)
            for term in unique_terms:
                self._df[term] += 1

        total_words = sum(len(toks) for toks in self._doc_tokens)
        self._avgdl = total_words / len(self._doc_tokens) if self._doc_tokens else 0.0

    def index_tender(
        self,
        tender_id: str,
        nit_number: str,
        title: str,
        criteria: Optional[list[dict[str, Any]]] = None,
        sections: Optional[list[dict[str, Any]]] = None,
    ) -> int:
        """Index tender specifications and criteria into the TENDER knowledge domain."""
        chunks = []
        # Index main tender overview
        overview_text = (
            f"Tender NIT: {nit_number}. Title: {title}. "
            f"Procuring Entity: Chennai Petroleum Corporation Limited (CPCL). "
            f"Evaluation Standard: GFR 2017 Two-Bid System."
        )
        chunks.extend(
            self.chunker.chunk_text(
                text=overview_text,
                domain=KnowledgeDomain.TENDER,
                document_name=f"NIT_{nit_number}.pdf",
                page_no=1,
                section="Tender Notice",
                tender_id=tender_id,
            )
        )

        # Index criteria
        if criteria:
            for idx, crit in enumerate(criteria, start=1):
                crit_code = crit.get("code") or f"CRIT_{idx}"
                crit_desc = crit.get("description") or crit.get("name") or ""
                crit_category = crit.get("category", "COMMERCIAL")
                crit_text = (
                    f"Criterion {crit_code} ({crit_category}): {crit_desc}. "
                    f"Mandatory requirement under CPCL Bid Evaluation Criteria."
                )
                chunks.extend(
                    self.chunker.chunk_text(
                        text=crit_text,
                        domain=KnowledgeDomain.TENDER,
                        document_name=f"NIT_{nit_number}_BEC.pdf",
                        page_no=crit.get("page", 2),
                        section="Bid Evaluation Criteria",
                        clause=crit_code,
                        tender_id=tender_id,
                        metadata=crit,
                    )
                )

        # Index sections / clauses
        if sections:
            for sec in sections:
                sec_title = sec.get("title", "Clause")
                sec_text = sec.get("text", "")
                p_no = sec.get("page_no", 1)
                chunks.extend(
                    self.chunker.chunk_text(
                        text=f"{sec_title}: {sec_text}",
                        domain=KnowledgeDomain.TENDER,
                        document_name=f"NIT_{nit_number}_Spec.pdf",
                        page_no=p_no,
                        section=sec_title,
                        clause=sec.get("clause"),
                        tender_id=tender_id,
                    )
                )

        self.index_chunks(chunks)
        return len(chunks)

    def index_bidder_documents(
        self,
        bidder_id: str,
        bidder_name: str,
        documents: list[dict[str, Any]],
    ) -> int:
        """Index uploaded bidder filings into the BIDDER_DOCUMENT knowledge domain."""
        chunks = []
        for doc in documents:
            doc_name = doc.get("filename") or doc.get("original_filename") or "bidder_document.pdf"
            doc_type = doc.get("doc_type", "BIDDER_ATTACHMENT")
            pages = doc.get("pages") or []

            if pages:
                # Multi-page structure
                chunks.extend(
                    self.chunker.chunk_pages(
                        pages=pages,
                        domain=KnowledgeDomain.BIDDER_DOCUMENT,
                        document_name=doc_name,
                        bidder_id=bidder_id,
                        metadata={"doc_type": doc_type, "bidder_name": bidder_name},
                    )
                )
            else:
                # Single text representation
                doc_text = doc.get("text", "")
                chunks.extend(
                    self.chunker.chunk_text(
                        text=doc_text,
                        domain=KnowledgeDomain.BIDDER_DOCUMENT,
                        document_name=doc_name,
                        page_no=doc.get("page_no", 1),
                        bidder_id=bidder_id,
                        metadata={"doc_type": doc_type, "bidder_name": bidder_name},
                    )
                )

        self.index_chunks(chunks)
        return len(chunks)

    def index_evidence_findings(
        self,
        bidder_id: str,
        findings: list[dict[str, Any]],
    ) -> int:
        """Index evaluation findings into the EVIDENCE knowledge domain."""
        chunks = []
        for f in findings:
            rule_id = f.get("rule_id", "R-GEN-01")
            status = f.get("status", "REVIEW")
            title = f.get("title", "")
            explanation = f.get("explanation", "")
            citation = f.get("citation") or {}
            evidence_items = f.get("evidence") or []
            page_no = 1
            if evidence_items and isinstance(evidence_items, list):
                first_ev = evidence_items[0]
                if isinstance(first_ev, dict):
                    page_no = first_ev.get("page_no") or first_ev.get("page") or 1

            evidence_text = (
                f"Finding {rule_id} [{status}]: {title}. Explanation: {explanation}. "
                f"Statutory Citation: {citation.get('source', 'CPCL Rules')}."
            )
            chunks.extend(
                self.chunker.chunk_text(
                    text=evidence_text,
                    domain=KnowledgeDomain.EVIDENCE,
                    document_name="VigilBid_Evaluation_Findings.json",
                    page_no=page_no,
                    section="Compliance Evaluation",
                    clause=rule_id,
                    bidder_id=bidder_id,
                    rule_id=rule_id,
                    metadata={"status": status, "finding_id": str(f.get("id", ""))},
                )
            )

        self.index_chunks(chunks)
        return len(chunks)

    def search(
        self,
        query: str,
        domains: Optional[list[str]] = None,
        bidder_id: Optional[str] = None,
        tender_id: Optional[str] = None,
        top_k: int = 3,
    ) -> list[RetrievedClause]:
        """Perform ranked BM25 search with domain filtering and keyword boosts."""
        if not self.chunks or not query.strip():
            return []

        query_tokens = self.tokenize(query)
        if not query_tokens:
            return []

        total_docs = len(self.chunks)
        scores: list[tuple[float, int, KnowledgeChunk]] = []

        # Target domains
        target_domains = None
        if domains:
            target_domains = {d.lower() for d in domains}

        for idx, chunk in enumerate(self.chunks):
            # Domain filter
            chunk_domain = chunk.domain.value if isinstance(chunk.domain, KnowledgeDomain) else str(chunk.domain)
            if target_domains and chunk_domain.lower() not in target_domains:
                continue

            # Bidder filter
            if bidder_id and chunk.bidder_id and str(chunk.bidder_id) != str(bidder_id):
                continue

            # Tender filter
            if tender_id and chunk.tender_id and str(chunk.tender_id) != str(tender_id):
                continue

            doc_toks = self._doc_tokens[idx]
            if not doc_toks:
                continue

            doc_len = len(doc_toks)
            term_counts = Counter(doc_toks)
            bm25_score = 0.0

            for q_term in query_tokens:
                if q_term in term_counts:
                    freq = term_counts[q_term]
                    df = self._df.get(q_term, 1)
                    # Standard BM25 IDF
                    idf = math.log((total_docs - df + 0.5) / (df + 0.5) + 1.0)
                    tf_component = (freq * (self.k1 + 1.0)) / (
                        freq + self.k1 * (1.0 - self.b + self.b * (doc_len / (self._avgdl or 1.0)))
                    )
                    bm25_score += idf * tf_component

            # Specific query keyword boosts
            query_lower = query.lower()
            text_lower = chunk.text.lower()
            clause_lower = (chunk.clause or "").lower()

            # Clause number exact match bonus (e.g. "Rule 170" or "144")
            for token in query_tokens:
                if token.isalnum() and len(token) >= 3:
                    if token in clause_lower:
                        bm25_score += 3.5
                    elif token in text_lower:
                        bm25_score += 0.5

            # Phrase match bonus
            if len(query_tokens) >= 2 and query_lower in text_lower:
                bm25_score += 4.0

            if bm25_score > 0.0:
                scores.append((bm25_score, idx, chunk))

        # Sort descending by score
        scores.sort(key=lambda item: item[0], reverse=True)
        top_results = scores[:top_k]

        if not top_results:
            return []

        max_score = top_results[0][0] if top_results else 1.0
        retrieved: list[RetrievedClause] = []

        for raw_score, _, chunk in top_results:
            norm_score = min(1.0, raw_score / max(1.0, max_score))
            domain_val = chunk.domain.value if isinstance(chunk.domain, KnowledgeDomain) else str(chunk.domain)

            # Extract best snippet
            best_snippet = self._extract_best_snippet(chunk.text, query_tokens)

            retrieved.append(
                RetrievedClause(
                    source=chunk.document_name,
                    clause=chunk.clause or chunk.section or f"{domain_val.upper()} Reference",
                    content=chunk.text,
                    score=norm_score,
                    page_no=chunk.page_no or 1,
                    domain=domain_val,
                    exact_quote=best_snippet,
                    document_name=chunk.document_name,
                    url=None,
                )
            )

        return retrieved

    def _extract_best_snippet(self, text: str, query_tokens: list[str]) -> str:
        """Extract the most relevant factual sentence from text for quote citation."""
        text_protected = re.sub(r"\b(Rs|No|Pvt|Ltd|Dr|Mr|Ms)\.", r"\1_DOT_", text, flags=re.IGNORECASE)
        sentences = [x.replace("_DOT_", ".") for x in re.split(r"(?<=[.?!])\s+", text_protected)]
        if not sentences:
            return text[:200]

        best_sentence = sentences[0]
        max_matches = -1

        for sent in sentences:
            # Never choose an adversarial prompt injection as a factual citation
            is_inj, _ = PromptInjectionGuard.scan(sent)
            if is_inj:
                continue

            sent_lower = sent.lower()
            matches = sum(1 for tok in query_tokens if tok in sent_lower)
            if matches > max_matches:
                max_matches = matches
                best_sentence = sent

        return best_sentence.strip()


class RegulatoryRetriever:
    """Backward-compatible regulatory retriever wrapping ProcurementRetriever."""

    def __init__(self):
        self.retriever = ProcurementRetriever()

    def search(self, query: str, top_k: int = 3) -> list[RetrievedClause]:
        return self.retriever.search(query, domains=["regulatory"], top_k=top_k)
