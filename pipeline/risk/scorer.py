"""Transparent weighted risk score computation and risk driver aggregation."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional
import yaml

DEFAULT_WEIGHTS_PATH = Path(__file__).resolve().parent.parent.parent / "rules" / "risk_weights.yaml"


@dataclass
class RiskFactor:
    """Individual risk driver contributing to the overall bidder risk composite."""
    factor_id: str
    category: str  # COMPLIANCE, IDENTITY, REGISTRY, DOCUMENTATION, CONTRADICTION, FORENSIC, COLLUSION, DEBARMENT
    title: str
    weight: int
    score: int
    evidence_reference: Optional[dict[str, Any]] = None
    explanation: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "factor_id": self.factor_id,
            "category": self.category,
            "title": self.title,
            "weight": self.weight,
            "score": self.score,
            "evidence_reference": self.evidence_reference or {},
            "explanation": self.explanation,
        }


@dataclass
class RiskBreakdown:
    """Comprehensive explainable risk assessment output with composite score and driver ranking."""
    total_score: int  # 0 to 100
    risk_band: str  # 'LOW' | 'MEDIUM' | 'HIGH'
    recommendation: str
    drivers: list[RiskFactor] = field(default_factory=list)
    driver_count: int = 0
    top_drivers: list[RiskFactor] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "total_score": self.total_score,
            "risk_band": self.risk_band,
            "recommendation": self.recommendation,
            "drivers": [d.to_dict() for d in self.drivers],
            "driver_count": self.driver_count,
            "top_drivers": [d.to_dict() for d in self.top_drivers],
        }


class RiskScorer:
    """Aggregates statutory findings, forensic anomalies, and cross-document inconsistencies into an explainable 0–100 score."""

    def __init__(self, weights_path: Optional[Path] = None):
        self.weights_path = Path(weights_path) if weights_path else DEFAULT_WEIGHTS_PATH
        self.weights: dict[str, Any] = {}
        self.bands: dict[str, Any] = {}
        self._load_config()

    def _load_config(self) -> None:
        """Load YAML configuration for risk weights and classification bands."""
        if self.weights_path and self.weights_path.exists():
            try:
                with open(self.weights_path, "r", encoding="utf-8") as f:
                    cfg = yaml.safe_load(f)
                    if isinstance(cfg, dict):
                        self.weights = cfg.get("weights", {})
                        self.bands = cfg.get("bands", {})
            except Exception:
                self.weights = {}
                self.bands = {}

    def get_risk_band(self, score: int) -> tuple[str, str]:
        """Map a numeric composite score (0–100) to standard traffic-light risk band and narrative."""
        # Check YAML bands first if present
        if self.bands:
            low_max = self.bands.get("low", {}).get("max", 24)
            med_max = self.bands.get("medium", {}).get("max", 54)
            if score <= low_max:
                desc = self.bands.get("low", {}).get("description", "Standard risk profile — routine review")
                return "LOW", desc
            if score <= med_max:
                desc = self.bands.get("medium", {}).get("description", "Elevated risk signals — officer verification required on flagged drivers")
                return "MEDIUM", desc
            desc = self.bands.get("high", {}).get("description", "Substantial risk signals — thorough human review required before qualification")
            return "HIGH", desc

        # Built-in specification bands: 0–24 Low · 25–54 Medium · 55–100 High
        if score <= 24:
            return "LOW", "Standard risk profile — routine review"
        if score <= 54:
            return "MEDIUM", "Elevated risk signals — officer verification required on flagged drivers"
        return "HIGH", "Substantial risk signals — thorough human review required before qualification"

    def calculate_risk(
        self,
        findings: Optional[list[Any]] = None,
        anomalies: Optional[list[Any]] = None,
        entity_resolution_score: Optional[float] = None,
        missing_documents: Optional[list[str]] = None,
        expired_documents: Optional[list[str]] = None,
        government_registry_failures: Optional[list[str]] = None,
        cross_bidder_links: Optional[list[Any]] = None,
        debarment_hits: Optional[list[str]] = None,
    ) -> RiskBreakdown:
        """Deterministically aggregate all risk factors into composite score and driver ranking."""
        drivers: list[RiskFactor] = []

        findings = findings or []
        anomalies = anomalies or []
        missing_documents = missing_documents or []
        expired_documents = expired_documents or []
        government_registry_failures = government_registry_failures or []
        cross_bidder_links = cross_bidder_links or []
        debarment_hits = debarment_hits or []

        # ---------------------------------------------------------------------
        # 1. Compliance Rule Findings (HARD FAIL, REVIEW, WARN)
        # ---------------------------------------------------------------------
        fail_findings = [f for f in findings if (getattr(f, "status", None) == "FAIL" or (isinstance(f, dict) and f.get("status") == "FAIL"))]
        review_findings = [f for f in findings if (getattr(f, "status", None) == "REVIEW" or (isinstance(f, dict) and f.get("status") == "REVIEW"))]
        warn_findings = [f for f in findings if (getattr(f, "status", None) == "WARN" or (isinstance(f, dict) and f.get("status") == "WARN"))]

        if fail_findings:
            # +25 points per HARD FAIL, capped at 50 points
            points = min(50, len(fail_findings) * 25)
            drivers.append(
                RiskFactor(
                    factor_id="RF-COMP-FAIL",
                    category="COMPLIANCE",
                    title="Statutory Eligibility Rule Failure",
                    weight=50,
                    score=points,
                    evidence_reference={"failed_rule_count": len(fail_findings)},
                    explanation=f"Risk signal: {len(fail_findings)} mandatory statutory rule(s) failed — requires review.",
                )
            )

        if review_findings:
            # +8 points per REVIEW, capped at 24 points
            points = min(24, len(review_findings) * 8)
            drivers.append(
                RiskFactor(
                    factor_id="RF-COMP-REVIEW",
                    category="COMPLIANCE",
                    title="Criteria Requiring Officer Review",
                    weight=24,
                    score=points,
                    evidence_reference={"review_rule_count": len(review_findings)},
                    explanation=f"Risk signal: {len(review_findings)} criterion/criteria require manual inspection.",
                )
            )

        if warn_findings:
            # +3 points per WARN, capped at 12 points
            points = min(12, len(warn_findings) * 3)
            drivers.append(
                RiskFactor(
                    factor_id="RF-COMP-WARN",
                    category="COMPLIANCE",
                    title="Non-Critical Advisory Observations",
                    weight=12,
                    score=points,
                    evidence_reference={"warn_rule_count": len(warn_findings)},
                    explanation=f"Risk signal: {len(warn_findings)} soft observation(s) noted on submitted documents.",
                )
            )

        # ---------------------------------------------------------------------
        # 2. Entity Resolution Confidence
        # ---------------------------------------------------------------------
        if entity_resolution_score is not None:
            if entity_resolution_score < 0.60:
                drivers.append(
                    RiskFactor(
                        factor_id="RF-ER-LOW",
                        category="IDENTITY",
                        title="Low Entity Resolution Confidence",
                        weight=20,
                        score=20,
                        evidence_reference={"er_score": entity_resolution_score},
                        explanation=(
                            f"Risk signal: Cross-document entity resolution confidence is low ({entity_resolution_score:.2f}) — "
                            "potential anomaly detected; requires review."
                        ),
                    )
                )
            elif entity_resolution_score < 0.85:
                drivers.append(
                    RiskFactor(
                        factor_id="RF-ER-MOD",
                        category="IDENTITY",
                        title="Moderate Entity Resolution Confidence",
                        weight=10,
                        score=10,
                        evidence_reference={"er_score": entity_resolution_score},
                        explanation=(
                            f"Risk signal: Name or address variation across documents (confidence {entity_resolution_score:.2f}) — "
                            "requires review."
                        ),
                    )
                )

        # ---------------------------------------------------------------------
        # 3. Missing Mandatory Documents
        # ---------------------------------------------------------------------
        if missing_documents:
            points = min(30, len(missing_documents) * 10)
            drivers.append(
                RiskFactor(
                    factor_id="RF-DOC-MISSING",
                    category="DOCUMENTATION",
                    title="Missing Mandatory Documents",
                    weight=30,
                    score=points,
                    evidence_reference={"missing_documents": missing_documents},
                    explanation=f"Risk signal: Missing mandatory document(s): {', '.join(missing_documents)} — requires review.",
                )
            )

        # ---------------------------------------------------------------------
        # 4. Expired Certificates
        # ---------------------------------------------------------------------
        if expired_documents:
            points = min(30, len(expired_documents) * 15)
            drivers.append(
                RiskFactor(
                    factor_id="RF-DOC-EXPIRED",
                    category="DOCUMENTATION",
                    title="Expired Statutory Certificates",
                    weight=30,
                    score=points,
                    evidence_reference={"expired_documents": expired_documents},
                    explanation=(
                        f"Risk signal: Certificate validity expired prior to tender due date: "
                        f"{', '.join(expired_documents)} — requires review."
                    ),
                )
            )

        # ---------------------------------------------------------------------
        # 5. Government Verification Failures
        # ---------------------------------------------------------------------
        if government_registry_failures:
            points = min(40, len(government_registry_failures) * 25)
            drivers.append(
                RiskFactor(
                    factor_id="RF-REG-FAILURE",
                    category="REGISTRY",
                    title="Government Registry Verification Discrepancy",
                    weight=40,
                    score=points,
                    evidence_reference={"failures": government_registry_failures},
                    explanation=(
                        f"Risk signal: Statutory registry verification flagged discrepancy: "
                        f"{', '.join(government_registry_failures)} — potential anomaly detected; requires review."
                    ),
                )
            )

        # ---------------------------------------------------------------------
        # 6. Forensic & Content Anomalies
        # ---------------------------------------------------------------------
        for a in anomalies:
            code = getattr(a, "code", None) or (a.get("code") if isinstance(a, dict) else "A-GEN-01")
            pts = getattr(a, "points", None) or (a.get("points") if isinstance(a, dict) else 6)
            title = getattr(a, "title", None) or (a.get("title") if isinstance(a, dict) else "Document Anomaly Signal")
            desc = getattr(a, "description", None) or (a.get("description") if isinstance(a, dict) else "Potential anomaly detected — requires review.")

            drivers.append(
                RiskFactor(
                    factor_id=f"RF-ANOM-{code}",
                    category="FORENSIC",
                    title=title,
                    weight=pts,
                    score=pts,
                    evidence_reference=getattr(a, "evidence", None) or (a.get("evidence") if isinstance(a, dict) else {}),
                    explanation=desc,
                )
            )

        # ---------------------------------------------------------------------
        # 7. Cross-Bidder Links (Collusion Risk Signals)
        # ---------------------------------------------------------------------
        for link in cross_bidder_links:
            title = getattr(link, "title", None) or (link.get("title") if isinstance(link, dict) else "Cross-Bidder Collision")
            pts = getattr(link, "points", None) or (link.get("points") if isinstance(link, dict) else 15)
            desc = getattr(link, "description", None) or (link.get("description") if isinstance(link, dict) else "Risk signal: Cross-bidder relationship detected — requires review.")
            drivers.append(
                RiskFactor(
                    factor_id="RF-XB-COLLUSION",
                    category="COLLUSION",
                    title=title,
                    weight=pts,
                    score=pts,
                    evidence_reference=getattr(link, "evidence", None) or (link.get("evidence") if isinstance(link, dict) else {}),
                    explanation=desc,
                )
            )

        # ---------------------------------------------------------------------
        # 8. Debarment Hits
        # ---------------------------------------------------------------------
        if debarment_hits:
            drivers.append(
                RiskFactor(
                    factor_id="RF-DEB-MATCH",
                    category="DEBARMENT",
                    title="National Debarment Registry Match",
                    weight=35,
                    score=35,
                    evidence_reference={"debarment_records": debarment_hits},
                    explanation=(
                        "Risk signal: Entity or related director identified on national debarment list — "
                        "potential anomaly detected; requires review."
                    ),
                )
            )

        # ---------------------------------------------------------------------
        # Composite Score & Driver Ranking
        # ---------------------------------------------------------------------
        raw_sum = sum(d.score for d in drivers)
        total_score = min(100, max(0, raw_sum))

        risk_band, recommendation = self.get_risk_band(total_score)
        top_drivers = sorted(drivers, key=lambda d: d.score, reverse=True)[:5]

        return RiskBreakdown(
            total_score=total_score,
            risk_band=risk_band,
            recommendation=recommendation,
            drivers=drivers,
            driver_count=len(drivers),
            top_drivers=top_drivers,
        )
