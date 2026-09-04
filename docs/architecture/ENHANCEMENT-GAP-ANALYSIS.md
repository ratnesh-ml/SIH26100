# Enhancement Gap Analysis — VigilBid (SIH26100)

> **Document Status:** Baseline Complete · Architectural Audit Approved  
> **Target Framework:** GFR 2017 & CVC Guidelines for Public Procurement  
> **Codebase Baseline:** 353 Backend Tests Passing (100%), 70 Frontend Checks Passing (100%), 20/20 Release Subsystems Certified.

---

## 1. Already Implemented

The following capabilities are 100% implemented, integrated, and verified in the repository:

| Capability / Feature | Implementation Location | API Endpoint | Models / Tables | Frontend Page / Component | Baseline Status |
|---|---|---|---|---|---|
| **Multi-Document Ingestion Gateway** | `pipeline/steps/step01_ingest.py` | `POST /api/v1/documents/upload` | `documents` | `frontend/src/components/UploadModal.tsx` | Verified (CAS storage, magic byte checks, 100:1 zip-bomb defense) |
| **Document Classification** | `pipeline/steps/step02_classify.py` | Pipeline Internal | `documents.doc_type` | `frontend/src/components/PipelineStepper.tsx` | Verified (13 Indian document types via TF-IDF + heuristics) |
| **Hybrid OCR & Text Extraction** | `pipeline/ocr/ocr_engine.py` | Pipeline Internal | `document_pages` | `frontend/src/components/BidderCockpit.tsx` | Verified (PyMuPDF fast path + Tesseract 5.0 fallback) |
| **Structured Field Extraction** | `pipeline/steps/step04_extract.py` | Pipeline Internal | `extracted_fields` | `frontend/src/components/BidderCockpit.tsx` | Verified (~40 fields: GSTIN, PAN, Udyam, Turnover, UDIN) |
| **Indian Format Normalization** | `pipeline/steps/step05_normalize.py`| Pipeline Internal | `extracted_fields.normalized_value` | N/A | Verified (Lakhs/Crores, DD/MM/YYYY dates, legal suffixes) |
| **Cross-Document Entity Resolution** | `pipeline/steps/step06_entity_resolution.py` | `GET /api/v1/bidders/{id}/entity-resolution` | `bidders`, `extracted_fields` | `frontend/src/components/BidderCockpit.tsx` | Verified (PAN-in-GSTIN match, Jaro-Winkler company similarity) |
| **Simulated Government Registries** | `pipeline/registry/` | `POST /api/v1/registry/verify/{type}` | `registry_cache` | `frontend/src/components/BidderCockpit.tsx` | Verified (GSTN, PAN, MCA-21, Udyam, CVC debarment) |
| **Deterministic Compliance Engine** | `pipeline/rules/rule_engine.py` | `GET /api/v1/compliance/tenders/{id}/matrix` | `criteria`, `compliance_findings` | `frontend/src/components/ComplianceMatrix.tsx` | Verified (34 CPCL Goods criteria under GFR 2017) |
| **Forensic Anomaly Detection** | `pipeline/steps/step09_anomalies.py`| `GET /api/v1/bidders/{id}/anomalies` | `anomalies` | `frontend/src/components/BidderCockpit.tsx` | Verified (PDF timestamp inversion, GIMP tags, prompt injections) |
| **Explainable Composite Risk Engine**| `pipeline/risk/risk_engine.py` | `GET /api/v1/bidders/{id}/risk` | `risk_scores` | `frontend/src/components/RiskBreakdownModal.tsx` | Verified (0–100 scale, Identity, Financial, Compliance, Anomaly) |
| **Coordinate-Level Evidence Inspector**| `pipeline/steps/step04_extract.py`| `GET /api/v1/evidence/{finding_id}` | `evidence_items` | `frontend/src/components/EvidenceViewer.tsx` | Verified (Yellow bounding box overlay on rendered PDF page) |
| **Officer Adjudication & Overrides** | `backend/routers/officer.py` | `POST /api/v1/bidders/{id}/adjudicate` | `officer_decisions` | `frontend/src/components/OfficerDecisionPanel.tsx` | Verified (ACCEPT, OVERRIDE, CLARIFY with mandatory justification) |
| **Cryptographic Audit Ledger** | `backend/services/audit_service.py`| `GET /api/v1/audit/trail`, `GET /api/v1/audit/verify` | `audit_events` | `frontend/src/components/AuditLedger.tsx` | Verified (SHA-256 hash chaining, runtime forward verification) |
| **CVC Compliance Dossier Export** | `pipeline/reports/dossier_generator.py`| `GET /api/v1/reports/tender/{id}/dossier` | N/A | `frontend/src/components/ReportModal.tsx` | Verified (ReportLab PDF compilation with cryptographic seal) |
| **Cross-Bidder Collusion Network** | `pipeline/steps/step06_entity_resolution.py`| `GET /api/v1/graph/tender/{id}` | N/A | `frontend/src/components/CollusionGraph.tsx` | Verified (Shared phone numbers, bank accounts, identical hashes) |
| **Interactive Standalone Demo Tour** | `frontend/src/components/DemoTour.tsx`| Client-side route `/#/demo` | Seed fixtures | `frontend/src/components/DemoTour.tsx` | Verified (Unauthenticated guided walkthrough for evaluators) |

---

## 2. Partially Implemented

The following components exist and function, but lack streamlined officer-facing workflows or turnkey CLI tooling:

1. **One-Click Demo Seeding & Reset Commands:**
   - *Current State:* `python scripts/demo_setup.py` exists and seeds 5 bidders, but there is no simple `make demo` or `make demo-reset` automation target in the root Makefile.
   - *Enhancement Requirement:* Unify demo initialization, validation, and zero-loss resetting into standardized CLI targets.

2. **Bidder Requirement-to-Evidence Matrix View:**
   - *Current State:* The platform has a multi-bidder `ComplianceMatrix` (`/compliance-matrix`) comparing 5 bidders across 8 criteria, and a finding-centric `EvidenceViewer` in the Cockpit.
   - *Enhancement Requirement:* Provide a single, unified, officer-friendly `Requirement → Result → Evidence` matrix table inside the bidder scrutiny flow where each tender requirement is mapped to its evaluated result, source document, page, and a direct `[VIEW EVIDENCE]` trigger.

3. **Demo Scenario Presentation Documentation:**
   - *Current State:* `docs/demo/DEMO-NARRATIVE.md` provides a 7-minute presentation script; `docs/demo/FINAL-DEMO.md` covers end-to-end steps.
   - *Enhancement Requirement:* Create a dedicated, concise, presenter-facing `docs/demo/demo-script.md` strictly targeted at a 60–120 second quick demo for hackathon judges.

---

## 3. Missing

1. **Automated Demo Lifecycle Regression Tests:**
   - Test verifying that `demo_setup` and `demo_reset` can be executed repeatedly in arbitrary sequence without foreign key collisions, duplicate key violations, or storage leakage.
2. **Dedicated Requirement Traceability Endpoint:**
   - An API endpoint (`GET /api/v1/bidders/{id}/requirement-traceability`) that returns the structured tree: `Requirement` $\rightarrow$ `Rule` $\rightarrow$ `Input Field` $\rightarrow$ `Document` $\rightarrow$ `Page` $\rightarrow$ `Evidence Bounding Box` $\rightarrow$ `Verification Status`.
3. **UI "Demo Mode" Header Trigger:**
   - A visible, non-intrusive action button in the main application header enabling an evaluator to reload synthetic demo data or launch the guided scenario in one click.

---

## 4. Broken

- **None.**  
  All 353 backend tests (`pytest tests/ -v`), 70 frontend tests (`npm test`), and the 20-subsystem release audit (`python scripts/release_audit.py`) pass with 0 failures and 0 errors.

---

## 5. Needs Verification

1. **Continuous Demo Reseeding Stability:** Verify that re-running the demo seeder resets the SQLite and PostgreSQL databases cleanly without leaving orphaned CAS files in `data/storage/`.
2. **Scanned PDF Highlight Coordinates:** Ensure that OCR fallback coordinates correctly map to the rendered canvas across different browser viewport zoom levels.

---

## 6. Recommended Enhancements (Classified)

| Proposed Enhancement | Category | Architectural Rationale |
|---|---|---|
| **One-Click Demo Setup (`make demo`)** | **EXTEND** | Wraps existing `scripts/demo_setup.py` into a standardized Makefile target with pre-flight environment validation. |
| **Safe Demo Reset (`make demo-reset`)** | **NEW** | Provides an explicit, non-destructive script resetting demo database tables and storage fixtures without affecting production schemas. |
| **Demo Lifecycle Regression Tests (`test_demo_lifecycle.py`)** | **NEW** | Validates repeated seeding, resetting, and scenario data integrity under pytest. |
| **60–120s Presenter Script (`docs/demo/demo-script.md`)** | **NEW** | Provides concise, high-impact click-by-click instructions for competition demonstrations. |
| **Requirement Traceability Model & API** | **EXTEND** | Aggregates existing `criteria`, `compliance_findings`, `extracted_fields`, and `evidence_items` into a single query contract. |
| **Officer Requirement-Result-Evidence Matrix UI** | **EXTEND** | Enhances the Bidder Cockpit with an interactive table mapping tender requirements to visual bounding boxes. |
| **Existing Rule Engine & Risk Scorer** | **KEEP** | Proven 100% reliable; 34 rules and 4-factor risk scoring remain untouched. |
| **Existing Cryptographic Audit Ledger** | **KEEP** | Core SHA-256 forward hash chaining remains unchanged and locked. |
