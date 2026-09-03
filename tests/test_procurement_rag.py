"""Test suite for Phase 28: Procurement-Specific RAG.

Validates:
1. Four distinct knowledge domains (tender, bidder_document, regulatory, evidence)
2. Document chunking with page number and clause metadata preservation
3. BM25 retrieval and ranking with domain filtering
4. Mandatory structured citations with page references
5. Grounded Copilot response generation without hallucination
6. REST API endpoints (/api/v1/copilot/query and /api/v1/copilot/knowledge-domains)
7. Full evaluation benchmark suite execution
"""

from datetime import datetime, timezone
import uuid
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.core.database import get_db_session
from backend.core.security import create_access_token, get_password_hash
from backend.models.entities import User
from pipeline.rag.chunker import DocumentChunker
from pipeline.rag.copilot import ProcurementCopilot, RegulatoryCopilot
from pipeline.rag.eval_examples import run_rag_eval
from pipeline.rag.models import KnowledgeChunk, KnowledgeDomain, RetrievedClause
from pipeline.rag.retriever import ProcurementRetriever, RegulatoryRetriever
from seed.seed_users import DEV_USERS


# ===========================================================================
# Fixtures
# ===========================================================================

@pytest.fixture
def auth_header():
    token = create_access_token(subject=str(DEV_USERS[0]["id"]), role="officer")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def mock_api_client():
    mock_user = User(
        id=DEV_USERS[0]["id"],
        email=DEV_USERS[0]["email"],
        full_name=DEV_USERS[0]["full_name"],
        role=DEV_USERS[0]["role"],
        created_at=datetime.now(timezone.utc),
    )

    class MockRAGSession:
        async def execute(self, stmt):
            from unittest.mock import MagicMock
            mock = MagicMock()
            mock.scalar_one_or_none.return_value = mock_user
            scalars_mock = MagicMock()
            scalars_mock.all.return_value = []
            mock.scalars.return_value = scalars_mock
            return mock

    async def override_get_db():
        yield MockRAGSession()

    app.dependency_overrides[get_db_session] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# ===========================================================================
# 1. Document Chunking & Provenance Metadata
# ===========================================================================

def test_document_chunking_preserves_page_and_metadata():
    """Test chunker preserves exact page numbers, document names, and clauses."""
    chunker = DocumentChunker(target_chunk_size=50, overlap=10)
    sample_text = (
        "Rule 170(i) of GFR 2017 specifies Bid Security requirements. "
        "Micro and Small Enterprises (MSEs) registered with Udyam are 100% exempt from EMD. "
        "Startups recognized by DPIIT are also exempt from paying bid security in goods tenders.\n\n"
        "Rule 170(ii) allows a Bid Security Declaration in lieu of physical bank guarantee. "
        "Bidders accept suspension from future tenders if they withdraw their bids."
    )

    chunks = chunker.chunk_text(
        text=sample_text,
        domain=KnowledgeDomain.REGULATORY,
        document_name="GFR_2017.pdf",
        page_no=52,
        section="Bid Security",
        metadata={"statute": "GFR 2017"},
    )

    assert len(chunks) >= 2
    for c in chunks:
        assert c.domain == KnowledgeDomain.REGULATORY
        assert c.document_name == "GFR_2017.pdf"
        assert c.page_no == 52
        assert c.metadata["statute"] == "GFR 2017"
        assert len(c.text) > 20


def test_multi_page_document_chunking():
    """Test chunking a multi-page document retains sequential page tracking."""
    chunker = DocumentChunker()
    pages = [
        {"page_no": 1, "text": "Annual Report Cover Page. Audited accounts for FY 2023-24.", "section": "Cover"},
        {"page_no": 2, "text": "Auditor's Report. Independent auditor certifies compliance with accounting standards.", "section": "Audit"},
        {"page_no": 3, "text": "Balance Sheet. Net worth is Rs. 15 Crores. Current assets exceed liabilities.", "section": "Balance Sheet"},
    ]

    chunks = chunker.chunk_pages(
        pages=pages,
        domain=KnowledgeDomain.BIDDER_DOCUMENT,
        document_name="Financial_Statements.pdf",
        bidder_id="bidder-123",
    )

    assert len(chunks) == 3
    assert [c.page_no for c in chunks] == [1, 2, 3]
    assert [c.section for c in chunks] == ["Cover", "Audit", "Balance Sheet"]


# ===========================================================================
# 2. Knowledge Domain Separation & Multi-Domain Indexing
# ===========================================================================

def test_knowledge_domain_separation():
    """Test knowledge is partitioned into tender, bidder_document, regulatory, and evidence."""
    retriever = ProcurementRetriever()

    # 1. Regulatory domain is pre-loaded
    reg_results = retriever.search("EMD exemption", domains=["regulatory"], top_k=5)
    assert len(reg_results) > 0
    assert all(r.domain == "regulatory" for r in reg_results)

    # 2. Index Tender domain
    retriever.index_tender(
        tender_id="t-100",
        nit_number="CPCL/VALVES/2026",
        title="High Pressure Gate Valves Procurement",
        criteria=[{"code": "BEC-01", "name": "Experience", "page": 8, "description": "3 orders of 40% value in 7 years"}],
    )

    # 3. Index Bidder Document domain
    retriever.index_bidder_documents(
        bidder_id="b-200",
        bidder_name="Apex Valves Ltd",
        documents=[
            {"filename": "Apex_Catalog.pdf", "page_no": 4, "text": "Gate valve model GV-500 rated for 2500 PSI pressure."}
        ],
    )

    # 4. Index Evidence domain
    retriever.index_evidence_findings(
        bidder_id="b-200",
        findings=[
            {
                "id": "f-1",
                "rule_id": "R-VALVE-01",
                "status": "PASS",
                "title": "Pressure Rating Satisfied",
                "explanation": "Offered 2500 PSI exceeds BEC minimum 2000 PSI.",
                "citation": {"source": "CPCL Technical Spec"},
                "evidence": [{"page_no": 4, "quote": "rated for 2500 PSI"}],
            }
        ],
    )

    # Query Tender domain only
    tender_hits = retriever.search("Gate Valves", domains=["tender"], top_k=3)
    assert len(tender_hits) > 0
    assert all(h.domain == "tender" for h in tender_hits)

    # Query Bidder Document domain only
    bidder_hits = retriever.search("GV-500 2500 PSI", domains=["bidder_document"], top_k=3)
    assert len(bidder_hits) > 0
    assert all(h.domain == "bidder_document" for h in bidder_hits)
    assert bidder_hits[0].page_no == 4

    # Query Evidence domain only
    ev_hits = retriever.search("R-VALVE-01 Pressure Rating", domains=["evidence"], top_k=3)
    assert len(ev_hits) > 0
    assert all(h.domain == "evidence" for h in ev_hits)


# ===========================================================================
# 3. Regulatory Retrieval & BM25 Ranking Accuracy
# ===========================================================================

def test_regulatory_retriever_mse_emd_query():
    """Test searching for MSE EMD exemption returns Rule 170(i) and MSE Order Clause 4."""
    retriever = RegulatoryRetriever()
    results = retriever.search("Is an MSE bidder exempt from EMD in this tender?", top_k=3)

    assert len(results) > 0
    top_hit = results[0]
    assert "Rule 170" in top_hit.clause or "Clause 4" in top_hit.clause
    assert "exempt" in top_hit.content.lower()
    assert top_hit.page_no is not None
    assert top_hit.score > 0.0


def test_regulatory_retriever_make_in_india_query():
    """Test searching for Make in India returns Class-I / Class-II thresholds."""
    retriever = RegulatoryRetriever()
    results = retriever.search("What is the local content required for Class-I local supplier?", top_k=3)

    assert len(results) > 0
    top_hit = results[0]
    assert "Make in India" in top_hit.source or "Clause 3" in top_hit.clause or "PPP-MII" in top_hit.content
    assert "50%" in top_hit.content or "20%" in top_hit.content


def test_regulatory_retriever_udin_mandate_query():
    """Test searching for UDIN mandate returns ICAI guidance note."""
    retriever = RegulatoryRetriever()
    results = retriever.search("Is a CA financial certificate valid without ICAI UDIN?", top_k=3)

    assert len(results) > 0
    top_hit = results[0]
    assert "UDIN" in top_hit.clause or "ICAI" in top_hit.source
    assert "18-digit" in top_hit.content.lower() or "udin" in top_hit.content.lower()


# ===========================================================================
# 4. Citations & Grounded Copilot Answers
# ===========================================================================

def test_procurement_copilot_grounded_response():
    """Test Copilot provides grounded answers with mandatory structured citations."""
    copilot = ProcurementCopilot()
    response = copilot.answer_query("Can the evaluation committee seek clarifications on technical bids?")

    assert response.confidence > 0.0
    assert len(response.citations) > 0
    assert not response.used_llm

    # Validate citations contract
    for cit in response.citations:
        assert isinstance(cit, RetrievedClause)
        assert cit.source != ""
        assert cit.clause != ""
        assert cit.page_no >= 1
        assert cit.exact_quote != ""

    # Validate answer text
    assert "Rule 173(v)" in response.answer or "clarification" in response.answer.lower()
    assert "Decision Support Disclaimer" in response.answer


def test_regulatory_copilot_backward_compatibility():
    """Test legacy RegulatoryCopilot interface functions smoothly."""
    copilot = RegulatoryCopilot()
    resp = copilot.answer_query("What red flags indicate cartelization or collusion under CVC?")

    assert resp is not None
    assert len(resp.citations) >= 1
    assert "Circular 04/02/2019" in resp.citations[0].clause or "Rule 175" in resp.citations[0].clause


def test_copilot_empty_and_no_match_handling():
    """Test handling of empty or unmatchable queries."""
    copilot = ProcurementCopilot()

    # Empty query
    empty_resp = copilot.answer_query("")
    assert "No query provided" in empty_resp.answer
    assert len(empty_resp.citations) == 0

    # Non-matching nonsensical query
    no_match = copilot.answer_query("xyzqwerty123456789 nonexistingkeyword")
    assert "No relevant clauses or document passages were found" in no_match.answer
    assert len(no_match.citations) == 0


# ===========================================================================
# 5. REST API Endpoints (/copilot/query and /copilot/knowledge-domains)
# ===========================================================================

def test_api_copilot_query(mock_api_client, auth_header):
    """Test POST /api/v1/copilot/query returns grounded answer with citations."""
    payload = {
        "question": "Is an MSE bidder exempt from EMD?",
        "domains": ["regulatory"],
        "top_k": 3,
    }
    resp = mock_api_client.post("/api/v1/copilot/query", json=payload, headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert "answer" in data
    assert "citations" in data
    assert len(data["citations"]) >= 1
    assert data["citations"][0]["page_no"] is not None
    assert data["citations"][0]["domain"] == "regulatory"


def test_api_copilot_knowledge_domains(mock_api_client, auth_header):
    """Test GET /api/v1/copilot/knowledge-domains inventories all 4 domains."""
    resp = mock_api_client.get("/api/v1/copilot/knowledge-domains", headers=auth_header)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_chunks"] >= 15
    domains = [d["domain"] for d in data["domains"]]
    assert "tender" in domains
    assert "bidder_document" in domains
    assert "regulatory" in domains
    assert "evidence" in domains


# ===========================================================================
# 6. Evaluation Benchmark Suite Execution
# ===========================================================================

def test_full_rag_evaluation_benchmark():
    """Run the complete evaluation benchmark suite and verify 100% accuracy."""
    metrics = run_rag_eval()
    assert metrics["total_eval_queries"] == 9
    assert metrics["passed_eval_queries"] == 9
    assert metrics["retrieval_accuracy"] == 1.0
    assert metrics["citation_integrity"] == 1.0
