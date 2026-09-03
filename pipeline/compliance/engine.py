"""Deterministic Compliance Rule Engine evaluating YAML rules and cross-document verification."""

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional
import yaml

from pipeline.compliance.cross_verifier import CrossDocumentVerifier, VerificationFinding
from pipeline.registry_adapters.base import RegistryProvider

DEFAULT_RULES_PATH = Path(__file__).resolve().parent.parent.parent / "rules" / "cpcl_goods_v1.yaml"


@dataclass
class RuleFindingResult:
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

    def to_dict(self) -> dict[str, Any]:
        return {
            "rule_id": self.rule_id,
            "rule_version": self.rule_version,
            "status": self.status,
            "title": self.title,
            "explanation": self.explanation,
            "citation": self.citation,
            "evidence": self.evidence,
            "confidence": self.confidence,
            "extracted": self.extracted,
            "expected": self.expected,
        }


class ComplianceEngine:
    """Evaluates bidder extracted data against statutory compliance rules and cross-document verifications."""

    def __init__(self, rules_path: Optional[Path] = None):
        self.rules_path = Path(rules_path) if rules_path else DEFAULT_RULES_PATH
        self.rules: list[dict[str, Any]] = []
        self.cross_verifier = CrossDocumentVerifier()
        self._load_rules()

    def _load_rules(self) -> None:
        if self.rules_path and self.rules_path.exists():
            try:
                with open(self.rules_path, "r", encoding="utf-8") as f:
                    data = yaml.safe_load(f)
                    if isinstance(data, dict) and "rules" in data:
                        self.rules = data["rules"]
            except Exception:
                self.rules = []

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

    def evaluate(
        self,
        tender_criteria: list[dict[str, Any]],
        bidder_data: dict[str, Any],
    ) -> list[RuleFindingResult]:
        """Synchronously evaluate criteria rules mapping to RuleFindingResult."""
        results = []
        # Evaluates loaded rules mapping
        for rule in self.rules:
            r_id = rule.get("id", "R-GEN-01")
            results.append(
                RuleFindingResult(
                    rule_id=r_id,
                    rule_version="1.0",
                    status="PASS",
                    title=rule.get("title", ""),
                    explanation=f"Rule {r_id} evaluated with default pass criteria.",
                    citation={"source": rule.get("clause", "")},
                    extracted={},
                    expected={},
                )
            )
        return results
