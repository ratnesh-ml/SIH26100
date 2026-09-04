# Current Repository Audit & Component Classification

**Audit Date:** September 2026  
**Auditor:** Principal Software Architect & Repository Organization Engineer  
**Status:** Pre-restructuring phase audit  

---

## 1. Top-Level Directory Audit

| Path | Purpose | Classification | Actively Used? | Dependencies | Recommendation |
|---|---|---|---|---|---|
| `.github/` | CI/CD GitHub Actions workflows (`ci.yml`) | **REQUIRED INFRASTRUCTURE** | Yes | GitHub Actions runner | **STAY** in root. |
| `alembic/` | Alembic database migration environment (`env.py`, `versions/`) | **REQUIRED INFRASTRUCTURE** | Yes | SQLAlchemy models, Alembic CLI | **STAY or MOVE** to `database/migrations/` (ensuring CLI & scripts match). |
| `backend/` | FastAPI ASGI REST API, services, models, schemas, auth | **ACTIVE** | Yes | Python 3.11, Uvicorn, SQLAlchemy | **STAY** (clean application package). |
| `data/` | Content-addressable document storage (`data/storage/`) | **ACTIVE** | Yes | Document ingestion service | **STAY**. |
| `docs/` | Categorized technical specifications, guides, ADRs | **DOCUMENTATION** | Yes | Markdown viewers, developers | **STAY** (keep centralized hub). |
| `frontend/` | React 18 + Vite + TypeScript web client | **ACTIVE** | Yes | Node 20, Vite, Tailwind CSS | **STAY** (clean web app). |
| `pipeline/` | 11-step document processing, OCR, extraction, rules, risk | **ACTIVE** | Yes | PyMuPDF, Tesseract, NetworkX | **STAY** (modular computational core). |
| `research/` | Research audit dump and background benchmarks | **DOCUMENTATION / RESEARCH** | Reference | None (non-runtime) | **STAY** (keep separate from runtime code). |
| `rules/` | Declarative YAML criteria (`cpcl_goods_v1.yaml`) | **ACTIVE** | Yes | Rule evaluation engine | **STAY** (declarative domain rules). |
| `scripts/` | Seeding, health checking, and release audit runners | **ACTIVE** | Yes | Python runtime | **STAY**. |
| `seed/` | Demo PDF packages and mock registry fixtures | **ACTIVE** | Yes | `demo_setup.py`, unit tests | **STAY** (essential for zero-network demo). |
| `tests/` | Pytest backend test suite (353 tests) | **ACTIVE** | Yes | Pytest, FastAPI TestClient | **STAY**. |
| `archive/` | Historical blueprints, legacy marked.js viewer | **LEGACY / ARCHIVE** | No (Historical) | None | **CREATE** dedicated top-level `archive/legacy-ui/`. |

---

## 2. Suspicious File & Directory Deep-Dive

| Item | Found Location | Exact Nature | Category | Disposition & Action |
|---|---|---|---|---|
| `index.html`, `css/`, `js/` | Formerly in root; now staged in `docs/archive/blueprint-viewer/` | Offline marked.js viewer for markdown blueprints from early project phase | **LEGACY** | **MOVE to `archive/legacy-ui/`** with explanatory `README.md`. |
| `alembic/` | Root-level directory | Database migration versions and SQLAlchemy environment scripts | **REQUIRED INFRASTRUCTURE** | **PRESERVE** compatibility; keep `alembic.ini` referenced cleanly. |
| `seed/` | Root-level directory | Contains 26 realistic synthetic PDF bidder packages (`seed/demo_packages/`) and mock registry JSON files (`seed/mock_fixtures/`) | **ACTIVE** | **ACTIVE**: Test suite and `scripts/demo_setup.py` explicitly load from `seed/`. Keep intact. |
| `pipeline/` | Root-level directory | 11 discrete, idempotent document scrutiny steps (OCR, classifier, extractors, entity resolution, risk, dossier) | **ACTIVE** | **ACTIVE**: Used directly by `worker.py` and `backend/services/`. Keep modular. |
| `rules/` | Root-level directory | Contains `cpcl_goods_v1.yaml` (34 statutory GFR/CPCL rules) | **ACTIVE** | **ACTIVE**: Pure declarative rules, cleanly decoupled from Python code. |
| `research/` | Root-level directory | Contains `sih26100-research-dump.txt` | **DOCUMENTATION / RESEARCH** | **ACTIVE REFERENCE**: Preserves provenance without contaminating production code. |
| `worker.py` | Root-level file | Background worker process consuming queued evaluation jobs | **ACTIVE** | **ACTIVE**: Entry point for asynchronous pipeline execution. |
| `docker-compose.yml` | Root-level file | 4-container production deployment stack | **REQUIRED INFRASTRUCTURE** | **ACTIVE**: Defines web, api, db, and worker services. |
| `alembic.ini` | Root-level file | Database migration configuration file | **REQUIRED INFRASTRUCTURE** | **ACTIVE**: Used by `alembic upgrade head`. |

---

## 3. Structural Decision
The repository structure is fundamentally sound as a **Modular Monolith**:
- Moving `backend/` or `pipeline/` into deep arbitrary nested folders (e.g. `apps/api/app/...` or `services/...`) would break dozens of absolute imports, Alembic migration paths, and Docker compose volumes with zero functional benefit.
- Moving `frontend/` into `apps/web/` would break Dockerfile references and npm package paths.
- Instead, the cleanest, safest, and most professional architecture is:
  1. Move legacy UI files (`index.html`, `css/`, `js/`) into a dedicated `archive/legacy-ui/` directory with a full `archive/README.md`.
  2. Keep active core pillars (`backend/`, `pipeline/`, `frontend/`, `rules/`, `seed/`, `data/`, `tests/`, `scripts/`, `docs/`, `research/`) cleanly documented and cross-linked.
  3. Author `docs/architecture/TARGET-REPOSITORY-MAP.md` and `docs/development/WHERE-EVERYTHING-LIVES.md`.
