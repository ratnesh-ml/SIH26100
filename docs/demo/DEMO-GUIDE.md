# VigilBid — Demonstration & Evaluation Walkthrough Guide

**Document Version:** 1.0.0 (Release Baseline)  
**Target Domain:** Public Sector Procurement & Statutory Vigilance  
**Target Reference Tender:** `CPCL/MM/2026/PUMP-217` — 12 API-610 Centrifugal Process Pumps (₹18.40 Crores)  
**Core Principle:** *"AI assists. Rules verify. Evidence explains. Officer decides."*

---

## 1. Executive Summary

This guide provides a comprehensive, step-by-step walkthrough for evaluating the VigilBid platform. It explains the end-to-end evaluation flow, describes what the demonstration proves, details the synthetic data scenarios, and highlights what reviewers should observe at each stage.

### What the Demonstration Proves
1. **Safe Ingestion & Document Intelligence:** Untrusted multi-document archives are safely ingested, fingerprinted via SHA-256 for Content-Addressable Storage (CAS), classified across 13 Indian statutory document types, and parsed via hybrid PyMuPDF + Tesseract OCR.
2. **Cross-Document Entity Resolution:** Inconsistencies between tax identifiers (e.g. standalone PAN vs PAN embedded in GSTIN) and legal entity names are resolved mathematically without probabilistic drift.
3. **Deterministic Rule Execution:** 34 CPCL Goods criteria under GFR 2017 are evaluated deterministically with auditable pass/warn/review/fail outcomes.
4. **Explainable Risk Scoring:** 0–100 composite risk scores decompose into transparent Identity, Financial, Compliance, and Anomaly factor contributions.
5. **Split-Screen Evidence Inspection:** Every finding links directly to the exact source PDF, page number, and bounding box coordinates.
6. **Governed Human Decision Authority:** Officers can accept findings or record overrides with mandatory statutory written justifications.
7. **Tamper-Evident Cryptographic Auditability:** Every action is committed to an immutable SHA-256 hash-chained ledger that can be verified at runtime in milliseconds.

---

## 2. Quick Demonstration Launch Options

### Option A: Interactive Zero-Setup Guided Tour (Recommended)
1. Start the application services:
   ```bash
   uvicorn backend.main:app --port 8000
   cd frontend && npm run dev
   ```
2. Navigate directly to:
   ```
   http://localhost:5173/#/demo
   ```
   *No login or authentication required. The guided tour demonstrates all 5 vendor scenarios with interactive telemetry.*

### Option B: Full Procurement Officer Evaluation
1. Initialize pristine demo data:
   ```bash
   python scripts/demo_setup.py
   ```
2. Open `http://localhost:5173` and log in with default evaluation credentials:
   - **Procurement Officer:** `officer@cpcl.gov.in` / `Officer@123`
   - **Vigilance Officer (CVO):** `vigilance@cpcl.gov.in` / `Vigilance@123`
   - **System Administrator:** `admin@cpcl.gov.in` / `Admin@123`

---

## 3. Synthetic Demonstration Dataset

All demonstration vendor packages, tax identifiers, financial certificates, and statutory responses are synthetic and provided exclusively for demonstration and evaluation:

| Vendor Package | Status | Risk Score | Evaluation Scenario |
|---|---|---|---|
| **1. Meridian Flow Systems Pvt Ltd** | `PASS` | `0.0 (LOW)` | Clean, fully compliant Tier-1 centrifugal pump manufacturer. |
| **2. Sri Kaveri Engineering Works** | `WARN / REVIEW` | `22.0 (LOW)` | Minor MSE legal suffix variance (`LLP` vs `Limited Liability Partnership`); turnover requirement exempted under GFR Rule 153. |
| **3. Bharat Hydrotech Corp** | `FAIL` | `65.0 (HIGH)` | Hard PAN-in-GSTIN mismatch (`AAACB1234F` vs `AAACB9999F`) and local content deficit (45% declared vs 50% Class-I requirement). |
| **4. Nova Pumps & Systems Ltd** | `REVIEW` | `76.5 (HIGH)` | Format-compliant submission flagged for PDF metadata modification (GIMP graphic editor) and indirect prompt injection in technical text. |
| **5. Zenith Infra Tech Pvt Ltd** | `FAIL` | `95.0 (HIGH)` | Cancelled GSTIN registration and active CVC debarment listing under GFR Rule 151. |

---

## 4. Step-by-Step Evaluation Walkthrough

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ 1. Dashboard │ ──> │ 2. Ingestion │ ──> │ 3. Extraction│ ──> │ 4. Resolution│ ──> │ 5. Compliance│
│  & Overview  │     │   Security   │     │   & OCR      │     │  & Registry  │     │   & Risk     │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
                                                                                           │
                                  ┌─────────────────────────┐     ┌────────────────────────┴────┐
                                  │ 7. Audit Verification   │ <── │ 6. Split-Screen Evidence    │
                                  │    & Dossier Export     │     │    & Human Adjudication     │
                                  └─────────────────────────┘     └─────────────────────────────┘
```

### Stage 1: Executive Scrutiny Dashboard
- **Route:** `/dashboard` or `/`
- **What to Observe:** Portfolio-level overview of active tenders, bidder qualification distribution, average processing time, and real-time audit ledger health.
- **Key Insight:** Clear distinction between compliant bids and high-risk submissions requiring immediate officer scrutiny.

### Stage 2: Safe Document Ingestion & Archive Defense
- **Route:** `/tenders/CPCL-PUMP-217` $\rightarrow$ Document Upload Modal
- **What to Observe:** Ingestion gateway validates magic bytes (`%PDF-`), calculates SHA-256 digests for Content-Addressable Storage (CAS), and enforces a maximum 100:1 archive decompression ratio to prevent zip bombs.
- **Key Insight:** Untrusted vendor archives are isolated and fingerprinted before downstream processing begins.

### Stage 3: Document Intelligence & Hybrid OCR
- **Route:** Pipeline Stepper View
- **What to Observe:** Automatic classification of 13 statutory document types (GST REG-06, PAN cards, Udyam MSME certificates, CA turnover balance sheets) using TF-IDF tokenization. Native text layers are extracted in milliseconds via PyMuPDF with deterministic fallback to Tesseract 5.0 for scanned pages.
- **Key Insight:** Text and bounding-box word coordinates are preserved for evidence mapping.

### Stage 4: Cross-Document Entity Resolution & Registry Verification
- **Route:** Bidder Scrutiny Cockpit $\rightarrow$ Identity & Entity Grid
- **What to Observe:**
  - *Sri Kaveri Engineering Works:* Jaro-Winkler string similarity (0.82) handles legitimate legal entity name abbreviation drift and normalizes corporate suffixes.
  - *Bharat Hydrotech Corp:* Catches structural mismatch between standalone PAN (`AAACB1234F`) and GSTIN characters 3–12 (`AAACB9999F`).
  - *Registry Verification:* Mock adapters cross-reference identifiers against GSTN, PAN, MCA-21, Udyam, and CVC Debarment sandbox datasets with clear simulation disclaimers.
- **Key Insight:** Catches subtle cross-document identity errors that slip past manual spreadsheet reviews.

### Stage 5: Deterministic Compliance Rules & Explainable Risk
- **Route:** Compliance Matrix (`/compliance-matrix`) & Risk Breakdown (`/bidders/:id/risk`)
- **What to Observe:**
  - Evaluation of 34 CPCL Goods criteria under GFR 2017 using transparent Python rules.
  - Risk score decomposed into 4 auditable dimensions: Identity Risk (30%), Financial Risk (25%), Compliance Gap (25%), and Anomaly Signals (20%).
- **Key Insight:** Transparent arithmetic explains exactly why a vendor is assigned a risk score without opaque AI reasoning.

### Stage 6: Split-Screen Evidence Inspector & Officer Adjudication
- **Route:** `/bidders/:id/evidence`
- **What to Observe:**
  - Left pane displays the specific compliance finding and clause citation.
  - Right pane renders the source PDF at 150 DPI, automatically scrolling to the target page and highlighting the exact string with a coordinate bounding box overlay.
  - Officer can accept recommendations or record an override.
  - **Mandatory Justification:** Overriding a finding requires entering a formal statutory justification (minimum 15 characters) before submission.
- **Key Insight:** The officer retains complete statutory authority while every decision is backed by verifiable document evidence.

### Stage 7: Cryptographic Audit Verification & CVC Dossier Export
- **Route:** `/audit`
- **What to Observe:**
  - Click **"Verify Ledger Integrity"** to execute runtime SHA-256 hash recalculation across all recorded events from genesis to head in milliseconds.
  - Click **"Download CVC Compliance Dossier"** to generate a publication-quality compliance PDF report with finding summaries, evidence crops, and cryptographic audit stamps.
- **Key Insight:** Complete, tamper-evident chain of custody ready for Tender Evaluation Committee and CAG oversight.

---

## 5. Simulation Disclosures & Scope

| Component | Current Implementation | Production Requirement |
|---|---|---|
| **Government Registries** | Sandbox mock adapters conforming to GSTN, MCA, and Udyam API schemas with simulated latency and failure modes. | Official departmental MoUs, production API credentials, and Hardware Security Modules (HSMs). |
| **Dataset** | 5 synthetic vendor packages (26 PDFs) with published ground truth. | Ingestion of live vendor archives under departmental confidentiality agreements. |
| **Procurement Rules** | 34 CPCL Goods procurement criteria under GFR 2017. | Expansion to Works, Services, and Non-Consultancy procurement categories. |
| **Decision Authority** | Advisory decision support with mandatory human review. | Statutory procurement authority remains exclusively with designated human procurement officers. |

---

## 6. Related Documentation

- [docs/ONE-MINUTE-TOUR.md](../ONE-MINUTE-TOUR.md): 60-second executive summary.
- [docs/demo/REGISTRY-SIMULATOR.md](REGISTRY-SIMULATOR.md): Registry simulator and failure injection guide.
- [docs/demo/SCREENSHOTS.md](SCREENSHOTS.md): Screen capture specification.
- [docs/architecture/REPOSITORY-MAP.md](../architecture/REPOSITORY-MAP.md): Full system architecture and directory index.
