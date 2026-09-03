# VigilBid (SIH26100) — Build Status & Transition Baseline

**Document Version:** 1.4.0  
**Date:** September 2026  
**Status:** Phase 06 Complete — Authentication & Role-Based Authorization Operational  
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
| **Containerization & Compose** | ✅ Completed (100%) | `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.dockerignore`. |
| **Database Connectivity Engine** | ✅ Completed (100%) | `backend/core/database.py` with async SQLAlchemy 2.0 engine, async sessionmaker, and DB connection probe. |
| **PostgreSQL Schema & Models** | ✅ Completed (100%) | All 17 locked tables defined with UUIDs, BigIntegers, JSONB, foreign keys, and indexes. |
| **Alembic Migrations Framework** | ✅ Completed (100%) | `alembic.ini`, `alembic/env.py`, initial revision `0001_initial_schema.py` tested against fresh DB. |
| **Authentication & RBAC System** | ✅ Completed (100%) | PBKDF2 password hashing, JWT HS256, login, me, logout, RoleChecker, 4 core roles. |
| **Development User Seeding** | ✅ Completed (100%) | `seed/seed_users.py` with PBKDF2 hashed accounts for officer, evaluator, vigilance, and admin. |
| **Live Health Probe Endpoint** | ✅ Completed (100%) | `/health` actively probes database status, dialect, and latency. |
| **Background Worker Process** | ✅ Completed (100%) | `worker.py` and `backend/workers/job_worker.py` with DB readiness check and graceful signal shutdown. |
| **Frontend Production Build** | ✅ Completed (100%) | Vite + React 18 + TypeScript builds cleanly (`dist/` created in 38s) with dark mode and API client. |
| **Automated Tests & Startup Verification** | ✅ Completed (100%) | 52 pytest unit and security tests passing, `scripts/verify_structure.py` passing with 0 warnings. |
| **Project Automation Tooling** | ✅ Completed (100%) | Single-command deployment (`docker compose up --build`), `Makefile`, and `scripts/dev.ps1`. |
| **Synthetic Demo Dataset (`seed/`)** | 🔄 Ready for Generation | `template_tender.json` created; 4+1 generator script pending Phase 07. |

**Current Repo Baseline:** Authentication, JWT lifecycle, and role-based access control (Procurement Officer, Evaluator, Vigilance, Administrator) are fully operational and verified by 52 automated tests. Sensitive endpoints enforce RBAC with HTTP 403 Forbidden.

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
 
**Execute Phase 07 (Synthetic Demo Dataset Generator & Pipeline Ingestion):**
1. Implement synthetic bidder document generator (`seed/generate_demo_docs.py`) to produce the 4+1 demo bidder PDFs (scanned + digital) and ground truth fixtures.
2. Wire the 11-step pipeline runner into the PostgreSQL `jobs` table polling loop in `backend/workers/job_worker.py`.
3. Test end-to-end ingestion and rule evaluation of the demo bidder packages against tender criteria.
4. Begin Phase 07 implementation per timeline in `docs/05`.
