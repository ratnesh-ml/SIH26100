# Requirement -> Result -> Evidence Traceability Model

## Overview

Public procurement verification requires unambiguous traceability linking tender requirements to observed data and source document provenance:

$$\text{Tender Requirement} \longrightarrow \text{Evaluation Result} \longrightarrow \text{Primary Evidence}$$

The VigilBid Requirement Traceability Matrix (`GET /api/v1/bidders/{id}/requirement-matrix`) consolidates evaluated criteria, observed values, deterministic rule IDs, and multi-modal evidence citations.

---

## 1. Schema & Contract

```json
{
  "bidder_id": "b1a2c3d4-...",
  "bidder_name": "Meridian Energy Infrastructure Ltd",
  "tender_id": "t1a2c3d4-...",
  "tender_nit": "CPCL/PROC/2026/088",
  "total_requirements": 9,
  "passed_requirements": 8,
  "failed_requirements": 1,
  "review_required": 0,
  "rows": [
    {
      "requirement_code": "CRIT_TURNOVER",
      "requirement_title": "Minimum Annual Financial Turnover (30% of NIT)",
      "rule_id": "R-FIN-01",
      "status": "PASS",
      "expected_value": ">= ₹15.00 Cr",
      "observed_value": "₹18.50 Cr",
      "document_name": "Financials_Audited_FY24.pdf",
      "page_no": 17,
      "bounding_box": [120, 340, 500, 410],
      "verification_source": "DigiLocker / ICAI UDIN: 24123456AAAA1234",
      "finding_id": "f1a2c3d4-...",
      "explanation": "Average turnover of ₹18.50 Cr exceeds required threshold of ₹15.00 Cr."
    }
  ]
}
```

---

## 2. Invariants & Officer Presentation

1. **No Uncorroborated Passes**: Every requirement marked `PASS` must cite the specific source document and page number.
2. **Visual Proof Click-Through**: In the UI, clicking `[VIEW EVIDENCE]` navigates directly to the exact PDF page with bounding box highlight overlays.
3. **Registry Corroboration**: If verification is attested by external registries (GSTN, MCA21, NSDL, Udyam), the verification source adapter is explicitly named.
