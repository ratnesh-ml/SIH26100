"""Transparent weighted risk score computation."""

from dataclasses import dataclass
from typing import Any


@dataclass
class RiskBreakdown:
    total_score: int
    risk_band: str  # 'LOW' | 'MEDIUM' | 'HIGH'
    drivers: list[dict[str, Any]]


class RiskScorer:
    """Aggregates findings and anomaly points into an explainable 0–100 score."""

    def calculate_risk(self, findings: list[dict[str, Any]], anomalies: list[dict[str, Any]]) -> RiskBreakdown:
        raise NotImplementedError("Risk calculation will be implemented in future phase")
