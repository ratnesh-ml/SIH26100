"""Deterministic Compliance Rule Engine evaluating YAML rules and cross-document verification."""

from dataclasses import dataclass, field
from pathlib import Path
import re
from typing import Any, Optional
import yaml

from pipeline.compliance.cross_verifier import CrossDocumentVerifier, VerificationFinding
from pipeline.entity_resolution.validators import (
    validate_gstin,
    validate_pan,
    validate_udin,
    validate_udyam,
)
from pipeline.registry_adapters.base import RegistryProvider

DEFAULT_RULES_PATH = Path(__file__).resolve().parent.parent.parent / "rules" / "cpcl_goods_v1.yaml"


@dataclass
class RuleFindingResult:
    """Standardized finding output for a single evaluated compliance rule."""
    rule_id: str
    rule_version: str
    status: str  # PASS, WARN, REVIEW, FAIL, INFO
    title: str
    explanation: str
    citation: dict[str, Any]
    evidence: list[dict[str, Any]] = field(default_factory=list)
    confidence: float = 1.0
    extracted: dict[str, Any] = field(default_factory=dict)
    expected: dict[str, Any] = field(default_factory=dict)
    category: str = "HARD"
    potential_anomaly_detected: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "rule_version": self.rule_version,
            "status": self.status,
            "title": self.title,
            "explanation": self.explanation,
            "citation": self.citation,
            "evidence": self.evidence,
            "confidence": round(self.confidence, 4),
            "extracted": self.extracted,
            "expected": self.expected,
            "category": self.category,
            "potential_anomaly_detected": self.potential_anomaly_detected,
        }


@dataclass
class BidderComplianceSummary:
    """Aggregated compliance evaluation summary across all applicable rules for a bidder."""
    bidder_id: Optional[str]
    overall_status: str  # "FAIL", "REVIEW", "WARN", "PASS"
    recommendation: str
    findings: list[RuleFindingResult]
    pass_count: int
    fail_count: int
    warn_count: int
    review_count: int

    def to_dict(self) -> dict[str, Any]:
        return {
            "bidder_id": self.bidder_id,
            "overall_status": self.overall_status,
            "recommendation": self.recommendation,
            "findings": [f.to_dict() for f in self.findings],
            "pass_count": self.pass_count,
            "fail_count": self.fail_count,
            "warn_count": self.warn_count,
            "review_count": self.review_count,
        }


def calculate_precedence(statuses: list[str]) -> str:
    """Compute overall compliance status following the strict precedence hierarchy: FAIL > REVIEW > WARN > PASS."""
    upper_statuses = [s.upper() for s in statuses if s]
    if not upper_statuses:
        return "PASS"
    if "FAIL" in upper_statuses:
        return "FAIL"
    if "REVIEW" in upper_statuses:
        return "REVIEW"
    if "WARN" in upper_statuses:
        return "WARN"
    return "PASS"


def get_recommendation_for_status(status: str) -> str:
    """Derive conservative human-in-the-loop audit recommendations per project architecture."""
    status_upper = status.upper()
    if status_upper == "FAIL":
        return "Recommended: Not Qualified — officer confirmation required"
    if status_upper == "REVIEW":
        return "Needs Review — officer inspection required"
    if status_upper == "WARN":
        return "Qualified with observations"
    return "Recommended: Qualified"


class ComplianceEngine:
    """Evaluates bidder extracted data against statutory compliance rules and cross-document verifications."""

    def __init__(self, rules_path: Optional[Path] = None):
        self.rules_path = Path(rules_path) if rules_path else DEFAULT_RULES_PATH
        self.rules: list[dict[str, Any]] = []
        self.rule_map: dict[str, dict[str, Any]] = {}
        self.version: str = "1.0"
        self.template_name: str = "cpcl_goods_v1"
        self.cross_verifier = CrossDocumentVerifier()
        self._load_rules()

    def _load_rules(self) -> None:
        """Load and index YAML rule configurations."""
        if self.rules_path and self.rules_path.exists():
            try:
                with open(self.rules_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    if isinstance(data, dict):
                        self.version = str(data.get("version", "1.0"))
                        self.template_name = str(data.get("template_name", "cpcl_goods_v1"))
                        self.rules = data.get("rules", [])
                        self.rule_map = {r.get("id"): r for r in self.rules if "id" in r}
            except Exception:
                self.rules = []
                self.rule_map = {}

    def evaluate_rule(
        self,
        rule_id: str,
        bidder_data: dict[str, Any],
        tender_context: Optional[dict[str, Any]] = None,
    ) -> RuleFindingResult:
        """Deterministically evaluate a single compliance rule against extracted bidder data."""
        tender = tender_context or {}
        rule = self.rule_map.get(rule_id, {})
        title = rule.get("title", f"Rule {rule_id}")
        version = rule.get("version", self.version)
        category = rule.get("category", "HARD")
        clause = rule.get("clause", "")
        citation = rule.get("citation", {"source": clause})

        evaluator = rule.get("evaluator", "")

        # -----------------------------------------------------------------
        # Dispatch to deterministic evaluator
        # -----------------------------------------------------------------
        if evaluator == "gstin_checksum" or rule_id in ("R-ID-01", "R-GST-01"):
            return self._eval_gstin_checksum(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "pan_gstin_linkage" or rule_id in ("R-ID-02", "R-GST-02"):
            return self._eval_pan_gstin_linkage(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "pan_checksum_format" or rule_id == "R-PAN-01":
            return self._eval_pan_format(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "udyam_validation" or rule_id in ("R-ID-03", "R-UDY-01"):
            return self._eval_udyam_validation(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "udyam_category_mse_benefits" or rule_id == "R-UDY-02":
            return self._eval_udyam_category_mse(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "turnover_threshold" or rule_id == "R-FIN-01":
            return self._eval_turnover_threshold(rule_id, title, version, category, citation, bidder_data, tender)

        if evaluator == "net_worth_positive" or rule_id == "R-FIN-02":
            return self._eval_net_worth(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "udin_validation" or rule_id == "R-FIN-03":
            return self._eval_udin_validation(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "make_in_india" or rule_id == "R-REG-01":
            return self._eval_make_in_india(rule_id, title, version, category, citation, bidder_data, tender)

        if evaluator == "land_border_144xi" or rule_id == "R-REG-02":
            return self._eval_land_border(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "debarment_check" or rule_id == "R-REG-03":
            return self._eval_debarment(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "oem_authorization" or rule_id == "R-TEC-01":
            return self._eval_oem_authorization(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "past_performance" or rule_id == "R-TEC-02":
            return self._eval_past_performance(rule_id, title, version, category, citation, bidder_data)

        if evaluator == "emd_or_mse_exemption" or rule_id == "R-COM-01":
            return self._eval_emd_or_mse(rule_id, title, version, category, citation, bidder_data, tender)

        if evaluator == "document_presence" or rule_id == "R-DOC-01":
            return self._eval_document_presence(rule_id, title, version, category, citation, bidder_data, "GST_CERT")

        # Fallback default evaluation
        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"Rule {rule_id} evaluated with default pass criteria.",
            citation=citation,
            extracted={},
            expected={},
            category=category,
        )

    def evaluate_bidder(
        self,
        bidder_data: dict[str, Any],
        tender_context: Optional[dict[str, Any]] = None,
    ) -> BidderComplianceSummary:
        """Evaluate all applicable compliance rules for a bidder and compile summary."""
        findings: list[RuleFindingResult] = []
        bidder_id = bidder_data.get("bidder_id")

        for rule in self.rules:
            r_id = rule.get("id")
            if not r_id:
                continue

            # Check applies_when condition
            applies_when = rule.get("applies_when", "always")
            if applies_when == "bidder.claims_mse" and not bidder_data.get("claims_mse", False):
                continue

            finding = self.evaluate_rule(r_id, bidder_data, tender_context)
            findings.append(finding)

        # Count statuses
        pass_count = sum(1 for f in findings if f.status == "PASS")
        fail_count = sum(1 for f in findings if f.status == "FAIL")
        warn_count = sum(1 for f in findings if f.status == "WARN")
        review_count = sum(1 for f in findings if f.status == "REVIEW")

        overall_status = calculate_precedence([f.status for f in findings])
        recommendation = get_recommendation_for_status(overall_status)

        return BidderComplianceSummary(
            bidder_id=bidder_id,
            overall_status=overall_status,
            recommendation=recommendation,
            findings=findings,
            pass_count=pass_count,
            fail_count=fail_count,
            warn_count=warn_count,
            review_count=review_count,
        )

    # =========================================================================
    # Individual Evaluators (Deterministic Logic)
    # =========================================================================

    def _eval_gstin_checksum(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        gstin = bidder_data.get("gstin")
        ev = bidder_data.get("gst_evidence")
        evidence_list = [ev] if ev else []

        if not gstin:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="GSTIN certificate or number missing from bidder submission — manual review required.",
                citation=citation,
                evidence=evidence_list,
                extracted={"gstin": None},
                expected={"gstin": "15-character statutory GSTIN"},
                category=category,
            )

        val = validate_gstin(gstin)
        if not val.is_valid:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=f"GSTIN '{gstin}' failed checksum verification ({val.error_message}).",
                citation=citation,
                evidence=evidence_list,
                extracted={"gstin": gstin},
                expected={"is_valid": True},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"GSTIN '{gstin}' passed structure and Mod-36 checksum verification.",
            citation=citation,
            evidence=evidence_list,
            extracted={"gstin": gstin},
            expected={"is_valid": True},
            category=category,
        )

    def _eval_pan_gstin_linkage(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        gstin = bidder_data.get("gstin")
        pan = bidder_data.get("pan")
        ev_gst = bidder_data.get("gst_evidence")
        ev_pan = bidder_data.get("pan_evidence")
        evidence = [e for e in (ev_gst, ev_pan) if e]

        if not gstin or not pan:
            missing = []
            if not gstin:
                missing.append("GSTIN")
            if not pan:
                missing.append("PAN")
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation=f"Cannot verify PAN-GSTIN parity: missing evidence for {', '.join(missing)}.",
                citation=citation,
                evidence=evidence,
                extracted={"gstin": gstin, "pan": pan},
                expected={"gstin": "present", "pan": "present"},
                category=category,
            )

        clean_gst = str(gstin).strip().upper()
        clean_pan = str(pan).strip().upper()

        if len(clean_gst) >= 12:
            embedded_pan = clean_gst[2:12]
        else:
            embedded_pan = ""

        if embedded_pan != clean_pan:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=(
                    f"Conflicting statutory evidence: Embedded PAN in GSTIN ('{embedded_pan}') "
                    f"does not match declared PAN card ('{clean_pan}')."
                ),
                citation=citation,
                evidence=evidence,
                extracted={"embedded_pan": embedded_pan, "declared_pan": clean_pan},
                expected={"embedded_pan": clean_pan},
                category=category,
                potential_anomaly_detected=True,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"PAN '{clean_pan}' matches embedded identifier in GSTIN '{clean_gst}'.",
            citation=citation,
            evidence=evidence,
            extracted={"embedded_pan": embedded_pan, "declared_pan": clean_pan},
            expected={"embedded_pan": clean_pan},
            category=category,
        )

    def _eval_pan_format(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        pan = bidder_data.get("pan")
        ev = bidder_data.get("pan_evidence")
        evidence = [ev] if ev else []

        if not pan:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="PAN card document or identifier not submitted in bid package.",
                citation=citation,
                evidence=evidence,
                extracted={"pan": None},
                expected={"pan": "10-character PAN"},
                category=category,
            )

        val = validate_pan(pan)
        if not val.is_valid:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=f"PAN '{pan}' is invalid ({val.error_message}).",
                citation=citation,
                evidence=evidence,
                extracted={"pan": pan},
                expected={"is_valid": True},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"PAN '{pan}' is structurally valid.",
            citation=citation,
            evidence=evidence,
            extracted={"pan": pan},
            expected={"is_valid": True},
            category=category,
        )

    def _eval_udyam_validation(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        udyam_no = bidder_data.get("udyam_no")
        ev = bidder_data.get("udyam_evidence")
        evidence = [ev] if ev else []

        if not udyam_no:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="Udyam certificate missing for MSE claim — officer review required.",
                citation=citation,
                evidence=evidence,
                extracted={"udyam_no": None},
                expected={"udyam_no": "UDYAM-XX-00-0000000"},
                category=category,
            )

        val = validate_udyam(udyam_no)
        if not val.is_valid:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=f"Udyam number '{udyam_no}' is structurally invalid ({val.error_message}).",
                citation=citation,
                evidence=evidence,
                extracted={"udyam_no": udyam_no},
                expected={"is_valid": True},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"Udyam number '{udyam_no}' conforms to Ministry of MSME specification.",
            citation=citation,
            evidence=evidence,
            extracted={"udyam_no": udyam_no},
            expected={"is_valid": True},
            category=category,
        )

    def _eval_udyam_category_mse(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        enterprise_cat = bidder_data.get("enterprise_category", "").upper()
        ev = bidder_data.get("udyam_evidence")
        evidence = [ev] if ev else []

        if not enterprise_cat:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="Udyam enterprise category (Micro/Small/Medium) not verified in evidence.",
                citation=citation,
                evidence=evidence,
                extracted={"category": None},
                expected={"category": "MICRO or SMALL"},
                category=category,
            )

        if enterprise_cat == "MEDIUM":
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=(
                    "Ineligible MSE exemption claim: Enterprise is classified as MEDIUM; "
                    "Public Procurement Policy for MSEs Order 2012 strictly limits benefits to Micro and Small enterprises."
                ),
                citation=citation,
                evidence=evidence,
                extracted={"enterprise_category": "MEDIUM"},
                expected={"enterprise_category": "MICRO or SMALL"},
                category=category,
                potential_anomaly_detected=True,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"Enterprise category '{enterprise_cat}' is eligible for MSE procurement preferences.",
            citation=citation,
            evidence=evidence,
            extracted={"enterprise_category": enterprise_cat},
            expected={"enterprise_category": "MICRO or SMALL"},
            category=category,
        )

    def _eval_turnover_threshold(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
        tender: dict[str, Any],
    ) -> RuleFindingResult:
        turnover = bidder_data.get("average_turnover_inr")
        threshold = tender.get("min_turnover_threshold_inr") or tender.get("min_turnover_inr", 13500000.0)
        ev = bidder_data.get("financial_evidence")
        evidence = [ev] if ev else []

        if turnover is None:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="Audited turnover figures not extracted from submitted financial statements.",
                citation=citation,
                evidence=evidence,
                extracted={"turnover": None},
                expected={"min_turnover_threshold_inr": threshold},
                category=category,
            )

        if turnover < threshold:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=(
                    f"Turnover shortfall: Average annual turnover of Rs. {turnover:,.2f} "
                    f"is below the required tender threshold of Rs. {threshold:,.2f}."
                ),
                citation=citation,
                evidence=evidence,
                extracted={"average_turnover_inr": turnover},
                expected={"min_turnover_threshold_inr": threshold},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"Average turnover Rs. {turnover:,.2f} exceeds minimum threshold Rs. {threshold:,.2f}.",
            citation=citation,
            evidence=evidence,
            extracted={"average_turnover_inr": turnover},
            expected={"min_turnover_threshold_inr": threshold},
            category=category,
        )

    def _eval_net_worth(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        net_worth = bidder_data.get("net_worth_inr")
        ev = bidder_data.get("financial_evidence")
        evidence = [ev] if ev else []

        if net_worth is None:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="Audited net worth not extracted from latest balance sheet.",
                citation=citation,
                evidence=evidence,
                extracted={"net_worth_inr": None},
                expected={"net_worth_inr": "> 0"},
                category=category,
            )

        if net_worth < 0:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=f"Financial insolvency: Net worth is negative (Rs. {net_worth:,.2f}).",
                citation=citation,
                evidence=evidence,
                extracted={"net_worth_inr": net_worth},
                expected={"net_worth_inr": "> 0"},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"Net worth is positive (Rs. {net_worth:,.2f}) meeting solvency criteria.",
            citation=citation,
            evidence=evidence,
            extracted={"net_worth_inr": net_worth},
            expected={"net_worth_inr": "> 0"},
            category=category,
        )

    def _eval_udin_validation(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        udin = bidder_data.get("udin")
        ev = bidder_data.get("financial_evidence")
        evidence = [ev] if ev else []

        if not udin:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="WARN",
                title=title,
                explanation="CA turnover certificate does not display a Unique Document Identification Number (UDIN).",
                citation=citation,
                evidence=evidence,
                extracted={"udin": None},
                expected={"udin": "18-character alphanumeric string"},
                category=category,
            )

        val = validate_udin(udin)
        if not val.is_valid:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="WARN",
                title=title,
                explanation=f"UDIN '{udin}' does not conform to ICAI standard format ({val.error_message}).",
                citation=citation,
                evidence=evidence,
                extracted={"udin": udin},
                expected={"is_valid": True},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"UDIN '{udin}' verified conforming to ICAI mandate.",
            citation=citation,
            evidence=evidence,
            extracted={"udin": udin},
            expected={"is_valid": True},
            category=category,
        )

    def _eval_make_in_india(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
        tender: dict[str, Any],
    ) -> RuleFindingResult:
        local_pct = bidder_data.get("local_content_pct")
        min_pct = tender.get("min_local_content_pct", 50.0)
        ev = bidder_data.get("mii_evidence")
        evidence = [ev] if ev else []

        if local_pct is None:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="Make in India (PPP-MII) local content self-declaration missing from bid package.",
                citation=citation,
                evidence=evidence,
                extracted={"local_content_pct": None},
                expected={"min_local_content_pct": min_pct},
                category=category,
            )

        if local_pct < min_pct:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=(
                    f"Inadequate local content: Declared local content ({local_pct}%) "
                    f"is below required minimum ({min_pct}%)."
                ),
                citation=citation,
                evidence=evidence,
                extracted={"local_content_pct": local_pct},
                expected={"min_local_content_pct": min_pct},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"Declared local content of {local_pct}% meets or exceeds required {min_pct}%.",
            citation=citation,
            evidence=evidence,
            extracted={"local_content_pct": local_pct},
            expected={"min_local_content_pct": min_pct},
            category=category,
        )

    def _eval_land_border(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        has_decl = bidder_data.get("has_land_border_decl")
        land_origin = bidder_data.get("land_border_origin", False)
        has_reg = bidder_data.get("has_competent_reg", False)
        ev = bidder_data.get("lb_evidence")
        evidence = [ev] if ev else []

        if not has_decl:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="Mandatory Rule 144(xi) land border compliance declaration not submitted.",
                citation=citation,
                evidence=evidence,
                extracted={"has_land_border_decl": False},
                expected={"has_land_border_decl": True},
                category=category,
            )

        if land_origin and not has_reg:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation=(
                    "Bidder declares beneficial ownership in country sharing land border with India "
                    "without evidence of registration with Competent Authority — legal review required."
                ),
                citation=citation,
                evidence=evidence,
                extracted={"land_border_origin": True, "has_competent_reg": False},
                expected={"has_competent_reg": True},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation="Compliant Rule 144(xi) land border declaration submitted.",
            citation=citation,
            evidence=evidence,
            extracted={"has_land_border_decl": True},
            expected={"has_land_border_decl": True},
            category=category,
        )

    def _eval_debarment(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        debarred = bidder_data.get("debarred", False)
        reason = bidder_data.get("debarment_reason")
        order_no = bidder_data.get("debarment_order_no")

        if debarred:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=(
                    f"Potential anomaly detected: Entity identified on national debarment list "
                    f"(Order: {order_no or 'N/A'}, Reason: {reason or 'Blacklisted under GFR 151'})."
                ),
                citation=citation,
                evidence=[],
                extracted={"debarred": True, "order_no": order_no},
                expected={"debarred": False},
                category=category,
                potential_anomaly_detected=True,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation="Entity is not listed on CPPP / GeM debarment lists.",
            citation=citation,
            evidence=[],
            extracted={"debarred": False},
            expected={"debarred": False},
            category=category,
        )

    def _eval_oem_authorization(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        is_oem = bidder_data.get("is_oem", False)
        has_auth = bidder_data.get("has_oem_auth", False)
        refs_tender = bidder_data.get("oem_auth_references_tender", False)
        ev = bidder_data.get("oem_evidence")
        evidence = [ev] if ev else []

        if is_oem:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="PASS",
                title=title,
                explanation="Bidder is the Original Equipment Manufacturer (OEM); authorization letter not required.",
                citation=citation,
                evidence=evidence,
                extracted={"is_oem": True},
                expected={"is_oem": True},
                category=category,
            )

        if not has_auth:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="OEM Manufacturer Authorization letter not provided — officer review required.",
                citation=citation,
                evidence=evidence,
                extracted={"has_oem_auth": False},
                expected={"has_oem_auth": True},
                category=category,
            )

        if not refs_tender:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="WARN",
                title=title,
                explanation="OEM authorization letter submitted but does not explicitly cite this tender NIT number.",
                citation=citation,
                evidence=evidence,
                extracted={"has_oem_auth": True, "refs_tender": False},
                expected={"refs_tender": True},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation="Valid tender-specific OEM Manufacturer Authorization letter verified.",
            citation=citation,
            evidence=evidence,
            extracted={"has_oem_auth": True, "refs_tender": True},
            expected={"has_oem_auth": True},
            category=category,
        )

    def _eval_past_performance(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
    ) -> RuleFindingResult:
        has_cert = bidder_data.get("has_completion_cert", False)
        order_val = bidder_data.get("order_value_inr", 0.0)
        ev = bidder_data.get("exp_evidence")
        evidence = [ev] if ev else []

        if not has_cert:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation="Similar past work completion certificates not provided — officer verification required.",
                citation=citation,
                evidence=evidence,
                extracted={"has_completion_cert": False},
                expected={"has_completion_cert": True},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"Valid past performance completion certificate verified (order value: Rs. {order_val:,.2f}).",
            citation=citation,
            evidence=evidence,
            extracted={"order_value_inr": order_val},
            expected={"has_completion_cert": True},
            category=category,
        )

    def _eval_emd_or_mse(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
        tender: dict[str, Any],
    ) -> RuleFindingResult:
        is_exempt = bidder_data.get("is_mse_exempt", False)
        paid = bidder_data.get("emd_paid_inr", 0.0)
        required = tender.get("emd_amount_inr", 900000.0)
        ev = bidder_data.get("emd_evidence")
        evidence = [ev] if ev else []

        if is_exempt:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="PASS",
                title=title,
                explanation="Exempted from Earnest Money Deposit (EMD) under Public Procurement Policy for MSEs Order 2012.",
                citation=citation,
                evidence=evidence,
                extracted={"is_mse_exempt": True},
                expected={"is_mse_exempt": True},
                category=category,
            )

        if paid < required:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="FAIL",
                title=title,
                explanation=f"EMD shortfall: Submitted payment of Rs. {paid:,.2f} is less than required Rs. {required:,.2f}.",
                citation=citation,
                evidence=evidence,
                extracted={"emd_paid_inr": paid},
                expected={"emd_required_inr": required},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"EMD amount of Rs. {paid:,.2f} submitted via Bank Guarantee / DD.",
            citation=citation,
            evidence=evidence,
            extracted={"emd_paid_inr": paid},
            expected={"emd_required_inr": required},
            category=category,
        )

    def _eval_document_presence(
        self,
        rule_id: str,
        title: str,
        version: str,
        category: str,
        citation: dict[str, Any],
        bidder_data: dict[str, Any],
        required_doc: str,
    ) -> RuleFindingResult:
        submitted = bidder_data.get("submitted_document_types", [])
        if required_doc not in submitted:
            return RuleFindingResult(
                rule_id=rule_id,
                rule_version=version,
                status="REVIEW",
                title=title,
                explanation=f"Mandatory document '{required_doc}' not found in uploaded bid submission — officer check required.",
                citation=citation,
                evidence=[],
                extracted={"submitted_document_types": submitted},
                expected={"required_document": required_doc},
                category=category,
            )

        return RuleFindingResult(
            rule_id=rule_id,
            rule_version=version,
            status="PASS",
            title=title,
            explanation=f"Mandatory document '{required_doc}' verified present.",
            citation=citation,
            evidence=[],
            extracted={"required_document": required_doc},
            expected={"required_document": required_doc},
            category=category,
        )

    # =========================================================================
    # Cross-Document Verification Wrapper (retained from Phase 18)
    # =========================================================================

    async def evaluate_cross_document_checks(
        self,
        bidder_data: dict[str, Any],
        tender_due_date: Optional[str] = None,
        registry_provider: Optional[RegistryProvider] = None,
        claims_mse: bool = False,
    ) -> list[VerificationFinding]:
        """Execute full suite of cross-document verifications for a bidder package."""
        findings: list[VerificationFinding] = []

        # 1. PAN <-> GSTIN parity
        pan_val = bidder_data.get("pan")
        gstin_val = bidder_data.get("gstin")
        pan_name = bidder_data.get("pan_name")
        gst_name = bidder_data.get("gst_legal_name") or bidder_data.get("gst_trade_name")

        findings.extend(
            self.cross_verifier.verify_pan_gstin_parity(
                pan_value=pan_val,
                gstin_value=gstin_val,
                pan_name=pan_name,
                gst_name=gst_name,
                pan_doc_evidence=bidder_data.get("pan_evidence"),
                gst_doc_evidence=bidder_data.get("gst_evidence"),
            )
        )

        # 2. GST <-> Udyam parity
        udyam_val = bidder_data.get("udyam_no")
        udyam_pan = bidder_data.get("udyam_pan")
        udyam_gstin = bidder_data.get("udyam_gstin")
        udyam_name = bidder_data.get("udyam_enterprise_name")

        findings.extend(
            self.cross_verifier.verify_gst_udyam_parity(
                gstin=gstin_val,
                udyam_no=udyam_val,
                udyam_pan=udyam_pan,
                udyam_gstin=udyam_gstin,
                gst_name=gst_name,
                udyam_name=udyam_name,
                gst_doc_evidence=bidder_data.get("gst_evidence"),
                udyam_doc_evidence=bidder_data.get("udyam_evidence"),
            )
        )

        # 3. Company Name <-> GST / Udyam parity
        company_name = bidder_data.get("company_name")
        if company_name and gst_name:
            findings.append(
                self.cross_verifier.verify_company_name_parity(
                    declared_bidder_name=company_name,
                    target_name=gst_name,
                    target_doc_type="GST",
                    doc_evidence=bidder_data.get("gst_evidence"),
                )
            )

        if company_name and udyam_name:
            findings.append(
                self.cross_verifier.verify_company_name_parity(
                    declared_bidder_name=company_name,
                    target_name=udyam_name,
                    target_doc_type="UDYAM",
                    doc_evidence=bidder_data.get("udyam_evidence"),
                )
            )

        # 4. Identity fields <-> Government Registry
        if registry_provider:
            reg_findings = await self.cross_verifier.verify_identity_against_registry(
                registry_provider=registry_provider,
                gstin=gstin_val,
                pan=pan_val,
                udyam_no=udyam_val,
                cin=bidder_data.get("cin"),
                company_name=company_name,
                claims_mse_benefits=claims_mse,
            )
            findings.extend(reg_findings)

        # 5. Document dates <-> Tender submission deadline
        if tender_due_date:
            for doc in bidder_data.get("documents", []):
                doc_type = doc.get("type", "DOCUMENT")
                issue_date = doc.get("issue_date")
                valid_until = doc.get("valid_until")
                findings.extend(
                    self.cross_verifier.verify_registration_and_dates(
                        document_type=doc_type,
                        issue_date_str=issue_date,
                        tender_due_date_str=tender_due_date,
                        valid_until_str=valid_until,
                        doc_evidence=doc.get("evidence"),
                    )
                )

        return findings
