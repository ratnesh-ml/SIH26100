# Project Archive — VigilBid (SIH26100)

This directory contains historical prototypes, superseded specifications, and early research artifacts retained for project evolution provenance and academic reference.

> [!WARNING]
> **NOT FOR PRODUCTION OR RUNTIME USE.** Nothing inside `archive/` is imported, executed, or mounted by the active FastAPI backend, Vite web client, background workers, or automated CI test suites.

---

## Catalog of Archived Assets

1. **`archive/legacy-ui/`:**
   - Contains the initial Phase-0 offline marked.js browser (`index.html`, `css/`, `js/`) used prior to the development of the React 18 SPA client in `frontend/`.
   - See [archive/legacy-ui/README.md](legacy-ui/README.md) for full context.

2. **`docs/archive/`:**
   - Contains early phase research audits (`00-research-audit.md` through `06-demo-...`).
   - Intermediate development phase plans (`PHASE-47-PLAN.md`, `PHASE-47-WALKTHROUGH.md`, `E2E-DEMO-RESULTS.md`).
   - Early API and schema drafts superseded by authoritative contracts in `docs/api/`, `docs/database/`, and `docs/architecture/`.

---

## Archival Policy
- Files are moved to `archive/` only after verifying via static code analysis that zero runtime imports or test runners reference them.
- Commit history remains preserved via git movements.
