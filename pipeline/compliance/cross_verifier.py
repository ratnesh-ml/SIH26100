"""Cross-Document Verification Engine for Multi-Certificate Parity and Registry Compliance.

Evaluates cross-document consistency across:
- PAN <-> GSTIN linkage (R-GST-02)
- GSTIN <-> Udyam linkage (R-UDY-03)
- Declared Company Name <-> GST Registration (R-GST-03)
- Declared Company Name <-> Udyam Registration (R-UDY-04)
- Identity Fields <-> Government Registries (GSTN, PAN, MSME, Debarment)
- Registration Status <-> Tender / Document Dates (R-DATE-01)
"""

from dataclasses import dataclass, field
from datetime import date, datetime
import logging
from typing import Any, Optional

from pipeline.entity_resolution.matcher import EntityMatcher, EntityRecord
from pipeline.entity_resolution.validators import validate_date
from pipeline.registry_adapters.base import RegistryProvider, RegistryResult

logger = logging.getLogger(__name__)


@dataclass
class VerificationFinding:
    """Standardized result shape for cross-document verification checks."""
    check_id: str
    input_fields: dict[str, Any]
    expected_relationship: str
    actual_values: dict[str, Any]
    status: str  # PASS, FAIL, WARN, REVIEW
    confidence: float
    evidence_references: list[dict[str, Any]] = field(default_factory=list)
    explanation: str = ""
    citation: Optional[str] = None
    potential_anomaly_detected: bool = False

    def to_dict(self) -> dict[str, Any]:
        return {
            "check_id": self.check_id,
            "input_fields": self.input_fields,
            "expected_relationship": self.expected_relationship,
            "actual_values": self.actual_values,
            "status": self.status,
            "confidence": self.confidence,
            "evidence_references": self.evidence_references,
            "explanation": self.explanation,
            "citation": self.citation,
            "potential_anomaly_detected": self.potential_anomaly_detected,
        }


class CrossDocumentVerifier:
    """Deterministic & fuzzy cross-document verification engine."""

    def __init__(self, matcher: Optional[EntityMatcher] = None):
        self.matcher = matcher or EntityMatcher()

    # =========================================================================
    # 1. PAN <-> GST Verification (R-GST-02 & R-PAN-02)
    # =========================================================================

    def verify_pan_gstin_parity(
        self,
        pan_value: Optional[str],
        gstin_value: Optional[str],
        pan_name: Optional[str] = None,
        gst_name: Optional[str] = None,
        pan_doc_evidence: Optional[dict[str, Any]] = None,
        gst_doc_evidence: Optional[dict[str, Any]] = None,
    ) -> list[VerificationFinding]:
        """Verify statutory linkage between PAN card and Form GST REG-06."""
        findings = []
        evidences = [e for e in (pan_doc_evidence, gst_doc_evidence) if e]

        clean_pan = pan_value.strip().upper() if pan_value else None
        clean_gstin = gstin_value.strip().upper() if gstin_value else None

        # Check 1: Embedded PAN Parity in GSTIN (Hard Identifier)
        if not clean_pan or not clean_gstin:
            findings.append(VerificationFinding(
                check_id="XDOC-PAN-GST-01",
                input_fields={"pan": clean_pan, "gstin": clean_gstin},
                expected_relationship="Both PAN and GSTIN must be present for cross-document parity verification",
                actual_values={"pan_present": bool(clean_pan), "gstin_present": bool(clean_gstin)},
                status="REVIEW",
                confidence=0.50,
                evidence_references=evidences,
                explanation="Missing PAN or GSTIN document in bidder package — officer review required.",
                citation="GFR 2017 Rule 144 / GST Act Sec 22",
            ))
        else:
            embedded_pan = clean_gstin[2:12] if len(clean_gstin) >= 12 else ""
            if clean_pan == embedded_pan:
                findings.append(VerificationFinding(
                    check_id="XDOC-PAN-GST-01",
                    input_fields={"pan": clean_pan, "gstin": clean_gstin},
                    expected_relationship="Characters 3-12 of GSTIN must exactly match the 10-character PAN",
                    actual_values={"declared_pan": clean_pan, "embedded_gstin_pan": embedded_pan},
                    status="PASS",
                    confidence=1.0,
                    evidence_references=evidences,
                    explanation=f"Authoritative parity confirmed: PAN '{clean_pan}' exactly matches characters 3-12 of GSTIN '{clean_gstin}'.",
                    citation="Income Tax Act 1961 Sec 139A / CGST Rules Rule 10",
                ))
            else:
                findings.append(VerificationFinding(
                    check_id="XDOC-PAN-GST-01",
                    input_fields={"pan": clean_pan, "gstin": clean_gstin},
                    expected_relationship="Characters 3-12 of GSTIN must exactly match the 10-character PAN",
                    actual_values={"declared_pan": clean_pan, "embedded_gstin_pan": embedded_pan},
                    status="FAIL",
                    confidence=1.0,
                    evidence_references=evidences,
                    explanation=f"Potential anomaly detected: PAN card identifier '{clean_pan}' does not match embedded PAN '{embedded_pan}' in GSTIN '{clean_gstin}'. Human verification required.",
                    citation="Income Tax Act 1961 Sec 139A / CGST Rules Rule 10",
                    potential_anomaly_detected=True,
                ))

        # Check 2: Name consistency across PAN and GST certificates
        if pan_name and gst_name:
            sim_score, detail = self.matcher.compare_names(pan_name, gst_name)
            status = "PASS" if sim_score >= 0.85 else ("REVIEW" if sim_score >= 0.60 else "FAIL")
            explanation = (
                f"Company name on PAN card ('{pan_name}') matches GST registration name ('{gst_name}') with high confidence ({sim_score:.2f})."
                if status == "PASS" else
                f"Potential anomaly detected: Name on PAN card ('{pan_name}') differs from GST certificate ('{gst_name}') with similarity score {sim_score:.2f}. Human verification required."
            )
            findings.append(VerificationFinding(
                check_id="XDOC-PAN-GST-02",
                input_fields={"pan_name": pan_name, "gst_name": gst_name},
                expected_relationship="Taxpayer name on PAN card must align with legal name on Form GST REG-06 (ER >= 0.85)",
                actual_values={"pan_name": pan_name, "gst_name": gst_name, "similarity": round(sim_score, 3)},
                status=status,
                confidence=round(sim_score, 3),
                evidence_references=evidences,
                explanation=explanation,
                citation="Tender Eligibility / General Financial Rules 2017",
                potential_anomaly_detected=(status in ("FAIL", "REVIEW")),
            ))

        return findings

    # =========================================================================
    # 2. GST <-> Udyam Verification (R-UDY-03)
    # =========================================================================

    def verify_gst_udyam_parity(
        self,
        gstin: Optional[str],
        udyam_no: Optional[str],
        udyam_pan: Optional[str] = None,
        udyam_gstin: Optional[str] = None,
        gst_name: Optional[str] = None,
        udyam_name: Optional[str] = None,
        gst_doc_evidence: Optional[dict[str, Any]] = None,
        udyam_doc_evidence: Optional[dict[str, Any]] = None,
    ) -> list[VerificationFinding]:
        """Verify parity between Form GST REG-06 and Udyam MSME Registration."""
        findings = []
        evidences = [e for e in (gst_doc_evidence, udyam_doc_evidence) if e]

        clean_gstin = gstin.strip().upper() if gstin else None
        clean_udyam = udyam_no.strip().upper() if udyam_no else None
        clean_udyam_pan = udyam_pan.strip().upper() if udyam_pan else None
        clean_udyam_gstin = udyam_gstin.strip().upper() if udyam_gstin else None

        if not clean_udyam:
            # Udyam not submitted - neutral unless MSE exemption claimed
            return findings

        # Check 1: Identifier Linkage (PAN or GSTIN in Udyam)
        gstin_pan = clean_gstin[2:12] if clean_gstin and len(clean_gstin) >= 12 else None
        identifier_match = False
        mismatch_detected = False

        if clean_udyam_gstin and clean_gstin:
            if clean_udyam_gstin == clean_gstin:
                identifier_match = True
            else:
                mismatch_detected = True
        elif clean_udyam_pan and gstin_pan:
            if clean_udyam_pan == gstin_pan:
                identifier_match = True
            else:
                mismatch_detected = True

        if mismatch_detected:
            findings.append(VerificationFinding(
                check_id="XDOC-GST-UDY-01",
                input_fields={"gstin": clean_gstin, "udyam_no": clean_udyam, "udyam_gstin": clean_udyam_gstin, "udyam_pan": clean_udyam_pan},
                expected_relationship="Udyam registration statutory identifiers (PAN/GSTIN) must match Form GST REG-06",
                actual_values={"gstin": clean_gstin, "gstin_pan": gstin_pan, "udyam_pan": clean_udyam_pan, "udyam_gstin": clean_udyam_gstin},
                status="FAIL",
                confidence=1.0,
                evidence_references=evidences,
                explanation=f"Potential anomaly detected: Identifiers declared in Udyam registration '{clean_udyam}' conflict with GSTIN '{clean_gstin}'. Human verification required.",
                citation="MSMED Act 2006 / GFR 2017 Rule 170",
                potential_anomaly_detected=True,
            ))
        elif identifier_match:
            findings.append(VerificationFinding(
                check_id="XDOC-GST-UDY-01",
                input_fields={"gstin": clean_gstin, "udyam_no": clean_udyam},
                expected_relationship="Udyam registration statutory identifiers must match Form GST REG-06",
                actual_values={"gstin": clean_gstin, "udyam_no": clean_udyam},
                status="PASS",
                confidence=1.0,
                evidence_references=evidences,
                explanation=f"Authoritative parity confirmed: Udyam certificate '{clean_udyam}' statutory identifiers align with GSTIN '{clean_gstin}'.",
                citation="MSMED Act 2006 / GFR 2017 Rule 170",
            ))

        # Check 2: Name Parity between GST and Udyam
        if gst_name and udyam_name:
            sim_score, detail = self.matcher.compare_names(gst_name, udyam_name)
            status = "PASS" if sim_score >= 0.85 else ("REVIEW" if sim_score >= 0.60 else "FAIL")
            findings.append(VerificationFinding(
                check_id="XDOC-GST-UDY-02",
                input_fields={"gst_name": gst_name, "udyam_name": udyam_name},
                expected_relationship="Legal or trade name in GST certificate must match Udyam enterprise name (ER >= 0.85)",
                actual_values={"gst_name": gst_name, "udyam_name": udyam_name, "similarity": round(sim_score, 3)},
                status=status,
                confidence=round(sim_score, 3),
                evidence_references=evidences,
                explanation=(
                    f"GST registered name ('{gst_name}') matches Udyam enterprise name ('{udyam_name}') with score {sim_score:.2f}."
                    if status == "PASS" else
                    f"Potential anomaly detected: GST name ('{gst_name}') differs from Udyam enterprise name ('{udyam_name}') with score {sim_score:.2f}. Human verification required."
                ),
                citation="Public Procurement Policy for MSEs Order 2012",
                potential_anomaly_detected=(status != "PASS"),
            ))

        return findings

    # =========================================================================
    # 3. Declared Company Name <-> GST / Udyam Verification (R-GST-03 / R-UDY-04)
    # =========================================================================

    def verify_company_name_parity(
        self,
        declared_bidder_name: str,
        target_name: str,
        target_doc_type: str,  # "GST" or "UDYAM"
        doc_evidence: Optional[dict[str, Any]] = None,
    ) -> VerificationFinding:
        """Verify declared bidder entity name against registered statutory document name."""
        check_id = f"XDOC-COMP-{target_doc_type.upper()}-01"
        sim_score, detail = self.matcher.compare_names(declared_bidder_name, target_name)
        status = "PASS" if sim_score >= 0.85 else ("REVIEW" if sim_score >= 0.60 else "FAIL")

        explanation = (
            f"Declared bidder name ('{declared_bidder_name}') matches {target_doc_type} name ('{target_name}') with high confidence ({sim_score:.2f})."
            if status == "PASS" else
            f"Potential anomaly detected: Declared bidder name ('{declared_bidder_name}') exhibits variance against {target_doc_type} registered name ('{target_name}') with similarity score {sim_score:.2f}. Human verification required."
        )

        return VerificationFinding(
            check_id=check_id,
            input_fields={"declared_bidder_name": declared_bidder_name, f"{target_doc_type.lower()}_name": target_name},
            expected_relationship=f"Declared company name must resolve to {target_doc_type} registered entity with similarity >= 0.85",
            actual_values={"declared_name": declared_bidder_name, "registered_name": target_name, "similarity": round(sim_score, 3)},
            status=status,
            confidence=round(sim_score, 3),
            evidence_references=[doc_evidence] if doc_evidence else [],
            explanation=explanation,
            citation="CPCL Tender Eligibility / GFR 2017 Rule 144",
            potential_anomaly_detected=(status != "PASS"),
        )

    # =========================================================================
    # 4. Identity Fields <-> Government Registry Verification
    # =========================================================================

    async def verify_identity_against_registry(
        self,
        registry_provider: RegistryProvider,
        gstin: Optional[str] = None,
        pan: Optional[str] = None,
        udyam_no: Optional[str] = None,
        cin: Optional[str] = None,
        company_name: Optional[str] = None,
        claims_mse_benefits: bool = False,
    ) -> list[VerificationFinding]:
        """Cross-reference extracted identity fields against statutory government registry portals."""
        findings = []

        # 4.1 GSTIN Registry Check
        if gstin:
            clean_gst = gstin.strip().upper()
            gst_res = await registry_provider.verify_gstin(clean_gst)
            if not gst_res.found:
                findings.append(VerificationFinding(
                    check_id="XDOC-REG-GST-01",
                    input_fields={"gstin": clean_gst},
                    expected_relationship="GSTIN must be found and ACTIVE in simulated GSTN registry",
                    actual_values={"found": False, "status": gst_res.status},
                    status="WARN",
                    confidence=0.80,
                    explanation=f"GSTIN '{clean_gst}' record not located in {gst_res.source}. Officer manual verification recommended.",
                    citation="GST Act 2017 Sec 22",
                ))
            elif gst_res.status == "CANCELLED":
                reason = gst_res.data.get("cancellation_reason", "Suo-moto cancellation")
                findings.append(VerificationFinding(
                    check_id="XDOC-REG-GST-01",
                    input_fields={"gstin": clean_gst},
                    expected_relationship="GSTIN status must be ACTIVE in simulated GSTN registry",
                    actual_values={"found": True, "status": "CANCELLED", "cancellation_date": gst_res.data.get("cancellation_date")},
                    status="FAIL",
                    confidence=1.0,
                    explanation=f"Potential anomaly detected: GSTIN '{clean_gst}' is marked CANCELLED in {gst_res.source} ({reason}). Human verification required.",
                    citation="GST Act 2017 Sec 29 / CPCL Tender Eligibility",
                    potential_anomaly_detected=True,
                ))
            else:
                findings.append(VerificationFinding(
                    check_id="XDOC-REG-GST-01",
                    input_fields={"gstin": clean_gst},
                    expected_relationship="GSTIN status must be ACTIVE in simulated GSTN registry",
                    actual_values={"found": True, "status": "ACTIVE", "legal_name": gst_res.data.get("legal_name")},
                    status="PASS",
                    confidence=1.0,
                    explanation=f"GSTIN '{clean_gst}' confirmed ACTIVE in {gst_res.source}.",
                    citation="GST Act 2017 Sec 22",
                ))

        # 4.2 PAN Registry Check
        if pan:
            clean_p = pan.strip().upper()
            pan_res = await registry_provider.verify_pan(clean_p)
            if not pan_res.found:
                findings.append(VerificationFinding(
                    check_id="XDOC-REG-PAN-01",
                    input_fields={"pan": clean_p},
                    expected_relationship="PAN must be valid and active in simulated NSDL / Income Tax registry",
                    actual_values={"found": False, "status": pan_res.status},
                    status="WARN",
                    confidence=0.80,
                    explanation=f"PAN '{clean_p}' record not located in {pan_res.source}. Officer manual verification recommended.",
                    citation="Income Tax Act 1961 Sec 139A",
                ))
            else:
                findings.append(VerificationFinding(
                    check_id="XDOC-REG-PAN-01",
                    input_fields={"pan": clean_p},
                    expected_relationship="PAN must be valid and active in simulated NSDL / Income Tax registry",
                    actual_values={"found": True, "status": "VALID", "entity_type": pan_res.data.get("entity_type")},
                    status="PASS",
                    confidence=1.0,
                    explanation=f"PAN '{clean_p}' confirmed VALID in {pan_res.source} ({pan_res.data.get('entity_type', 'Entity')}).",
                    citation="Income Tax Act 1961 Sec 139A",
                ))

        # 4.3 Udyam Registry Check & MSE Benefit Eligibility (R-UDY-02)
        if udyam_no:
            clean_u = udyam_no.strip().upper()
            udy_res = await registry_provider.verify_udyam(clean_u)
            if not udy_res.found:
                findings.append(VerificationFinding(
                    check_id="XDOC-REG-UDY-01",
                    input_fields={"udyam_no": clean_u},
                    expected_relationship="Udyam registration must be active in simulated Ministry of MSME registry",
                    actual_values={"found": False, "status": udy_res.status},
                    status="WARN",
                    confidence=0.80,
                    explanation=f"Udyam registration '{clean_u}' not found in {udy_res.source}. Officer review recommended.",
                    citation="MSMED Act 2006 Sec 7",
                ))
            else:
                enterprise_type = udy_res.data.get("enterprise_type", "UNKNOWN").upper()
                if claims_mse_benefits and enterprise_type not in ("MICRO", "SMALL"):
                    findings.append(VerificationFinding(
                        check_id="XDOC-REG-UDY-01",
                        input_fields={"udyam_no": clean_u, "enterprise_type": enterprise_type, "claims_mse_benefits": True},
                        expected_relationship="Bidder claiming MSE benefits must be classified as MICRO or SMALL enterprise",
                        actual_values={"found": True, "enterprise_type": enterprise_type, "status": udy_res.status},
                        status="FAIL",
                        confidence=1.0,
                        explanation=f"Potential anomaly detected: Bidder claims MSE exemption/preference, but Udyam registration is categorized as '{enterprise_type}' in {udy_res.source}. Ineligible for MSE exemptions under MSMED Act 2006.",
                        citation="Public Procurement Policy for MSEs Order 2012 / GFR 170",
                        potential_anomaly_detected=True,
                    ))
                else:
                    findings.append(VerificationFinding(
                        check_id="XDOC-REG-UDY-01",
                        input_fields={"udyam_no": clean_u, "enterprise_type": enterprise_type},
                        expected_relationship="Udyam registration must be active in simulated Ministry of MSME registry",
                        actual_values={"found": True, "enterprise_type": enterprise_type, "status": "ACTIVE"},
                        status="PASS",
                        confidence=1.0,
                        explanation=f"Udyam registration '{clean_u}' confirmed ACTIVE in {udy_res.source} (Enterprise Category: {enterprise_type}).",
                        citation="MSMED Act 2006 Sec 7",
                    ))

        # 4.4 National Debarment / Blacklist Check (R-DEB-01)
        deb_res = await registry_provider.check_debarment(
            pan=pan,
            name=company_name,
            gstin=gstin,
            cin=cin,
        )
        if deb_res.status == "DEBARRED":
            hits = deb_res.data.get("hits", [{}])
            order_info = hits[0].get("order_number", "Unspecified")
            authority = hits[0].get("authority", "CPPP / GeM")
            reason = hits[0].get("reason", "Violation of procurement code")
            findings.append(VerificationFinding(
                check_id="XDOC-REG-DEB-01",
                input_fields={"pan": pan, "name": company_name, "gstin": gstin},
                expected_relationship="Bidder entity and identifiers must NOT appear on national debarment/blacklist registry",
                actual_values={"debarred": True, "order_number": order_info, "authority": authority},
                status="FAIL",
                confidence=1.0,
                explanation=f"Potential anomaly detected: Bidder identified on national debarment registry ({authority}, Order: {order_info}). Reason: {reason}. Human verification required.",
                citation="GFR 2017 Rule 151 / CVC Guidelines on Debarment",
                potential_anomaly_detected=True,
            ))
        else:
            findings.append(VerificationFinding(
                check_id="XDOC-REG-DEB-01",
                input_fields={"pan": pan, "name": company_name, "gstin": gstin},
                expected_relationship="Bidder entity and identifiers must NOT appear on national debarment/blacklist registry",
                actual_values={"debarred": False, "hits": 0},
                status="PASS",
                confidence=1.0,
                explanation=f"Bidder clear: No adverse records identified in {deb_res.source} debarment registry.",
                citation="GFR 2017 Rule 151 / CVC Guidelines",
            ))

        return findings

    # =========================================================================
    # 5. Registration Status <-> Document Dates Verification (R-DATE-01)
    # =========================================================================

    def verify_registration_and_dates(
        self,
        document_type: str,
        issue_date_str: Optional[str],
        tender_due_date_str: Optional[str],
        valid_until_str: Optional[str] = None,
        doc_evidence: Optional[dict[str, Any]] = None,
    ) -> list[VerificationFinding]:
        """Verify chronological plausibility and validity of document dates relative to tender submission."""
        findings = []
        evidences = [doc_evidence] if doc_evidence else []

        v_issue = validate_date(issue_date_str) if issue_date_str else None
        iso_issue = v_issue.normalized_value if (v_issue and v_issue.is_valid) else None

        v_due = validate_date(tender_due_date_str) if tender_due_date_str else None
        iso_due = v_due.normalized_value if (v_due and v_due.is_valid) else None

        v_valid = validate_date(valid_until_str) if valid_until_str else None
        iso_valid = v_valid.normalized_value if (v_valid and v_valid.is_valid) else None

        # Check 1: Document issued after tender submission deadline
        if iso_issue and iso_due:
            d_issue = date.fromisoformat(iso_issue)
            d_due = date.fromisoformat(iso_due)

            if d_issue > d_due:
                findings.append(VerificationFinding(
                    check_id="XDOC-DATE-POST-DUE-01",
                    input_fields={"document_type": document_type, "issue_date": iso_issue, "tender_due_date": iso_due},
                    expected_relationship=f"{document_type} must be issued on or before tender submission due date ({iso_due})",
                    actual_values={"issue_date": iso_issue, "tender_due_date": iso_due, "days_after_due": (d_issue - d_due).days},
                    status="FAIL",
                    confidence=1.0,
                    evidence_references=evidences,
                    explanation=f"Potential anomaly detected: {document_type} date of issuance ({iso_issue}) post-dates the tender submission deadline ({iso_due}). Human verification required.",
                    citation="GFR 2017 Rule 144 / CPCL Tender Clause 2.4",
                    potential_anomaly_detected=True,
                ))
            else:
                findings.append(VerificationFinding(
                    check_id="XDOC-DATE-POST-DUE-01",
                    input_fields={"document_type": document_type, "issue_date": iso_issue, "tender_due_date": iso_due},
                    expected_relationship=f"{document_type} must be issued on or before tender submission due date",
                    actual_values={"issue_date": iso_issue, "tender_due_date": iso_due},
                    status="PASS",
                    confidence=1.0,
                    evidence_references=evidences,
                    explanation=f"{document_type} issuance date ({iso_issue}) precedes the tender submission deadline ({iso_due}).",
                    citation="CPCL Tender Clause 2.4",
                ))

        # Check 2: Expired certificate prior to tender submission
        if iso_valid and iso_due:
            d_valid = date.fromisoformat(iso_valid)
            d_due = date.fromisoformat(iso_due)

            if d_valid < d_due:
                findings.append(VerificationFinding(
                    check_id="XDOC-DATE-EXPIRED-01",
                    input_fields={"document_type": document_type, "valid_until": iso_valid, "tender_due_date": iso_due},
                    expected_relationship=f"{document_type} validity must extend beyond the tender bid due date ({iso_due})",
                    actual_values={"valid_until": iso_valid, "tender_due_date": iso_due, "days_expired": (d_due - d_valid).days},
                    status="FAIL",
                    confidence=1.0,
                    evidence_references=evidences,
                    explanation=f"Potential anomaly detected: {document_type} expired on {iso_valid}, prior to the tender due date ({iso_due}). Human verification required.",
                    citation="CPCL BEC Clause 4.1",
                    potential_anomaly_detected=True,
                ))
            else:
                findings.append(VerificationFinding(
                    check_id="XDOC-DATE-EXPIRED-01",
                    input_fields={"document_type": document_type, "valid_until": iso_valid, "tender_due_date": iso_due},
                    expected_relationship=f"{document_type} validity must extend beyond the tender bid due date",
                    actual_values={"valid_until": iso_valid, "tender_due_date": iso_due},
                    status="PASS",
                    confidence=1.0,
                    evidence_references=evidences,
                    explanation=f"{document_type} validity ({iso_valid}) extends beyond the tender submission deadline ({iso_due}).",
                    citation="CPCL BEC Clause 4.1",
                ))

        # Check 3: Date in the future relative to today's date
        if iso_issue:
            d_issue = date.fromisoformat(iso_issue)
            today = date.today()
            if d_issue > today:
                findings.append(VerificationFinding(
                    check_id="XDOC-DATE-FUTURE-01",
                    input_fields={"document_type": document_type, "issue_date": iso_issue, "evaluated_date": today.isoformat()},
                    expected_relationship=f"{document_type} issuance date must not be a future calendar date",
                    actual_values={"issue_date": iso_issue, "today": today.isoformat()},
                    status="WARN",
                    confidence=0.90,
                    evidence_references=evidences,
                    explanation=f"Potential anomaly detected: {document_type} contains a future issuance date ({iso_issue}). Human verification required.",
                    citation="GFR 2017 Rule 144",
                    potential_anomaly_detected=True,
                ))

        return findings
