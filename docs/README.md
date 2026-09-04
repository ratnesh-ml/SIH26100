# VigilBid Documentation Hub

Welcome to the documentation hub for **VigilBid**, an open-source, evidence-first bid compliance verification platform built for public sector procurement under **GFR 2017** and **CVC guidelines**.

---

## Where Should I Start?

Depending on what you want to achieve, pick the relevant path below:

### 1. "I'm new here and have 1 minute"
Read our 60-second executive summary:
👉 [docs/ONE-MINUTE-TOUR.md](ONE-MINUTE-TOUR.md)

### 2. "I want to set up and run the application locally"
Follow the developer onboarding guide with verified commands for Docker and local host:
👉 [docs/development/DEVELOPER-GUIDE.md](development/DEVELOPER-GUIDE.md)  
Or view the full deployment and environment options:
👉 [docs/deployment/FINAL-SETUP.md](deployment/FINAL-SETUP.md)

### 3. "I want to understand the end-to-end architecture"
Explore how components connect and how data flows through the 11-step pipeline:
👉 [docs/architecture/FINAL-ARCHITECTURE.md](architecture/FINAL-ARCHITECTURE.md)  
👉 [docs/architecture/DATA-FLOW.md](architecture/DATA-FLOW.md)  
👉 [docs/architecture/REPOSITORY-MAP.md](architecture/REPOSITORY-MAP.md)

### 4. "I want to know where to change a feature or debug"
Check our developer quick-lookup directory to find the exact file to edit:
👉 [docs/development/WHERE-TO-CHANGE.md](development/WHERE-TO-CHANGE.md)  
👉 [docs/development/INTERFACE-CONTRACTS.md](development/INTERFACE-CONTRACTS.md)

### 5. "I want to see the 7-minute judge demonstration"
Review the step-by-step presentation narrative and runbook:
👉 [docs/demo/DEMO-NARRATIVE.md](demo/DEMO-NARRATIVE.md)  
👉 [docs/demo/DEMO-SCRIPT.md](demo/DEMO-SCRIPT.md)  
👉 [docs/demo/README.md](demo/README.md) *(Guided `/demo` tour instructions)*

### 6. "I want to inspect how OCR and Document Intelligence work"
Read how PyMuPDF and Tesseract extract text, layout coordinates, and identifiers:
👉 [docs/ai/OCR.md](ai/OCR.md)  
👉 [docs/ai/EXTRACTION.md](ai/EXTRACTION.md)  
👉 [docs/ai/NORMALIZATION.md](ai/NORMALIZATION.md)  
👉 [docs/ai/REGISTRY.md](ai/REGISTRY.md)

### 7. "I want to understand how compliance and risk are evaluated"
Read about our 34 deterministic CPCL rules, forensic anomaly checks, and 4-factor risk scoring:
👉 [docs/compliance/RULE-ENGINE.md](compliance/RULE-ENGINE.md)  
👉 [docs/risk/RISK-ENGINE.md](risk/RISK-ENGINE.md)  
👉 [docs/risk/ANOMALIES.md](risk/ANOMALIES.md)  
👉 [docs/risk/GRAPH.md](risk/GRAPH.md)

### 8. "I want to check test results and release certification"
Review our automated 353 backend tests, 70 frontend checks, and 20-subsystem audit report:
👉 [docs/testing/RELEASE-CHECKLIST.md](testing/RELEASE-CHECKLIST.md)  
👉 [docs/testing/EVALUATION.md](testing/EVALUATION.md)  
👉 [docs/testing/PERFORMANCE.md](testing/PERFORMANCE.md)

---

## Full Documentation Catalog

```
docs/
├── README.md                          # This document index
├── ONE-MINUTE-TOUR.md                 # 60-second judge and evaluator pitch
├── REPOSITORY-ORGANIZATION-AUDIT.md   # Structural audit of redundancy & naming
├── REFACTOR-MAP.md                    # Record of directory refactorings & moves
├── BUILD-STATUS.md                    # Running engineering log (Phases 1 to 50)
├── KNOWN-LIMITATIONS.md               # Honest disclosures on scope & simulated data
├── FUTURE-ROADMAP.md                  # Post-hackathon enterprise scaling phases
│
├── architecture/                      # System Structure & Requirements
│   ├── FINAL-ARCHITECTURE.md          # Comprehensive end-to-end architecture
│   ├── DATA-FLOW.md                   # Step-by-step data transformation pipeline
│   ├── REPOSITORY-MAP.md              # Codebase module taxonomy & directory guide
│   └── FEATURE-TRACEABILITY.md        # SIH26100 requirement-to-code traceability
│
├── development/                       # Developer Experience & Contracts
│   ├── DEVELOPER-GUIDE.md             # Local setup, running services, and debugging
│   ├── WHERE-TO-CHANGE.md             # Quick-lookup table: "Where do I change X?"
│   └── INTERFACE-CONTRACTS.md         # Internal service and API signatures
│
├── ai/                                # Document AI, OCR & Extraction
│   ├── OCR.md                         # Hybrid PyMuPDF & Tesseract 5.0 architecture
│   ├── EXTRACTION.md                  # Regex & coordinate field extraction rules
│   ├── NORMALIZATION.md               # Indian currency, date, and name normalizers
│   └── REGISTRY.md                    # Government registry sandbox adapters
│
├── compliance/                        # Statutory Rule Evaluation
│   └── RULE-ENGINE.md                 # 34 CPCL Goods rules evaluated under GFR 2017
│
├── risk/                              # Risk Scoring & Forensic Vigilance
│   ├── RISK-ENGINE.md                 # 4-factor composite risk scoring arithmetic
│   ├── ANOMALIES.md                   # PDF metadata tampering forensics (GIMP)
│   └── GRAPH.md                       # Cross-bidder collusion network graph
│
├── evidence/                          # Traceability & Official Reporting
│   ├── EVIDENCE.md                    # Coordinate bounding box citation model
│   └── PDF-CONTRACT.md                # ReportLab CVC compliance dossier generation
│
├── security/                          # Ingestion Defense & Authorization
│   ├── SECURITY.md                    # Decompression bomb and upload defense
│   ├── SECURITY-AUDIT.md              # Threat model & vulnerability mitigation
│   └── AUTH.md                        # OAuth2 + JWT role-based access control
│
├── api/                               # REST Interface Contracts
│   └── FINAL-API.md                   # 24 REST endpoints, schemas, and status codes
│
├── database/                          # Relational Schema Specifications
│   └── FINAL-DATABASE.md              # 18 relational tables, indexes, and migrations
│
├── deployment/                        # DevOps & Operational Setup
│   └── FINAL-SETUP.md                 # Single-command zero-Docker & Docker Compose
│
├── testing/                           # Verification & Quality Assurance
│   ├── RELEASE-CHECKLIST.md           # Formal 20-subsystem release certification
│   ├── EVALUATION.md                  # Benchmark datasets and accuracy metrics
│   └── PERFORMANCE.md                 # Sub-second latency audit and benchmarks
│
├── demo/                              # Presentation Materials & Walkthroughs
│   ├── README.md                      # Guide to the interactive in-app /demo page
│   ├── DEMO-NARRATIVE.md              # 7-minute chronological judge script
│   ├── DEMO-SCRIPT.md                 # 12-beat detailed PSU presentation runbook
│   ├── FINAL-DEMO.md                  # Presentation defense and judge Q&A guide
│   ├── SCREENSHOTS.md                 # Screenshot capture specifications
│   └── screenshots/                   # Directory for captured UI screenshot assets
│
├── decisions/                         # Architecture Decision Records (ADRs)
│   ├── ADR-001-modular-monolith.md
│   ├── ADR-002-ocr-abstraction.md
│   ├── ADR-003-mock-government-registries.md
│   ├── ADR-004-deterministic-compliance-engine.md
│   ├── ADR-005-evidence-first-architecture.md
│   ├── ADR-006-human-in-the-loop-decisions.md
│   ├── ADR-007-rag-architecture.md
│   └── ADR-008-risk-methodology.md
│
└── archive/                           # Historical Research & Deprecated Logs
    ├── 00-research-audit.md through 06-...
    ├── ARCHITECTURE-LOCK.md
    ├── REPOSITORY-STRUCTURE.md
    ├── API.md / DATABASE.md / DEPLOYMENT.md
    ├── PHASE-47-PLAN.md & PHASE-47-WALKTHROUGH.md
    ├── E2E-DEMO-RESULTS.md
    └── blueprint-viewer/ (legacy marked.js offline documentation browser)
```
