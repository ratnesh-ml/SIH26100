import uuid
import pytest
from httpx import ASGITransport, AsyncClient

from backend.main import app
from backend.core.security import create_access_token
from backend.api.deps import get_current_user
from backend.models.entities import User
from pipeline.risk.graph import (
    BidderLinkGraph,
    BidderPairLink,
    CrossBidderGraphBuilder,
    GraphEdge,
    GraphNode,
)


@pytest.fixture
def graph_builder():
    return CrossBidderGraphBuilder()


@pytest.fixture
def override_user():
    officer_user = User(
        id=uuid.uuid4(),
        email="officer@cpcl.in",
        role="officer",
        full_name="Test Officer",
    )
    app.dependency_overrides[get_current_user] = lambda: officer_user
    yield officer_user
    app.dependency_overrides.clear()


@pytest.fixture
def auth_headers(override_user):
    token = create_access_token(subject=str(override_user.id), role="officer")
    return {"Authorization": f"Bearer {token}"}


# =========================================================================
# 1. Graph Data Structures and Edge Attribute Contracts
# =========================================================================

def test_edge_contract_attributes():
    """Verify that every edge contains source, target, reason, evidence, and strength."""
    edge = GraphEdge(
        source="bidder-c",
        target="bidder-d",
        reason="Shared contact phone number",
        evidence={"attribute": "phone", "value": "9840198401"},
        strength=15.0,
        edge_type="SHARED_ATTRIBUTE",
    )
    assert hasattr(edge, "source")
    assert hasattr(edge, "target")
    assert hasattr(edge, "reason")
    assert hasattr(edge, "evidence")
    assert hasattr(edge, "strength")

    d = edge.to_dict()
    assert d["source"] == "bidder-c"
    assert d["target"] == "bidder-d"
    assert d["reason"] == "Shared contact phone number"
    assert d["evidence"]["value"] == "9840198401"
    assert d["strength"] == 15.0


def test_bidder_pair_link_contract():
    """Verify BidderPairLink contains direct link metadata and CVC guideline warning."""
    link = BidderPairLink(
        source_bidder="b-01",
        target_bidder="b-02",
        source_bidder_name="Bidder One",
        target_bidder_name="Bidder Two",
        reason="Shared PDF author and phone",
        evidence={"shared_count": 2},
        strength=25.0,
        shared_attributes=[
            {"type": "PDF_AUTHOR", "value": "Suresh Laptop", "points": 10},
            {"type": "PHONE", "value": "9840198401", "points": 15},
        ],
    )
    d = link.to_dict()
    assert d["source_bidder"] == "b-01"
    assert d["target_bidder"] == "b-02"
    assert d["strength"] == 25.0
    assert "CVC guideline" in d["cvc_warning"]
    assert len(d["shared_attributes"]) == 2


# =========================================================================
# 2. Deterministic Link Construction (All Approved Signals)
# =========================================================================

def test_isolated_bidders_zero_edges(graph_builder):
    """Bidders with distinct identifiers produce zero links and zero clusters."""
    bidders = [
        {
            "bidder_id": "b1",
            "company_name": "Company A",
            "phone": "9840111111",
            "email": "contact@companya.in",
            "directors": ["Ravi Kumar"],
            "address": "12 Mount Road, Chennai 600002",
            "bank_account": "HDFC0001111",
            "pdf_author": "Accountant Alpha",
        },
        {
            "bidder_id": "b2",
            "company_name": "Company B",
            "phone": "9840222222",
            "email": "contact@companyb.in",
            "directors": ["Priya Sharma"],
            "address": "88 Anna Salai, Chennai 600032",
            "bank_account": "ICIC0002222",
            "pdf_author": "Finance Beta",
        },
    ]

    graph = graph_builder.build_graph(bidders)
    assert len(graph.direct_bidder_links) == 0
    assert len(graph.clusters) == 0
    assert graph.summary["linked_bidders_count"] == 0
    assert graph.summary["max_link_strength"] == 0.0


def test_shared_director_link(graph_builder):
    """Detect shared common director between two distinct bidders."""
    bidders = [
        {"bidder_id": "b1", "company_name": "Valves Ltd", "directors": ["K. Sundaram", "A. Patel"]},
        {"bidder_id": "b2", "company_name": "Pumps Ltd", "directors": ["K. Sundaram", "M. Singh"]},
    ]
    graph = graph_builder.build_graph(bidders)
    assert len(graph.direct_bidder_links) == 1

    link = graph.direct_bidder_links[0]
    assert link.strength == 15.0
    assert "director" in link.reason.lower()
    assert any(a["type"] == "DIRECTOR" for a in link.shared_attributes)


def test_shared_contact_phone_and_email(graph_builder):
    """Detect shared telephone and email address across distinct bidders."""
    bidders = [
        {"bidder_id": "b1", "company_name": "Alpha Corp", "phone": "+91 9840198401", "email": "tender@commonoffice.com"},
        {"bidder_id": "b2", "company_name": "Beta Corp", "phone": "09840198401", "email": "tender@commonoffice.com"},
    ]
    graph = graph_builder.build_graph(bidders)
    assert len(graph.direct_bidder_links) == 1

    link = graph.direct_bidder_links[0]
    assert link.strength == 30.0  # 15 phone + 15 email
    assert len(link.shared_attributes) == 2


def test_shared_address_and_bank_account(graph_builder):
    """Detect common bank account and identical premises."""
    bidders = [
        {
            "bidder_id": "b1",
            "company_name": "Equip One",
            "address": "Plot 42, SIDCO Industrial Estate, Ambattur, Chennai 600058",
            "bank_account": "SBIN00012345678",
        },
        {
            "bidder_id": "b2",
            "company_name": "Equip Two",
            "address": "Plot 42, SIDCO Industrial Estate, Ambattur, Chennai 600058",
            "bank_account": "SBIN00012345678",
        },
    ]
    graph = graph_builder.build_graph(bidders)
    assert len(graph.direct_bidder_links) == 1

    link = graph.direct_bidder_links[0]
    assert link.strength == 30.0  # 15 address + 15 bank


def test_shared_pdf_metadata_author_and_timestamp(graph_builder):
    """Detect identical PDF author and generation timestamp across different bidder submissions."""
    bidders = [
        {
            "bidder_id": "b1",
            "company_name": "Supplier X",
            "pdf_author": "Suresh Laptop",
            "creation_date": "2026-08-14 11:20:00",
        },
        {
            "bidder_id": "b2",
            "company_name": "Supplier Y",
            "pdf_author": "Suresh Laptop",
            "creation_date": "2026-08-14 11:20:00",
        },
    ]
    graph = graph_builder.build_graph(bidders)
    assert len(graph.direct_bidder_links) == 1

    link = graph.direct_bidder_links[0]
    assert link.strength == 20.0  # 10 author + 10 metadata
    assert any(a["type"] == "PDF_AUTHOR" for a in link.shared_attributes)


def test_near_duplicate_text_simhash(graph_builder):
    """Detect near-duplicate declaration text hash across bidders."""
    common_hash = "simhash_mii_decl_88f7a1"
    bidders = [
        {"bidder_id": "b1", "company_name": "Bidder 1", "document_hashes": [common_hash]},
        {"bidder_id": "b2", "company_name": "Bidder 2", "document_hashes": [common_hash]},
    ]
    graph = graph_builder.build_graph(bidders)
    assert len(graph.direct_bidder_links) == 1

    link = graph.direct_bidder_links[0]
    assert link.strength == 10.0
    assert any(a["type"] == "DOC_SIMHASH" for a in link.shared_attributes)


# =========================================================================
# 3. Specification Demo Scenario (Bidder C & Bidder D Collusion)
# =========================================================================

def test_specification_demo_scenario_bidder_c_and_d(graph_builder):
    """Verify Section 10.4 / Section 26 demo moment:
    Bidder C and Bidder D share Author 'Suresh Laptop' and Phone '9840198401'
    -> CVC related-party bidding flag.
    """
    bidders = [
        {
            "bidder_id": "bidder-a",
            "company_name": "Kaveri Engineering Works",
            "phone": "9840100001",
            "pdf_author": "Kaveri Workstation",
        },
        {
            "bidder_id": "bidder-b",
            "company_name": "Sri Kaveri Engineering Works",
            "phone": "9840100002",
            "pdf_author": "Finance Dept",
        },
        {
            "bidder_id": "bidder-c",
            "company_name": "Coromandel Engineering Works",
            "phone": "9840198401",          # Shared phone
            "pdf_author": "Suresh Laptop",  # Shared author
        },
        {
            "bidder_id": "bidder-d",
            "company_name": "Delta Petrochemical Equipment",
            "phone": "9840198401",          # Shared phone
            "pdf_author": "Suresh Laptop",  # Shared author
        },
    ]

    graph = graph_builder.build_graph(bidders, tender_id="demo-pump-217")

    # Overall structure
    assert graph.summary["total_bidders"] == 4
    assert graph.summary["linked_bidders_count"] == 2
    assert graph.summary["collusion_clusters_count"] == 1
    assert len(graph.direct_bidder_links) == 1

    cd_link = graph.direct_bidder_links[0]
    assert cd_link.source_bidder == "bidder-c"
    assert cd_link.target_bidder == "bidder-d"
    assert cd_link.strength == 25.0  # 15 phone + 10 author
    assert "CVC guideline on related bidders" in cd_link.cvc_warning
    assert "Coromandel Engineering Works" in cd_link.source_bidder_name
    assert "Delta Petrochemical Equipment" in cd_link.target_bidder_name

    # Connected component contains exactly bidder-c and bidder-d
    cluster = graph.clusters[0]
    assert set(cluster) == {"bidder-c", "bidder-d"}


# =========================================================================
# 4. Multi-Bidder Collusion Triads
# =========================================================================

def test_multi_bidder_collusion_triad(graph_builder):
    """Bidders 1, 2, and 3 form a connected collusion cluster via shared director and bank."""
    bidders = [
        {"bidder_id": "b1", "company_name": "Firm 1", "directors": ["R. Sharma"], "bank_account": "BANK111"},
        {"bidder_id": "b2", "company_name": "Firm 2", "directors": ["R. Sharma"], "bank_account": "BANK222"},
        {"bidder_id": "b3", "company_name": "Firm 3", "directors": ["Different"], "bank_account": "BANK222"},
    ]
    graph = graph_builder.build_graph(bidders)

    assert len(graph.clusters) == 1
    assert len(graph.clusters[0]) == 3
    assert graph.summary["linked_bidders_count"] == 3


# =========================================================================
# 5. REST API Endpoints Verification
# =========================================================================

@pytest.mark.asyncio
async def test_api_compute_cross_bidder_graph(auth_headers):
    """Test POST /api/v1/risk/graph computes graph data from raw payload."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        payload = {
            "tender_id": "tender-test-123",
            "bidders": [
                {
                    "bidder_id": "b-alpha",
                    "company_name": "Alpha Valves",
                    "phone": "9840198401",
                    "pdf_author": "Common Laptop",
                },
                {
                    "bidder_id": "b-beta",
                    "company_name": "Beta Valves",
                    "phone": "9840198401",
                    "pdf_author": "Common Laptop",
                },
            ],
        }
        resp = await ac.post("/api/v1/risk/graph", json=payload, headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()

        assert "nodes" in data
        assert "edges" in data
        assert "direct_bidder_links" in data
        assert "summary" in data

        assert len(data["direct_bidder_links"]) == 1
        link = data["direct_bidder_links"][0]
        assert link["strength"] == 25.0
        assert "CVC guideline" in link["cvc_warning"]
        assert data["summary"]["linked_bidders_count"] == 2


@pytest.mark.asyncio
async def test_api_graph_requires_authentication():
    """Verify unauthorized request to graph endpoint is rejected."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        resp = await ac.post("/api/v1/risk/graph", json={"bidders": []})
        assert resp.status_code in (401, 403)
