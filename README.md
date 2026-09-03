# VigilBid — AI-Powered GeM Tender Evaluation Platform (SIH26100)

**Problem Statement:** SIH26100 — AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement  
**Target Organization:** Chennai Petroleum Corporation Limited (CPCL) · IndianOil Group · Ministry of Petroleum & Natural Gas  

VigilBid is a buyer-side, human-in-the-loop decision-support platform that automates two-bid tender evaluation under GFR 2017 and CVC guidelines. It ingests bidder document packages (ZIP of PDFs), performs hybrid AI extraction and deterministic compliance rule verification, calculates explainable risk scores, and produces tamper-evident SHA-256 hash-chained compliance dossiers.

---

## 1. Repository Architecture

```
SIH26100/
├── backend/          # FastAPI ASGI application, DB models (17 tables), schemas, auth, and worker
├── pipeline/         # 11-step document processing, OCR, extraction, compliance, risk, and reports
├── rules/            # Declarative YAML rule definitions (34 CPCL Goods rules) and risk weights
├── seed/             # Synthetic tender templates, 4+1 bidder datasets, and mock registry fixtures
├── frontend/         # Vite + React 18 + TypeScript SPA (8 MVP screens S1–S8)
├── tests/            # Automated test suite (unit, integration, and architecture contracts)
├── docs/             # Technical specifications, architecture locks, and build status logs
├── scripts/          # Ops scripts, Windows PowerShell helper (dev.ps1), and structure validators
└── data/             # Content-addressable document storage (data/storage/) and fixtures
```

See [docs/REPOSITORY-STRUCTURE.md](docs/REPOSITORY-STRUCTURE.md) for full folder and module descriptions.

---

## 2. Quickstart & Local Development

### Option A: Single-Command Docker Deployment (Recommended)

To start the entire platform (PostgreSQL 16, FastAPI Backend, Vite Frontend, and Background Worker) in isolated network containers:

```bash
# 1. Clone the repository
git clone https://github.com/ratnesh-ml/SIH26100.git
cd SIH26100

# 2. Configure environment (defaults work out-of-the-box)
cp .env.example .env

# 3. Build and launch all 4 services
docker compose up --build
```

**Services Running:**
| Service | Endpoint / Port | Description |
|---|---|---|
| **Frontend SPA** | `http://localhost:5173` | React 18 + Vite development client |
| **Backend API** | `http://localhost:8000` | FastAPI ASGI REST application |
| **Interactive API Docs** | `http://localhost:8000/api/v1/docs` | Swagger / OpenAPI UI |
| **System Health Check** | `http://localhost:8000/health` | Active live database & service health probe |
| **Database** | `localhost:5432` | PostgreSQL 16 Alpine container (`vigilbid_db`) |
| **Background Worker** | Container `vigilbid_worker` | Asynchronous 11-step pipeline job poller |

To stop all services:
```bash
docker compose down
```

---

### Option B: Local Host Development (Zero-Docker)

For local development directly on the host machine:

#### 1. Setup Environment
```bash
# Copy default local configuration
cp .env.example .env

# Install backend dependencies
python -m pip install -r requirements.txt

# Install frontend dependencies
cd frontend && npm install && cd ..
```

#### 2. Run Verification & Test Suites
```bash
# Cross-platform / POSIX:
python scripts/verify_structure.py
pytest tests/ -v

# Or via Makefile:
make verify
make test

# Or on Windows PowerShell:
.\scripts\dev.ps1 verify
.\scripts\dev.ps1 test
```

#### 3. Start Development Services Individually
```bash
# Terminal 1: Backend API server
uvicorn backend.main:app --reload --port 8000

# Terminal 2: Pipeline Background Worker
python worker.py

# Terminal 3: Frontend Client
cd frontend && npm run dev
```

---

## 3. Key Architectural Principles

1. **Decision Support, Never Adjudication**: System outputs traffic-light statuses (`PASS`, `WARN`, `REVIEW`, `FAIL`) and `"Recommended: Not Qualified — officer confirmation required"`. The platform never autonomously disqualifies or accuses any bidder.
2. **Strict Legal Vocabulary Ban**: The words "fraud", "fake", "forged", and "tampered" are strictly prohibited in all user-facing UI, generated PDFs, and audit trails. Anomaly signals are described neutrally as `"Potential anomaly detected — human verification required"`.
3. **Hybrid AI + Deterministic Separation**: AI is utilized strictly where inputs are noisy and unstructured (PDF text extraction, scan OCR, fuzzy entity matching, and semantic search). Deterministic code strictly governs anything with legal weight (tax checksums, GFR/CVC rule evaluation, risk score aggregation, and SHA-256 audit chaining).
4. **Air-Gap Readiness**: Verification interfaces (`RegistryProvider`) operate with local synthetic fixtures (`seed/mock_fixtures`) to ensure zero failure risk during network-isolated live pitches.

---

## 4. Documentation Index

- [docs/BUILD-STATUS.md](docs/BUILD-STATUS.md): Current build status, completed phases, and transition backlog.
- [docs/ARCHITECTURE-LOCK.md](docs/ARCHITECTURE-LOCK.md): Immutable architectural specifications and MVP scope cut-line.
- [docs/INTERFACE-CONTRACTS.md](docs/INTERFACE-CONTRACTS.md): 24 REST API endpoint contracts, 11-step pipeline signatures, and audit event format.
- [docs/REPOSITORY-STRUCTURE.md](docs/REPOSITORY-STRUCTURE.md): Detailed module directory documentation.
- [index.html](index.html): Interactive browser-based viewer for blueprint documents.
