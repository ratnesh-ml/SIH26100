# VigilBid (SIH26100) — Architecture Lock Specification

**Status:** LOCKED  
**Version:** 1.0.0  
**Effective Date:** September 2026  
**Target:** SIH Grand Finale — Problem Statement SIH26100 (Chennai Petroleum Corporation Limited / Ministry of Petroleum & Natural Gas)

---

## 1. System Identity & Core Philosophy

VigilBid is an **AI-powered, buyer-side, human-in-the-loop decision-support platform** designed specifically for CPCL procurement officers evaluating two-bid tenders on GeM and CPPP portals.

### Immutable Principles
1. **Decision Support, Never Adjudication**: The platform never autonomously disqualifies or admits bidders. The system calculates findings, traffic lights (`PASS`, `WARN`, `REVIEW`, `FAIL`), and risk scores, but an officer must review and confirm every finding.
2. **Absolute Legal Vocabulary Ban**:
   - **Prohibited Words**: In no circumstance may user-facing UI, generated PDFs, or audit logs state that a document or bidder is "fraudulent", "fake", "forged", or "tampered".
   - **Enforced Terminology**: Use `"Recommended: Not Qualified — officer confirmation required"` or `"Potential anomaly detected — human verification required"`.
3. **Strict Separation of AI vs. Deterministic Code**:
   - **AI/ML Domain**: Unstructured and noisy data processing only (document classification via TF-IDF + Logistic Regression, scan OCR via PyMuPDF/PaddleOCR/Tesseract, fuzzy name resolution via RapidFuzz, and semantic search for Copilot).
   - **Deterministic Code Domain**: Everything with legal consequence (GSTIN/PAN/CIN/UDIN check-digits and checksums, threshold math, 34 YAML compliance rules, weighted risk score aggregation, and SHA-256 hash-chain audit logging).
4. **Air-Gap & Self-Containment**:
   - The entire core evaluation workflow functions with zero live external cloud API calls.
   - All government portal verifications (GSTN, PAN, MCA21, Udyam, CPPP Debarment) are routed through a provider abstraction (`RegistryProvider`) that defaults to local verified mock fixtures for the demo and air-gapped deployments.

---

## 2. Technology Stack Lock

| Layer | Locked Technology | Version / Spec |
|---|---|---|
| **Backend Framework** | FastAPI (ASGI) | Python 3.11+ / 3.12 |
| **Data Layer & ORM** | PostgreSQL + SQLAlchemy 2.0 (async + sync) | PostgreSQL 16, Alembic |
| **Validation & Serialization** | Pydantic | v2.x |
| **Frontend Framework** | Vite + React + TypeScript | React 18 / 19, TypeScript 5.x |
| **UI & Styling** | Tailwind CSS + shadcn/ui + Lucide Icons | Vanilla CSS tokens + Tailwind |
| **PDF Extraction & OCR** | PyMuPDF (fitz) + PaddleOCR PP-OCRv4 (Tesseract 5 fallback) | CPU optimized |
| **Entity Resolution** | RapidFuzz + Jaro-Winkler + PAN-in-GSTIN extraction | Python |
| **Graph Visualization** | NetworkX (backend) + Force Graph (frontend) | JSON node-link format |
| **Dossier Generation** | WeasyPrint / ReportLab fallback + Jinja2 | CVC/RTI-ready PDF format |
| **Security & Hashing** | Cryptography (Fernet) + SHA-256 Hash Chaining | HS256 JWT, Fernet encryption |

---

## 3. Subsystem Boundaries

```
SIH26100/
├── backend/          # REST API, DB models, auth, services, background workers
├── pipeline/         # 11-step document processing, extraction, compliance, risk
├── rules/            # YAML rule library (34 CPCL Goods rules, risk weights)
├── seed/             # Synthetic demo datasets, tender templates, fixtures
├── frontend/         # React SPA (8 MVP screens S1–S8)
├── tests/            # Unit, integration, and architecture contract tests
├── docs/             # Technical blueprints, architecture locks, status logs
├── scripts/          # Ops, startup checks, database initialization scripts
└── data/             # Local content-addressable storage & static fixtures
```

---

## 4. 11-Step Pipeline Lock

Every uploaded bidder document package must pass through the deterministic 11-step pipeline in sequential order:

1. **Step 1: Ingestion** — Safe ZIP decompression, zip-bomb defense, magic byte validation (`%PDF-`), and SHA-256 content hashing.
2. **Step 2: Classification** — Filename heuristics + TF-IDF Logistic Regression into 13 canonical document types.
3. **Step 3: Textification** — Direct text-layer extraction via PyMuPDF; falls back to OCR if character density < 50 chars/page.
4. **Step 4: Extraction** — Regex and anchor-based field extraction for 11 core document types with bounding-box tracking.
5. **Step 5: Normalization** — Canonical formatting of legal entities, dates (ISO 8601), financial amounts (INR Crores), and tax IDs.
6. **Step 6: Entity Resolution** — Cross-document entity parity (PAN vs. GSTIN chars 3-12, Token Set Ratio ≥ 85, CIN matching).
7. **Step 7: Verification** — Check-digit verification (GSTIN mod-36, PAN 4th letter), CPPP debarment check, and mock registry parity.
8. **Step 8: Compliance Rules** — Evaluation of 34 YAML compliance rules yielding `PASS`, `WARN`, `REVIEW`, or `FAIL` findings.
9. **Step 9: Anomaly Forensics** — PDF metadata discrepancy checks, xref table inspection, and prompt injection scanning.
10. **Step 10: Risk Scoring** — Transparent weighted sum aggregation (0–100) with explainable driver points.
11. **Step 11: Explanations & Packaging** — Generation of human-readable finding summaries citing specific GFR, CVC, or BEC clauses.

---

## 5. Scope Boundary (MVP Cut-Line)

The following items are **explicitly cut from the 36-hour MVP scope**:
- Direct live GeM/CPPP portal scraping or dynamic headless browser automation during evaluation.
- Autonomous disqualified bidder notifications or automatic bid rejection emails.
- GPU-dependent Vision LLMs (e.g. Donut, LayoutLMv3 fine-tune).
- Multi-region or Kubernetes cluster deployments (local Docker Compose suffices).
