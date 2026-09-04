# VigilBid (SIH26100) — Engineering Documentation Index

Welcome to the central technical documentation repository for **VigilBid**, an AI-powered integrated bid compliance verification platform designed for GeM public procurement and Chennai Petroleum Corporation Limited (CPCL).

---

## 1. Quick Navigation for Evaluators & Reviewers

| If you want to understand... | Read this document |
|---|---|
| **What VigilBid does in 60 seconds** | [docs/ONE-MINUTE-TOUR.md](ONE-MINUTE-TOUR.md) |
| **How to set up and run the codebase** | [docs/DEVELOPER-GUIDE.md](DEVELOPER-GUIDE.md) |
| **Complete 6–7 minute judge demonstration flow** | [docs/demo/DEMO-NARRATIVE.md](demo/DEMO-NARRATIVE.md) |
| **Traceability of SIH requirements to code and tests** | [docs/architecture/FEATURE-TRACEABILITY.md](architecture/FEATURE-TRACEABILITY.md) |
| **High-level folder structure & module taxonomy** | [docs/architecture/REPOSITORY-MAP.md](architecture/REPOSITORY-MAP.md) |
| **Interactive In-App Demo configuration** | [docs/demo/README.md](demo/README.md) |
| **Production release certification & test reports** | [docs/RELEASE-CHECKLIST.md](RELEASE-CHECKLIST.md) |
| **Current build status & phase milestones** | [docs/BUILD-STATUS.md](BUILD-STATUS.md) |

---

## 2. Comprehensive Documentation Tree

```
docs/
├── architecture/
│   ├── REPOSITORY-MAP.md            # Comprehensive module taxonomy and directory map
│   └── FEATURE-TRACEABILITY.md      # SIH26100 requirements mapped to code, APIs, and tests
│
├── decisions/                       # Architecture Decision Records (ADRs)
│   ├── ADR-001-modular-monolith.md
│   ├── ADR-002-ocr-abstraction.md
│   ├── ADR-003-mock-government-registries.md
│   ├── ADR-004-deterministic-compliance-engine.md
│   ├── ADR-005-evidence-first-architecture.md
│   ├── ADR-006-human-in-the-loop-decisions.md
│   ├── ADR-007-rag-architecture.md
│   └── ADR-008-risk-methodology.md
│
├── demo/                            # Live Presentation & Demonstration Suite
│   ├── README.md                    # How to run, reset, and configure the in-app /demo page
│   ├── DEMO-NARRATIVE.md            # Chronological 7-minute judge demonstration script
│   ├── SCREENSHOTS.md               # 11-screen capture plan and UI specifications
│   └── screenshots/                 # Directory reserved for captured PNG assets
│
├── Subsystem Specifications:
│   ├── FINAL-ARCHITECTURE.md        # Core end-to-end system design & components
│   ├── FINAL-API.md                 # 24 REST endpoints, schemas, and error contracts
│   ├── FINAL-DATABASE.md            # 17 relational tables, indexes, and Alembic migrations
│   ├── FINAL-SETUP.md               # Step-by-step local and Docker deployment manual
│   ├── FINAL-DEMO.md                # Demonstration claims verification and Q&A guide
│   ├── KNOWN-LIMITATIONS.md         # Transparent technical boundaries and honest disclosures
│   ├── FUTURE-ROADMAP.md            # Post-hackathon enterprise scaling phases
│   ├── DEMO-SCRIPT.md               # 12-beat detailed PSU presentation runbook
│   ├── RELEASE-CHECKLIST.md         # Production release sign-off and subsystem verification
│   ├── SECURITY.md                  # Ingestion defense policy and threat model
│   ├── SECURITY-AUDIT.md            # Static analysis, dependency scan, and hardening audit
│   ├── OCR.md                       # Hybrid PyMuPDF and Tesseract OCR engine specifications
│   ├── EXTRACTION.md                # Key-value field extraction strategies and regular expressions
│   ├── NORMALIZATION.md             # Fiscal amount, date, and company entity normalizers
│   ├── REGISTRY.md                  # Simulated GSTN, MCA, Udyam, and Debarment adapters
│   ├── RULE-ENGINE.md               # 34 CPCL Goods rules and GFR 2017 logic specifications
│   ├── RISK-ENGINE.md               # 4-factor composite risk scoring arithmetic and drivers
│   ├── EVIDENCE.md                  # Bounding box coordinate geometry and snippet storage
│   ├── ANOMALIES.md                 # PDF metadata tampering forensics and prompt injection defense
│   ├── GRAPH.md                     # Cross-bidder collusion network graph specifications
│   ├── PDF-CONTRACT.md              # ReportLab CVC compliance dossier generation specification
│   ├── PERFORMANCE.md               # Sub-second latency benchmarks and concurrency analysis
│   └── EVALUATION.md                # Test suites, accuracy benchmarks, and release statistics
│
└── Foundational Blueprints:
    ├── ARCHITECTURE-LOCK.md         # Locked architectural contracts and scope boundaries
    ├── INTERFACE-CONTRACTS.md       # API schemas, pipeline step signatures, and audit format
    ├── REPOSITORY-STRUCTURE.md      # Foundational structure documentation
    ├── 00-research-audit.md         # Initial research and domain audit
    ├── 01-understanding-requirements-architecture.md
    ├── 02-ai-docai-rag-er-compliance-risk.md
    ├── 03-frontend-backend-db-api.md
    ├── 04-dataset-mockapi-security-devops-mvpcut-team.md
    ├── 05-dependencies-timeline-checklists-skills-git.md
    └── 06-demo-judges-claims-stack-spec-strategy.md
```

---

## 3. Key Architectural Pillars

1. **Evidence-First Verification:** Every finding (`PASS`, `WARN`, `REVIEW`, `FAIL`) is paired with exact document, page, and bounding box coordinates.
2. **Deterministic Rules Over Probabilistic AI:** AI is used strictly for perceptual tasks (OCR, layout parsing); all compliance checks, tax validations, and legal evaluations are deterministic Python code.
3. **Strict Human-in-the-Loop:** The system recommends; the procurement officer decides. Mandatory written justifications are enforced for any officer override.
4. **Zero Accusatory Vocabulary:** System UI and PDF outputs strictly eschew terms such as *"fraud"*, *"fake"*, or *"tampered"*, adhering to statutory neutrality: *"Potential anomaly detected — human verification required"*.
5. **Immutable Cryptographic Audit:** Every action is cryptographically chained into a SHA-256 ledger verifiable at runtime.
