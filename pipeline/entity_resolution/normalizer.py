"""Advanced Field Normalization Engine for Indian Public Procurement.

Implements statutory whitespace, punctuation, legal suffix expansion, address expansion,
and anti-collision organization matching to prevent accidental merging of unrelated entities.
"""

from dataclasses import dataclass, field
import re
from typing import Any, Optional, Union

# Common legal and corporate abbreviations mapping
LEGAL_FORM_MAPPINGS = [
    (r"\b(?:PVT\.?\s*LTD\.?|PRIVATE\s+LIMITED)\b", "PRIVATE LIMITED", "PRIVATE_LIMITED"),
    (r"\b(?:LTD\.?|LIMITED)\b", "LIMITED", "PUBLIC_LIMITED"),
    (r"\b(?:LLP|L\.L\.P\.)\b", "LLP", "LLP"),
    (r"\b(?:OPC|O\.P\.C\.)\b", "OPC", "OPC"),
    (r"\b(?:INC\.?|INCORPORATED)\b", "INCORPORATED", "CORPORATION"),
    (r"\b(?:CORP\.?|CORPORATION)\b", "CORPORATION", "CORPORATION"),
    (r"\b(?:CO\.?|COMPANY)\b", "COMPANY", "COMPANY"),
    (r"\b(?:PARTNERSHIP|FIRM)\b", "PARTNERSHIP", "PARTNERSHIP"),
    (r"\b(?:PROPRIETORSHIP|PROPRIETARY)\b", "PROPRIETORSHIP", "PROPRIETORSHIP"),
]

# Address token expansions
ADDRESS_ABBREVIATIONS = {
    r"\bRD\.?\b": "ROAD",
    r"\bST\.?\b": "STREET",
    r"\bNR\.?\b": "NEAR",
    r"\bOPP\.?\b": "OPPOSITE",
    r"\bFLR\.?\b": "FLOOR",
    r"\bINDL\.?\b": "INDUSTRIAL",
    r"\bIND\.?\b": "INDUSTRIAL",
    r"\bEST\.?\b": "ESTATE",
    r"\bSEC\.?\b": "SECTOR",
    r"\bPH\.?\b": "PHASE",
    r"\bBLDG\.?\b": "BUILDING",
    r"\bAPT\.?\b": "APARTMENT",
    r"\bNO\.?\b": "NUMBER",
    r"\bNGR\.?\b": "NAGAR",
    r"\bDIST\.?\b": "DISTRICT",
    r"\bTN\b": "TAMIL NADU",
    r"\bMH\b": "MAHARASHTRA",
    r"\bKA\b": "KARNATAKA",
    r"\bDL\b": "DELHI",
    r"\bUP\b": "UTTAR PRADESH",
}

# Tokens that distinguish corporate entities and must NOT be stripped or ignored
DISTINCTIVE_SECTORS = {
    "STEEL", "POWER", "MOTORS", "CHEMICALS", "PETROCHEMICALS", "ENERGY", "TECH",
    "TECHNOLOGIES", "SOLUTIONS", "INDUSTRIES", "ENTERPRISES", "ENGINEERING",
    "SYSTEMS", "PHARMA", "PHARMACEUTICALS", "INFRASTRUCTURE", "LOGISTICS",
    "COMMUNICATIONS", "SERVICES", "CONSULTING", "GLOBAL", "INDIA", "INTERNATIONAL",
}


@dataclass
class NormalizedOrgName:
    """Detailed decomposition of an organization name for safe disambiguation."""
    raw_name: str
    clean_name: str
    core_name: str
    legal_form: str
    distinctive_tokens: set[str] = field(default_factory=set)


@dataclass
class NormalizedAddress:
    """Normalized postal address with extracted structural components."""
    raw_address: str
    clean_address: str
    pincode: Optional[str]
    state: Optional[str]
    city: Optional[str]


# =========================================================================
# Atomic Normalization Functions
# =========================================================================

def normalize_whitespace(text: Optional[str]) -> str:
    """Collapse tabs, non-breaking spaces (\xa0), newlines, and multi-spaces."""
    if not text:
        return ""
    # Replace non-breaking spaces and tabs with space
    s = text.replace("\xa0", " ").replace("\t", " ")
    # Replace newlines with single space
    s = re.sub(r"[\r\n]+", " ", s)
    # Collapse multiple spaces and strip
    return re.sub(r"\s+", " ", s).strip()


def normalize_punctuation(text: Optional[str]) -> str:
    """Normalize punctuation: standardize ampersands, hyphens, and remove extraneous symbols."""
    if not text:
        return ""
    s = normalize_whitespace(text)
    # Standardize ampersand
    s = re.sub(r"\s*&\s*", " AND ", s)
    # Replace non-standard dashes (en-dash, em-dash) with hyphen
    s = re.sub(r"[\u2013\u2014]", "-", s)
    # Remove quotes, backticks, brackets
    s = re.sub(r"[\"\'`\(\)\[\]\{\}]", " ", s)
    return normalize_whitespace(s)


def normalize_legal_abbreviations(text: Optional[str]) -> str:
    """Remove or standardize formal statutory prefixes and legal boilerplate."""
    if not text:
        return ""
    s = normalize_punctuation(text)
    # Remove honorific prefixes (M/S, MESSRS, SHRI, SMT) at start or word boundaries
    s = re.sub(r"(?:^|\b)(?:M/S\.?|MESSRS\.?|SHRI\.?|SMT\.?)\s*", "", s, flags=re.IGNORECASE)
    # Collapse dotted corporate acronyms (L.L.P. -> LLP, P.V.T. -> PVT, L.T.D. -> LTD, O.P.C. -> OPC)
    s = re.sub(r"\bL\s*\.\s*L\s*\.\s*P\.?", "LLP", s, flags=re.IGNORECASE)
    s = re.sub(r"\bP\s*\.\s*V\s*\.\s*T\.?", "PVT", s, flags=re.IGNORECASE)
    s = re.sub(r"\bL\s*\.\s*T\s*\.\s*D\.?", "LTD", s, flags=re.IGNORECASE)
    s = re.sub(r"\bO\s*\.\s*P\s*\.\s*C\.?", "OPC", s, flags=re.IGNORECASE)
    # Standardize common government/corporate abbreviations (handling optional period)
    s = re.sub(r"\bGOVT\.?", "GOVERNMENT", s, flags=re.IGNORECASE)
    s = re.sub(r"\bREGD\.?", "REGISTERED", s, flags=re.IGNORECASE)
    s = re.sub(r"\bESTD\.?", "ESTABLISHED", s, flags=re.IGNORECASE)
    s = re.sub(r"\bDEPT\.?", "DEPARTMENT", s, flags=re.IGNORECASE)
    # Strip standalone periods after abbreviation words
    s = re.sub(r"(?<=\w)\.(?=\s|[,\-]|$)", "", s)
    return normalize_whitespace(s)


# =========================================================================
# Organization Name Normalization & Safe Matching
# =========================================================================

class EntityNormalizer:
    """Normalizes company names, addresses, and statutory identifiers without data loss."""

    def normalize_company_name(self, name: Optional[str]) -> str:
        """Standardize company name to canonical legal form in uppercase."""
        parsed = self.parse_company(name)
        return parsed.clean_name

    def parse_company(self, name: Optional[str]) -> NormalizedOrgName:
        """Decompose company name into clean string, core semantic root, and legal form."""
        if not name or not str(name).strip():
            return NormalizedOrgName(
                raw_name="",
                clean_name="",
                core_name="",
                legal_form="UNKNOWN",
                distinctive_tokens=set(),
            )

        raw = str(name).strip()
        s = normalize_legal_abbreviations(raw).upper()

        detected_form = "OTHER"
        standardized_name = s

        # Identify and standardize legal form suffix
        for pattern, replacement, form_type in LEGAL_FORM_MAPPINGS:
            if re.search(pattern, s, re.IGNORECASE):
                standardized_name = re.sub(pattern, replacement, s, flags=re.IGNORECASE)
                detected_form = form_type
                break

        # Generate core name by stripping standard legal form words
        core_tokens = []
        for tok in standardized_name.split():
            clean_tok = re.sub(r"[^\w]", "", tok)
            if clean_tok not in ("PRIVATE", "LIMITED", "LLP", "OPC", "COMPANY", "CORPORATION", "AND"):
                if clean_tok:
                    core_tokens.append(clean_tok)

        core_str = " ".join(core_tokens)
        tokens_set = set(core_tokens)
        distinctive = tokens_set.intersection(DISTINCTIVE_SECTORS)

        clean_final = normalize_whitespace(re.sub(r"[^\w\s]", " ", standardized_name))

        return NormalizedOrgName(
            raw_name=raw,
            clean_name=clean_final,
            core_name=core_str,
            legal_form=detected_form,
            distinctive_tokens=distinctive,
        )

    def is_same_company(
        self,
        name_a: str,
        name_b: str,
        similarity_threshold: float = 0.85,
    ) -> tuple[bool, float, str]:
        """Safely determine if two company names represent the same legal entity.

        Guards against false merges between unrelated companies (e.g. 'Apex Solutions'
        vs 'Apex Technologies', or 'Tata Motors' vs 'Tata Steel').
        
        Returns:
            (is_match: bool, score: float, reason: str)
        """
        p_a = self.parse_company(name_a)
        p_b = self.parse_company(name_b)

        if not p_a.clean_name or not p_b.clean_name:
            return False, 0.0, "Empty company name"

        # 1. Exact canonical match
        if p_a.clean_name == p_b.clean_name:
            return True, 1.0, "Exact canonical name match"

        # 2. Exact core root match with compatible legal form
        if p_a.core_name and p_a.core_name == p_b.core_name:
            # Check if one is PVT LTD and other is LTD (private vs public entity requires caution)
            if p_a.legal_form != p_b.legal_form and "OTHER" not in (p_a.legal_form, p_b.legal_form):
                if {p_a.legal_form, p_b.legal_form} == {"PRIVATE_LIMITED", "PUBLIC_LIMITED"}:
                    return False, 0.60, f"Legal form mismatch: '{p_a.legal_form}' vs '{p_b.legal_form}'"
            return True, 0.95, "Exact core root match"

        # 3. Anti-Collision: Check for conflicting distinctive sector words
        # (e.g., TATA STEEL vs TATA MOTORS, APEX SOLUTIONS vs APEX TECHNOLOGIES)
        conflicts = (p_a.distinctive_tokens ^ p_b.distinctive_tokens)
        if conflicts:
            # If both have distinctive tokens and they differ, strictly reject match
            if p_a.distinctive_tokens and p_b.distinctive_tokens and p_a.distinctive_tokens != p_b.distinctive_tokens:
                return (
                    False,
                    0.40,
                    f"Conflicting distinctive business tokens: {p_a.distinctive_tokens} vs {p_b.distinctive_tokens}",
                )

        # 4. Token Overlap (Jaccard on core tokens)
        set_a = set(p_a.core_name.split())
        set_b = set(p_b.core_name.split())

        intersection = len(set_a.intersection(set_b))
        union = len(set_a.union(set_b))
        jaccard = intersection / union if union > 0 else 0.0

        if jaccard >= similarity_threshold:
            return True, round(jaccard, 3), f"High token overlap ({jaccard:.2f} >= {similarity_threshold})"

        return False, round(jaccard, 3), f"Insufficient token similarity ({jaccard:.2f} < {similarity_threshold})"

    def normalize_address(self, addr: Optional[str]) -> NormalizedAddress:
        """Normalize Indian postal address, expanding abbreviations and extracting PIN code."""
        if not addr or not str(addr).strip():
            return NormalizedAddress(
                raw_address="",
                clean_address="",
                pincode=None,
                state=None,
                city=None,
            )

        raw = str(addr).strip()
        s = normalize_punctuation(raw).upper()
        # Remove dots after words before expanding abbreviations
        s = re.sub(r"(?<=\w)\.(?=\s|[,\-]|$)", "", s)

        # Expand address abbreviations
        for pat, repl in ADDRESS_ABBREVIATIONS.items():
            s = re.sub(pat, repl, s, flags=re.IGNORECASE)

        # Extract 6-digit Indian PIN code
        pin_match = re.search(r"\b([1-9][0-9]{5})\b", s)
        pincode = pin_match.group(1) if pin_match else None

        # Extract State if present
        detected_state = None
        for code, state_name in {
            "TAMIL NADU": "Tamil Nadu", "MAHARASHTRA": "Maharashtra",
            "KARNATAKA": "Karnataka", "DELHI": "Delhi", "GUJARAT": "Gujarat",
            "TELANGANA": "Telangana", "ANDHRA PRADESH": "Andhra Pradesh",
            "WEST BENGAL": "West Bengal", "HARYANA": "Haryana", "UTTAR PRADESH": "Uttar Pradesh",
        }.items():
            if re.search(r"\b" + code + r"\b", s, re.IGNORECASE):
                detected_state = state_name
                break

        clean_final = normalize_whitespace(s)

        return NormalizedAddress(
            raw_address=raw,
            clean_address=clean_final,
            pincode=pincode,
            state=detected_state,
            city=None,
        )


# Module-level convenience functions
_DEFAULT_NORMALIZER = EntityNormalizer()

def normalize_org_name(name: Optional[str]) -> str:
    """Convenience helper for standard company name normalization."""
    return _DEFAULT_NORMALIZER.normalize_company_name(name)

normalize_company_name = normalize_org_name

def normalize_address(addr: Optional[str]) -> NormalizedAddress:
    """Convenience helper for standard address normalization."""
    return _DEFAULT_NORMALIZER.normalize_address(addr)

def is_same_company(name_a: str, name_b: str, similarity_threshold: float = 0.85) -> tuple[bool, float, str]:
    """Convenience helper for safe anti-collision company comparison."""
    return _DEFAULT_NORMALIZER.is_same_company(name_a, name_b, similarity_threshold)
