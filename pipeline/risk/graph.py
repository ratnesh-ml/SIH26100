"""Deterministic Cross-Bidder Link Graph construction using NetworkX.

Builds explainable entity-relationship graphs connecting bidders via shared identifiers,
common directors, contact details, bank accounts, PDF author metadata, and near-duplicate text.

Strictly deterministic: replaces black-box GNNs with explainable CVC-aligned link analysis.
"""

from dataclasses import dataclass, field
import hashlib
import re
from typing import Any, Optional
import networkx as nx


@dataclass
class GraphNode:
    """Node in the cross-bidder link graph (either a Bidder or a Shared Attribute)."""
    id: str
    label: str
    node_type: str  # "BIDDER", "DIRECTOR", "PHONE", "EMAIL", "ADDRESS", "BANK_ACCOUNT", "PDF_AUTHOR", "DOC_SIMHASH"
    properties: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "label": self.label,
            "node_type": self.node_type,
            "type": self.node_type,
            "properties": self.properties,
        }


@dataclass
class GraphEdge:
    """Edge connecting a Bidder to an attribute or directly to another Bidder."""
    source: str
    target: str
    reason: str
    evidence: dict[str, Any] = field(default_factory=dict)
    strength: float = 1.0  # Weight points or normalized strength
    edge_type: str = "SHARED_ATTRIBUTE"

    def to_dict(self) -> dict[str, Any]:
        return {
            "source": self.source,
            "target": self.target,
            "reason": self.reason,
            "evidence": self.evidence,
            "strength": round(self.strength, 2),
            "edge_type": self.edge_type,
        }


@dataclass
class BidderPairLink:
    """Synthesized direct relationship link between two distinct bidders."""
    source_bidder: str
    target_bidder: str
    source_bidder_name: str
    target_bidder_name: str
    reason: str
    evidence: dict[str, Any]
    strength: float
    shared_attributes: list[dict[str, Any]]
    cvc_warning: str = "Potential related-party bidding — verify independently (CVC guideline on related bidders)."

    def to_dict(self) -> dict[str, Any]:
        return {
            "source_bidder": self.source_bidder,
            "target_bidder": self.target_bidder,
            "source_bidder_name": self.source_bidder_name,
            "target_bidder_name": self.target_bidder_name,
            "reason": self.reason,
            "evidence": self.evidence,
            "strength": round(self.strength, 2),
            "shared_attributes": self.shared_attributes,
            "cvc_warning": self.cvc_warning,
        }


@dataclass
class BidderLinkGraph:
    """Complete graph structure containing nodes, edges, direct links, and cluster metrics."""
    nodes: list[GraphNode] = field(default_factory=list)
    edges: list[GraphEdge] = field(default_factory=list)
    direct_bidder_links: list[BidderPairLink] = field(default_factory=list)
    clusters: list[list[str]] = field(default_factory=list)
    summary: dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> dict[str, Any]:
        return {
            "nodes": [n.to_dict() for n in self.nodes],
            "edges": [e.to_dict() for e in self.edges],
            "direct_bidder_links": [l.to_dict() for l in self.direct_bidder_links],
            "clusters": self.clusters,
            "summary": self.summary,
        }


class CrossBidderGraphBuilder:
    """Builds a deterministic NetworkX link graph across multiple bidder packages.
    
    Evaluates:
    - Shared Directors / DINs (+15 pts)
    - Shared Phone Numbers (+15 pts)
    - Shared Email Domains / Addresses (+15 pts)
    - Shared Registered Addresses (+15 pts)
    - Shared Bank Accounts (+15 pts)
    - Shared PDF Authors / Creators (+10 pts)
    - Shared PDF Metadata Timestamps (+10 pts)
    - Near-Duplicate Document SimHash / Shingles (+10 pts)
    """

    PUBLIC_EMAIL_DOMAINS = {
        "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "rediffmail.com", "icloud.com"
    }

    WEIGHT_MAP = {
        "DIRECTOR": 15.0,
        "PHONE": 15.0,
        "EMAIL": 15.0,
        "ADDRESS": 15.0,
        "BANK_ACCOUNT": 15.0,
        "PDF_AUTHOR": 10.0,
        "PDF_METADATA": 10.0,
        "DOC_SIMHASH": 10.0,
    }

    def build_graph(
        self,
        bidders: list[dict[str, Any]],
        tender_id: Optional[str] = None,
    ) -> BidderLinkGraph:
        """Construct a deterministic cross-bidder link graph from bidder metadata."""
        G = nx.Graph()

        # Step 1: Add Bidder Nodes
        bidder_map: dict[str, dict[str, Any]] = {}
        for b in bidders:
            b_id = str(b.get("bidder_id") or b.get("id") or "")
            if not b_id:
                continue

            name = str(b.get("company_name") or b.get("legal_name") or f"Bidder {b_id}")
            bidder_map[b_id] = b

            G.add_node(
                b_id,
                node_type="BIDDER",
                label=name,
                company_name=name,
                risk_score=b.get("risk_score", 0),
                risk_band=b.get("risk_band", "LOW"),
            )

        # Attribute index to find overlaps: attr_key -> dict of bidder_id -> evidence_value
        attr_index: dict[tuple[str, str], dict[str, Any]] = {}

        for b_id, b in bidder_map.items():
            # 1. Directors (list of strings or dicts)
            directors = b.get("directors") or []
            if isinstance(directors, str):
                directors = [d.strip() for d in directors.split(",") if d.strip()]
            for d in directors:
                d_name = d.get("name") if isinstance(d, dict) else str(d)
                clean_d = self._clean_string(d_name)
                if clean_d and len(clean_d) > 3:
                    key = ("DIRECTOR", clean_d)
                    attr_index.setdefault(key, {})[b_id] = d_name

            # 2. Phone
            phone = str(b.get("phone") or "").strip()
            clean_phone = re.sub(r"[^0-9]", "", phone)
            if len(clean_phone) >= 10:
                clean_phone = clean_phone[-10:]
                key = ("PHONE", clean_phone)
                attr_index.setdefault(key, {})[b_id] = phone

            # 3. Email
            email = str(b.get("email") or "").strip().lower()
            if email and "@" in email:
                key = ("EMAIL", email)
                attr_index.setdefault(key, {})[b_id] = email

            # 4. Address / PIN
            address = str(b.get("address") or "").strip()
            clean_addr = self._clean_address(address)
            if clean_addr and len(clean_addr) > 10:
                addr_hash = hashlib.sha256(clean_addr.encode("utf-8")).hexdigest()[:12]
                key = ("ADDRESS", addr_hash)
                attr_index.setdefault(key, {})[b_id] = address

            # 5. Bank Account
            bank_acct = str(b.get("bank_account") or "").strip()
            clean_bank = re.sub(r"[^a-zA-Z0-9]", "", bank_acct).upper()
            if len(clean_bank) >= 6:
                key = ("BANK_ACCOUNT", clean_bank)
                attr_index.setdefault(key, {})[b_id] = bank_acct

            # 6. PDF Author
            pdf_author = str(b.get("pdf_author") or "").strip()
            clean_author = self._clean_string(pdf_author)
            if clean_author and len(clean_author) > 3 and clean_author not in ("microsoft word", "unknown", "administrator", "user"):
                key = ("PDF_AUTHOR", clean_author)
                attr_index.setdefault(key, {})[b_id] = pdf_author

            # 7. PDF Creation Date / Metadata
            creation_date = str(b.get("creation_date") or "").strip()
            clean_cd = re.sub(r"[^0-9]", "", creation_date)[:14]
            if len(clean_cd) >= 8:
                key = ("PDF_METADATA", clean_cd)
                attr_index.setdefault(key, {})[b_id] = creation_date

            # 8. Document Text SimHash / Shingle Hash
            doc_hashes = b.get("document_hashes") or []
            if isinstance(doc_hashes, str):
                doc_hashes = [h.strip() for h in doc_hashes.split(",") if h.strip()]
            for dh in doc_hashes:
                if dh and len(dh) >= 8:
                    key = ("DOC_SIMHASH", dh)
                    attr_index.setdefault(key, {})[b_id] = dh

        # Step 2: Identify Overlaps and Build Nodes and Edges
        graph_nodes: list[GraphNode] = []
        graph_edges: list[GraphEdge] = []
        bidder_pair_overlaps: dict[tuple[str, str], list[dict[str, Any]]] = {}

        # Add all bidder nodes
        for node_id, data in G.nodes(data=True):
            graph_nodes.append(
                GraphNode(
                    id=node_id,
                    label=data.get("label", node_id),
                    node_type="BIDDER",
                    properties={
                        "company_name": data.get("company_name", ""),
                        "risk_score": data.get("risk_score", 0),
                        "risk_band": data.get("risk_band", "LOW"),
                    },
                )
            )

        # For each attribute shared by 2 or more bidders, create an Attribute Node and link them
        for (attr_type, attr_val), sharing_bidders in attr_index.items():
            if len(sharing_bidders) >= 2:
                attr_node_id = f"attr-{attr_type.lower()}-{attr_val[:16]}"
                attr_label = f"{attr_type.replace('_', ' ').title()}: {attr_val}"
                weight = self.WEIGHT_MAP.get(attr_type, 10.0)

                # Add attribute node
                G.add_node(attr_node_id, node_type=attr_type, label=attr_label, value=attr_val)
                graph_nodes.append(
                    GraphNode(
                        id=attr_node_id,
                        label=attr_label,
                        node_type=attr_type,
                        properties={"attribute_type": attr_type, "value": attr_val},
                    )
                )

                b_ids = list(sharing_bidders.keys())
                for b_id in b_ids:
                    raw_val = sharing_bidders[b_id]
                    reason = f"Shared {attr_type.replace('_', ' ').lower()} with other bidders"
                    edge = GraphEdge(
                        source=b_id,
                        target=attr_node_id,
                        reason=reason,
                        evidence={"attribute": attr_type, "value": raw_val},
                        strength=weight,
                        edge_type="SHARED_ATTRIBUTE",
                    )
                    G.add_edge(b_id, attr_node_id, weight=weight, reason=reason)
                    graph_edges.append(edge)

                # Track pairwise overlaps between bidders
                for i in range(len(b_ids)):
                    for j in range(i + 1, len(b_ids)):
                        pair = tuple(sorted([b_ids[i], b_ids[j]]))
                        bidder_pair_overlaps.setdefault(pair, []).append(
                            {
                                "type": attr_type,
                                "value": attr_val,
                                "points": weight,
                            }
                        )

        # Step 3: Build Direct Bidder-to-Bidder Collusion Links
        direct_links: list[BidderPairLink] = []
        for (b1_id, b2_id), shared_attrs in bidder_pair_overlaps.items():
            b1_name = bidder_map.get(b1_id, {}).get("company_name", f"Bidder {b1_id}")
            b2_name = bidder_map.get(b2_id, {}).get("company_name", f"Bidder {b2_id}")

            total_strength = sum(a["points"] for a in shared_attrs)
            attr_types_str = ", ".join(sorted(list({a["type"].replace("_", " ").lower() for a in shared_attrs})))
            reason = f"Shared {attr_types_str} across distinct bidders"

            evidence = {
                "shared_count": len(shared_attrs),
                "attributes": shared_attrs,
            }

            direct_links.append(
                BidderPairLink(
                    source_bidder=b1_id,
                    target_bidder=b2_id,
                    source_bidder_name=b1_name,
                    target_bidder_name=b2_name,
                    reason=reason,
                    evidence=evidence,
                    strength=total_strength,
                    shared_attributes=shared_attrs,
                )
            )

        # Step 4: Compute Connected Components / Collusion Clusters
        # Filter G to only Bidder nodes to find clusters
        bidder_subgraph = nx.Graph()
        for b_id in bidder_map:
            bidder_subgraph.add_node(b_id)
        for link in direct_links:
            bidder_subgraph.add_edge(link.source_bidder, link.target_bidder, weight=link.strength)

        clusters: list[list[str]] = [
            list(comp) for comp in nx.connected_components(bidder_subgraph) if len(comp) > 1
        ]

        # Step 5: Construct Summary
        summary = {
            "tender_id": tender_id,
            "total_bidders": len(bidder_map),
            "linked_bidders_count": sum(len(c) for c in clusters),
            "collusion_clusters_count": len(clusters),
            "total_direct_links": len(direct_links),
            "max_link_strength": max((l.strength for l in direct_links), default=0.0),
        }

        return BidderLinkGraph(
            nodes=graph_nodes,
            edges=graph_edges,
            direct_bidder_links=direct_links,
            clusters=clusters,
            summary=summary,
        )

    def _clean_string(self, val: str) -> str:
        if not val:
            return ""
        return re.sub(r"[^a-zA-Z0-9\s]", "", str(val)).strip().lower()

    def _clean_address(self, addr: str) -> str:
        if not addr:
            return ""
        return re.sub(r"[^a-zA-Z0-9]", "", str(addr)).lower()
