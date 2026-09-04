# VigilBid (SIH26100) — Repository Structure & Component Guide

**Status:** ACTIVE  
**Version:** 1.0.0  
**Effective Date:** September 2026  

This document describes the complete production repository layout for **VigilBid (SIH26100)**, detailing the purpose, responsibility, and interface boundary for each major folder and package.

---

## 1. Top-Level Directory Tree

```
SIH26100/
├── backend/                  # FastAPI web server, DB models, schemas, auth, and worker
│   ├── api/                  # REST API route handlers (/api/v1) and dependencies
│   ├── auth/                 # JWT token generation, verification, and RBAC enforcement
│   ├── core/                 # Global settings, configuration, and security utilities
│   ├── models/               # SQLAlchemy 2.0 database models (17 tables)
│   ├── schemas/              # Pydantic v2 validation models and response envelopes
│   ├── services/             # Business workflow orchestration layer (tenders, bidders, audit)
│   ├── workers/              # Background worker polling jobs table for async processing
│   └── main.py               # FastAPI application factory and /health endpoint
│
├── pipeline/                 # 11-step document processing, extraction, compliance & risk
│   ├── ocr/                  # Text extraction (PyMuPDF text layer + PaddleOCR/Tesseract)
│   ├── document_processing/  # Safe ZIP intake, magic byte check, doc classification
│   ├── extraction/           # Regex, anchor, and tabular extractors for 11 doc types
│   ├── entity_resolution/    # Name normalization, rapidfuzz similarity, PAN-in-GSTIN parity
│   ├── registry_adapters/    # Abstract & mock providers for GSTN, MCA21, PAN, Udyam, Debarment
│   ├── compliance/           # Deterministic rule engine evaluating 34 YAML rules
│   ├── risk/                 # Transparent weighted risk scorer & forensic anomaly scanner
│   ├── audit/                # Cryptographic SHA-256 hash-chain generation & verification
│   ├── evidence/             # Bounding box coordinate conversion and evidence packaging
│   ├── rag/                  # Regulatory knowledge base indexing and Copilot clause search
│   ├── reports/              # CVC/RTI-ready PDF compliance dossier generation
│   └── runner.py             # 11-step pipeline runner and context orchestrator
│
├── rules/                    # Declarative YAML rule definitions and risk weights
│   ├── cpcl_goods_v1.yaml    # 34 eligibility and compliance rules for CPCL Goods tenders
│   └── risk_weights.yaml     # Point allocations for risk drivers and anomaly signals
│
├── seed/                     # Test datasets, tender templates, and fixture generators
│   ├── template_tender.json  # Reference CPCL goods NIT specification and criteria
│   └── mock_fixtures/        # Synthetic registry responses for air-gapped demo
│
├── frontend/                 # Vite + React 18 + TypeScript SPA client
│   ├── src/
│   │   ├── api/              # Typed backend REST client bindings
│   │   ├── components/       # Reusable UI widgets and screen components (S1–S8)
│   │   ├── types/            # TypeScript interfaces matching backend Pydantic schemas
│   │   ├── App.tsx           # Application root layout with header and navigation
│   │   ├── main.tsx          # React DOM entry point
│   │   └── index.css         # Modern dark-mode styling and Tailwind directives
│   ├── package.json          # Node dependencies (lucide-react, react, tailwindcss, vite)
│   ├── tsconfig.json         # TypeScript compiler configuration
│   └── vite.config.ts        # Vite build tool and proxy configuration
│
├── tests/                    # Automated testing suite
│   ├── conftest.py           # Pytest test client and shared fixtures
│   ├── test_health.py        # Health check and route mounting tests
│   └── test_structure.py     # Structural import and module completeness tests
│
├── docs/                     # Technical specifications and architectural baselines
│   ├── 00-research-audit.md  # Research analysis and claims verification audit
│   ├── 01-understanding...md # Problem decomposition and functional requirements
│   ├── 02-ai-docai-rag...md  # AI vs. Rules matrix, OCR options, 34 rules, risk engine
│   ├── 03-frontend-backend...# UI screen specs, DB schema, 24 REST API endpoints
│   ├── 04-dataset-mockapi... # Synthetic 4+1 bidder story, mock provider, team roles
│   ├── 05-dependencies...md  # Execution timeline, checklists, Git workflow
│   ├── 06-demo-judges...md   # 6.5-minute demo script, judge defense questions
│   ├── ARCHITECTURE-LOCK.md  # Immutable architectural decisions and vocabulary ban
│   ├── BUILD-STATUS.md       # Build status transition logs and milestone tracking
│   ├── INTERFACE-CONTRACTS.md# REST API, pipeline step, and audit event contracts
│   └── REPOSITORY-STRUCTURE.md# This document
│
├── scripts/                  # Development, verification, and operational scripts
│   ├── dev.ps1               # Windows PowerShell task runner (verify, test, run)
│   └── verify_structure.py   # Automated structural integrity and import validator
│
├── data/                     # Content-addressable storage and persistent artifacts
│   ├── storage/              # Local storage hierarchy: storage/{tender}/{bidder}/{sha}.pdf
│   └── fixtures/             # Local static dataset files
│
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore patterns for Python, Node, caches, and storage
├── Makefile                  # Unix/POSIX project automation commands
└── README.md                 # Project introduction, quickstart, and development guide
```

---

## 2. Component Responsibilities & Boundaries

### 2.1 Backend (`backend/`)
- **`backend/core/`**: Provides `Settings` via Pydantic (`config.py`), cryptographic encryption/decryption of PAN/GSTIN using Fernet (`security.py`), and JWT token generation.
- **`backend/auth/`**: Declares user roles (`officer`, `approver`, `auditor`, `admin`) and RBAC dependencies (`rbac.py`, `jwt.py`).
- **`backend/api/`**: Implements the 24 REST endpoints defined in the interface contract. Enforces the standard error envelope `{ "error": { "code", "message", "details" } }`.
- **`backend/models/`**: Defines the 17 relational database tables in SQLAlchemy 2.0 (`User`, `Tender`, `Criterion`, `Bidder`, `Document`, `DocumentPage`, `ExtractedField`, `VerificationEvent`, `Finding`, `AnomalySignal`, `RiskDriver`, `Decision`, `BidderLink`, `Job`, `AuditLog`, `Report`, `KBChunk`).
- **`backend/schemas/`**: Pydantic v2 models ensuring bidirectional validation and typed contracts between frontend, backend, and pipeline.
- **`backend/services/`**: Encapsulates core business transactions (tender creation, bidder upload queuing, finding decisions, audit logging, dossier generation).
- **`backend/workers/`**: Background worker (`job_worker.py`) polling the `jobs` table using PostgreSQL `SELECT FOR UPDATE SKIP LOCKED`.

### 2.2 Pipeline (`pipeline/`)
- **`pipeline/ocr/`**: Direct text-layer acquisition with PyMuPDF; falls back to OCR if character density < 50 chars/page.
- **`pipeline/document_processing/`**: Safe ZIP archive unpacking, magic byte sniff (`%PDF-`), SHA-256 fingerprinting, and document classification into 13 document types.
- **`pipeline/extraction/`**: Regex and anchor-based field extractors with bounding box coordinate capture.
- **`pipeline/entity_resolution/`**: Canonical name normalization and token-set ratio fuzzy matching across documents.
- **`pipeline/registry_adapters/`**: Provider interface decoupling live verification from mock fixtures (`MockRegistryProvider`).
- **`pipeline/compliance/`**: Pure deterministic evaluation of bidder data against 34 YAML compliance rules.
- **`pipeline/risk/`**: Aggregates finding points and anomaly points into an explainable 0–100 risk score.
- **`pipeline/audit/`**: Cryptographic SHA-256 hash chaining:
  `curr_hash = sha256(prev_hash + json.dumps(payload, sort_keys=True))`
- **`pipeline/evidence/`**: Normalizes PyMuPDF points into CSS percentage overlays (`left%`, `top%`, `width%`, `height%`) for responsive frontend display.
- **`pipeline/rag/`**: Retrieval over GFR 2017 and CVC regulatory clauses for Copilot query responses.
- **`pipeline/reports/`**: Generates CVC/RTI-ready PDF compliance dossiers with embedded audit chain heads.
- **`pipeline/runner.py`**: Orchestrates the sequential execution of Steps 1 through 11.

### 2.3 Rules (`rules/`)
- Declarative, human-auditable YAML rule definitions that are strictly separated from application code.
- `cpcl_goods_v1.yaml` encodes CPCL BEC Goods criteria.
- `risk_weights.yaml` encodes transparent point allocations.

### 2.4 Frontend (`frontend/`)
- Built with Vite + React 18 + TypeScript + Tailwind CSS.
- Implements the 8 MVP screens (S1 Login, S2 Tenders, S3 Compliance Matrix Heatmap, S4 Upload, S5 Status Stepper, S6 Bidder Cockpit with bbox overlays, S7 Cross-Bidder Link Graph, S8 Audit Trail & Dossiers).

### 2.5 Tests & Scripts (`tests/`, `scripts/`)
- Unit and integration tests in `tests/`.
- Automated structural validator `scripts/verify_structure.py` ensures no missing modules or circular imports.
- `scripts/dev.ps1` provides native Windows PowerShell automation.
- `Makefile` provides POSIX standard development commands.
