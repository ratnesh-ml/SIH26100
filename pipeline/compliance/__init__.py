"""Compliance Rule Engine and Cross-Document Verification Subsystem."""

from pipeline.compliance.cross_verifier import (
    CrossDocumentVerifier,
    VerificationFinding,
)
from pipeline.compliance.engine import (
    BidderComplianceSummary,
    ComplianceEngine,
    RuleFindingResult,
    calculate_precedence,
    get_recommendation_for_status,
)

__all__ = [
    "CrossDocumentVerifier",
    "VerificationFinding",
    "ComplianceEngine",
    "RuleFindingResult",
    "BidderComplianceSummary",
    "calculate_precedence",
    "get_recommendation_for_status",
]
