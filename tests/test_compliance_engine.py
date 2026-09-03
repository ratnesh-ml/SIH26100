"""Comprehensive Tests for the Compliance Rules Engine."""

from pathlib import Path
import pytest

from pipeline.compliance.engine import (
    BidderComplianceSummary,
    ComplianceEngine,
    RuleFindingResult,
    calculate_precedence,
    get_recommendation_for_status,
)


@pytest.fixture
def engine():
    return ComplianceEngine()


# =========================================================================
# 1. Rule Loading & Metadata Tests
# =========================================================================

def test_engine_loads_rules(engine):
    assert len(engine.rules) >= 12
    assert engine.version == "1.0"
    assert "R-ID-01" in engine.rule_map
    assert "R-FIN-01" in engine.rule_map
    assert "R-REG-01" in engine.rule_map
    assert "R-TEC-01" in engine.rule_map
    assert "R-COM-01" in engine.rule_map


# =========================================================================
# 2. Precedence Hierarchy Tests
# =========================================================================

def test_calculate_precedence_hierarchy():
    # FAIL > REVIEW > WARN > PASS
    assert calculate_precedence(["PASS", "PASS", "PASS"]) == "PASS"
    assert calculate_precedence(["PASS", "WARN", "PASS"]) == "WARN"
    assert calculate_precedence(["PASS", "WARN", "REVIEW"]) == "REVIEW"
    assert calculate_precedence(["PASS", "WARN", "REVIEW", "FAIL"]) == "FAIL"
    assert calculate_precedence(["FAIL", "REVIEW"]) == "FAIL"
    assert calculate_precedence([]) == "PASS"


def test_recommendation_phrasing():
    rec_fail = get_recommendation_for_status("FAIL")
    assert "Recommended: Not Qualified" in rec_fail
    assert "officer confirmation required" in rec_fail
    assert "fraud" not in rec_fail.lower()

    rec_rev = get_recommendation_for_status("REVIEW")
    assert "Needs Review" in rec_rev

    rec_warn = get_recommendation_for_status("WARN")
    assert "Qualified with observations" in rec_warn

    rec_pass = get_recommendation_for_status("PASS")
    assert "Recommended: Qualified" in rec_pass


# =========================================================================
# 3. PASS Test Cases (Fully Compliant Bidder)
# =========================================================================

def test_rule_evaluation_pass_cases(engine):
    bidder_data = {
        "bidder_id": "bidder-01",
        "gstin": "33AABCA1234A1Z5",
        "pan": "AABCA1234A",
        "udyam_no": "UDYAM-TN-02-0012345",
        "enterprise_category": "SMALL",
        "average_turnover_inr": 25000000.0,
        "net_worth_inr": 5000000.0,
        "udin": "24123456AAAAAA1234",
        "local_content_pct": 65.0,
        "has_land_border_decl": True,
        "debarred": False,
        "is_oem": True,
        "has_completion_cert": True,
        "order_value_inr": 20000000.0,
        "is_mse_exempt": True,
        "submitted_document_types": ["GST_CERT", "PAN_CARD"],
    }
    tender_context = {"min_turnover_inr": 13500000.0, "min_local_content_pct": 50.0}

    # Evaluate GSTIN
    f_gst = engine.evaluate_rule("R-ID-01", bidder_data, tender_context)
    assert f_gst.status == "PASS"
    assert "CGST Rules" in f_gst.citation.get("source", "")

    # Evaluate Turnover
    f_fin = engine.evaluate_rule("R-FIN-01", bidder_data, tender_context)
    assert f_fin.status == "PASS"

    # Evaluate Net Worth
    f_nw = engine.evaluate_rule("R-FIN-02", bidder_data, tender_context)
    assert f_nw.status == "PASS"

    # Evaluate MII Local Content
    f_mii = engine.evaluate_rule("R-REG-01", bidder_data, tender_context)
    assert f_mii.status == "PASS"


# =========================================================================
# 4. FAIL Test Cases (Statutory Violations & Shortfalls)
# =========================================================================

def test_rule_evaluation_fail_cases(engine):
    tender_context = {"min_turnover_inr": 13500000.0, "min_local_content_pct": 50.0, "emd_amount_inr": 900000.0}

    # 1. Turnover shortfall (< 13.5 Cr)
    bidder_low_turnover = {"average_turnover_inr": 8000000.0}
    f_turnover = engine.evaluate_rule("R-FIN-01", bidder_low_turnover, tender_context)
    assert f_turnover.status == "FAIL"
    assert "below the required" in f_turnover.explanation

    # 2. Negative Net Worth (Insolvency)
    bidder_neg_nw = {"net_worth_inr": -1500000.0}
    f_nw = engine.evaluate_rule("R-FIN-02", bidder_neg_nw, tender_context)
    assert f_nw.status == "FAIL"
    assert "Financial insolvency" in f_nw.explanation

    # 3. MII Local Content Shortfall (< 50%)
    bidder_low_mii = {"local_content_pct": 35.0}
    f_mii = engine.evaluate_rule("R-REG-01", bidder_low_mii, tender_context)
    assert f_mii.status == "FAIL"
    assert "below required minimum" in f_mii.explanation

    # 4. Debarment Match
    bidder_debarred = {
        "debarred": True,
        "debarment_reason": "Collusive bidding in refinery procurement",
        "debarment_order_no": "CPPP/DEB/2025/998",
    }
    f_deb = engine.evaluate_rule("R-REG-03", bidder_debarred, tender_context)
    assert f_deb.status == "FAIL"
    assert f_deb.potential_anomaly_detected is True
    assert "fraud" not in f_deb.explanation.lower()

    # 5. EMD Shortfall
    bidder_low_emd = {"is_mse_exempt": False, "emd_paid_inr": 200000.0}
    f_emd = engine.evaluate_rule("R-COM-01", bidder_low_emd, tender_context)
    assert f_emd.status == "FAIL"
    assert "EMD shortfall" in f_emd.explanation


# =========================================================================
# 5. WARN Test Cases (Soft / Advisory Non-Compliance)
# =========================================================================

def test_rule_evaluation_warn_cases(engine):
    # 1. Missing or invalid UDIN on CA turnover certificate (R-FIN-03)
    bidder_invalid_udin = {"udin": "INVALID_UDIN_123"}
    f_udin = engine.evaluate_rule("R-FIN-03", bidder_invalid_udin)
    assert f_udin.status == "WARN"

    bidder_missing_udin = {"udin": None}
    f_udin_missing = engine.evaluate_rule("R-FIN-03", bidder_missing_udin)
    assert f_udin_missing.status == "WARN"

    # 2. OEM Authorization letter present but does not cite tender NIT (R-TEC-01)
    bidder_oem_no_ref = {
        "is_oem": False,
        "has_oem_auth": True,
        "oem_auth_references_tender": False,
    }
    f_oem_warn = engine.evaluate_rule("R-TEC-01", bidder_oem_no_ref)
    assert f_oem_warn.status == "WARN"
    assert "does not explicitly cite" in f_oem_warn.explanation


# =========================================================================
# 6. REVIEW Test Cases (Human Officer Judgement Needed)
# =========================================================================

def test_rule_evaluation_review_cases(engine):
    # 1. Past performance work orders (R-TEC-02)
    bidder_missing_exp = {"has_completion_cert": False}
    f_exp = engine.evaluate_rule("R-TEC-02", bidder_missing_exp)
    assert f_exp.status == "REVIEW"
    assert "officer verification required" in f_exp.explanation

    # 2. Land border origin declaring foreign control without approval (R-REG-02)
    bidder_border = {
        "has_land_border_decl": True,
        "land_border_origin": True,
        "has_competent_reg": False,
    }
    f_lb = engine.evaluate_rule("R-REG-02", bidder_border)
    assert f_lb.status == "REVIEW"
    assert "legal review required" in f_lb.explanation


# =========================================================================
# 7. Missing Evidence Tests
# =========================================================================

def test_missing_evidence_evaluations(engine):
    empty_bidder = {}

    # Missing GSTIN -> REVIEW
    f_gst = engine.evaluate_rule("R-ID-01", empty_bidder)
    assert f_gst.status == "REVIEW"
    assert "missing" in f_gst.explanation.lower()

    # Missing PAN -> REVIEW
    f_pan = engine.evaluate_rule("R-PAN-01", empty_bidder)
    assert f_pan.status == "REVIEW"

    # Missing Turnover -> REVIEW
    f_fin = engine.evaluate_rule("R-FIN-01", empty_bidder)
    assert f_fin.status == "REVIEW"

    # Missing Land Border Decl -> REVIEW
    f_lb = engine.evaluate_rule("R-REG-02", empty_bidder)
    assert f_lb.status == "REVIEW"

    # Missing Mandatory Document -> REVIEW
    f_doc = engine.evaluate_rule("R-DOC-01", empty_bidder)
    assert f_doc.status == "REVIEW"


# =========================================================================
# 8. Conflicting Evidence Tests (Hard Discrepancies)
# =========================================================================

def test_conflicting_evidence_evaluations(engine):
    # 1. Conflicting PAN embedded in GSTIN vs declared PAN card (R-ID-02)
    bidder_conflict_pan = {
        "gstin": "33AABCA1234A1Z5",  # Embedded PAN: AABCA1234A
        "pan": "BBBCB5678B",         # Conflicting declared PAN
    }
    f_pan_link = engine.evaluate_rule("R-ID-02", bidder_conflict_pan)
    assert f_pan_link.status == "FAIL"
    assert f_pan_link.potential_anomaly_detected is True
    assert "Conflicting statutory evidence" in f_pan_link.explanation
    assert "AABCA1234A" in f_pan_link.explanation
    assert "BBBCB5678B" in f_pan_link.explanation

    # 2. Conflicting Udyam: Medium enterprise claiming MSE benefits (R-UDY-02)
    bidder_conflict_mse = {
        "enterprise_category": "MEDIUM",
        "claims_mse": True,
    }
    f_mse = engine.evaluate_rule("R-UDY-02", bidder_conflict_mse)
    assert f_mse.status == "FAIL"
    assert f_mse.potential_anomaly_detected is True
    assert "MEDIUM" in f_mse.explanation


# =========================================================================
# 9. Full Bidder Compliance Evaluation Summary Test
# =========================================================================

def test_evaluate_bidder_full_summary(engine):
    bidder_data = {
        "bidder_id": "b-99",
        "gstin": "33AABCA1234A1Z5",
        "pan": "AABCA1234A",
        "average_turnover_inr": 20000000.0,
        "net_worth_inr": 3000000.0,
        "local_content_pct": 55.0,
        "has_land_border_decl": True,
        "is_oem": True,
        "debarred": False,
        "is_mse_exempt": True,
        "udin": "24123456AAAAAA1234",
        "has_completion_cert": True,
        "submitted_document_types": ["GST_CERT"],
    }
    tender_context = {"min_turnover_inr": 13500000.0, "min_local_content_pct": 50.0}

    summary = engine.evaluate_bidder(bidder_data, tender_context)
    assert isinstance(summary, BidderComplianceSummary)
    assert summary.bidder_id == "b-99"
    assert summary.fail_count == 0
    assert summary.pass_count >= 5
    assert summary.overall_status in ("PASS", "REVIEW", "WARN")

    d = summary.to_dict()
    assert "findings" in d
    assert "overall_status" in d
    assert "recommendation" in d
