# VigilBid (SIH26100) — Target Repository Architecture

**Document Version:** 2.0.0  
**Status:** Approved Architectural Baseline  
**Audience:** Judges, Open-Source Contributors, System Architects, DevOps Engineers  

---

## 1. Architectural Philosophy

VigilBid uses a **Clean Modular Monolith** pattern. We intentionally reject over-engineered multi-tier nesting (such as `apps/api/app/core/...`) in favor of clear, shallow, domain-oriented directories that can be deployed on a single laptop in an air-gapped PSU environment while scaling to Docker Compose clusters.

```
SIH26100/
│
├── README.md                      # Humanized project landing page & quickstart
├── LICENSE                        # MIT open-source license
├── CONTRIBUTING.md                # Contributor guidelines & code standards
├── SECURITY.md                    # Security policy & responsible disclosure
├── docker-compose.yml             # 4-container production deployment stack
├── Makefile                       # Cross-platform developer commands
├── alembic.ini                    # Database migration configuration
├── requirements.txt               # Backend Python dependencies
├── worker.py                      # Asynchronous background pipeline worker
│
├── frontend/                      # Web Presentation Client (React 18 + Vite SPA)
│   ├── src/                       # TypeScript application source
│   │   ├── components/            # Cockpit, Compliance Matrix, Audit, /demo tour
│   │   │   └── ui/                # Decoupled UI primitives (Button, Card, StatusChip)
│   │   ├── api/                   # Typed REST API client
│   │   └── types/                 # Frontend TypeScript contracts
│   └── package.json               # Node.js dependencies
│
├── backend/                       # Application Gateway & REST Services
│   ├── main.py                    # FastAPI ASGI application & lifespan
│   ├── database.py                # Async SQLAlchemy 2.0 engine
│   ├── models/                    # 18 Relational database models
│   ├── routers/                   # 24 REST API endpoints under /api/v1
│   ├── schemas/                   # Pydantic v2 validation contracts
│   └── services/                  # Business services (auth, documents, audit, decisions)
│
├── pipeline/                      # 11-Step Forensic Document Processing Core
│   ├── runner.py                  # End-to-end pipeline coordinator
│   ├── ocr/                       # Hybrid PyMuPDF & Tesseract 5.0 OCR abstraction
│   ├── document_processing/       # 13 statutory document classifiers
│   ├── extraction/                # Deterministic field extractors (GST, PAN, CA, Udyam)
│   ├── entity_resolution/         # Jaro-Winkler & sub-string parity resolution
│   ├── registry_adapters/         # Simulated government registry sandbox adapters
│   ├── compliance/                # Declarative rule evaluation engine (GFR 2017)
│   ├── risk/                      # Anomaly scanners, composite risk & collusion graph
│   ├── evidence/                  # Coordinate bounding box citation packaging
│   ├── audit/                     # Cryptographic forward SHA-256 hash chaining
│   └── reports/                   # ReportLab CVC compliance dossier PDF generator
│
├── rules/                         # Declarative Statutory Procurement Rules
│   └── cpcl_goods_v1.yaml         # 34 GFR 2017 & CPCL Goods criteria definitions
│
├── seed/                          # Demonstration Dataset & Sandbox Fixtures
│   ├── demo_packages/             # 5 realistic vendor folders (26 synthetic PDFs)
│   └── mock_fixtures/             # Schema-faithful GSTN, MCA, Udyam, Debarment JSONs
│
├── data/                          # Content-Addressable Storage (CAS)
│   └── storage/                   # Deduplicated PDF storage indexed by SHA-256
│
├── tests/                         # Automated Test Suites (353 backend tests)
│   ├── unit/                      # Ingestion, OCR, rules, extraction, and risk tests
│   └── integration/               # Pipeline end-to-end and API integration tests
│
├── scripts/                       # Operational Tooling & Diagnostic Utilities
│   ├── demo_setup.py              # Automated 5.4s reset and reseed utility
│   ├── release_audit.py           # 20-subsystem release certification runner
│   └── health_check.py            # Environment & preflight diagnostic CLI
│
├── docs/                          # Categorized Technical Documentation Hub
│   ├── README.md                  # Central documentation index with role-based paths
│   ├── ONE-MINUTE-TOUR.md         # 60-second executive summary for evaluators
│   ├── architecture/              # DATA-FLOW.md, REPOSITORY-MAP.md, TRACEABILITY.md
│   ├── development/               # DEVELOPER-GUIDE.md, WHERE-TO-CHANGE.md
│   ├── ai/                        # OCR.md, EXTRACTION.md, NORMALIZATION.md, REGISTRY.md
│   ├── compliance/                # RULE-ENGINE.md (34 criteria specs)
│   ├── risk/                      # RISK-ENGINE.md, ANOMALIES.md, GRAPH.md
│   ├── evidence/                  # EVIDENCE.md, PDF-CONTRACT.md
│   ├── security/                  # SECURITY.md, SECURITY-AUDIT.md, AUTH.md
│   ├── api/                       # FINAL-API.md (24 REST endpoint contracts)
│   ├── database/                  # FINAL-DATABASE.md (18 relational tables)
│   ├── deployment/                # FINAL-SETUP.md (Deployment options)
│   ├── testing/                   # RELEASE-CHECKLIST.md, EVALUATION.md
│   ├── demo/                      # DEMO-NARRATIVE.md, DEMO-SCRIPT.md, SCREENSHOTS.md
│   ├── decisions/                 # ADR-001 through ADR-008
│   └── archive/                   # Historical 00–06 research blueprints
│
├── research/                      # Domain Research & Regulatory Benchmarks
│   └── sih26100-research-dump.txt # Pre-prototype statutory requirements analysis
│
└── archive/                       # Deprecated & Historical Prototype Assets
    ├── README.md                  # Explanation of archived assets
    └── legacy-ui/                 # Early marked.js offline documentation browser
        ├── index.html
        ├── css/style.css
        └── js/main.js
```

---

## 2. Rationale for Boundary Decisions

1. **Why `backend/` and `pipeline/` are separate top-level directories:**
   - `backend/` handles HTTP I/O, authentication, database persistence, and API routing.
   - `pipeline/` is a pure computational engine that can run completely headless without an active HTTP server (e.g. in the background worker or CLI batch processing).
2. **Why `rules/` is top-level:**
   - Non-developer procurement officers and domain experts can inspect and update tender rules in `rules/cpcl_goods_v1.yaml` without touching Python or React code.
3. **Why `archive/` is top-level:**
   - Isolates historical files from the active codebase while maintaining git provenance and team reference.
