# Verification History & Snapshot Traceability

## Overview

The Verification History endpoint (`GET /api/v1/bidders/{id}/verification-history`) provides an immutable, point-in-time snapshot of the entire evaluation pipeline for a bidder submission.

---

## 1. REST Contract: `GET /api/v1/bidders/{id}/verification-history`

```json
{
  "bidder_id": "b1a2c3d4-...",
  "bidder_name": "Meridian Energy Infrastructure Ltd",
  "tender_id": "t1a2c3d4-...",
  "tender_nit": "CPCL/PROC/2026/088",
  "verified_at": "2026-09-04T12:00:00Z",
  "ruleset_version": "1.0",
  "documents_evaluated": [
    {
      "filename": "Financials_FY24.pdf",
      "sha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "doc_type": "FINANCIAL_STATEMENT",
      "page_count": 22
    }
  ],
  "registry_responses": [
    {
      "adapter": "GSTN_API_Adapter",
      "status": "VERIFIED",
      "details": {"trade_name": "Meridian Energy", "active": true}
    }
  ],
  "findings_count": 9,
  "risk_score": 12,
  "risk_band": "LOW",
  "officer_decisions": [
    {
      "decision_id": "d1a2c3d4-...",
      "finding_id": "f1a2c3d4-...",
      "action": "APPROVE",
      "justification": "Audited balance sheet verified against MCA21.",
      "officer_name": "Senior Procurement Officer",
      "created_at": "2026-09-04T12:05:00Z"
    }
  ],
  "audit_chain_head": "8f49b3..."
}
```
