"""Comprehensive Unit Tests for Cross-Document Entity Resolution and Scoring."""

import pytest
from pipeline.entity_resolution.matcher import (
    EntityMatcher,
    EntityMatchStatus,
    EntityRecord,
    jaro_winkler_similarity,
    token_set_ratio,
)
from pipeline.entity_resolution.normalizer import normalize_org_name


# =========================================================================
# 1. User Prompt Requirement & Core Canonical Example
# =========================================================================

def test_entity_resolution_user_example_gst_vs_udyam():
    """Verify exact user prompt example:
    GST: ABC Engineering Pvt Ltd
    Udyam: ABC Engineering Private Limited
    Result: LIKELY_MATCH, confidence: ~0.97 - 1.0
    """
    matcher = EntityMatcher()

    rec_gst = EntityRecord(
        company_name="ABC Engineering Pvt Ltd",
        source_document="GST_REG_06.pdf",
    )
    rec_udyam = EntityRecord(
        company_name="ABC Engineering Private Limited",
        source_document="UDYAM_CERT.pdf",
    )

    result = matcher.compare_entities(rec_gst, rec_udyam)

    assert result.status == EntityMatchStatus.LIKELY_MATCH
    assert result.confidence >= 0.95
    assert result.is_match is True
    assert "ABC ENGINEERING" in result.summary_explanation


# =========================================================================
# 2. Multi-Field Comprehensive Resolution with Strong Identifiers
# =========================================================================

def test_multi_field_authoritative_match():
    """Test full document comparison across Name, GSTIN, PAN, and Address."""
    matcher = EntityMatcher()

    rec_gst = EntityRecord(
        company_name="Apex Industrial Solutions Pvt. Ltd.",
        gstin="33AABCC1234F1Z5",
        address="Plot 45, Manali Industrial Estate, Chennai 600068",
        constitution="Private Limited Company",
        source_document="GST_REG_06.pdf",
    )

    rec_pan = EntityRecord(
        company_name="APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED",
        pan="AABCC1234F",
        address="Plot 45, Manali Indl. Est., Chennai - 600068, Tamil Nadu",
        source_document="PAN_CARD.pdf",
    )

    result = matcher.compare_entities(rec_gst, rec_pan)

    assert result.status == EntityMatchStatus.LIKELY_MATCH
    assert result.confidence >= 0.95
    assert result.pan_gstin_parity is True
    assert result.potential_anomaly_detected is False

    # Check field comparisons
    assert "pan_link" in result.field_comparisons
    assert result.field_comparisons["pan_link"].is_match is True
    assert result.field_comparisons["pan_link"].similarity == 1.0

    assert "name_sim" in result.field_comparisons
    assert result.field_comparisons["name_sim"].is_match is True

    assert "addr_sim" in result.field_comparisons
    assert result.field_comparisons["addr_sim"].is_match is True


# =========================================================================
# 3. Strong Identifier Primacy & Conflict Handling
# =========================================================================

def test_pan_mismatch_overrides_name_similarity():
    """Crucial Rule: If strong identifiers (PAN/GSTIN) conflict, result must be MISMATCH
    even if the names are identical, without declaring fraud.
    """
    matcher = EntityMatcher()

    # Identical company names, but different PANs
    rec_a = EntityRecord(
        company_name="Apex Industrial Solutions Private Limited",
        gstin="33AABCC1234F1Z5",  # Embedded PAN: AABCC1234F
        source_document="GST_REG_06.pdf",
    )
    rec_b = EntityRecord(
        company_name="Apex Industrial Solutions Private Limited",
        pan="XYZAB5678C",  # Conflicting PAN
        source_document="PAN_CARD.pdf",
    )

    result = matcher.compare_entities(rec_a, rec_b)

    assert result.status == EntityMatchStatus.MISMATCH
    assert result.confidence < 0.60
    assert result.pan_gstin_parity is False
    assert result.potential_anomaly_detected is True

    # Check that explanation clearly explains why and does NOT use forbidden words
    explanation = result.summary_explanation.lower()
    assert "potential anomaly detected" in explanation
    assert "mismatch" in explanation
    assert "human verification required" in explanation
    assert "fraud" not in explanation
    assert "fake" not in explanation
    assert "forged" not in explanation


def test_udyam_identifier_conflict():
    """Conflicting Udyam numbers should trigger anomaly and MISMATCH status."""
    matcher = EntityMatcher()

    rec_a = EntityRecord(
        company_name="Sri Kaveri Engineering Works",
        udyam="UDYAM-TN-01-0012345",
    )
    rec_b = EntityRecord(
        company_name="Sri Kaveri Engineering Works",
        udyam="UDYAM-MH-02-0099999",
    )

    result = matcher.compare_entities(rec_a, rec_b)

    assert result.status == EntityMatchStatus.MISMATCH
    assert result.potential_anomaly_detected is True
    assert "Conflicting Udyam identifiers" in result.summary_explanation


# =========================================================================
# 4. Status Bands: NEEDS_REVIEW and MISMATCH
# =========================================================================

def test_moderate_similarity_triggers_needs_review():
    """Names with moderate overlap and no hard identifiers should be flagged for human review."""
    matcher = EntityMatcher()

    rec_a = EntityRecord(company_name="Apex Logistics Private Limited")
    rec_b = EntityRecord(company_name="Apex Cargo Movers Private Limited")

    result = matcher.compare_entities(rec_a, rec_b)

    assert result.status in (EntityMatchStatus.NEEDS_REVIEW, EntityMatchStatus.MISMATCH)
    assert result.confidence < 0.85


def test_completely_unrelated_companies_mismatch():
    """Completely different companies must resolve to MISMATCH."""
    matcher = EntityMatcher()

    rec_a = EntityRecord(company_name="Bharat Heavy Electricals Limited")
    rec_b = EntityRecord(company_name="Kaveri Surgical Supplies Private Limited")

    result = matcher.compare_entities(rec_a, rec_b)

    assert result.status == EntityMatchStatus.MISMATCH
    assert result.confidence < 0.50
    assert result.is_match is False


# =========================================================================
# 5. String Similarity Algorithm Tests
# =========================================================================

def test_jaro_winkler_similarity():
    assert jaro_winkler_similarity("APEX", "APEX") == 1.0
    assert jaro_winkler_similarity("APEX", "APEX CORP") > 0.80
    assert jaro_winkler_similarity("APEX", "DELTA") < 0.60
    assert jaro_winkler_similarity("", "") == 1.0


def test_token_set_ratio():
    assert token_set_ratio("APEX SOLUTIONS", "SOLUTIONS APEX") == 100.0
    assert token_set_ratio("TATA STEEL LIMITED", "TATA STEEL") == 100.0
    assert token_set_ratio("TATA MOTORS", "TATA STEEL") < 70.0


# =========================================================================
# 6. Legal Form Consistency Penalty
# =========================================================================

def test_legal_form_inconsistency_penalty():
    """PAN 4th char 'P' (Individual) with claimed Private Limited form receives penalty."""
    matcher = EntityMatcher()

    rec_a = EntityRecord(
        company_name="Sharma Trading Private Limited",
        pan="AABPS1234F",  # 'P' indicates Individual, not Company
        constitution="Private Limited Company",
    )
    rec_b = EntityRecord(
        company_name="Sharma Trading Private Limited",
        pan="AABPS1234F",
    )

    result = matcher.compare_entities(rec_a, rec_b)

    assert result.legal_form_consistent is False
    assert "PAN 4th character is inconsistent" in result.summary_explanation


# =========================================================================
# 7. Backward-Compatible Legacy Interface
# =========================================================================

def test_legacy_match_entities_method():
    matcher = EntityMatcher()
    score = matcher.match_entities(
        declared_name="Apex Industrial Solutions Pvt Ltd",
        extracted_names=["APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED"],
        pan="AABCC1234F",
        gstin="33AABCC1234F1Z5",
    )

    assert score.is_match is True
    assert score.pan_gstin_parity is True
    assert score.confidence >= 0.95
    assert score.status == "LIKELY_MATCH"
