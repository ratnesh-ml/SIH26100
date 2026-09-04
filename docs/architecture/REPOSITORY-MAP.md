# VigilBid (SIH26100) — Repository Map & Directory Guide

**Document Version:** 1.0.0  
**Date:** September 2026  
**Audience:** Judges, Open-Source Contributors, System Evaluators, and PSU Technical Officers  

---

## 1. High-Level Repository Layout

VigilBid is structured as a **modular monorepo** with explicit separation between the web presentation client, application API gateway, document AI & compliance pipeline, declarative statutory rules, automated evaluation harnesses, and synthetic test datasets.

```
SIH26100/
├── README.md                      # Public GitHub landing page & product overview
├── CONTRIBUTING.md                # Open-source contribution & development standards
├── SECURITY.md                    # Vulnerability disclosure & sensitive data policy
├── LICENSE                        # Apache 2.0 Open Source License
├── Makefile                       # Developer shortcuts (test, lint, seed, demo)
├── docker-compose.yml             # 4-service production container orchestration
├── .env.example                   # Complete documented environment configuration
├── requirements.txt               # Backend Python dependencies
├── worker.py                      # Standalone background pipeline job worker
│
├── frontend/                      # Web Presentation Client (SPA)
│   ├── src/                       # React 18 + TypeScript application source
│   │   ├── components/            # Application views (Dashboard, Matrix, Cockpit, Demo)
│   │   │   └── ui/                # 9 decoupled design system primitives (Card, StatusChip)
│   │   ├── api/                   # Typed HTTP REST client connecting to backend contracts
│   │   ├── types/                 # TypeScript data contracts mirroring Pydantic models
│   │   └── App.tsx                # View router and layout container
│   ├── package.json               # Node.js dependencies (Vite, Tailwind, Vitest)
│   └── tailwind.config.js         # Accessible government dark-mode design tokens
│
├── backend/                       # Application Gateway & REST Service
│   ├── api/                       # OpenAPI 3.1 REST route definitions (/api/v1)
│   ├── core/                      # Configuration, async database engine, security/JWT
│   ├── models/                    # 18 SQLAlchemy 2.0 relational models (Postgres + SQLite)
│   ├── schemas/                   # Pydantic v2 request/response validation contracts
│   ├── services/                  # Business logic (adjudication, CAS ingestion, audit)
│   └── workers/                   # Background queue consumer & pipeline orchestrator
│
├── pipeline/                      # 11-Step Forensic Document Processing Pipeline
│   ├── runner.py                  # End-to-end pipeline execution coordinator
│   ├── pdf/                       # PyMuPDF text acquisition, coordinates & 150 DPI render
│   ├── ocr/                       # PaddleOCR PP-OCRv4 CPU/GPU adapter & Tesseract fallback
│   ├── document_processing/       # Document classifier (11 statutory document categories)
│   ├── extraction/                # Deterministic field extractors (GST, PAN, Udyam, CA)
│   ├── entity_resolution/         # Fuzzy matcher, legal form normalizer, parity scorer
│   ├── registry_adapters/         # Abstract RegistryProvider & simulated mock gateway
│   ├── compliance/                # YAML rule evaluation engine & cross-document verifier
│   ├── risk/                      # Anomaly scanners, risk composite scorer & collusion graph
│   ├── evidence/                  # Pixel-accurate bounding box packaging & trace generator
│   ├── audit/                     # SHA-256 forward hash-chaining service
│   ├── reports/                   # On-demand statutory CVC compliance dossier PDF compiler
│   └── rag/                       # Procurement Copilot (BM25 retrieval & prompt guardrails)
│
├── rules/                         # Declarative Statutory Procurement Rules
│   └── cpcl_goods_v1.yaml         # 34 statutory procurement rules citing GFR/MII/MSE clauses
│
├── seed/                          # Demonstration Dataset & Fixtures
│   ├── demo_packages/             # 5 format-faithful synthetic bidder packages (26 PDFs)
│   ├── mock_fixtures/             # Fixtures for GSTN, MCA21, PAN, Udyam, Debarment
│   └── ground_truth.json          # Benchmark ground truth for automated evaluation
│
├── tests/                         # Automated Regression & Verification Suite
│   ├── unit/ & integration/       # 353 passing pytest tests (100% pass rate)
│   ├── test_security_audit.py     # 12 automated OWASP security attack simulations
│   └── test_*.py                  # Subsystem unit tests for all pipeline components
│
├── scripts/                       # Operational Tooling & Preflight Diagnostics
│   ├── demo_setup.py              # Single-command 5.4s reset and seed orchestrator
│   ├── release_audit.py           # 20-subsystem automated release certification suite
│   ├── health_check.py            # 7-stage environment and preflight diagnostic CLI
│   ├── evaluate.py                # Ground-truth accuracy and benchmark evaluation harness
│   └── backup_restore.py          # Standalone JSON snapshot backup and restore engine
│
└── docs/                          # Comprehensive Technical Documentation
    ├── architecture/              # Repository map, feature traceability, contracts
    ├── demo/                      # Demonstration runbook, video guide, screenshots
    ├── decisions/                 # 8 Architecture Decision Records (ADRs)
    ├── FINAL-*.md                 # Definitive final project handoff specifications
    └── RELEASE-CHECKLIST.md       # 20-point production release audit sign-off
```

---

## 2. Directory Breakdown & Responsibility Map

### 2.1 `frontend/` (Web Presentation Client)
* **What it is:** A lightweight, high-performance Single Page Application built with React 18, TypeScript, and Vite.
* **Key Components:**
  * `DashboardView.tsx`: Executive KPI cards, vendor compliance distribution bar, risk breakdown, and live audit health widget.
  * `ComplianceMatrixView.tsx` (Screen S3): 5 × 8 comparative evaluation matrix with sticky legal identity column and status chips.
  * `BidderDetailView.tsx` (Screen S6): The "One Screen That Wins" — three-column cockpit (Criteria Rail, 150 DPI Document Canvas with SVG bounding boxes, and Adjudication Panel with CVC justification validation).
  * `CrossBidderGraphView.tsx` (Screen S7): Interactive NetworkX-rendered collusion graph linking shared attributes.
  * `AuditTrailView.tsx` (Screen S8): Immutable SHA-256 ledger with live "Verify Chain" forward re-hash button.
  * `DemoView.tsx` (`/demo`): Standalone interactive guided tour for judges and contributors.
  * `components/ui/`: 9 modular primitives guaranteeing UI re-skinning without business logic disruption.

### 2.2 `backend/` (Application Gateway & REST Service)
* **What it is:** Enterprise FastAPI application providing 24 REST endpoints across 16 categories under `/api/v1`.
* **Key Modules:**
  * `backend/api/router.py`: API route handlers with Pydantic v2 schemas and input sanitization.
  * `backend/core/database.py`: Async SQLAlchemy 2.0 engine supporting both PostgreSQL and SQLite.
  * `backend/models/entities.py`: All 18 relational database models with dialect-adaptive UUIDs and BigIntegers.
  * `backend/services/document_service.py`: Content-Addressable Storage (CAS) ingestion with SHA-256 deduplication and ZIP ratio guards.
  * `backend/services/decision_service.py`: Human-in-the-loop review workflow requiring written CVC justifications on overrides.

### 2.3 `pipeline/` (11-Step Forensic Document Processing Pipeline)
* **What it is:** The computational core of VigilBid. Connects raw uploaded PDFs to auditable legal findings.
* **Key Subsystems:**
  * `runner.py`: Coordinates the 11 pipeline stages with automatic error recovery and duration telemetry.
  * `pipeline/ocr/`: Text-layer extraction prioritized (<1s) with PaddleOCR PP-OCRv4 raster fallback.
  * `pipeline/extraction/`: Deterministic regex and coordinate extractors for GST REG-06, PAN, Udyam, and CA Turnover certificates.
  * `pipeline/entity_resolution/`: Token Set Ratio, Jaro-Winkler, legal suffix cleaning, and embedded PAN primacy.
  * `pipeline/registry_adapters/`: `RegistryProvider` abstraction with `MockRegistryProvider` simulation.
  * `pipeline/compliance/`: Declarative YAML rule evaluation with legal precedence (`FAIL > REVIEW > WARN > PASS`).
  * `pipeline/risk/`: PDF metadata tampering checks (GIMP), prompt injection detection, and NetworkX collusion graph.
  * `pipeline/audit/`: Forward SHA-256 hash chaining service with zero blockchain dependencies.
  * `pipeline/reports/`: On-demand CVC Technical Evaluation Dossier PDF compilation.

### 2.4 `rules/` (Statutory Procurement Rules)
* **What it is:** Declarative procurement rules encoded in human-readable YAML.
* **File:** `rules/cpcl_goods_v1.yaml` — 34 rules citing exact GFR 2017, PPP-MII, and MSE Order clauses. Rules are versioned (`1.0`) and parameterized at the tender level.

### 2.5 `seed/` (Demonstration Dataset)
* **What it is:** Complete synthetic demonstration data allowing 100% reproducible presentations.
* **Contents:**
  * `seed/demo_packages/`: 5 realistic bidder folders (26 statutory PDFs) representing clean large enterprise, MSE with abbreviation, hard PAN-GSTIN mismatch, adversarial PDF tampering with prompt injection, and debarred vendor control.
  * `seed/mock_fixtures/`: Curated JSON records for simulated government registries.
  * `seed/ground_truth.json`: Published ground truth benchmark for classification, extraction, and rule outcomes.

### 2.6 `scripts/` (Operational & Diagnostic Tooling)
* **`demo_setup.py`:** Single-command 5.4-second reset and seed orchestrator (`python scripts/demo_setup.py --reset --seed-only`).
* **`release_audit.py`:** 20-subsystem release certification suite and automated E2E demo runner (7.89s).
* **`health_check.py`:** 7-stage environment, key, database, and rule diagnostic CLI.
* **`evaluate.py`:** Ground truth benchmark harness evaluating extraction, classification, and rule precision.
* **`backup_restore.py`:** Standalone JSON snapshot backup and restore engine with cryptographic verification.

---

## 3. Files That Must NOT Be Touched

To prevent accidental regressions during presentation and evaluation:
* `pipeline/compliance/engine.py` (Core compliance evaluation logic).
* `pipeline/audit/hasher.py` (SHA-256 forward hash chain formula).
* `backend/models/entities.py` (Dialect-adaptive database models).
* `rules/cpcl_goods_v1.yaml` (Statutory procurement rule definitions).
* `seed/demo_packages/` (Frozen demonstration PDF filings).
* `seed/ground_truth.json` (Empirical evaluation ground truth).

---

**Repository Map Status:** Certified and Current for SIH 2026 Grand Finale.
