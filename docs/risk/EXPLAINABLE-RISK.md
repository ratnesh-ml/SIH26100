# Explainable Risk Engine ("WHY?")

## Overview

A risk score without a clear explanation is unhelpful and legally insufficient for tender evaluation committees. The VigilBid Explainable Risk Engine breaks down composite risk scores into transparent, weighted factor contributions that answer the procurement officer's central question: **"WHY was this bidder marked HIGH RISK?"**

---

## 1. REST Contract: `GET /api/v1/bidders/{id}/risk/explain`

```json
{
  "bidder_id": "b1a2c3d4-...",
  "bidder_name": "Shadow Systems Pvt Ltd",
  "composite_score": 78,
  "risk_band": "HIGH",
  "explanation_summary": "High Risk (78/100) driven primarily by: Turnover requirement failed (Deficit ₹2.5 Cr) (+40 pts); PAN-GSTIN entity mismatch (+25 pts); Expired ISO certificate (+13 pts).",
  "factors": [
    {
      "factor_id": "RF-FIN-01",
      "category": "HARD_FAILURE",
      "title": "Turnover requirement failed",
      "contribution_points": 40,
      "severity": "CRITICAL",
      "reason": "Declared 3-year average turnover ₹12.5 Cr falls short of mandatory ₹15.0 Cr threshold.",
      "evidence_document": "Financials.pdf",
      "evidence_page": 17,
      "rule_id": "R-FIN-01",
      "explanation_status": "CORROBORATED"
    },
    {
      "factor_id": "RF-ID-02",
      "category": "ENTITY_PARITY",
      "title": "PAN mismatch with GSTIN",
      "contribution_points": 25,
      "severity": "HIGH",
      "reason": "Characters 3-12 of GSTIN do not match declared entity PAN card.",
      "evidence_document": "PAN_Card.pdf",
      "evidence_page": 1,
      "rule_id": "R-ID-02",
      "explanation_status": "CORROBORATED"
    }
  ],
  "missing_evidence_factors": []
}
```

---

## 2. Invariants

1. **Deterministic Point Attribution**: The sum of factor contribution points matches or bounds the calculated risk score.
2. **Missing Evidence Flagging**: If a risk factor lacks primary document provenance or bounding boxes, it is marked `explanation_status="INSUFFICIENT_EVIDENCE"` with reason `"Insufficient visual evidence to fully corroborate this finding"`.
3. **No Black-Box Scoring**: Machine learning and GNN anomaly scores are explained using explicit plain-language reasons and evidence links.
