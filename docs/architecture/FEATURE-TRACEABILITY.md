# VigilBid (SIH26100) — Requirement & Feature Traceability Matrix

**Problem Statement:** SIH26100 — AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement  
**Beneficiary:** Chennai Petroleum Corporation Limited (CPCL) · IndianOil Group · Ministry of Petroleum & Natural Gas  
**Applicable Regulations:** General Financial Rules (GFR) 2017 · Central Vigilance Commission (CVC) Procurement Manual  

---

## 1. Traceability Overview

This document provides a line-by-line verification mapping between the competition problem requirements (SIH26100), the architectural capabilities implemented, the corresponding backend API endpoints, the user interface views, and the automated test validation suites.

---

## 2. Requirement-to-Implementation Matrix

| Req ID | SIH26100 Requirement | Implemented Feature | Backend Service / Pipeline Step | API Endpoint | Frontend Screen / UI Component | Test Suite & Validation | Status |
|---|---|---|---|---|---|---|---|
| **REQ-01** | Multi-document batch ingestion & archive safety | Safe ZIP decompression, Zip-bomb heuristics, magic-byte inspection, SHA-256 Content-Addressable Storage | `pipeline/steps/step01_ingest.py`<br>`backend/services/document_service.py` | `POST /api/v1/tenders/{tid}/bidders/{bid}/documents/upload` | `UploadModal.tsx`<br>`BidderCockpit.tsx` (S3/S4) | `tests/unit/test_ingestion_security.py`<br>`tests/integration/test_pipeline_e2e.py` | **VERIFIED** |
| **REQ-02** | Automated document typing & classification | TF-IDF token vectorizer + regex heuristic fallback classifying 13+ mandatory Indian tender document types | `pipeline/steps/step02_classify.py`<br>`pipeline/extractors/classifier.py` | `GET /api/v1/documents/{doc_id}` | `BidderCockpit.tsx` (Document Badge List) | `tests/unit/test_classifier.py` | **VERIFIED** |
| **REQ-03** | Text extraction with OCR fallback for scans | PyMuPDF text layer parsing with automated fallback to Tesseract 5.0 / deterministic OCR engine | `pipeline/steps/step03_ocr.py`<br>`pipeline/ocr/ocr_engine.py` | `GET /api/v1/pipeline/status/{bid}` | `BidderCockpit.tsx` (Processing Progress Stepper) | `tests/unit/test_ocr_engine.py` | **VERIFIED** |
| **REQ-04** | Structured identifier & financial extraction | Extraction of GSTIN, PAN, Udyam No., CA-certified Turnover, UDIN, OEM authorization dates | `pipeline/steps/step04_extract.py`<br>`pipeline/extractors/` | `GET /api/v1/bidders/{bid}/fields` | `BidderCockpit.tsx` (Extracted Key-Value Table) | `tests/unit/test_field_extraction.py` | **VERIFIED** |
| **REQ-05** | Format normalization & standardization | Indian fiscal amount parsing (Lakhs/Crores), date standardizer (DD/MM/YYYY), company suffix normalization | `pipeline/steps/step05_normalize.py`<br>`pipeline/normalizers/` | Internal pipeline normalization | `BidderCockpit.tsx` (Normalized Field Display) | `tests/unit/test_normalizer.py` | **VERIFIED** |
| **REQ-06** | Cross-document entity resolution | Sub-string PAN-in-GSTIN containment check, Jaro-Winkler company name similarity ($\ge 0.85$), address parity | `pipeline/steps/step06_entity_resolution.py`<br>`pipeline/entity_resolution/` | `GET /api/v1/bidders/{bid}/entities` | `BidderCockpit.tsx` (Entity Consistency Banner) | `tests/unit/test_entity_resolution.py` | **VERIFIED** |
| **REQ-07** | Government registry adapter verification | Simulated live verification against GSTN (active/cancelled), CBDT/PAN, MCA-21, Udyam MSME, and CVC Debarment lists | `pipeline/steps/step07_registry_verify.py`<br>`pipeline/registry/` | `GET /api/v1/bidders/{bid}/verifications` | `BidderCockpit.tsx` (Registry Status Pills) | `tests/unit/test_registry_adapters.py` | **VERIFIED** *(Mock Sandbox)* |
| **REQ-08** | Deterministic compliance rule engine | 34 CPCL Goods rules evaluated under GFR 2017; deterministic evaluation outputting PASS/WARN/REVIEW/FAIL | `pipeline/steps/step08_compliance_rules.py`<br>`pipeline/rules/rule_engine.py` | `GET /api/v1/tenders/{tid}/compliance-matrix`<br>`GET /api/v1/bidders/{bid}/findings` | `ComplianceMatrix.tsx` (S2)<br>`BidderCockpit.tsx` (S4) | `tests/unit/test_rule_engine.py` | **VERIFIED** |
| **REQ-09** | Forensic document anomaly detection | PDF metadata creation date discrepancy analysis, editing tool signatures (GIMP), prompt injection token trapping | `pipeline/steps/step09_anomaly_detection.py`<br>`pipeline/anomalies/anomaly_engine.py` | `GET /api/v1/bidders/{bid}/anomalies` | `BidderCockpit.tsx` (Anomaly Signals Banner) | `tests/unit/test_anomaly_engine.py` | **VERIFIED** |
| **REQ-10** | Explainable composite risk scoring | Multi-factor weighted risk engine (0–100 score) decomposed into Identity, Financial, Compliance, and Anomaly factors | `pipeline/steps/step10_risk_scoring.py`<br>`pipeline/risk/risk_engine.py` | `GET /api/v1/bidders/{bid}/risk` | `BidderCockpit.tsx` (Risk Gauge & Driver Breakdown)<br>`DashboardView.tsx` | `tests/unit/test_risk_engine.py` | **VERIFIED** |
| **REQ-11** | Evidence-first traceability & citations | Deep bounding-box coordinate tracking, document page references, and exact verbatim snippet citations | `backend/models/evidence.py`<br>`pipeline/steps/step04_extract.py` | `GET /api/v1/findings/{finding_id}/evidence` | `BidderCockpit.tsx` (Split-Screen Evidence Inspector) | `tests/unit/test_evidence_model.py` | **VERIFIED** |
| **REQ-12** | Human-in-the-loop officer adjudication | Officer action bar allowing Accept, Override (with mandatory justification), or Clarification Request | `backend/routers/officer.py`<br>`backend/services/officer_service.py` | `POST /api/v1/bidders/{bid}/findings/{fid}/review`<br>`POST /api/v1/bidders/{bid}/complete-evaluation` | `BidderCockpit.tsx` (Officer Action Dock) | `tests/unit/test_officer_workflow.py` | **VERIFIED** |
| **REQ-13** | Immutable cryptographic audit logging | SHA-256 hash-chained event ledger recording all user logins, pipeline triggers, reviews, and overrides | `backend/models/audit.py`<br>`backend/services/audit_service.py`<br>`pipeline/audit/audit_chain.py` | `GET /api/v1/audit/trail`<br>`GET /api/v1/audit/verify` | `AuditView.tsx` (S5, with cryptographic integrity check) | `tests/unit/test_audit_chain.py` | **VERIFIED** |
| **REQ-14** | CVC-compliant PDF dossier generation | Formal PDF compliance dossier compilation with tabular findings, evidence excerpts, and officer sign-offs | `pipeline/steps/step11_report_gen.py`<br>`pipeline/reports/pdf_generator.py` | `GET /api/v1/tenders/{tid}/reports/dossier.pdf`<br>`GET /api/v1/bidders/{bid}/reports/summary.pdf` | `ReportView.tsx` (S6) | `tests/unit/test_pdf_report.py` | **VERIFIED** |
| **REQ-15** | Cross-bidder collusion & network graph | Network graph detecting shared phone numbers, bank accounts, authorized signatories, or identical file hashes | `backend/routers/graph.py`<br>`backend/services/graph_service.py` | `GET /api/v1/tenders/{tid}/graph` | `GraphView.tsx` (S7, Interactive Network Topology) | `tests/unit/test_graph_service.py` | **VERIFIED** |
| **REQ-16** | Tender document Q&A copilot (RAG) | Local semantic retrieval over tender criteria, CPCL clauses, and bidder submissions with source attribution | `backend/routers/copilot.py`<br>`pipeline/rag/retriever.py` | `POST /api/v1/copilot/query` | `CopilotDrawer.tsx` | `tests/unit/test_copilot_service.py` | **VERIFIED** *(Local Air-Gapped)* |
| **REQ-17** | Interactive Guided Tour for Evaluators | Standalone, unauthenticated `/demo` page with pipeline simulation, live vendor scenarios, and video player | `frontend/src/components/DemoView.tsx` | Static UI client route (`#/demo` or `/demo`) | `DemoView.tsx` (`/demo`) | `tests/frontend/app.test.tsx` | **VERIFIED** |

---

## 3. Regulatory Alignment

### 3.1 General Financial Rules (GFR 2017)
- **Rule 144(xi):** Restrictions on procurement from countries sharing land borders with India. Implemented in `rules/cpcl_goods_rules.yaml` (Rule `CPCL-DOC-009`, Land Border Declaration verification).
- **Rule 153:** Preference to Micro and Small Enterprises (MSEs). Implemented in Rule `CPCL-MSE-001` (Udyam verification + turnover exemption).
- **Rule 153(iii):** Public Procurement (Preference to Make in India) Order 2017 (PPP-MII). Implemented in Rule `CPCL-MII-001` (Local content percentage calculation).

### 3.2 Central Vigilance Commission (CVC) Compliance Guidelines
- **Zero Autonomous Disqualification:** VigilBid strictly emits `"Recommended: Not Qualified — officer confirmation required"`. The algorithm does not possess statutory authority to disqualify bidders.
- **Mandatory Justification for Overrides:** When an evaluating officer dissents from a system-generated `FAIL` finding, the UI strictly enforces input of a reasoned justification (`override_reason`), which is committed to the immutable SHA-256 audit ledger.
- **Strict Legal Vocabulary Ban:** System UI and PDF output strictly eschews terms such as "fraud", "fake", "forged", or "tampered", replacing them with neutral vigilance terminology: `"Potential anomaly detected — human verification required"`.
