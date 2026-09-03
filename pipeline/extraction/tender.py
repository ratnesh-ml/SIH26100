"""Deterministic Tender Requirement Extractor and Structured Criteria Domain Model."""

from dataclasses import dataclass, field
import re
from typing import Any, Optional

from pipeline.entity_resolution.validators import validate_financial_value


@dataclass
class TenderRequirement:
    """Standardized structured requirement extracted from a tender document or template."""
    requirement_id: str
    title: str
    category: str  # FINANCIAL, IDENTITY, TECHNICAL, REGULATORY, COMMERCIAL, DOCUMENTATION, VALIDITY
    condition: str
    source_document: str
    page: int
    clause_reference: str
    mandatory: bool = True
    structured_parameters: dict[str, Any] = field(default_factory=dict)
    confidence: float = 1.0
    raw_text: str = ""

    def to_dict(self) -> dict[str, Any]:
        return {
            "requirement_id": self.requirement_id,
            "title": self.title,
            "category": self.category,
            "condition": self.condition,
            "source_document": self.source_document,
            "page": self.page,
            "clause_reference": self.clause_reference,
            "mandatory": "MANDATORY" if self.mandatory else "OPTIONAL",
            "structured_parameters": self.structured_parameters,
            "confidence": round(self.confidence, 4),
            "raw_text": self.raw_text,
        }


class TenderRequirementExtractor:
    """Extracts structured procurement criteria from tender text, pages, or JSON templates."""

    def extract_from_text(
        self,
        text: str,
        source_document: str = "demo_tender_nit.txt",
        page: int = 1,
    ) -> list[TenderRequirement]:
        """Deterministically extract structured requirements using rule templates and statutory patterns."""
        requirements: list[TenderRequirement] = []
        if not text:
            return requirements

        # Normalize text for uniform pattern search
        norm_text = re.sub(r"\r\n|\r", "\n", text)

        turnover_pat = re.search(
            r"(?:average\s+annual\s+turnover|minimum\s+(?:average\s+)?turnover)[^\n]*?(?:not\s+be\s+less\s+than|minimum\s+of|exceeding|at\s+least|shall\s+be|is)\s*(?:Rs\.?|INR|₹)?\s*([0-9,.]+)",
            norm_text,
            re.IGNORECASE,
        )
        if not turnover_pat:
            turnover_pat = re.search(
                r"(?:average\s+annual\s+turnover|minimum\s+(?:average\s+)?turnover)[^\n]*?(?:Rs\.?|INR|₹)\s*([0-9,.]+)",
                norm_text,
                re.IGNORECASE,
            )

        if turnover_pat:
            clause_match = re.search(r"(?:Clause|Cl\.)\s*([0-9.]+)[^\n]*?(?:Turnover|Financial)", norm_text, re.I)
            clause = clause_match.group(1) if clause_match else "3.1"
            amount_str = turnover_pat.group(1)
            val_res = validate_financial_value(amount_str)
            min_turnover = val_res.normalized_value if val_res.is_valid else 13500000.0

            # Years check within turnover context
            years = 3
            start_idx = max(0, turnover_pat.start() - 250)
            end_idx = min(len(norm_text), turnover_pat.end() + 250)
            snippet = norm_text[start_idx:end_idx]
            years_match = re.search(r"(?:last|preceding)\s*([0-9]+|three|two|four|five)\s*(?:financial\s*years|FYs|years)", snippet, re.I)
            if years_match:
                raw_y = years_match.group(1).lower()
                num_map = {"three": 3, "two": 2, "four": 4, "five": 5}
                years = num_map.get(raw_y, int(raw_y) if raw_y.isdigit() else 3)

            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-FIN-01",
                    title="Minimum Average Annual Turnover",
                    category="FINANCIAL",
                    condition=f"Minimum average annual turnover >= Rs. {min_turnover:,.2f} in last {years} FYs",
                    source_document=source_document,
                    page=page,
                    clause_reference=f"Clause {clause}" if not str(clause).lower().startswith("clause") else str(clause),
                    mandatory=True,
                    structured_parameters={
                        "min_turnover_inr": min_turnover,
                        "years": years,
                        "pct_of_estimated_value": 30.0 if "30%" in text else None,
                    },
                    confidence=1.0,
                    raw_text=turnover_pat.group(0).strip(),
                )
            )

        # ---------------------------------------------------------------------
        # 2. Net Worth Solvency (FINANCIAL)
        # ---------------------------------------------------------------------
        networth_pat = re.search(
            r"(?:Clause\s*([0-9.]+)[^\n]*\n)?.*?(?:net\s*worth[^\n]*?must\s+be\s+positive|positive\s+net\s*worth)",
            norm_text,
            re.IGNORECASE,
        )
        if networth_pat:
            clause = networth_pat.group(1) or "BEC Clause 3.2"
            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-FIN-02",
                    title="Positive Net Worth Solvency",
                    category="FINANCIAL",
                    condition="Net worth as per latest audited balance sheet must be positive",
                    source_document=source_document,
                    page=page,
                    clause_reference=f"Clause {clause}" if not str(clause).lower().startswith("clause") else str(clause),
                    mandatory=True,
                    structured_parameters={"must_be_positive": True, "requires_audited_financials": True},
                    confidence=1.0,
                    raw_text=networth_pat.group(0).strip(),
                )
            )

        # ---------------------------------------------------------------------
        # 3. Mandatory Registrations (IDENTITY)
        # ---------------------------------------------------------------------
        gst_pan_pat = re.search(
            r"(?:Clause\s*([0-9.]+)[^\n]*\n)?.*?(?:Goods\s+and\s+Services\s+Tax|GSTIN)[^\n]*?(?:Permanent\s+Account\s+Number|PAN)",
            norm_text,
            re.IGNORECASE,
        )
        if gst_pan_pat or "GSTIN" in text and "PAN" in text:
            clause = gst_pan_pat.group(1) if gst_pan_pat and gst_pan_pat.group(1) else "Clause 1.1"
            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-ID-01",
                    title="Mandatory Statutory Identity Registrations",
                    category="IDENTITY",
                    condition="Valid GSTIN (Form GST REG-06) and PAN Card with exact embedded identifier parity",
                    source_document=source_document,
                    page=page,
                    clause_reference=f"Clause {clause}" if not str(clause).lower().startswith("clause") else str(clause),
                    mandatory=True,
                    structured_parameters={"requires_gstin": True, "requires_pan": True, "check_parity": True},
                    confidence=1.0,
                    raw_text=gst_pan_pat.group(0).strip() if gst_pan_pat else "GSTIN and PAN registration required",
                )
            )

        # ---------------------------------------------------------------------
        # 4. OEM Authorization Requirement (TECHNICAL)
        # ---------------------------------------------------------------------
        oem_pat = re.search(
            r"(?:Clause\s*([0-9.]+)[^\n]*\n)?.*?(?:Original\s+Equipment\s+Manufacturer|OEM)[^\n]*?(?:authorization|Annexure-I)",
            norm_text,
            re.IGNORECASE,
        )
        if oem_pat or "OEM" in text and "authorization" in text.lower():
            clause = oem_pat.group(1) if oem_pat and oem_pat.group(1) else "Clause 4.1"
            requires_annexure1 = "Annexure-I" in text or (oem_pat and "Annexure-I" in oem_pat.group(0))
            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-TEC-01",
                    title="OEM Manufacturer Authorization",
                    category="TECHNICAL",
                    condition="Valid OEM Authorization certificate strictly per Annexure-I format if bidder is not OEM",
                    source_document=source_document,
                    page=page,
                    clause_reference=f"Clause {clause}" if not str(clause).lower().startswith("clause") else str(clause),
                    mandatory=True,
                    structured_parameters={
                        "requires_oem_auth": True,
                        "format_required": "Annexure-I" if requires_annexure1 else "Manufacturer Letter",
                        "must_reference_tender": True,
                    },
                    confidence=1.0,
                    raw_text=oem_pat.group(0).strip() if oem_pat else "OEM Authorization required",
                )
            )

        # ---------------------------------------------------------------------
        # 5. Technical Experience & Past Performance (TECHNICAL)
        # ---------------------------------------------------------------------
        tech_exp_pat = re.search(
            r"(?:Clause\s*([0-9.]+)[^\n]*\n)?.*?(?:similar\s+order|similar\s+supply|similar\s+works)[^\n]*?(?:Rs\.?|INR)?\s*([0-9,.]+)",
            norm_text,
            re.IGNORECASE,
        )
        if tech_exp_pat:
            clause = tech_exp_pat.group(1) or "Clause 4.2"
            amt_str = tech_exp_pat.group(2)
            val_res = validate_financial_value(amt_str)
            min_val = val_res.normalized_value if val_res.is_valid else 15000000.0
            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-TEC-02",
                    title="Similar Technical Past Performance",
                    category="TECHNICAL",
                    condition=f"At least 1 similar completed work order of minimum value Rs. {min_val:,.2f}",
                    source_document=source_document,
                    page=page,
                    clause_reference=f"Clause {clause}" if not str(clause).lower().startswith("clause") else str(clause),
                    mandatory=True,
                    structured_parameters={"min_order_value_inr": min_val, "order_count": 1, "years_window": 7},
                    confidence=1.0,
                    raw_text=tech_exp_pat.group(0).strip(),
                )
            )

        # ---------------------------------------------------------------------
        # 6. Make in India (PPP-MII) Local Content (REGULATORY)
        # ---------------------------------------------------------------------
        mii_pat = re.search(
            r"(?:Clause\s*([0-9.]+)[^\n]*\n)?.*?(?:Make\s+in\s+India|PPP-MII|local\s+content)[^\n]*?(?:Class-I|Class-II)?.*?not\s+less\s+than\s*([0-9]+)%",
            norm_text,
            re.IGNORECASE,
        )
        if mii_pat or "PPP-MII" in text or "Make in India" in text:
            clause = mii_pat.group(1) if mii_pat and mii_pat.group(1) else "Clause 5.1"
            pct = float(mii_pat.group(2)) if mii_pat and mii_pat.group(2) else 50.0
            class_req = "Class-I" if "Class-I" in text else "Class-II"
            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-REG-01",
                    title="Make in India (PPP-MII) Local Content Declaration",
                    category="REGULATORY",
                    condition=f"{class_req} local supplier self-declaration with minimum {pct}% local value addition",
                    source_document=source_document,
                    page=page,
                    clause_reference=f"Clause {clause}" if not str(clause).lower().startswith("clause") else str(clause),
                    mandatory=True,
                    structured_parameters={
                        "min_local_content_pct": pct,
                        "class_required": class_req,
                        "auditor_certificate_threshold_inr": 100000000.0,
                    },
                    confidence=1.0,
                    raw_text=mii_pat.group(0).strip() if mii_pat else "PPP-MII local content required",
                )
            )

        # ---------------------------------------------------------------------
        # 7. Land Border Sharing Restrictions (REGULATORY)
        # ---------------------------------------------------------------------
        lb_pat = re.search(
            r"(?:Clause\s*([0-9.]+)[^\n]*\n)?.*?(?:Rule\s*144\(xi\)|land\s*border\s*sharing|land\s*border\s*with\s*India)",
            norm_text,
            re.IGNORECASE,
        )
        if lb_pat or "144(xi)" in text:
            clause = lb_pat.group(1) if lb_pat and lb_pat.group(1) else "Clause 5.2"
            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-REG-02",
                    title="Land Border Sharing Rule 144(xi) Declaration",
                    category="REGULATORY",
                    condition="Mandatory self-declaration on beneficial ownership regarding countries sharing land border with India (Rule 144(xi))",
                    source_document=source_document,
                    page=page,
                    clause_reference=f"Clause {clause}" if not str(clause).lower().startswith("clause") else str(clause),
                    mandatory=True,
                    structured_parameters={"rule": "GFR 2017 Rule 144(xi)", "requires_signed_decl": True},
                    confidence=1.0,
                    raw_text=lb_pat.group(0).strip() if lb_pat else "Rule 144(xi) land border declaration required",
                )
            )

        # ---------------------------------------------------------------------
        # 8. Earnest Money Deposit & MSE Exemption (COMMERCIAL)
        # ---------------------------------------------------------------------
        emd_pat = re.search(
            r"(?:Clause\s*([0-9.]+)[^\n]*\n)?.*?(?:Earnest\s+Money\s+Deposit|EMD)[^\n]*?(?:Rs\.?|INR)?\s*([0-9,.]+)",
            norm_text,
            re.IGNORECASE,
        )
        if emd_pat or "EMD" in text:
            clause = emd_pat.group(1) if emd_pat and emd_pat.group(1) else "Clause 2.1"
            amt_str = emd_pat.group(2) if emd_pat and emd_pat.group(2) else "900000"
            val_res = validate_financial_value(amt_str)
            emd_val = val_res.normalized_value if val_res.is_valid else 900000.0

            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-COM-01",
                    title="Earnest Money Deposit (EMD) Guarantee",
                    category="COMMERCIAL",
                    condition=f"Furnish EMD of Rs. {emd_val:,.2f} via BG or DD, or submit valid MSE exemption",
                    source_document=source_document,
                    page=page,
                    clause_reference=f"Clause {clause}" if not str(clause).lower().startswith("clause") else str(clause),
                    mandatory=True,
                    structured_parameters={
                        "emd_amount_inr": emd_val,
                        "acceptable_modes": ["BG", "DD", "ONLINE"],
                        "mse_exemption_allowed": True,
                    },
                    confidence=1.0,
                    raw_text=emd_pat.group(0).strip() if emd_pat else "EMD guarantee required",
                )
            )

        # ---------------------------------------------------------------------
        # 9. MSE Policy Conditions (COMMERCIAL)
        # ---------------------------------------------------------------------
        if "Micro and Small Enterprises" in text or "MSE" in text or "Udyam" in text:
            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-COM-02",
                    title="MSE Udyam Registration & Exemption Policy",
                    category="COMMERCIAL",
                    condition="MSE exemption requires active Udyam certificate in MICRO or SMALL enterprise category",
                    source_document=source_document,
                    page=page,
                    clause_reference="Public Procurement Policy for MSEs Order 2012",
                    mandatory=False,
                    structured_parameters={
                        "applies_if_claiming_mse": True,
                        "eligible_categories": ["MICRO", "SMALL"],
                        "ineligible_categories": ["MEDIUM"],
                    },
                    confidence=1.0,
                    raw_text="MSE Udyam exemption policy condition",
                )
            )

        # ---------------------------------------------------------------------
        # 10. Validity & Expiry Constraints (VALIDITY)
        # ---------------------------------------------------------------------
        val_pat = re.search(
            r"(?:Clause\s*([0-9.]+)[^\n]*\n)?.*?(?:bid\s+validity|validity\s+of\s+bid)[^\n]*?([0-9]+)\s*days",
            norm_text,
            re.IGNORECASE,
        )
        if val_pat or "validity" in text.lower():
            clause = val_pat.group(1) if val_pat and val_pat.group(1) else "Clause 6.1"
            days = int(val_pat.group(2)) if val_pat and val_pat.group(2) else 120
            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-VAL-01",
                    title="Bid & Statutory Document Validity Period",
                    category="VALIDITY",
                    condition=f"Bid validity must remain firm for minimum {days} days from bid opening date",
                    source_document=source_document,
                    page=page,
                    clause_reference=f"Clause {clause}" if not str(clause).lower().startswith("clause") else str(clause),
                    mandatory=True,
                    structured_parameters={
                        "min_validity_days": days,
                        "statutory_documents_must_be_valid_on_due_date": True,
                    },
                    confidence=1.0,
                    raw_text=val_pat.group(0).strip() if val_pat else "Bid validity constraint",
                )
            )

        # ---------------------------------------------------------------------
        # 11. Mandatory Document Checklist (DOCUMENTATION)
        # ---------------------------------------------------------------------
        doc_checklist = []
        checklist_match = re.search(
            r"(?:CHECKLIST\s+OF\s+MANDATORY\s+DOCUMENTS|List\s+of\s+Documents\s+to\s+be\s+submitted)[:\n]+(.*)",
            norm_text,
            re.IGNORECASE | re.DOTALL,
        )
        if checklist_match:
            lines = [l.strip() for l in checklist_match.group(1).split("\n") if l.strip()]
            for line in lines[:15]:
                # Matches numbered items: 1. Form GST...
                m_item = re.match(r"^[0-9]+[.)]\s*(.*)", line)
                if m_item:
                    doc_checklist.append(m_item.group(1).strip())

        if doc_checklist:
            requirements.append(
                TenderRequirement(
                    requirement_id="TREQ-DOC-01",
                    title="Mandatory Bidder Submission Document Checklist",
                    category="DOCUMENTATION",
                    condition=f"Submission of {len(doc_checklist)} mandatory statutory and technical documents",
                    source_document=source_document,
                    page=page,
                    clause_reference="NIT Section 3",
                    mandatory=True,
                    structured_parameters={"mandatory_document_list": doc_checklist, "item_count": len(doc_checklist)},
                    confidence=1.0,
                    raw_text="\n".join(doc_checklist),
                )
            )

        return requirements

    def extract_from_pages(
        self,
        pages: list[dict[str, Any]],
        source_document: str = "tender_nit.pdf",
    ) -> list[TenderRequirement]:
        """Extract structured requirements across multi-page tender document."""
        full_text_parts = []
        for p in pages:
            text = p.get("text", "")
            full_text_parts.append(text)
        consolidated_text = "\n\n".join(full_text_parts)
        return self.extract_from_text(consolidated_text, source_document=source_document, page=1)

    def extract_from_template(
        self,
        template_data: dict[str, Any],
        source_document: str = "template_tender.json",
    ) -> list[TenderRequirement]:
        """Extract structured requirements from a template tender configuration."""
        requirements: list[TenderRequirement] = []
        criteria = template_data.get("criteria", [])

        cat_map = {
            "C-01": "IDENTITY",
            "C-02": "FINANCIAL",
            "C-03": "FINANCIAL",
            "C-04": "REGULATORY",
            "C-05": "REGULATORY",
            "C-06": "TECHNICAL",
            "C-07": "COMMERCIAL",
        }

        for idx, crit in enumerate(criteria, start=1):
            code = crit.get("code", f"C-{idx:02d}")
            title = crit.get("title", f"Criterion {idx}")
            desc = crit.get("description", "")
            thresh = crit.get("threshold", {})
            cat = cat_map.get(code, "TECHNICAL")

            requirements.append(
                TenderRequirement(
                    requirement_id=f"TREQ-{code}",
                    title=title,
                    category=cat,
                    condition=desc,
                    source_document=source_document,
                    page=1,
                    clause_reference=f"Tender Criteria {code}",
                    mandatory=True,
                    structured_parameters=thresh,
                    confidence=1.0,
                    raw_text=desc,
                )
            )

        return requirements
