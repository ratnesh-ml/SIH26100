# VigilBid (SIH26100) — Codebase & Documentation Organization Audit

**Audit Date:** September 2026  
**Auditor Persona:** Senior Software Architect, DX Engineer, Open-Source Maintainer  
**Scope:** Full repository structure, documentation hierarchy, backend services, pipeline modules, frontend components, and root-level cleanliness.

---

## 1. Inventory & Structural Findings

### A. Duplicate Files
- `docs/FEATURE-TRACEABILITY.md` duplicated at `docs/architecture/FEATURE-TRACEABILITY.md`.
- `docs/REPOSITORY-STRUCTURE.md` largely duplicated by the newer, more detailed `docs/architecture/REPOSITORY-MAP.md`.
- `docs/API.md` vs `docs/FINAL-API.md`: `API.md` is an earlier snapshot, while `FINAL-API.md` contains the complete 24-endpoint catalog.
- `docs/DATABASE.md` vs `docs/FINAL-DATABASE.md`: Similar schema descriptions, where `FINAL-DATABASE.md` contains the authoritative 18-table definition.
- `docs/DEPLOYMENT.md` vs `docs/FINAL-SETUP.md`: Deployment instructions overlap.

### B. Duplicate Documentation Content
- GFR 2017 Rule 144(xi), 153, and PPP-MII summaries were repeated verbatim across 6 different markdown documents (`01-...`, `RULE-ENGINE.md`, `FINAL-ARCHITECTURE.md`, `DEMO-SCRIPT.md`, `FINAL-DEMO.md`, `FEATURE-TRACEABILITY.md`).
- CAG audit statistics (Report No. 18 of 2020 on 42.79% unverified PANs) were duplicated across 5 files.
- SHA-256 hash chaining formula was re-explained across 4 separate documents.

### C. Badly Named Files
- `research/sih26100-research-dump.txt`: Unstructured dump name; contains initial problem research and benchmark tables.
- `docs/00-research-audit.md` through `docs/06-demo-judges-claims-stack-spec-strategy.md`: Numbered research prefix from early prototyping. Useful historical context, but clutters the root `docs/` index.

### D. Badly Named Directories
- Root-level `css/` and `js/`: These contain styling and script for a marked.js documentation browser. Because they reside at the root alongside `frontend/`, new developers mistake them for the actual web client.

### E. Outdated Documentation
- `docs/ARCHITECTURE-LOCK.md`: Authored at Phase 1; refers to earlier 11-rule prototypes before expanding to 34 CPCL Goods rules.
- `docs/PHASE-47-PLAN.md` and `docs/PHASE-47-WALKTHROUGH.md`: Historical step logs that should reside in an archive directory.
- `docs/E2E-DEMO-RESULTS.md`: Phase 48 pre-release validation notes superseded by `docs/RELEASE-CHECKLIST.md`.

### F. Conflicting Documentation
- Early documents mention "11 criteria", later documents mention "34 criteria" (the full Goods rule catalog), and demo scripts evaluate "8 key criteria" on-screen during the 7-minute presentation. While technically valid in their respective contexts, the discrepancy causes confusion without an introductory note explaining the full catalog vs demo subset.

### G. Overly Technical Explanations
- Previous pipeline descriptions jumped straight into AST token extraction and mathematical Jaro-Winkler matrix definitions before explaining *why* an officer needs to know if "Sri Kaveri Engg LLP" equals "Sri Kaveri Engineering Works".

### H. Unnecessarily Complicated Explanations
- Audit trail documentation previously explained HMAC-SHA256 mathematical inner/outer pad derivation when the practical design simply requires explaining that each log event hashes the previous block hash to make retroactive database edits mathematically impossible to hide.

### I. Giant Files
- `docs/BUILD-STATUS.md` (~52 KB, 365+ lines): Large running log of phases 1 to 50. Highly valuable, but should be preserved as a historical log while modular entry points guide day-to-day developers.
- `frontend/src/components/BidderDetailView.tsx` (~600+ lines): Handles extracted fields, registry pills, finding cards, split-screen PDF canvas, and decision modal. (Functionally robust and tested; should only be refactored with extreme care).

### J. Modules Containing Unrelated Responsibilities
- None in backend: `backend/routers/` cleanly delegates to `backend/services/`, which interact with `backend/models/`.
- `pipeline/runner.py` acts as an orchestrator, correctly calling separate sub-packages (`ocr`, `extraction`, `compliance`, `risk`, `reports`).

### K. Circular Dependencies
- Zero circular dependencies detected in Python backend or pipeline (`import-cycle` check: clean).

### L. Confusing Import Paths
- Import paths in `backend/` and `pipeline/` use absolute module notation (e.g. `from backend.database import SessionLocal`, `from pipeline.ocr.factory import get_ocr_engine`). Clean and PEP 8 compliant.

### M. Dead Code
- `SIH26100.zip` in root: 2.1 MB untracked zip archive leftover from an earlier file bundle.
- Root `index.html`, `css/`, `js/`: Unused by FastAPI or Vite runtime.

### N. Unnecessary Generated Files
- Temporary SQLite databases and `__pycache__` artifacts are excluded by `.gitignore` but should be kept pruned.

### O. Temporary / Debug Files
- None currently committed to git.

### P. Inconsistent Naming Conventions
- In `docs/`: A mixture of kebab-case (`01-understanding-...`), UPPERCASE-KEBAB (`BUILD-STATUS.md`, `FEATURE-TRACEABILITY.md`), and camelCase.
- Recommendation: Standardize all official docs under categorized subdirectories with clean, UPPERCASE or Title markdown names.

### Q. Inconsistent Markdown Structure
- Some early docs lack breadcrumb navigation and cross-links back to `docs/README.md`.

### R. Confusing Developer Entry Points
- Previously, opening `docs/` showed 45 files in a single flat directory with no clear sequence. A new contributor could not tell whether to read `01-...`, `FINAL-ARCHITECTURE.md`, `ARCHITECTURE-LOCK.md`, or `DEVELOPER-GUIDE.md` first.

---

## 2. Prioritized Action Plan

### HIGH PRIORITY (Execute Immediately)
1. **Establish Documentation Subdirectories:**
   Create categorized folders:
   - `docs/architecture/` (System design, data flow, traceability, repository map)
   - `docs/development/` (Developer onboarding, "Where to change this", contracts)
   - `docs/ai/` (OCR, extraction, normalization, registry adapters)
   - `docs/compliance/` (Rule engine specifications)
   - `docs/risk/` (Risk scoring, anomaly detection, collusion graph)
   - `docs/evidence/` (Evidence model, PDF dossier contract)
   - `docs/security/` (Ingestion defense, security audit, authentication)
   - `docs/deployment/` (Setup, Docker, and environment configuration)
   - `docs/testing/` (Test specifications, release checklists, performance benchmarks)
   - `docs/archive/` (Historical research 00–06, old phase plans, superseded files)
2. **Create Central Documentation Entry Point (`docs/README.md`):**
   A human-centered index providing role-based navigation ("I am an SIH judge", "I am a new developer", "I want to modify a rule").
3. **Create Developer Navigation Assets:**
   - `docs/development/WHERE-TO-CHANGE.md` (Answers exactly where to make common code changes).
   - `docs/architecture/DATA-FLOW.md` (Visual, step-by-step pipeline input/output reference).
4. **Clean Root Directory Clutter:**
   - Move `index.html`, `css/`, and `js/` into `docs/archive/blueprint-viewer/`.
   - Remove `SIH26100.zip`.

### MEDIUM PRIORITY
1. **Humanize Core Markdown Documents:**
   - Rewrite dense, overly robotic sentences into clear, confident engineer-to-engineer prose.
   - Explain *why* before *how*.
   - Replace buzzwords with concrete descriptions.
2. **Create Refactoring Map (`docs/REFACTOR-MAP.md`):**
   - Document every moved, archived, or consolidated file to preserve project continuity.

### LOW PRIORITY
1. **Split Large Frontend Views:**
   - Defer `BidderDetailView.tsx` splitting to post-demo phase to preserve 100% test and UI stability during demo freeze.
