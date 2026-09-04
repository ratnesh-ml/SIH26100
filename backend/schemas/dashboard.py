"""Pydantic schemas for Executive Dashboard and Telemetry Metrics."""

from typing import Any
from pydantic import BaseModel, Field


class DashboardMetricsOut(BaseModel):
    total_tenders: int = 0
    total_bidders: int = 0
    verified_bidders: int = 0
    pending_bidders: int = 0
    high_risk_bidders: int = 0
    compliance_distribution: dict[str, int] = Field(default_factory=dict)
    risk_distribution: dict[str, int] = Field(default_factory=dict)
    avg_risk_score: float = 0.0
    finding_counts: dict[str, Any] = Field(default_factory=dict)
    processing_performance: dict[str, Any] = Field(default_factory=dict)

