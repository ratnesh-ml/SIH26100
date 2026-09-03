"""Cross-document entity matching, parity scoring, and resolution engine.

Determines whether data extracted from different statutory documents (GST, PAN, Udyam,
Financial statements) refers to the same organization using the documented scoring approach.
"""

from dataclasses import dataclass, field
from difflib import SequenceMatcher
from enum import Enum
import math
import re
from typing import Any, Optional

from pipeline.entity_resolution.normalizer import (
    EntityNormalizer,
    NormalizedAddress,
    NormalizedOrgName,
    normalize_address,
    normalize_org_name,
)
from pipeline.entity_resolution.validators import validate_gstin, validate_pan


class EntityMatchStatus(str, Enum):
    """Standardized decision status for entity resolution."""
    LIKELY_MATCH = "LIKELY_MATCH"
    SAME_ENTITY = "SAME_ENTITY"
    NEEDS_REVIEW = "NEEDS_REVIEW"
    MISMATCH = "MISMATCH"


@dataclass
class EntityRecord:
    """Consolidated statutory profile extracted from a document or bidder registration."""
    company_name: Optional[str] = None
    pan: Optional[str] = None
    gstin: Optional[str] = None
    udyam: Optional[str] = None
    address: Optional[str] = None
    pincode: Optional[str] = None
    constitution: Optional[str] = None
    source_document: Optional[str] = None


@dataclass
class FieldComparisonDetail:
    """Detailed diagnostic for an individual field comparison."""
    field_name: str
    val_a: Optional[str]
    val_b: Optional[str]
    similarity: float
    weight: float
    is_match: bool
    notes: str


@dataclass
class EntityResolutionResult:
    """Comprehensive outcome of pairwise or cross-document entity resolution."""
    status: EntityMatchStatus
    confidence: float
    field_comparisons: dict[str, FieldComparisonDetail] = field(default_factory=dict)
    summary_explanation: str = ""
    pan_gstin_parity: bool = True
    legal_form_consistent: bool = True
    potential_anomaly_detected: bool = False

    @property
    def is_match(self) -> bool:
        return self.status in (EntityMatchStatus.LIKELY_MATCH, EntityMatchStatus.SAME_ENTITY)


# Backward-compatible score structure
@dataclass
class ResolutionScore:
    declared_name: str
    canonical_name: str
    token_set_ratio: float
    pan_gstin_parity: bool
    is_match: bool
    confidence: float = 0.0
    status: str = "LIKELY_MATCH"
    explanation: str = ""


# =========================================================================
# Pure Python String Similarity Algorithms
# =========================================================================

def jaro_winkler_similarity(s1: str, s2: str, p: float = 0.1, max_l: int = 4) -> float:
    """Compute Jaro-Winkler similarity between two strings."""
    if not s1 or not s2:
        return 1.0 if s1 == s2 else 0.0
    if s1 == s2:
        return 1.0

    len1, len2 = len(s1), len(s2)
    max_dist = math.floor(max(len1, len2) / 2) - 1
    if max_dist < 0:
        max_dist = 0

    s1_matches = [False] * len1
    s2_matches = [False] * len2

    matches = 0
    for i in range(len1):
        start = max(0, i - max_dist)
        end = min(i + max_dist + 1, len2)
        for j in range(start, end):
            if not s2_matches[j] and s1[i] == s2[j]:
                s1_matches[i] = True
                s2_matches[j] = True
                matches += 1
                break

    if matches == 0:
        return 0.0

    transpositions = 0
    k = 0
    for i in range(len1):
        if s1_matches[i]:
            while not s2_matches[k]:
                k += 1
            if s1[i] != s2[k]:
                transpositions += 1
            k += 1

    transpositions //= 2
    jaro = (matches / len1 + matches / len2 + (matches - transpositions) / matches) / 3.0

    # Prefix match up to max_l characters
    l = 0
    for i in range(min(len1, len2, max_l)):
        if s1[i] == s2[i]:
            l += 1
        else:
            break

    return min(1.0, round(jaro + l * p * (1.0 - jaro), 4))


def token_set_ratio(s1: str, s2: str) -> float:
    """Compute Token Set Ratio (0.0 to 100.0) between two strings."""
    if not s1 or not s2:
        return 100.0 if s1 == s2 else 0.0
    tokens1 = set(s1.split())
    tokens2 = set(s2.split())

    intersection = sorted(tokens1.intersection(tokens2))
    diff1 = sorted(tokens1 - tokens2)
    diff2 = sorted(tokens2 - tokens1)

    t0 = " ".join(intersection)
    t1 = " ".join(intersection + diff1)
    t2 = " ".join(intersection + diff2)

    r1 = SequenceMatcher(None, t0, t1).ratio() if t0 and t1 else 0.0
    r2 = SequenceMatcher(None, t0, t2).ratio() if t0 and t2 else 0.0
    r3 = SequenceMatcher(None, t1, t2).ratio() if t1 and t2 else 0.0

    return round(max(r1, r2, r3, SequenceMatcher(None, s1, s2).ratio()) * 100.0, 2)


def phonetic_hash(text: str) -> str:
    """Generate phonetic soundex code for Indian and English words."""
    clean = re.sub(r"[^A-Z]", "", text.upper())
    if not clean:
        return ""
    code = [clean[0]]
    mapping = {
        "BFPV": "1", "CGJKQSXZ": "2", "DT": "3",
        "L": "4", "MN": "5", "R": "6",
    }
    char_map = {c: code_num for chars, code_num in mapping.items() for c in chars}
    prev = char_map.get(clean[0], "0")
    for char in clean[1:]:
        curr = char_map.get(char, "0")
        if curr != "0" and curr != prev:
            code.append(curr)
        prev = curr
    return "".join(code)[:4].ljust(4, "0")


# =========================================================================
# Core Entity Matcher
# =========================================================================

class EntityMatcher:
    """Computes cross-document entity similarity, parity scores, and resolution status."""

    def __init__(self, normalizer: Optional[EntityNormalizer] = None):
        self.normalizer = normalizer or EntityNormalizer()

    def compare_names(self, name_a: Optional[str], name_b: Optional[str]) -> tuple[float, str]:
        """Compute multi-metric name similarity using Token Set Ratio, Jaro-Winkler, and Phonetics.
        
        Formula from architecture spec Section 08.2:
        name_sim = 0.5 * token_set_ratio/100 + 0.3 * jaro_winkler + 0.2 * phonetic_match
        """
        if not name_a or not name_b:
            return 0.0, "One or both company names missing"

        parsed_a = self.normalizer.parse_company(name_a)
        parsed_b = self.normalizer.parse_company(name_b)

        core_a = parsed_a.core_name
        core_b = parsed_b.core_name

        if not core_a or not core_b:
            return 0.0, "Could not extract core organization root"

        # Check anti-collision distinctive tokens
        if parsed_a.distinctive_tokens and parsed_b.distinctive_tokens:
            if parsed_a.distinctive_tokens != parsed_b.distinctive_tokens:
                return 0.30, f"Distinctive domain conflict: {parsed_a.distinctive_tokens} vs {parsed_b.distinctive_tokens}"

        # If clean names or core names are identical
        if parsed_a.clean_name == parsed_b.clean_name or core_a == core_b:
            return 0.98, f"Exact match on core name: '{core_a}'"

        tsr = token_set_ratio(core_a, core_b) / 100.0
        jw = jaro_winkler_similarity(core_a, core_b)
        ph_match = 1.0 if phonetic_hash(core_a) == phonetic_hash(core_b) else 0.0

        score = (0.50 * tsr) + (0.30 * jw) + (0.20 * ph_match)
        score = min(1.0, round(score, 3))
        return score, f"TSR={tsr:.2f}, JW={jw:.2f}, Phonetic={ph_match}"

    def compare_addresses(self, addr_a: Optional[str], addr_b: Optional[str]) -> tuple[float, str]:
        """Compute address similarity via PIN code parity and token overlap.
        
        Formula from architecture spec Section 08.2:
        addr_sim = 0.6 * (pin_a == pin_b) + 0.4 * token_set_ratio(addr_a, addr_b)/100
        """
        if not addr_a or not addr_b:
            return 0.0, "One or both addresses missing"

        norm_a = self.normalizer.normalize_address(addr_a)
        norm_b = self.normalizer.normalize_address(addr_b)

        pin_match = 1.0 if (norm_a.pincode and norm_b.pincode and norm_a.pincode == norm_b.pincode) else 0.0
        tsr = token_set_ratio(norm_a.clean_address, norm_b.clean_address) / 100.0

        score = (0.60 * pin_match) + (0.40 * tsr)
        score = min(1.0, round(score, 3))
        return score, f"PIN match={pin_match}, Address TSR={tsr:.2f}"

    def check_legal_form_consistency(
        self,
        pan: Optional[str],
        constitution: Optional[str],
        detected_form: Optional[str],
    ) -> bool:
        """Check consistency between PAN 4th character, GST constitution, and name legal suffix."""
        if not pan or len(pan) < 4:
            return True  # Cannot disprove consistency without PAN

        fourth_char = pan[3].upper()
        form = (detected_form or "").upper()
        const = (constitution or "").upper()

        if fourth_char == "C":
            if "PRIVATE" in form or "LIMITED" in form or "COMPANY" in const:
                return True
            if "PROPRIETORSHIP" in const or "FIRM" in const:
                return False
        elif fourth_char == "P":
            if "COMPANY" in const or "PRIVATE" in form or "LIMITED" in form:
                return False
        elif fourth_char == "F":
            if "COMPANY" in const and "LLP" not in const and "LLP" not in form:
                return False

        return True

    def compare_entities(self, rec_a: EntityRecord, rec_b: EntityRecord) -> EntityResolutionResult:
        """Compare two document records using the documented scoring approach.
        
        Strong identifiers (PAN, GSTIN, Udyam) carry greater weight than fuzzy text.
        Conservative vocabulary is strictly maintained (never declaring fraud).
        """
        comparisons: dict[str, FieldComparisonDetail] = {}
        weighted_scores = []
        total_weights = []
        explanations = []

        is_conflict = False
        pan_gstin_parity = True

        # ---------------------------------------------------------------------
        # 1. PAN & GSTIN Strong Identifier Primary Linkage (Weight: 0.45)
        # ---------------------------------------------------------------------
        pan_a = rec_a.pan or (rec_a.gstin[2:12] if rec_a.gstin and len(rec_a.gstin) >= 12 else None)
        pan_b = rec_b.pan or (rec_b.gstin[2:12] if rec_b.gstin and len(rec_b.gstin) >= 12 else None)

        if pan_a and pan_b:
            clean_pan_a = pan_a.strip().upper()
            clean_pan_b = pan_b.strip().upper()
            if clean_pan_a == clean_pan_b:
                pan_score = 1.0
                explanations.append(f"Authoritative PAN parity confirmed: '{clean_pan_a}' matches across both records.")
            else:
                pan_score = 0.0
                is_conflict = True
                pan_gstin_parity = False
                explanations.append(
                    f"Potential anomaly detected: PAN mismatch across records ('{clean_pan_a}' vs '{clean_pan_b}'). Human verification required."
                )

            comparisons["pan_link"] = FieldComparisonDetail(
                field_name="pan",
                val_a=clean_pan_a,
                val_b=clean_pan_b,
                similarity=pan_score,
                weight=0.45,
                is_match=pan_score == 1.0,
                notes="Hard statutory identifier parity" if pan_score == 1.0 else "Identifier conflict",
            )
            weighted_scores.append(pan_score * 0.45)
            total_weights.append(0.45)

        # ---------------------------------------------------------------------
        # 2. Organization Name Similarity (Weight: 0.30)
        # ---------------------------------------------------------------------
        if rec_a.company_name and rec_b.company_name:
            name_score, name_note = self.compare_names(rec_a.company_name, rec_b.company_name)
            comparisons["name_sim"] = FieldComparisonDetail(
                field_name="company_name",
                val_a=rec_a.company_name,
                val_b=rec_b.company_name,
                similarity=name_score,
                weight=0.30,
                is_match=name_score >= 0.85,
                notes=name_note,
            )
            weighted_scores.append(name_score * 0.30)
            total_weights.append(0.30)
            if name_score >= 0.85:
                explanations.append(f"Company names highly consistent ({name_note}).")
            elif name_score < 0.50:
                explanations.append(f"Company names diverge significantly ({name_note}).")

        # ---------------------------------------------------------------------
        # 3. Address & PIN Code Parity (Weight: 0.15)
        # ---------------------------------------------------------------------
        addr_a = rec_a.address or rec_a.pincode
        addr_b = rec_b.address or rec_b.pincode
        if addr_a and addr_b:
            addr_score, addr_note = self.compare_addresses(addr_a, addr_b)
            comparisons["addr_sim"] = FieldComparisonDetail(
                field_name="address",
                val_a=addr_a,
                val_b=addr_b,
                similarity=addr_score,
                weight=0.15,
                is_match=addr_score >= 0.70,
                notes=addr_note,
            )
            weighted_scores.append(addr_score * 0.15)
            total_weights.append(0.15)
            if addr_score >= 0.70:
                explanations.append(f"Address alignment verified ({addr_note}).")

        # ---------------------------------------------------------------------
        # 4. Udyam Linkage (Weight: 0.10)
        # ---------------------------------------------------------------------
        if rec_a.udyam and rec_b.udyam:
            udyam_score = 1.0 if rec_a.udyam.strip().upper() == rec_b.udyam.strip().upper() else 0.0
            comparisons["udyam_link"] = FieldComparisonDetail(
                field_name="udyam",
                val_a=rec_a.udyam,
                val_b=rec_b.udyam,
                similarity=udyam_score,
                weight=0.10,
                is_match=udyam_score == 1.0,
                notes="Exact Udyam match" if udyam_score == 1.0 else "Udyam identifier mismatch",
            )
            weighted_scores.append(udyam_score * 0.10)
            total_weights.append(0.10)
            if udyam_score == 1.0:
                explanations.append("Udyam registration number matches across documents.")
            else:
                is_conflict = True
                explanations.append("Potential anomaly detected: Conflicting Udyam identifiers.")

        # ---------------------------------------------------------------------
        # Compute Weighted Score & Penalty
        # ---------------------------------------------------------------------
        if not total_weights:
            return EntityResolutionResult(
                status=EntityMatchStatus.NEEDS_REVIEW,
                confidence=0.0,
                field_comparisons={},
                summary_explanation="Insufficient data to perform entity resolution.",
            )

        raw_confidence = sum(weighted_scores) / sum(total_weights)

        # Check Legal Form Consistency
        detected_form = None
        if rec_a.company_name:
            detected_form = self.normalizer.parse_company(rec_a.company_name).legal_form
        legal_consistent = self.check_legal_form_consistency(
            pan=pan_a or pan_b,
            constitution=rec_a.constitution or rec_b.constitution,
            detected_form=detected_form,
        )

        penalty = 0.0
        if not legal_consistent:
            penalty = 0.20
            explanations.append("Potential anomaly detected: PAN 4th character is inconsistent with claimed business constitution.")

        final_confidence = max(0.0, min(1.0, round(raw_confidence - penalty, 2)))

        # ---------------------------------------------------------------------
        # Assign Status According to Documented Bands
        # ---------------------------------------------------------------------
        # Crucial: If strong identifier conflict exists, status is MISMATCH regardless of name similarity
        if is_conflict:
            status = EntityMatchStatus.MISMATCH
            final_confidence = min(final_confidence, 0.45)
            potential_anomaly = True
        elif final_confidence >= 0.85:
            status = EntityMatchStatus.LIKELY_MATCH
            potential_anomaly = False
        elif final_confidence >= 0.60:
            status = EntityMatchStatus.NEEDS_REVIEW
            potential_anomaly = False
        else:
            status = EntityMatchStatus.MISMATCH
            potential_anomaly = True

        summary = " ".join(explanations)

        return EntityResolutionResult(
            status=status,
            confidence=final_confidence,
            field_comparisons=comparisons,
            summary_explanation=summary,
            pan_gstin_parity=pan_gstin_parity,
            legal_form_consistent=legal_consistent,
            potential_anomaly_detected=potential_anomaly,
        )

    # Legacy / convenience interface
    def match_entities(
        self,
        declared_name: str,
        extracted_names: list[str],
        pan: str,
        gstin: str,
    ) -> ResolutionScore:
        """Score declared bidder name and statutory IDs against extracted document names."""
        canonical_name = normalize_org_name(declared_name)
        max_tsr = 0.0

        for ext_name in extracted_names:
            clean_ext = normalize_org_name(ext_name)
            tsr = token_set_ratio(canonical_name, clean_ext)
            if tsr > max_tsr:
                max_tsr = tsr

        pan_gstin_parity = True
        if pan and gstin and len(gstin) >= 12:
            pan_gstin_parity = (pan.strip().upper() == gstin[2:12].strip().upper())

        rec_a = EntityRecord(company_name=declared_name, pan=pan, gstin=gstin)
        rec_b = EntityRecord(
            company_name=extracted_names[0] if extracted_names else None,
            pan=pan,
            gstin=gstin,
        )
        res = self.compare_entities(rec_a, rec_b)

        return ResolutionScore(
            declared_name=declared_name,
            canonical_name=canonical_name,
            token_set_ratio=max_tsr,
            pan_gstin_parity=pan_gstin_parity,
            is_match=res.is_match,
            confidence=res.confidence,
            status=res.status.value,
            explanation=res.summary_explanation,
        )
