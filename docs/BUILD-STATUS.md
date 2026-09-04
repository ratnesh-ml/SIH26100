# VigilBid (SIH26100) — Build Status & Transition Baseline

**Document Version:** 2.31.0  
**Date:** September 2026  
**Status:** Phase 47 Complete — Comprehensive UI/UX Polish, Modular Design System Primitives & Frontend Ergonomics Fully Implemented & Verified (Bidder Cockpit, Compliance Matrix, Upload/Processing Stepper, Executive Dashboard, Cryptographic Audit Trail, CVC Dossier Reports, Activated PostCSS & Tailwind Build Pipeline), Full Frontend Test Suite (70/70 Checks Passing) & Backend Test Suite (353/353 Tests Passing, 100%)  
**Target:** SIH Grand Finale — Problem Statement SIH26100 (CPCL / Ministry of Petroleum & Natural Gas)

---

## 1. Project Understanding

VigilBid is an **AI-powered, buyer-side, human-in-the-loop decision-support platform** tailored for procurement officers at Chennai Petroleum Corporation Limited (CPCL, IndianOil Group) evaluating two-bid tenders on GeM and CPPP.

### Core Problem Solved
In public procurement under GFR 2017 and CVC guidelines, procurement officers manually download dozens of bidder packages (ZIP files filled with certificates, financial statements, and affidavits), manually inspect them, and cross-reference them across separate government portals (GSTN, MCA21, NSDL PAN, Udyam, Debarment lists). This process takes 6–10 person-hours per bidder, suffers from human error, and fails to catch cross-document inconsistencies (e.g., PAN embedded in GSTIN mismatching the PAN card) or cross-bidder collusion (e.g., shared PDF authors, directors, or phone numbers).

### System Purpose & Philosophy
- **Decision Support, Never Adjudication:** The system never autonomously disqualifies or labels any bidder as fraudulent. It provides traffic-light classifications (`PASS`, `WARN`, `REVIEW`, `FAIL`) per criterion, with a human-in-the-loop workflow.
- **Conservative Legal Vocabulary:** Bidders with critical failures receive the label: `"Recommended: Not Qualified — officer confirmation required"`. The platform never outputs words like "fraud", "forged", or "fake"; instead, it flags `"Potential anomaly detected — human verification required"`.
- **Hybrid AI + Deterministic Separation:** AI and OCR are utilized where documents are messy and unstructured (PDF text extraction, scan OCR, document typing, fuzzy name resolution, semantic retrieval). Deterministic code strictly governs anything with legal weight (checksums, identifier parity, threshold math, YAML rule execution, risk weighting, and SHA-256 hash-chain audit logging).
- **Tamper-Evident Accountability:** Every officer action, override, and decision is cryptographically hash-chained and exportable to a CVC/RTI-ready PDF compliance dossier.

---

## 2. Current Implementation Status

| Component | Status | Reality vs Specification |
|---|---|---|
| **Architecture & Specifications** | ✅ Completed (100%) | Complete in `docs/00` through `docs/06` (32 detailed sections). |
| **Architecture Lock & Contracts** | ✅ Completed (100%) | Locked in `docs/ARCHITECTURE-LOCK.md` & `docs/INTERFACE-CONTRACTS.md`. |
| **Repository Structure Documentation** | ✅ Completed (100%) | Detailed directory layout in `docs/REPOSITORY-STRUCTURE.md`. |
| **Database Architecture Documentation** | ✅ Completed (100%) | Detailed schema specification in `docs/DATABASE.md`. |
| **Authentication & RBAC Documentation** | ✅ Completed (100%) | Detailed security and role matrix in `docs/AUTH.md`. |
| **Ingestion Security Policy Documentation** | ✅ Completed (100%) | Detailed threat model, zip-bomb, and traversal defense in `docs/SECURITY.md`. |
| **PDF Processing Contract Documentation** | ✅ Completed (100%) | Complete extraction, forensics, and rendering contract in `docs/PDF-CONTRACT.md`. |
| **OCR Architecture & Specification Documentation**| ✅ Completed (100%) | Complete OCRProvider specification and Unlimited-OCR adapter guide in `docs/OCR.md`. |
| **Field Extraction Specification Documentation** | ✅ Completed (100%) | Complete field schema, validators, normalizers, and audit contract in `docs/EXTRACTION.md`. |
| **Field Normalization & Validation Documentation**| ✅ Completed (100%) | Complete normalization rules, validators, and anti-collision safeguards in `docs/NORMALIZATION.md`. |
| **Government Registry Abstraction Documentation**| ✅ Completed (100%) | Complete RegistryProvider interface, result shape, and simulation policy in `docs/REGISTRY.md`. |
| **Compliance Rules Engine Documentation**| ✅ Completed (100%) | Complete YAML rule schema, precedence hierarchy, and evaluation semantics in `docs/RULE-ENGINE.md`. |
| **Risk Scoring & Anomaly Forensics Documentation**| ✅ Completed (100%) | Complete driver point allocations, bands, and non-accusatory vocabulary in `docs/RISK-ENGINE.md`. |
| **Document Anomaly Signals Documentation**| ✅ Completed (100%) | Complete forensic signals, hidden text, and adversarial injection defense in `docs/ANOMALIES.md`. |
| **Cross-Bidder Link Graph Documentation**| ✅ Completed (100%) | Complete NetworkX deterministic link graph, CVC related-party heuristics, and REST APIs in `docs/GRAPH.md`. |
| **Evidence Model & Provenance Documentation**| ✅ Completed (100%) | Complete EvidenceItem, BoundingBox percentages, EvidenceTrace, and packaging in `docs/EVIDENCE.md`. |
| **Containerization & Compose** | ✅ Completed (100%) | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore`. |
| **Database Connectivity Engine** | ✅ Completed (100%) | `backend/core/database.py` with async SQLAlchemy 2.0 engine, async sessionmaker, and DB connection probe. |
| **PostgreSQL Schema & Models** | ✅ Completed (100%) | All 18 locked tables defined with UUIDs, BigIntegers, JSONB, foreign keys, and indexes. |
| **Alembic Migrations Framework** | ✅ Completed (100%) | `alembic.ini`, `alembic/env.py`, revision `0001_initial_schema.py` (18 tables including `bids`) tested against fresh DB. |
| **Authentication & RBAC System** | ✅ Completed (100%) | PBKDF2 password hashing, JWT HS256, login, me, logout, RoleChecker, 4 core roles. |
| **Development User Seeding** | ✅ Completed (100%) | `seed/seed_users.py` with PBKDF2 hashed accounts for officer, evaluator, vigilance, and admin. |
| **Tender Management & REST APIs** | ✅ Completed (100%) | `POST/GET/PATCH /api/v1/tenders`, database persistence, criteria cloning, pagination, input validation. |
| **Bidder & Bid Management** | ✅ Completed (100%) | `POST/GET/PATCH /api/v1/bidders`, `POST/GET /api/v1/tenders/{id}/bidders`, `POST/GET/PATCH /api/v1/bids`, Fernet credential encryption, masked profiles, bid status lifecycles. |
| **Document Ingestion & Storage Safety** | ✅ Completed (100%) | `POST /api/v1/bidders/{id}/documents`, `GET /documents/{id}`, magic byte verification (`%PDF-`), ZIP safety (ratio 100:1, max 200 files), path traversal defense, SHA-256 CAS storage, deduplication. |
| **PDF Processing & Rendering Layer** | ✅ Completed (100%) | `pipeline/pdf/` with PyMuPDF text-layer first extraction, bounding-box words, document metadata, active script forensics, on-disk cached rendering, CLI inspection, and DB persistence. |
| **OCR Abstraction & Unlimited-OCR Adapter** | ✅ Completed (100%) | Stable `OCRProvider` interface, `UnlimitedOCRAdapter` (with retries, CPU/GPU awareness, failure handling), and architecture-approved `FallbackOCRAdapter` for local dev/CPU execution. |
| **Processing Jobs & Worker Pipeline** | ✅ Completed (100%) | `backend/services/job_service.py` and `backend/workers/job_worker.py`: full 11-step pipeline connecting Upload → Job Creation (QUEUED) → Worker Claim (PROCESSING) → Classification → OCR → Field Extraction → Normalization → Entity Resolution → Government Registry Verification → Compliance Rules → Anomaly Scanning → Risk Scoring → Evidence Packaging → DB Persistence (findings, anomalies, risk_drivers, verification_events) → Status (DONE/FAILED). |
| **Document Classification Engine** | ✅ Completed (100%) | `pipeline/document_processing/classifier.py`: deterministic statutory anchors (Form GST REG-06, PAN, Udyam, UDIN turnover, ITR-V, OEM Annexure-I, Integrity Pact, MII, Land Border, Startup DPIIT, Debarment), keyword density, filename heuristics, multi-page scanning, and fallback to UNKNOWN with evidentiary audit trail. |
| **Structured Field Extraction Engine** | ✅ Completed (100%) | `pipeline/extraction/`: deterministic extractors for GST REG-06 (GSTIN, legal/trade names, constitution, address, date, status, PAN), PAN card, Udyam MSME, and CA Turnover certificates (multi-year turnover, UDIN, CA name), with Mod-36 checksum, ISO-date normalization, and INR turnover parsing. |
| **Field Normalization & Anti-Collision Engine** | ✅ Completed (100%) | `pipeline/entity_resolution/`: validators for PAN, GSTIN, Udyam, dates, turnover INR, company names, addresses; whitespace, punctuation, company suffixes, and anti-collision logic preventing false merges of unrelated companies. |
| **Entity Resolution & Parity Scoring Engine** | ✅ Completed (100%) | `pipeline/entity_resolution/matcher.py`: multi-metric resolution (Jaro-Winkler, Token Set Ratio, Phonetics, PIN parity), strong identifier primacy (PAN, GSTIN, Udyam), legal form consistency check, and explanatory narrative generation. |
| **Government Registry Abstraction & Mock Provider**| ✅ Completed (100%) | `pipeline/registry_adapters/`: `RegistryProvider` interface, `RegistryResult` standard shape (`found`, `status`, `data`, `source`, `fetched_at`, `latency_ms`), fixture-backed simulation (`gstin.json`, `pan.json`, `udyam.json`, `cin.json`, `debarment.json`), 300-800ms artificial latency for demo fan-out, and transparent `"Source: Simulated registry (demo)"` disclosure across UI/API. |
| **Cross-Document Verification Engine** | ✅ Completed (100%) | `pipeline/compliance/cross_verifier.py`: comprehensive verification across PAN ↔ GST, GST ↔ Udyam, Company ↔ GST/Udyam, Identity ↔ Registry, and Registration ↔ Document Dates. Outputs check ID, expected relationship, actual values, confidence, status (`PASS`, `FAIL`, `WARN`, `REVIEW`), and conservative non-fraud narratives. |
| **Tender Requirement Extraction Engine** | ✅ Completed (100%) | `pipeline/extraction/tender.py`: deterministic rule templates extracting turnover thresholds, net worth, mandatory registrations, OEM Annexure-I, Make in India % requirements, Land Border Rule 144(xi), EMD guarantees, MSE Udyam exemptions, and validity constraints from tender NITs and JSON templates. |
| **Compliance Rules Evaluation Engine** | ✅ Completed (100%) | `pipeline/compliance/engine.py`: deterministic YAML rule evaluation (`rules/cpcl_goods_v1.yaml`), versioning (`1.0`), rule conditions (`applies_when`), strict precedence hierarchy (`FAIL > REVIEW > WARN > PASS`), `RuleFindingResult`, and `BidderComplianceSummary`. |
| **Risk Scoring & Anomaly Forensics Engine** | ✅ Completed (100%) | `pipeline/risk/scorer.py` and `pipeline/risk/anomaly.py`: transparent 0-100 risk composite, risk bands (`LOW`, `MEDIUM`, `HIGH`), ranked risk drivers, and forensic scanners (PDF producer, timestamp inversion, incremental updates, microscopic text, white-on-white text, prompt injection, cross-bidder collusion links). |
| **Cross-Bidder Link Graph Engine & APIs** | ✅ Completed (100%) | `pipeline/risk/graph.py` and REST APIs (`GET /api/v1/tenders/{id}/graph`, `POST /api/v1/risk/graph`): deterministic NetworkX graph construction mapping shared directors, phone numbers, emails, addresses, bank accounts, PDF authors, metadata, and near-duplicate text with CVC-aligned related-party citations. |
| **Evidence Modeling & Provenance Subsystem** | ✅ Completed (100%) | `pipeline/evidence/highlighter.py`: stable `EvidenceItem` contract (document, page, field, quote, bounding box, source, method, confidence), responsive CSS percentages, multi-document split traces (`EvidenceTrace`), and visual highlight styling. |
| **Connected End-to-End Processing Pipeline** | ✅ Completed (100%) | `pipeline/runner.py`: 14 explicit named steps (`upload_and_registration`, `page_extraction`, `text_extraction`, `ocr_fallback`, `classification`, `field_extraction`, `normalization`, `entity_resolution`, `government_verification`, `tender_requirement_checks`, `compliance_rules`, `anomalies`, `risk_scoring`, `findings_and_evidence`), automatic retries, fail-safe degradation, backward-compatible aliases (`step_01_ingest` through `step_11_explain`), tested end-to-end with demo bidder package. |
| **Full Pipeline Backend Integration** | ✅ Completed (100%) | `job_service.process_job_full_pipeline()`: connects PipelineRunner to DB persistence. After OCR/extraction (steps 1-4), runs normalization, entity resolution, government registry verification, compliance rules, anomaly scanning, risk scoring, and evidence packaging (steps 5-11). Persists Finding, AnomalySignal, RiskDriver, VerificationEvent records. Updates Bidder canonical_name, entity_confidence, risk_score, risk_band, overall_status. Worker calls full pipeline automatically. |
| **Job Status & Pipeline REST APIs** | ✅ Completed (100%) | `GET /api/v1/jobs/{id}`, `GET /api/v1/bidders/{id}/jobs`, `POST /api/v1/jobs/{id}/process` (full 11-step pipeline), `POST /api/v1/jobs/{id}/process-ocr` (OCR-only fallback) with 11-step progress tracking. |
| **Cryptographic Audit Trail & Hash-Chaining** | ✅ Completed (100%) | `pipeline/audit/hasher.py` and `backend/services/audit_service.py`: Forward SHA-256 hash-chained immutable audit log (`audit_log` table) recording actor, timestamp, action, entity, previous state, new state, reason, and evidence reference. Automated event logging across tender creation/update, bidder registration/updates, document uploads, pipeline completions, and officer decisions. Cryptographic continuity verification (`GET /api/v1/audit/verify`, `POST /api/v1/audit/verify`) flagging any tampered payload or broken pointer. |
| **Audit Trail REST APIs** | ✅ Completed (100%) | `GET /api/v1/tenders/{id}/audit`, `GET /api/v1/audit/trail`, `GET /api/v1/audit/verify`, `POST /api/v1/audit/verify` with role-based access control and pagination. |
| **Human-in-the-Loop Review & Decisions** | ✅ Completed (100%) | `backend/services/decision_service.py` & REST APIs (`/api/v1/bids/{id}/decision`, `/api/v1/findings/{id}/decision`, `/api/v1/bidders/{id}/complete-review`, `/api/v1/bids/{id}/complete-review`, `/api/v1/bidders/{id}/findings?pending=true`, `/decisions` history): formal decision states (Accept, Reject, Request clarification, Override), mandatory justification requirement on Override, officer decisions strictly separated from machine recommendations, pending findings filtering, decision history tracking, and complete-review validation blocking review finalization if unresolved mandatory findings remain. |
| **Procurement-Specific RAG & Copilot** | ✅ Completed (100%) | `pipeline/rag/`: Multi-domain segregated knowledge base (`tender`, `bidder_document`, `regulatory`, `evidence`), section and page-aware chunker (`DocumentChunker`), BM25 ranked retrieval (`ProcurementRetriever`), grounded answer synthesis with mandatory structured citations and page references (`ProcurementCopilot`), REST APIs (`POST /api/v1/copilot/query`, `GET /api/v1/copilot/knowledge-domains`), and benchmark test suite (`eval_examples.py`) passing with 100% accuracy across 9 evaluation scenarios. |
| **Procurement Copilot & Guardrails** | ✅ Completed (100%) | `pipeline/rag/copilot.py`, `guardrails.py`, `llm_adapter.py`: Production-grade procurement copilot answering officer inquiries (risk analysis, requirement failures, turnover compliance, evidence proof) with strict facts vs explanations separation, statutory page citations, prompt-injection defense (`PromptInjectionGuard`), unsupported rule rejection (never invents a rule), uncertainty reporting (never hides uncertainty), and deterministic compliance guards preventing LLM overrides. |
| **Backend API Audit & Reports/Dossier Export** | ✅ Completed (100%) | 100% endpoint audit against CPCL specification covering all 16 categories: Tenders, Bidders, Bids, Documents (`GET /documents/{id}/file`, `GET /documents/{id}/pages/{n}.png`), Status, OCR, Findings, Compliance, Risk, Evidence, Registry, Graph, Decisions, Audit Trail, Copilot, and Reports (`GET /bidders/{id}/report.pdf`, `GET /tenders/{id}/report.pdf`). Complete reference published in `docs/API.md`. |
| **Live Health Probe Endpoint** | ✅ Completed (100%) | `/health` actively probes database status, dialect, and latency. |
| **Background Worker Process** | ✅ Completed (100%) | `worker.py` and `backend/workers/job_worker.py` with DB readiness check, queue poll cycle, and graceful signal shutdown. |
| **Frontend Foundation (React + TS + Vite)** | ✅ Completed (100%) | Production React 18 + TypeScript + Vite frontend connected to backend contracts: Login view with preset demo credentials, sticky Navbar with live DB health indicator, paginated Tender List with status filter, Tender Creation modal with PQC parameters, Bidder List with risk score indicators and qualification badges, and Bidder Detail Cockpit with statutory tax IDs, forensic risk drivers, deterministic findings, evidence citations, and CVC dossier PDF download. Builds in 2.70s. |
| **Document Upload & Pipeline Stepper (S4/S5)** | ✅ Completed (100%) | Screen S4 (UploadModal) & Screen S5 (PipelineStepperView) wired to backend contracts: Drag-and-drop ZIP/PDF package upload with SHA-256 deduplication and validation, real-time 11-step forensic pipeline stepper (Classify, OCR, Extract, Normalize, Resolve, Verify, Rules, Anomalies, Risk, Dossier) with per-step execution status and durations, live 2s auto-polling, error state highlighting with retry action (`POST /jobs/{id}/process`), and ingested document filings table with inline document re-tagging dropdown (`POST /bidders/{id}/documents/{doc_id}/retag`). Builds in 3.01s. |
| **Bidder Compliance Matrix (Screen S3)** | ✅ Completed (100%) | Screen S3 (ComplianceMatrixView) connected to actual backend API (`GET /tenders/{id}/matrix`): Bidder rows × criteria columns comparative evaluation heatmap, interactive PASS / WARN / REVIEW / FAIL status chips with deep linking to Bidder Cockpit, KPI status counters, composite risk score and band indicators, multi-dimensional filtering (overall status, risk level, bidder name text search), sorting by risk/name/status, sticky left column for wide displays, and CVC / GFR 2017 compliant legend. Builds in 3.24s. |
| **Primary Bidder Cockpit (Screen S6)** | ✅ Completed (100%) | Screen S6 (BidderDetailView) implementing the "one screen that wins": Three-column layout (Left Criteria Rail with category grouping and status filters; Center Evidence Viewer with raster page PNG, zoom/page controls, and bounding box highlight rectangles; Right Finding Card + Officer Decision Panel with Accept/Clarify/Override/Reject actions, justification validation, and audit decision history), declared vs canonical names, entity confidence pill, overall status badge, composite risk gauge, complete review action, and collapsible bottom drawer for forensic risk drivers and structural document anomalies. Builds in 2.75s. |
| **Risk, Anomalies & Cross-Bidder Graph Views** | ✅ Completed (100%) | `RiskAnomalyView.tsx` (Score 0-100 gauge, risk bands, risk drivers table with score contributions, entity resolution confidence, document anomalies table with severity filters, forensic code badges, and raw technical evidence metadata panel) and `CrossBidderGraphView.tsx` (Screen S7: Interactive SVG entity relationship canvas with bidder nodes and attribute nodes, CVC related-party collusion warning banners, KPI summary cards, inspector sidebar with properties and evidence JSON, collusion pairs table, edges table, and nodes table). Builds in 4.70s. |
| **Automated Tests & Startup Verification** | ✅ Completed (100%) | 340 pytest unit, auth, tender, bidder, ingest, PDF, OCR, job pipeline, classifier, extraction, normalization, validation, entity resolution, registry, cross-document verification, tender extraction, compliance rules, risk scoring, document anomaly, cross-bidder graph, evidence model, connected pipeline runner, full pipeline integration, cryptographic audit hash-chain, human-in-the-loop review, procurement RAG, procurement copilot, page image streaming, risk profile API, anomalies API, and cross-bidder graph API tests passing. |
| **Project Automation Tooling** | ✅ Completed (100%) | Single-command deployment (`docker compose up --build`), `Makefile`, and `scripts/dev.ps1`. |
| **Synthetic Demo Dataset (`seed/`)** | ✅ Completed (100%) | Complete 4+1 demo bidder packages (clean MSE, minor gap, hard PAN-GSTIN mismatch, manipulated metadata & prompt injection, debarred control) generated in `seed/demo_packages/` with `ground_truth.json` and active registry fixtures in `seed/mock_fixtures/`. |
| **End-to-End Evaluation Pipeline** | ✅ Completed (100%) | 14-step deterministic pipeline evaluated against all 5 demo bidders with simulated officer decisions, CVC PDF dossier exports, and 11-step cryptographic SHA-256 hash chains. Empirical results recorded in `docs/E2E-DEMO-RESULTS.md`. |
| **Reproducible Evaluation Harness** | ✅ Completed (100%) | `scripts/evaluate.py` benchmarks document classification (100%), field extraction (100%), entity resolution (100%), rule correctness (100%), risk band alignment (100%), and anomaly confusion matrix (100% precision, 100% recall, 100% F1). Results documented in `docs/EVALUATION.md`. |
| **Comprehensive Security Hardening** | ✅ Completed (100%) | Full security review across 17 vectors documented in `docs/SECURITY-AUDIT.md`. Remediated high-priority vectors: sliding-window rate limiting on auth, PBKDF2 DoS prevention, OWASP security headers (nosniff, DENY, CSP), strict CORS isolation, storage path traversal containment, Content-Disposition sanitization, and production secret key validation. Verified with 12 automated attack simulation tests in `tests/test_security_audit.py` (353 total passed). |
| **Pipeline Performance Profiling & Optimization** | ✅ Completed (100%) | `scripts/profile_pipeline.py` & `scripts/precompute_demo.py`: Comprehensive empirical latency profiling across upload, parsing, OCR, extraction, verification, rules, risk, API response times, and frontend loading. Optimized bottlenecks: two-tier page caching (13,996x faster), in-memory OCR deduplication (121x faster), parallel page OCR (`ThreadPoolExecutor`), N+1 DB query batching, and high-traffic indexing (`jobs`, `audit_log`, `findings`, `bidders`). Documented in `docs/PERFORMANCE.md`. |
| **DevOps & Reproducible Deployment** | ✅ Completed (100%) | Multi-service `docker-compose.yml` with health-gated startup ordering (`db` $\rightarrow$ `backend` $\rightarrow$ `worker` + `frontend`), comprehensive `.env.example`, automated diagnostic health check CLI (`scripts/health_check.py`), automated seeder & cache pre-warmer (`scripts/seed_demo.py`), snapshot backup/restore engine (`scripts/backup_restore.py`, `seed/demo_backup/demo_snapshot.json`) with cryptographic SHA-256 audit verification, and complete 10-section deployment runbook (`docs/DEPLOYMENT.md`). |

**Current Repo Baseline:** The platform features an end-to-end operational, production-hardened public procurement vigilance engine with full frontend views (Dashboard, Tenders, Matrix, Upload Stepper, Cockpit, Risk & Anomalies, Cross-Bidder Graph, and Cryptographic Audit Trail), connected backend REST APIs, live PostgreSQL database models with Alembic migrations, an automated evaluation harness (`scripts/evaluate.py`), an enterprise defense layer (`docs/SECURITY-AUDIT.md`, `tests/test_security_audit.py`), a profiled and optimized execution pipeline (`docs/PERFORMANCE.md`), and a fully reproducible DevOps deployment system (`docs/DEPLOYMENT.md`, `scripts/health_check.py`, `scripts/seed_demo.py`, `scripts/backup_restore.py`). The full pipeline evaluates all 5 demo bidders in ~108 ms (10.82 ms/bidder), passes 353 automated tests, serves cached document pages in 0.0044 ms, maintains a lightweight 79.05 KB gzipped frontend bundle, enforces OWASP security response headers and sliding-window rate limiting, and generates tamper-evident CVC compliance dossiers with cryptographically verified SHA-256 forward hash chains.

---

## 3. Current Architecture

### 3.1 Layered Architecture Overview
```
┌────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND CLIENT (SPA)                           │
│   Vite + React 18 + TypeScript + Tailwind CSS + shadcn/ui              │
│   - S1: Login (RBAC)                                                   │
│   - S2: Tenders (List & Create from CPCL Goods Template)               │
│   - S3: Tender Detail — Compliance Matrix (Heatmap)                    │
│   - S4: Bidder Upload (Drag-drop ZIP/PDFs)                             │
│   - S5: Processing Status (11-step visual stepper)                     │
│   - S6: Bidder Cockpit (Viewer + Bbox Overlays + Card + Decision Panel)│
│   - S7: Cross-Bidder Link Graph (NetworkX / react-force-graph)         │
│   - S8: Audit Trail & Reports (Hash-chain verification & PDF Dossier)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS / REST (Bearer JWT)
┌───────────────────────────────────▼────────────────────────────────────┐
│                       FASTAPI MONOLITH (Backend)                       │
│   /api/v1 - Auth, Tenders, Bidders, Documents, Jobs, Findings,         │
│             Decisions, Audit, Reports, Copilot, Graph, Registry        │
│   Enqueues jobs into PostgreSQL `jobs` table                           │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
┌──────────────────▼───────────────────┐  ┌──────────▼───────────────────┐
│        POSTGRESQL 16 DATABASE        │  │     LOCAL FILE STORAGE       │
│  - 17 Relational Tables              │  │  - Content-addressable       │
│  - JSONB Extracted Fields & Evidence │  │    `storage/{t}/{b}/{sha}.pdf│
│  - Append-only Hash-chained Audit Log│  │  - Cached page PNG renders   │
│  - Fernet encrypted PAN/GSTIN        │  └──────────────────────────────┘
└──────────────────▲───────────────────┘
                   │ `SELECT ... FOR UPDATE SKIP LOCKED`
┌──────────────────┴─────────────────────────────────────────────────────┐
│                 WORKER PROCESS (`python -m worker`)                    │
│   11-Step Pipeline Orchestration:                                      │
│   1. Ingestion: ZIP safe-unpack, magic byte sniff, SHA-256             │
│   2. Classification: TF-IDF + LogisticRegression + filename keywords   │
│   3. Textification: PyMuPDF text-layer -> PaddleOCR/Tesseract fallback │
│   4. Extraction: Regex + anchor heuristics for 11 document types       │
│   5. Normalisation: Names, legal forms, dates, amounts, addresses      │
│   6. Entity Resolution: Token set ratio + Jaro-Winkler + PAN parity   │
│   7. Verification: Format validation + MockProvider + Debarment CSV    │
│   8. Compliance Rules: 34 YAML rules -> PASS/WARN/REVIEW/FAIL          │
│   9. Anomaly Forensics: PDF metadata, xref counts, injection scans     │
│  10. Risk Scoring: Transparent weighted sum (0-100) + driver breakdown │
│  11. Explanations: Template generation with cited GFR/CVC/BEC clauses   │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Completed Items

1. **Comprehensive Research Dump (`research/sih26100-research-dump.txt`):** 25 papers, 15 government reports, 22 repos, 12 competitors.
2. **Rigorous Claim & Research Audit (`docs/00-research-audit.md`):** Claim-by-claim verification, classification into 7 categories, hallucination prevention.
3. **Problem Decomposition & Requirements (`docs/01-understanding-requirements-architecture.md`):** Functional requirements FR-01 through FR-26, non-functional targets, user personas.
4. **AI Architecture & Rule Definitions (`docs/02-ai-docai-rag-er-compliance-risk.md`):** AI vs Rules matrix, 13 document types, 34 compliance rules, ER scoring equation, risk weightings, prompt injection defense.
5. **Full System Specification (`docs/03-frontend-backend-db-api.md`):** 8 MVP screen specs, 17-table relational schema, 24 REST API endpoints.
6. **Dataset & Operational Design (`docs/04-dataset-mockapi-security-devops-mvpcut-team.md`):** Synthetic 4+1 bidder dataset story, mock registry interface, security hardening, MVP cut-line, 3-person role distribution.
7. **Execution Timeline & Checklists (`docs/05-dependencies-timeline-checklists-skills-git.md`):** Hour-by-hour 36h sprint schedule, individual person checklists, skill-gap mitigation, Git workflow.
8. **Demo Script & Winning Strategy (`docs/06-demo-judges-claims-stack-spec-strategy.md`):** 6.5-minute timed demo script, S6 Bidder Cockpit layout, 32 judge defense questions, claim defense card.
9. **Interactive Documentation Web Viewer (`index.html`, `css/style.css`, `js/main.js`):** Responsive client-side markdown viewer rendering all blueprint documents.

---

## 5. Pending Items (The Implementation Backlog)

### Phase 1: Foundation (Hours 0–6)
- [ ] Freeze OpenAPI spec and schemas (`openapi.json` / stubs).
- [ ] Scaffold monorepo structure: `backend/`, `frontend/`, `seed/`, `infra/`.
- [ ] Initialize Docker Compose (`postgres:16`, `backend`, `worker`, `frontend`).
- [ ] Implement SQLAlchemy 2 models and run initial Alembic migration.
- [ ] Implement JWT authentication (bcrypt + python-jose) and RBAC dependencies.
- [ ] Build upload endpoint with zip-bomb and path-traversal hardening.
- [ ] Scaffold Vite + React 18 + TypeScript + Tailwind + shadcn/ui frontend with MSW mock server.
- [ ] Write synthetic document generator (`seed/generate_demo_docs.py`) and produce `seed/ground_truth.json`.

### Phase 2: Core Engine & UI (Hours 6–18)
- [ ] Implement textification module: PyMuPDF text-layer extraction + PaddleOCR / Tesseract fallback.
- [ ] Implement document classifier: filename heuristics + TF-IDF Logistic Regression.
- [ ] Implement field extractors for 11 doc types with bounding box capture.
- [ ] Implement normaliser and identifier format/check-digit validators (mod-36 GSTIN, PAN, Udyam).
- [ ] Implement entity resolution scorer (rapidfuzz, Jaro-Winkler, PAN embedded in GSTIN).
- [ ] Implement mock `RegistryProvider` (fixtures for GSTN, PAN, Udyam, MCA) and CPPP debarment CSV loader.
- [ ] Implement 34-rule YAML compliance engine.
- [ ] Implement PDF anomaly detector (metadata deltas, xref updates, Producer inspection, injection scan).
- [ ] Implement risk engine (weighted aggregation 0–100).
- [ ] Build frontend screens: S1 Login, S2 Tenders, S3 Compliance Matrix, S4 Upload, S5 Status Stepper, S6 Bidder Cockpit (layout + overlay viewer).

### Phase 3: Integration & Dossier (Hours 18–24)
- [ ] Connect FastAPI runner to all P2 pipeline steps.
- [ ] Switch frontend from MSW mocks to real backend API.
- [ ] Implement officer decision endpoint (Accept / Override / Clarify) and audit logging.
- [ ] Implement SHA-256 hash-chained audit log and `/audit/verify` recomputation.
- [ ] Implement PDF compliance dossier generation via WeasyPrint.
- [ ] Ingest and verify all 4 demo bidders end-to-end.

### Phase 4: Hardening, P1 Enhancements & Rehearsal (Hours 24–36)
- [ ] Build S7 Cross-bidder link graph (`react-force-graph-2d`).
- [ ] Build Copilot Q&A over regulatory KB (retrieval-first).
- [ ] Precompute demo database dump (`seed/demo.sql`) for 1-minute restore.
- [ ] Record narrated backup screen recording (MP4).
- [ ] Complete 3 timed demo rehearsals (≤6.5 min).

---

## 6. Known Risks & Mitigations

1. **OCR Latency on CPU Laptops:**
   - *Risk:* Running OCR on 30-page scanned documents can cause the pipeline to exceed demo time limits.
   - *Mitigation:* Text-layer extraction is prioritized (<1 s/doc). Scans are restricted to specific demo cases (e.g., Bidder B's PAN card). Precomputed database states (`demo.sql`) eliminate live processing dependency during the pitch.
2. **WeasyPrint System Dependencies:**
   - *Risk:* WeasyPrint requires native Cairo, Pango, and GObject libraries, which can fail to build on non-Linux host machines.
   - *Mitigation:* Run WeasyPrint inside the Linux Docker container; provide ReportLab as a pure-Python fallback.
3. **Bounding Box Alignment Drift:**
   - *Risk:* Discrepancies between PyMuPDF point coordinates (72 dpi) and responsive HTML image scaling can misalign evidence highlights.
   - *Mitigation:* Backend returns explicit page dimensions (`page_width`, `page_height`); frontend computes percentage-based bounding box CSS (`left%`, `top%`, `width%`, `height%`).
4. **Legal / Regulatory Sensitivities:**
   - *Risk:* Accusing a bidder of "fraud" or "forgery" without judicial process creates severe legal pushback from PSU judges.
   - *Mitigation:* Absolute vocabulary ban on "fraud/fake/forged/tampered". Status is always "Recommended: Not Qualified — officer confirmation required".

---

## 7. Unresolved Decisions

1. **Primary vs Fallback OCR on Local Host:**
   - Confirm whether local host developer environment supports PaddleOCR PP-OCRv4 seamlessly or if Docker / Tesseract 5 should be prioritized for local dev.
2. **Frontend Framework Confirmation:**
   - Vite + React 18 SPA is the recommended lock; confirmation that P3 will not pivot to Next.js.
3. **Exact ICAI UDIN Checksum Spec:**
   - Verify if ICAI enforces a specific check-digit algorithm or strictly an 18-character alphanumeric string.
4. **Primary Primary-Source Document Confirmation:**
   - Download the official CAG Report No. 18 of 2020 PDF and confirm the exact table for PAN unverified percentages prior to the presentation.

---

## 8. Next Recommended Step

**Phase 44 Complete (Reproducible DevOps Deployment & Operational Tooling):**
1. **Multi-Service Docker Compose Topology (`docker-compose.yml` & `frontend/Dockerfile`):** Configured 4-service orchestrated stack (`db` $\rightarrow$ `backend` $\rightarrow$ `worker` + `frontend`) with strict health-check gating. Workers and frontend wait for the backend's `/health` endpoint to return 200 OK before initializing, eliminating cold-start connection refusals and race conditions.
2. **Production-Hardened Environment Configuration (`.env.example`):** Documented all 8 operational subsystem variable blocks (Server, Security Keys, PostgreSQL, CAS Storage, OCR & Concurrency, Procurement LLM/Copilot, Government Registries, and Frontend SPA).
3. **Automated Diagnostic Health CLI (`scripts/health_check.py`):** 7-stage preflight tool verifying Python runtime, dependencies, cryptographic keys, storage & CAS directory permissions, DB connectivity, compliance rules, demo seed files, frontend build artifacts, and live HTTP API readiness.
4. **Automated Demo Seeder & Cache Pre-warmer (`scripts/seed_demo.py`):** Single-command script (`python scripts/seed_demo.py --reset`) that provisions database schemas, 4 RBAC user accounts, the CPCL Goods tender, all 5 synthetic demo bidders, ingests statutory PDFs with SHA-256 CAS deduplication, simulates officer decisions, computes unbroken audit hash chains, and pre-renders high-resolution document pages into the LRU disk cache.
5. **Deterministic Demo Backup & Restore Engine (`scripts/backup_restore.py` & `seed/demo_backup/`):** Standalone JSON snapshot backup/restore utility allowing zero-downtime, offline restoration in < 5 seconds with automatic cryptographic SHA-256 audit chain verification (`verify_chain_full`).
6. **Comprehensive 10-Section Deployment Runbook (`docs/DEPLOYMENT.md`):** Complete operations guide covering hardware/software prerequisites, Docker Compose deployment, bare-metal deployment, health diagnostics, demo seeding, backup/restore procedures, production hardening checklist, and SIH pitch emergency contingency table.
7. **Automated Verification:** All 353 unit, integration, and security audit tests passing (100% pass, 0 failures).

**Phase 47 Complete (Comprehensive UI/UX Polish, Modular Design System Primitives & Frontend Ergonomics):**
1. **Tailwind & PostCSS Build Pipeline Integration (`frontend/tailwind.config.js` & `frontend/postcss.config.js`):** Resolved missing PostCSS build configuration, expanding compiled CSS bundle from 830 bytes to a rich 38.16 kB production stylesheet with modern dark-mode palette, accessible focus rings, responsive breakpoints, and custom font stacks.
2. **Modular Design System Primitives Layer (`frontend/src/components/ui/`):** Established 8 decoupled UI primitives (`StatusChip`, `Card`, `Button`, `Modal`, `EmptyState`, `LoadingState`, `ErrorState`, `Tabs`, `index.ts`) guaranteeing that presentation styling can be swapped or overhauled in the future without disrupting business logic, data models, or API client contracts.
3. **Priority 1 — Bidder Cockpit (`BidderDetailView.tsx`):**
   - Implemented three-column ergonomics: categorized criteria rail with filter tabs, evidence viewer canvas with percentage zoom (+/- / 0 keyboard shortcuts) and labeled bounding box highlight overlays, and officer adjudication panel with CVC mandatory justification validation on overrides.
   - Integrated direct statutory CVC compliance dossier PDF download link (`/api/v1/bidders/${bidderId}/report.pdf`).
   - Integrated collapsible bottom drawer for forensic risk driver points and structural document anomalies.
4. **Priority 2 — Comparative Compliance Matrix (`ComplianceMatrixView.tsx`):**
   - Engineered 6 KPI status cards (Total Bidders, PASS, WARN, REVIEW, FAIL, PENDING) with matching semantic color accents.
   - Added sticky Bidder Legal Identity column with responsive horizontal scroll region, accessible `aria-sort` table headers, cell tooltips, and tender PDF report download link.
5. **Priority 3 — Upload & Processing Flow (`UploadModal.tsx`, `PipelineStepperView.tsx`, `TenderCreateModal.tsx`):**
   - Wrapped ingestion in accessible `Modal` primitive with `Escape` key dismissal and drag-and-drop dropzone with file size formatting and CAS deduplication security badge.
   - Upgraded 11-step forensic state machine stepper with step duration telemetry (`meta.duration_ms`), status chips, and document classification retagging dropdown.
   - Refined `TenderCreateModal` with explicit form field associations and statutory GFR 2017 checkboxes (MSE preference, OEM auth, MII class).
6. **Priority 4 — Executive Dashboard (`DashboardView.tsx`):**
   - Built 5 KPI metric cards with hover feedback, Vendor Compliance Distribution bar with GFR 2017 compliant labels, Forensic Risk Distribution, and live SHA-256 Cryptographic Audit Chain health widget.
7. **Priority 5 & 6 — Audit Screen & Statutory Report Export (`AuditTrailView.tsx`):**
   - Implemented real-time forward SHA-256 hash continuity verification banner, one-click hash copying with visual checkmark feedback, filter toolbar by action and role, and expandable JSON payload inspector.
8. **Automated Verification:** Full test suites passing with 100% success rate:
   - Frontend unit & architecture tests: 27 Vitest tests across 6 test suites + 43 automated UI/UX checks passed (70/70 passing, 0 failures).
   - Frontend production bundle: `tsc && vite build` compiles cleanly in ~4s with 0 errors (38.16 kB compiled production CSS).
   - Backend API regression tests: all 353 pytest unit, integration, and security tests passing (353/353 passing, 0 failures).

