# VigilBid (SIH26100) — Developer Onboarding & Technical Guide

Welcome to the VigilBid developer guide! This document provides an engineering overview of the codebase, local setup instructions, testing conventions, and debugging guidelines.

---

## 1. Codebase Architecture & Anatomy

VigilBid is structured as a **clean modular monolith**:
- **Backend API (`backend/`):** FastAPI ASGI application exposing 24 REST endpoints, SQLAlchemy 2.0 ORM with 17 relational tables, JWT authentication, and RBAC.
- **Processing Pipeline (`pipeline/`):** 11 sequential, idempotent processing steps executed by an asynchronous background worker or in synchronous test mode.
- **Rules Definitions (`rules/`):** Declarative YAML rule definitions (`rules/cpcl_goods_rules.yaml`) representing 34 CPCL Goods eligibility requirements under GFR 2017.
- **Frontend SPA (`frontend/`):** React 18 SPA built with Vite and TypeScript, featuring a dark-mode, high-density vigilance cockpit designed for procurement officers.
- **Automated Tests (`tests/`):** 350+ unit and integration tests across pipeline steps, database models, security defenses, and API routers.

For a comprehensive breakdown of all directories and submodules, see [docs/architecture/REPOSITORY-MAP.md](../architecture/REPOSITORY-MAP.md).

---

## 2. Local Setup & Environment

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm 9+
- SQLite (included out-of-the-box for development) or PostgreSQL 16
- *(Optional)* Docker and Docker Compose

### Step 1: Clone and Configure
```bash
git clone https://github.com/ratnesh-ml/SIH26100.git
cd SIH26100

# Copy development environment file
cp .env.example .env
```

### Step 2: Backend Dependencies & DB Migrations
```bash
python -m pip install -r requirements.txt

# Run Alembic database migrations
alembic upgrade head
```

### Step 3: Frontend Dependencies
```bash
cd frontend
npm install
cd ..
```

### Step 4: Seed Demo Data
Populate the database with the CPCL Centrifugal Pump tender and 5 realistic evaluation packages:
```bash
python scripts/demo_setup.py
```

---

## 3. Running Development Services

You can run the full platform using three independent terminal sessions:

### Terminal 1: Backend FastAPI Server
```bash
uvicorn backend.main:app --reload --port 8000
```
- API root: `http://localhost:8000`
- Interactive Swagger UI: `http://localhost:8000/api/v1/docs`
- Health probe: `http://localhost:8000/health`

### Terminal 2: Pipeline Background Worker
```bash
python worker.py
```
- Polls the `evaluation_jobs` table for queued bid packages, runs the 11-step analysis pipeline, and updates finding statuses in real time.

### Terminal 3: Frontend Vite Client
```bash
cd frontend
npm run dev
```
- SPA client: `http://localhost:5173`
- Guided interactive demo: `http://localhost:5173/#/demo`

---

## 4. Subsystem Deep Dives & References

Instead of duplicating deep architectural rationale here, refer directly to our authoritative subsystem specifications:

| Subsystem | Core Module | Detailed Documentation |
|---|---|---|
| **API & Contracts** | `backend/api/` | [docs/api/FINAL-API.md](../api/FINAL-API.md) |
| **Database & Schema** | `backend/models/` | [docs/database/FINAL-DATABASE.md](../database/FINAL-DATABASE.md) |
| **Document Ingestion** | `pipeline/document_processing/ingest.py` | [docs/security/SECURITY.md](../security/SECURITY.md) & [docs/security/SECURITY-AUDIT.md](../security/SECURITY-AUDIT.md) |
| **OCR & Text Extraction** | `pipeline/ocr/` | [docs/ai/OCR.md](../ai/OCR.md) & [docs/decisions/ADR-002-ocr-abstraction.md](../decisions/ADR-002-ocr-abstraction.md) |
| **Entity Resolution** | `pipeline/entity_resolution/` | [docs/ai/NORMALIZATION.md](../ai/NORMALIZATION.md) |
| **Registry Adapters** | `pipeline/registry_adapters/` | [docs/ai/REGISTRY.md](../ai/REGISTRY.md) & [docs/decisions/ADR-003-mock-government-registries.md](../decisions/ADR-003-mock-government-registries.md) |
| **Compliance Rules** | `pipeline/compliance/engine.py` | [docs/compliance/RULE-ENGINE.md](../compliance/RULE-ENGINE.md) & [docs/decisions/ADR-004-deterministic-compliance-engine.md](../decisions/ADR-004-deterministic-compliance-engine.md) |
| **Anomaly Detection** | `pipeline/risk/anomaly.py` | [docs/risk/ANOMALIES.md](../risk/ANOMALIES.md) |
| **Risk Scoring** | `pipeline/risk/scorer.py` | [docs/risk/RISK-ENGINE.md](../risk/RISK-ENGINE.md) & [docs/decisions/ADR-008-risk-methodology.md](../decisions/ADR-008-risk-methodology.md) |
| **Evidence System** | `pipeline/evidence/` | [docs/evidence/EVIDENCE.md](../evidence/EVIDENCE.md) & [docs/decisions/ADR-005-evidence-first-architecture.md](../decisions/ADR-005-evidence-first-architecture.md) |
| **Cryptographic Audit** | `backend/services/audit_service.py` | [docs/decisions/ADR-006-human-in-the-loop-decisions.md](../decisions/ADR-006-human-in-the-loop-decisions.md) |
| **PDF Dossier Reports** | `pipeline/reports/` | [docs/evidence/PDF-CONTRACT.md](../evidence/PDF-CONTRACT.md) |

---

## 5. Running Automated Tests

VigilBid maintains strict test discipline across unit, integration, and release tiers:

```bash
# 1. Run all backend tests with coverage
pytest tests/ -v

# 2. Run frontend component tests and UI integrity checks
cd frontend && npm test && cd ..

# 3. Run the automated 20-subsystem release certification audit
python scripts/release_audit.py
```

Expected output:
- **Backend Tests:** 380 passed (100%)
- **Frontend Tests:** 70 passed (100%)
- **Release Audit:** 20/20 subsystems verified (100%)

---

## 6. Common Debugging Workflows

### Resetting the Database & Reseeding
If you need to return the local environment to a pristine state:
```bash
# Remove local SQLite database if using SQLite
rm -f vigilbid.db

# Re-run migrations and demo setup
alembic upgrade head
python scripts/demo_setup.py
```

### Inspecting Background Pipeline Jobs
Run the pipeline in synchronous mode directly in Python for interactive debugging:
```python
import asyncio
from pipeline.orchestrator import PipelineOrchestrator

# Run pipeline directly on a bidder
orchestrator = PipelineOrchestrator()
asyncio.run(orchestrator.process_bidder(bidder_id="<BIDDER_UUID>"))
```

### Verifying Cryptographic Audit Ledger Integrity
To programmatically check whether any log entry has been tampered with:
```bash
python -c "from backend.database import SessionLocal; from backend.services.audit_service import AuditService; db = SessionLocal(); print('Audit ledger valid:', AuditService(db).verify_chain_integrity())"
```
