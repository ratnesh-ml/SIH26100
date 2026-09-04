# Where Do I Change This? — Developer Quick-Lookup Guide

This document is a rapid-lookup directory for software engineers, evaluators, and contributors. When you need to modify a specific feature or behavior, look up the target area below to find the exact file, class, or configuration setting.

---

## Quick Reference Table

| If you want to modify... | Go to this file | Key Function / Variable / Class |
|---|---|---|
| **User Authentication & JWT Expiry** | `backend/services/auth_service.py`<br>`backend/routers/auth.py` | `authenticate_user()`, `create_access_token()`, `ACCESS_TOKEN_EXPIRE_MINUTES` |
| **Upload File Size & Archive Limits** | `backend/services/document_service.py`<br>`pipeline/document_processing/ingest.py` | `MAX_FILE_SIZE_MB`, `MAX_ZIP_RATIO` (default: 100.0), `MAX_ZIP_ENTRIES` (default: 200) |
| **OCR Engine Selection & DPI** | `pipeline/ocr/factory.py`<br>`pipeline/ocr/fallback_adapter.py` | `get_ocr_engine()`, `TesseractFallbackAdapter`, `rasterize_page(dpi=150)` |
| **Document Classification Patterns** | `pipeline/document_processing/classifier.py` | `DOCUMENT_PATTERNS`, `classify_document()`, TF-IDF keyword weights |
| **Field Extraction Regular Expressions** | `pipeline/extraction/gst.py`<br>`pipeline/extraction/pan.py`<br>`pipeline/extraction/financial.py` | `GSTIN_REGEX`, `PAN_REGEX`, `extract_turnover_table()`, `UDIN_REGEX` |
| **Entity Matching & Name Normalization** | `pipeline/entity_resolution/matcher.py`<br>`pipeline/entity_resolution/normalizer.py` | `calculate_name_similarity()`, `COMPANY_SUFFIX_MAP`, Jaro-Winkler threshold (0.85) |
| **Simulated Government Registry Responses** | `pipeline/registry_adapters/mock_adapter.py`<br>`seed/mock_fixtures/` | `MockRegistryAdapter.verify_gstin()`, JSON fixtures in `seed/mock_fixtures/` |
| **Tender Compliance Rules (GFR/CPCL)** | `rules/cpcl_goods_rules.yaml`<br>`pipeline/compliance/engine.py` | Declarative YAML rule definitions, `evaluate_rule()`, threshold operators |
| **Risk Scoring Weights & Drivers** | `pipeline/risk/scorer.py` | `RISK_WEIGHTS` (Identity: 30%, Financial: 25%, Compliance: 25%, Anomaly: 20%) |
| **Forensic Anomaly Detection Checks** | `pipeline/risk/anomaly.py` | `detect_metadata_anomalies()`, `detect_prompt_injection()`, timestamp delta checks |
| **Cryptographic Audit Ledger Logic** | `backend/services/audit_service.py`<br>`pipeline/audit/hasher.py` | `compute_forward_hash()`, `verify_chain_integrity()`, `GENESIS_HASH` |
| **Frontend Executive Dashboard Telemetry** | `frontend/src/components/DashboardView.tsx`<br>`backend/services/dashboard_service.py` | `get_dashboard_telemetry()`, compliance distribution stats, risk charts |
| **Split-Screen Bidder Cockpit Layout** | `frontend/src/components/BidderDetailView.tsx` | Split-screen canvas flex containers, bounding box highlight overlay, decision drawer |
| **CVC Compliance Dossier PDF Template** | `pipeline/reports/dossier.py` | `generate_cvc_dossier()`, ReportLab table styles, signature block styling |
| **RAG Copilot Prompts & Retrieval** | `pipeline/rag/copilot.py`<br>`pipeline/rag/retriever.py` | `COPILOT_SYSTEM_PROMPT`, `retrieve_relevant_chunks()`, guardrails |
| **Demonstration Seed Dataset & Vendors** | `scripts/demo_setup.py`<br>`seed/demo_packages/` | `setup_demo_tender()`, `seed_demo_bidders()`, synthetic PDF file copies |
| **Interactive Guided Tour (`/demo`)** | `frontend/src/components/DemoView.tsx` | `DemoView`, `YOUTUBE_DEMO_URL`, tabbed vendor scenarios |

---

## Detailed Modification Scenarios

### 1. How to Add a New Compliance Rule
1. Open [`rules/cpcl_goods_rules.yaml`](file:///rules/cpcl_goods_rules.yaml).
2. Add a new YAML rule entry under the appropriate section:
   ```yaml
   - id: CPCL-DOC-015
     name: "Annual Maintenance Contract (AMC) Commitment"
     category: "TECHNICAL"
     clause_reference: "CPCL Goods Manual Cl. 8.4"
     mandatory: true
     field: "has_amc_commitment"
     operator: "EQUALS"
     expected_value: true
     failure_status: "WARN"
     description: "Bidder must include explicit 3-year AMC commitment."
   ```
3. If the field requires custom extraction logic, add an extractor in `pipeline/extraction/declarations.py`.
4. Run tests: `pytest tests/unit/test_rule_engine.py`.

### 2. How to Add a New Registry Mock Fixture
1. Open [`seed/mock_fixtures/`](file:///seed/mock_fixtures/) and locate the target registry (e.g. `gst_fixtures.json`).
2. Add an entry matching the simulated entity's identifier:
   ```json
   {
     "gstin": "33AABCT5555P1Z9",
     "legal_name": "New Test Vendor Pvt Ltd",
     "status": "Active",
     "taxpayer_type": "Regular",
     "constitution": "Private Limited Company",
     "registration_date": "2018-04-01"
   }
   ```
3. Restart or reseed: `python scripts/demo_setup.py`.

### 3. How to Adjust Risk Weightings
1. Open [`pipeline/risk/scorer.py`](file:///pipeline/risk/scorer.py).
2. Modify the weight dictionary:
   ```python
   DIMENSION_WEIGHTS = {
       "identity": 0.35,     # Increased emphasis on identity
       "financial": 0.25,
       "compliance": 0.25,
       "anomaly": 0.15,
   }
   ```
3. Run test verification: `pytest tests/unit/test_risk_engine.py`.

### 4. How to Update the YouTube Demo URL
1. Open [`frontend/src/components/DemoView.tsx`](file:///frontend/src/components/DemoView.tsx).
2. Set the `YOUTUBE_DEMO_URL` string on line 14:
   ```typescript
   const YOUTUBE_DEMO_URL = "https://www.youtube.com/embed/YOUR_VIDEO_ID";
   ```
3. Save the file. Vite hot-reloads the video player immediately.
