"""Pydantic Schemas for Cross-Bidder Link Graph and Collusion Detection."""

from typing import Any, Optional
from pydantic import BaseModel, Field


class GraphNodeOut(BaseModel):
    id: str
    label: str
    node_type: str = Field(..., alias="type")
    properties: dict[str, Any] = Field(default_factory=dict)

    model_config = {"populate_by_name": True}


class GraphEdgeOut(BaseModel):
    source: str
    target: str
    reason: str
    evidence: dict[str, Any] = Field(default_factory=dict)
    strength: float
    edge_type: str = "SHARED_ATTRIBUTE"


class BidderPairLinkOut(BaseModel):
    source_bidder: str
    target_bidder: str
    source_bidder_name: str
    target_bidder_name: str
    reason: str
    evidence: dict[str, Any] = Field(default_factory=dict)
    strength: float
    shared_attributes: list[dict[str, Any]] = Field(default_factory=list)
    cvc_warning: str = "Potential related-party bidding — verify independently (CVC guideline on related bidders)."


class GraphSummaryOut(BaseModel):
    tender_id: Optional[str] = None
    total_bidders: int = 0
    linked_bidders_count: int = 0
    collusion_clusters_count: int = 0
    total_direct_links: int = 0
    max_link_strength: float = 0.0


class BidderLinkGraphOut(BaseModel):
    nodes: list[GraphNodeOut] = Field(default_factory=list)
    edges: list[GraphEdgeOut] = Field(default_factory=list)
    direct_bidder_links: list[BidderPairLinkOut] = Field(default_factory=list)
    clusters: list[list[str]] = Field(default_factory=list)
    summary: GraphSummaryOut = Field(default_factory=GraphSummaryOut)
