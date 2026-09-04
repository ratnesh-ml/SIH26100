"""Document Classification Engine with deterministic statutory anchors and fallback heuristics."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from enum import Enum
import re
from typing import Any, Optional


class DocumentType(str, Enum):
    GST_CERT = "GST_CERT"
    PAN_CARD = "PAN_CARD"
    UDYAM_CERT = "UDYAM_CERT"
    CA_TURNOVER_CERT = "CA_TURNOVER_CERT"
    AUDITED_FINANCIALS = "AUDITED_FINANCIALS"
    ITR_ACK = "ITR_ACK"
    OEM_AUTH = "OEM_AUTH"
    INTEGRITY_PACT = "INTEGRITY_PACT"
    MII_DECLARATION = "MII_DECLARATION"
    LAND_BORDER_DECL = "LAND_BORDER_DECL"
    EMD_PROOF = "EMD_PROOF"
    WORK_ORDER = "WORK_ORDER"
    STARTUP_CERT = "STARTUP_CERT"
    NON_BLACKLISTING = "NON_BLACKLISTING"
    BANK_DETAILS = "BANK_DETAILS"
    TECH_COMPLIANCE = "TECH_COMPLIANCE"
    UNKNOWN = "UNKNOWN"


@dataclass
class ClassificationResult:
    """Standardized classification output with confidence, method, and textual evidence."""
    doc_type: DocumentType
    confidence: float
    method: str  # 'deterministic_anchor' | 'filename_heuristic' | 'keyword_density' | 'fallback'
    evidence: list[str] = field(default_factory=list)
    matched_page: Optional[int] = 1

    def to_dict(self) -> dict[str, Any]:
        return {
            "doc_type": self.doc_type.value,
            "confidence": round(self.confidence, 4),
            "method": self.method,
            "evidence": self.evidence,
            "matched_page": self.matched_page,
        }


class DocumentClassifier(ABC):
    """Abstract interface defining document classification contracts."""

    @abstractmethod
    def classify(
        self,
        filename: str,
        first_page_text: str,
        page_no: int = 1,
        metadata: Optional[dict[str, Any]] = None,
    ) -> ClassificationResult:
        """Classify a single document based on filename and extracted text."""
        pass

    @abstractmethod
    def classify_document(
        self,
        filename: str,
        pages_text: list[str],
        metadata: Optional[dict[str, Any]] = None,
    ) -> ClassificationResult:
        """Classify a multi-page document across all page texts."""
        pass


# =========================================================================
# Canonical Statutory Anchor Definitions for CPCL / Indian Public Procurement
# =========================================================================

ANCHOR_RULES: dict[DocumentType, dict[str, Any]] = {
    DocumentType.GST_CERT: {
        "required_any": [
            [r"form\s+gst\s+reg-?06", r"goods\s+and\s+services\s+tax"],
            [r"registration\s+certificate", r"gstin"],
            [r"government\s+of\s+india", r"gst\s+reg-?06"],
        ],
        "keywords": [r"gstin", r"taxpayer", r"jurisdiction", r"constitution\s+of\s+business"],
        "filename_patterns": [r"gst", r"reg-?06", r"gstin"],
    },
    DocumentType.PAN_CARD: {
        "required_any": [
            [r"income\s+tax\s+department", r"permanent\s+account\s+number"],
            [r"govt\.?\s+of\s+india", r"permanent\s+account\s+number"],
            [r"income\s+tax\s+department", r"pan"],
            [r"permanent\s+account\s+number\s+card"],
        ],
        "keywords": [r"father'?s\s+name", r"date\s+of\s+birth", r"signature", r"photo"],
        "filename_patterns": [r"pan", r"pancard", r"pan_card"],
    },
    DocumentType.UDYAM_CERT: {
        "required_any": [
            [r"udyam\s+registration\s+certificate"],
            [r"ministry\s+of\s+micro,?\s+small\s+(&|and)\s+medium\s+enterprises"],
            [r"udyam-[a-z]{2}-\d{2}-\d{7}"],
        ],
        "keywords": [r"msme", r"enterprise\s+type", r"major\s+activity", r"manufacturing", r"services"],
        "filename_patterns": [r"udyam", r"msme"],
    },
    DocumentType.CA_TURNOVER_CERT: {
        "required_any": [
            [r"udin", r"chartered\s+accountant"],
            [r"annual\s+turnover", r"chartered\s+accountant"],
            [r"turnover\s+certificate", r"udin"],
            [r"net\s+worth\s+certificate", r"chartered\s+accountant"],
        ],
        "keywords": [r"udin", r"membership\s+number", r"firm\s+registration", r"financial\s+year"],
        "filename_patterns": [r"turnover", r"ca_cert", r"ca_turnover", r"udin"],
    },
    DocumentType.ITR_ACK: {
        "required_any": [
            [r"indian\s+income\s+tax\s+return\s+acknowledgement"],
            [r"form\s+itr-?v"],
            [r"acknowledgement\s+number", r"income\s+tax\s+department"],
        ],
        "keywords": [r"assessment\s+year", r"total\s+income", r"verification", r"e-filing"],
        "filename_patterns": [r"itr", r"itr-?v", r"income_tax_ack"],
    },
    DocumentType.OEM_AUTH: {
        "required_any": [
            [r"manufacturer'?s?\s+authorization\s+form"],
            [r"oem\s+authorization"],
            [r"annexure-?i", r"authorize"],
            [r"authorized\s+distributor", r"tender"],
        ],
        "keywords": [r"bonafide\s+manufacturer", r"guarantee", r"warranty", r"validity"],
        "filename_patterns": [r"oem", r"maf", r"authorization", r"annexure_i"],
    },
    DocumentType.INTEGRITY_PACT: {
        "required_any": [
            [r"integrity\s+pact"],
            [r"pre-?contract\s+integrity\s+pact"],
            [r"chennai\s+petroleum\s+corporation\s+limited", r"commitments\s+of\s+the\s+bidder"],
        ],
        "keywords": [r"independent\s+external\s+monitor", r"iem", r"commitments", r"sanctions"],
        "filename_patterns": [r"integrity", r"pact", r"integrity_pact"],
    },
    DocumentType.MII_DECLARATION: {
        "required_any": [
            [r"public\s+procurement\s+\(preference\s+to\s+make\s+in\s+india\)"],
            [r"make\s+in\s+india\s+declaration"],
            [r"local\s+content", r"class-?i\s+local\s+supplier"],
            [r"local\s+content\s+percentage"],
        ],
        "keywords": [r"ppp-?mii", r"location\s+of\s+value\s+addition", r"minimum\s+local\s+content"],
        "filename_patterns": [r"mii", r"make_in_india", r"local_content"],
    },
    DocumentType.LAND_BORDER_DECL: {
        "required_any": [
            [r"rule\s+144\s*\(xi\)"],
            [r"land\s+border\s+with\s+india"],
            [r"restrictions\s+under\s+rule\s+144"],
            [r"competent\s+authority", r"registration\s+with\s+dpiit"],
        ],
        "keywords": [r"order\s+\(public\s+procurement\s+no\.\s*1\)", r"sharing\s+land\s+border"],
        "filename_patterns": [r"land_border", r"rule_144", r"144_xi"],
    },
    DocumentType.STARTUP_CERT: {
        "required_any": [
            [r"department\s+for\s+promotion\s+of\s+industry\s+and\s+internal\s+trade"],
            [r"dpiit\s+recognition"],
            [r"certificate\s+of\s+recognition", r"startup"],
            [r"startup\s+india"],
        ],
        "keywords": [r"dipp", r"recognition\s+number", r"eligible\s+startup"],
        "filename_patterns": [r"startup", r"dpiit", r"dipp"],
    },
    DocumentType.NON_BLACKLISTING: {
        "required_any": [
            [r"not\s+been\s+blacklisted"],
            [r"debarment\s+affidavit"],
            [r"not\s+debarred\s+by\s+any\s+government"],
            [r"non-?blacklisting\s+declaration"],
        ],
        "keywords": [r"notarized\s+affidavit", r"vigilance", r"cbi", r"morals"],
        "filename_patterns": [r"blacklisting", r"non_blacklisting", r"debarment"],
    },
    DocumentType.EMD_PROOF: {
        "required_any": [
            [r"earnest\s+money\s+deposit"],
            [r"bank\s+guarantee\s+for\s+emd"],
            [r"emd\s+exemption"],
            [r"bid\s+security\s+declaration"],
        ],
        "keywords": [r"bg\s+number", r"claim\s+period", r"validity\s+period", r"exemption"],
        "filename_patterns": [r"emd", r"bid_security", r"bank_guarantee"],
    },
    DocumentType.AUDITED_FINANCIALS: {
        "required_any": [
            [r"independent\s+auditor'?s?\s+report"],
            [r"balance\s+sheet\s+as\s+at"],
            [r"statement\s+of\s+profit\s+and\s+loss"],
        ],
        "keywords": [r"cash\s+flow\s+statement", r"notes\s+to\s+accounts", r"statutory\s+audit"],
        "filename_patterns": [r"financial", r"balance_sheet", r"pnl", r"audited"],
    },
    DocumentType.WORK_ORDER: {
        "required_any": [
            [r"work\s+order"],
            [r"purchase\s+order"],
            [r"completion\s+certificate", r"satisfactorily"],
            [r"experience\s+certificate"],
        ],
        "keywords": [r"order\s+value", r"completion\s+date", r"scope\s+of\s+work"],
        "filename_patterns": [r"work_order", r"po_", r"purchase_order", r"experience"],
    },
    DocumentType.BANK_DETAILS: {
        "required_any": [
            [r"cancelled\s+cheque"],
            [r"bank\s+mandate\s+form"],
            [r"rtgs\s*/\s*neft\s+mandate"],
            [r"ifsc\s+code", r"bank\s+account\s+number"],
        ],
        "keywords": [r"micr", r"account\s+holder", r"branch\s+name"],
        "filename_patterns": [r"bank", r"cheque", r"mandate", r"rtgs"],
    },
    DocumentType.TECH_COMPLIANCE: {
        "required_any": [
            [r"technical\s+specification\s+compliance"],
            [r"compliance\s+statement", r"datasheet"],
            [r"schedule\s+of\s+technical\s+requirements"],
        ],
        "keywords": [r"deviations", r"make\s+and\s+model", r"technical\s+bid"],
        "filename_patterns": [r"tech_spec", r"compliance_sheet", r"technical"],
    },
}


class RuleBasedDocumentClassifier(DocumentClassifier):
    """Deterministic, anchor-based document classifier with filename fallback heuristics.

    Follows the CPCL / VigilBid architectural specification prioritizing deterministic
    statutory phrases (Form GST REG-06, Permanent Account Number, Udyam, UDIN, etc.)
    with clear evidentiary auditing.
    """

    def classify(
        self,
        filename: str,
        first_page_text: str,
        page_no: int = 1,
        metadata: Optional[dict[str, Any]] = None,
    ) -> ClassificationResult:
        """Classify a document using first page text and filename."""
        text_clean = first_page_text.lower() if first_page_text else ""
        fn_clean = filename.lower() if filename else ""

        # 1. Tier 1: Deterministic Content Anchor Search
        best_type: Optional[DocumentType] = None
        best_score = 0.0
        best_evidence: list[str] = []

        for doc_type, rules in ANCHOR_RULES.items():
            # Check mandatory co-occurring anchor bundles
            for bundle in rules.get("required_any", []):
                matches = []
                for pattern in bundle:
                    m = re.search(pattern, text_clean)
                    if m:
                        matches.append(m.group(0))
                if len(matches) == len(bundle):
                    # Complete anchor bundle found! High confidence deterministic hit
                    score = 0.95
                    # Check supporting keywords for boost
                    kw_matches = []
                    for kw_pat in rules.get("keywords", []):
                        m_kw = re.search(kw_pat, text_clean)
                        if m_kw:
                            kw_matches.append(m_kw.group(0))
                    if kw_matches:
                        score = min(0.99, score + (0.01 * len(kw_matches)))

                    all_evidence = [f"Anchor: '{m}'" for m in matches] + [f"Keyword: '{k}'" for k in kw_matches[:3]]
                    return ClassificationResult(
                        doc_type=doc_type,
                        confidence=score,
                        method="deterministic_anchor",
                        evidence=all_evidence,
                        matched_page=page_no,
                    )

        # 2. Tier 2: Keyword Density Search (when anchor bundle is partial)
        for doc_type, rules in ANCHOR_RULES.items():
            matched_kws = []
            for kw_pat in rules.get("keywords", []):
                m = re.search(kw_pat, text_clean)
                if m:
                    matched_kws.append(m.group(0))

            if len(matched_kws) >= 2:
                score = 0.75 + min(0.15, len(matched_kws) * 0.05)
                if score > best_score:
                    best_score = score
                    best_type = doc_type
                    best_evidence = [f"Keyword: '{k}'" for k in matched_kws]

        if best_type and best_score >= 0.75:
            return ClassificationResult(
                doc_type=best_type,
                confidence=best_score,
                method="keyword_density",
                evidence=best_evidence,
                matched_page=page_no,
            )

        # 3. Tier 3: Filename Heuristic Matching (useful for image-only scans before OCR)
        from pathlib import Path
        fn_stem = Path(filename).stem.lower() if filename else ""
        fn_tokens = set(re.split(r"[\W_]+", fn_stem))

        for doc_type, rules in ANCHOR_RULES.items():
            for fn_pat in rules.get("filename_patterns", []):
                # Exact token match or delimited substring match
                pat_clean = fn_pat.lower().replace("-", "_")
                token_match = any(tok == pat_clean or tok == fn_pat.lower() for tok in fn_tokens)
                delim_match = bool(re.search(r"(?:^|[\W_])" + re.escape(fn_pat) + r"(?:[\W_]|$)", fn_stem))
                if token_match or delim_match:
                    return ClassificationResult(
                        doc_type=doc_type,
                        confidence=0.85,
                        method="filename_heuristic",
                        evidence=[f"Filename pattern matched: '{fn_pat}' in '{filename}'"],
                        matched_page=page_no,
                    )

        # 4. Tier 4: Unknown / Unclassified
        return ClassificationResult(
            doc_type=DocumentType.UNKNOWN,
            confidence=0.0,
            method="fallback",
            evidence=["No matching statutory anchor or filename token found"],
            matched_page=page_no,
        )

    def classify_document(
        self,
        filename: str,
        pages_text: list[str],
        metadata: Optional[dict[str, Any]] = None,
    ) -> ClassificationResult:
        """Classify a multi-page document across all available pages."""
        if not pages_text:
            return self.classify(filename=filename, first_page_text="", page_no=1, metadata=metadata)

        # First inspect page 1 (standard location for headers/titles)
        p1_res = self.classify(filename=filename, first_page_text=pages_text[0], page_no=1, metadata=metadata)
        if p1_res.doc_type != DocumentType.UNKNOWN and p1_res.confidence >= 0.85:
            return p1_res

        # If page 1 is inconclusive, inspect remaining pages (up to page 5)
        for idx, page_txt in enumerate(pages_text[1:5], start=2):
            res = self.classify(filename=filename, first_page_text=page_txt, page_no=idx, metadata=metadata)
            if res.doc_type != DocumentType.UNKNOWN and res.confidence >= 0.85:
                return res

        # Return page 1 result or filename fallback
        return p1_res
