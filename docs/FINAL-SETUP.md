# VigilBid (SIH26100) — Final Setup & Operations Guide

**Document Version:** 1.0.0 (Final Release Baseline)  
**Date:** September 2026  
**Target:** Smart India Hackathon 2026 Grand Finale — Problem Statement SIH26100  
**Ministry / PSU:** Ministry of Petroleum & Natural Gas / Chennai Petroleum Corporation Limited (CPCL)  
**Classification:** Operational Deployment & Demonstration Setup Runbook  

---

## 1. System Requirements & Prerequisites

| Resource | Minimum (Evaluation Laptop) | Recommended (Production / VPS) |
|---|---|---|
| **Operating System** | Windows 10/11, Ubuntu 22.04 LTS, or macOS 13+ | Ubuntu 22.04 / 24.04 LTS Linux |
| **CPU Architecture** | 4-Core x86_64 or Apple Silicon (M1/M2/M3) | 8-Core Intel Xeon or AMD EPYC |
| **Memory (RAM)** | 8 GB RAM | 16 GB to 32 GB RAM |
| **Disk Storage** | 5 GB free SSD storage | 50 GB NVMe SSD storage |
| **Python Runtime** | Python 3.11.x or 3.12.x | Python 3.11.x (Containerized) |
| **Node.js Runtime** | Node.js 18.x or 20.x + npm 9+ | Node.js 20.x LTS |
| **Container Engine** | Optional (Docker Desktop 4.x+) | Docker 24.x+ with Docker Compose v2 |

---

## 2. Quick-Start Modes

VigilBid provides two official execution models:
1. **Zero-Docker Embedded Mode (Recommended for Hackathon Juries & Laptop Demos):** Runs locally on bare metal in under 6 seconds using an embedded SQLite engine and pre-rendered page cache. Requires no Docker daemon, no PostgreSQL container, and zero external network access.
2. **Multi-Service Docker Compose Mode (Recommended for VPS Staging & Enterprise Audits):** Boots 4 orchestrated containers (`db` $\rightarrow$ `backend` $\rightarrow$ `worker` + `frontend`) with strict health gating.

---

## 3. Mode A: Single-Command Local Setup (Zero-Docker)

### Step 1: Clone Repository & Create Virtual Environment
```bash
git clone https://github.com/ratnesh-ml/SIH26100.git
cd SIH26100

# Create and activate Python virtual environment
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On Linux/macOS:
source .venv/bin/activate
```

### Step 2: Install Dependencies
```bash
# Install backend and pipeline dependencies
pip install -r requirements.txt

# Install frontend dependencies (if developing or rebuilding SPA)
cd frontend
npm install
npm run build
cd ..
```

### Step 3: Initialize, Reset & Precompute Demo Data (< 6 Seconds)
```bash
python scripts/demo_setup.py --reset --seed-only
```
**What this single command executes in 5.4 seconds:**
* Drops existing tables and creates fresh schema tables with dialect-adaptive UUIDs and BigIntegers.
* Seeds 4 PBKDF2-hashed user accounts (`officer`, `evaluator`, `vigilance`, `admin`).
* Seeds CPCL Refinery Pump Tender `NIT CPCL/MM/2026/PUMP-217` with 8 statutory criteria.
* Seeds 5 realistic presentation bidders (Meridian, Kaveri, Bharat Hydro, Nova Pumps, Zenith).
* Ingests 26 statutory PDF filings into CAS storage with SHA-256 integrity verification.
* Verifies 5 mock registry fixtures (GSTN, MCA21, PAN, Udyam, Debarment) with `'Simulated registry (demo)'` tags.
* Evaluates 40 criteria findings, 3 forensic anomalies, 13 risk drivers, and 5 officer decisions.
* Assembles an unbroken cryptographic SHA-256 forward audit hash chain from Genesis.
* Pre-renders and caches 150 DPI page PNGs for instantaneous document rendering.

### Step 4: Launch Web Application
```bash
python scripts/demo_setup.py --port 8000
```
* **Web UI (SPA):** Open `http://localhost:8000` in Google Chrome or Microsoft Edge.
* **REST API Swagger:** `http://localhost:8000/docs`
* **Health Check:** `http://localhost:8000/health`
* **Login:** Click "Login as Officer" (`officer@cpcl.gov.in` / `Officer@123`).

---

## 4. Mode B: Multi-Service Docker Compose Setup

### Step 1: Configure Environment
```bash
copy .env.example .env
```
*(On Linux: `cp .env.example .env`)*

### Step 2: Build & Start Containerized Stack
```bash
docker compose up --build -d
```
* **Health-Gated Startup Sequence:**
  1. `db`: Initializes PostgreSQL 16 on port 5432 and waits for healthy status.
  2. `backend`: Migrates schema via Alembic and serves FastAPI on port 8000.
  3. `worker`: Connects to PostgreSQL queue and starts background processing loop.
  4. `frontend`: Nginx serves the optimized production React SPA on port 80.

### Step 3: Seed Docker Environment
```bash
docker compose exec backend python scripts/demo_setup.py --reset --seed-only
```

---

## 5. Diagnostic & Verification Tooling

### 5.1 Automated 20-Subsystem Release Audit (< 8 Seconds)
Run the automated release audit to verify all 20 critical operational subsystems and execute the 8-step end-to-end officer walkthrough:
```bash
python scripts/release_audit.py
```
*Expected Output:*
```
================================================================================
  RELEASE AUDIT SUMMARY: 20/20 SUBSYSTEMS VERIFIED (7.99s)
================================================================================
  >>> ALL 20 RELEASE REQUIREMENTS SATISFIED. SYSTEM PRODUCTION-READY. <<<
```

### 5.2 Pre-Flight Diagnostic Health Check
```bash
python scripts/health_check.py
```
* Checks Python runtime, library dependencies, cryptographic encryption keys, CAS storage directory permissions, database connectivity, YAML compliance rules, demo seed files, and frontend build bundles.

### 5.3 Deterministic Snapshot Backup & Restore
```bash
# Create an immutable JSON snapshot of all database records:
python scripts/backup_restore.py backup

# Restore database from snapshot with SHA-256 audit chain verification:
python scripts/backup_restore.py restore
```

---

## 6. Environment Configuration Parameters (`.env.example`)

| Variable | Default Value | Operational Purpose |
|---|---|---|
| `SERVER_HOST` | `0.0.0.0` | Backend API bind interface |
| `SERVER_PORT` | `8000` | Backend HTTP port |
| `SECRET_KEY` | `dev-insecure-secret-key-change-in-production-min-32-chars!` | JWT signing secret key |
| `ENCRYPTION_KEY` | `rV_xSgZ4T5P7z3q8L0bNmW6vC1yUiO9hAkFeR2jDt4E=` | AES-128 Fernet key for encrypting tax IDs |
| `DATABASE_URL` | `postgresql+asyncpg://vigilbid:vigilbid_secret@localhost:5432/vigilbid` | PostgreSQL async connection string |
| `CAS_STORAGE_PATH` | `./data/storage/cas` | Content-Addressable Storage directory for PDFs |
| `PAGE_CACHE_PATH` | `./data/storage/_page_cache` | 150 DPI pre-rendered raster page cache |
| `OCR_PROVIDER` | `paddleocr` | Primary OCR engine (`paddleocr`, `tesseract`, `fallback`) |
| `COPILOT_ENABLED` | `true` | Enables statutory Procurement Copilot RAG |
| `REGISTRY_MODE` | `mock` | Registry mode (`mock` fixture simulation or `real`) |

---

## 7. Setup & Operations Categorization Matrix

| Operational Subsystem | What We Built | What Is Simulated | What Is Research-Backed | What Is An Engineering Decision | What Is Not Implemented | What Is Required for Production |
|---|---|---|---|---|---|---|
| **Single-Command Seeder** | `scripts/demo_setup.py`: Complete 9-stage orchestrator; drops, migrates, seeds, adjudicates, hash-chains, and caches in 5.48s. | None. Operational orchestration scripts execute real application services. | DevOps Twelve-Factor App principles on disposable and fast-booting environments. | Unified script with `--reset` and `--seed-only` flags supporting both zero-Docker and containerized flows. | Web-based visual tenant onboarding wizard. | Automated Terraform/Ansible infrastructure-as-code provisioning scripts. |
| **Docker Compose Stack** | 4-service topology (`db`, `backend`, `worker`, `frontend`); health-check dependency gating. | None. Actual Docker images build and execute. | Production containerization best practices for web micro-services. | Strict health-check gating prevents cold-start race conditions between worker and database. | Kubernetes Helm charts and operators. | Production Kubernetes manifests with Horizontal Pod Autoscaling (HPA) and TLS ingress. |
| **Zero-Docker Standalone Mode** | SQLite fallback engine automatically detected and mounted if PostgreSQL container is offline. | None. Real SQLite 3 engine writes to `data/vigilbid.db`. | Hackathon demo reliability engineering: eliminate external software dependencies on presentation laptops. | Adaptive dialect layer (`BIGINT_PK`, `Uuid`) enabling identical model execution on SQLite and Postgres. | Distributed SQLite clustering (LiteFS). | Not applicable: PostgreSQL is strictly mandated for multi-user production deployments. |
| **Diagnostic Preflight CLI** | `scripts/health_check.py`: 7-stage preflight tool testing runtime, keys, permissions, DB, rules, and seed files. | None. Real operational diagnostics. | Site Reliability Engineering (SRE) pre-flight readiness verification. | Standalone CLI that can be run before entering the presentation hall to guarantee 100% readiness. | Automated self-healing daemon. | Integration with enterprise PagerDuty / Datadog alerting systems. |
| **Snapshot Backup & Restore** | `scripts/backup_restore.py`: Standalone JSON snapshot backup/restore engine with SHA-256 audit verification. | None. Full JSON serialization and cryptographic hash chain verification. | Disaster recovery and immutable state snapshotting in critical procurement systems. | Fast file-based snapshotting allowing zero-downtime restoration in under 2 seconds. | Continuous Write-Ahead Log (WAL) archiving. | Automated point-in-time recovery (PITR) with encrypted Amazon S3 / Google Cloud Storage off-site backups. |
| **Automated Release Audit** | `scripts/release_audit.py`: 20-subsystem verification suite testing every layer in 7.99s. | None. Real HTTP and service calls execute live. | Test-Driven Development (TDD) and continuous release compliance auditing. | Single automated audit script that combines unit verification with an 8-step live E2E officer demo. | Chaos engineering fault injection tests. | Full CI/CD automated pipeline running on GitHub Actions runners with staging deployment gates. |

---

**Setup Status:** Verified, Automated, and Frozen for SIH 2026 Grand Finale.
