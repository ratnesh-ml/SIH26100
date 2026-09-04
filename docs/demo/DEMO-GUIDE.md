# VigilBid — Evaluator-First Product Walkthrough Guide (SIH26100)

**Document Version:** 2.0.0 (Evaluator-First Scrutiny Baseline)  
**Target Problem Statement:** SIH26100 — *AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement*  
**Department / Organization:** Chennai Petroleum Corporation Limited (CPCL) / Ministry of Petroleum & Natural Gas (MoPNG)  
**Target Reference Tender:** `CPCL/MM/2026/PUMP-217` — 12 API-610 Centrifugal Process Pumps (₹18.40 Crores)  
**Core Principle:** *"AI assists. Rules verify. Evidence explains. Officer decides."*  
**Evaluation Target Time:** **Under 3 Minutes**

---

> [!WARNING]
> **DEMO / MOCK / SYNTHETIC ENVIRONMENT NOTICE**  
> All tender parameters, bidder documents, tax credentials (PAN cards, GST REG-06 certificates, Udyam MSME registrations), and external registry responses described in this guide are **synthetically modeled for hackathon evaluation**.  
> The system operates via local deterministic sandbox adapters. **No live government databases (NSDL, GSTN, MCA-21, Udyam, or CPPP) are contacted during this demonstration.**

---

## 1. Quick Launch Options

### Option A: Interactive Zero-Setup Guided Tour (Recommended)
1. Start the local services:
   ```bash
   uvicorn backend.main:app --port 8000
   cd frontend && npm run dev
   ```
2. Start the frontend with the command above and open the local address printed by Vite (navigate to route `/#/demo`).
   *No login required. The guided tour renders the complete 15-step interactive scrutiny journey with real-time UI telemetry and visual evidence cards.*

### Option B: Full Live Procurement Officer Session
1. Initialize pristine test data:
   ```bash
   python scripts/demo_setup.py
   ```
2. Log in at the application root with evaluation credentials:
   - **Procurement Officer:** `officer@cpcl.gov.in` / `Officer@123`
   - **Vigilance Officer (CVO):** `vigilance@cpcl.gov.in` / `Vigilance@123`
   - **System Administrator:** `admin@cpcl.gov.in` / `Admin@123`

---

## 2. The 3-Minute Evaluator Journey: Bharat Hydrotech Corp

The complete value of VigilBid is demonstrated through **ONE concrete synthetic bidder scenario**: **Bharat Hydrotech Corp** (Bidder C).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                   THE 15-STEP SCRUTINY JOURNEY (UNDER 3 MINUTES)                       │
│                                                                                        │
│  [01] Tender Context       ──> [02] Select Bidder      ──> [03] Document Package       │
│  [04] Auto Extraction      ──> [05] PAN-GSTIN Mismatch ──> [06] Click Finding          │
│  [07] Evidence on Pages    ──> [08] Local Content Gap  ──> [09] Compliance Status      │
│  [10] 65/100 HIGH Risk     ──> [11] Reason Breakdown   ──> [12] AI Recommendation      │
│  [13] Officer Review       ──> [14] Human Decision     ──> [15] Audit Ledger Entry     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Tender Context
- **Screen / Route:** `/tenders` or `/demo` (Step 1)
- **What Happens:** Evaluator views Tender `CPCL/MM/2026/PUMP-217` — *Supply of 12 API-610 Centrifugal Process Pumps for Manali Refinery* (Estimated Value: **₹18.40 Crores**).
- **Underlying Logic:** Ingests tender parameters and CPCL Goods rules specifying:
  - 3-Year Average Turnover $\ge$ ₹5.52 Cr (30% tender value threshold under GFR Rule 161)
  - Class-I Local Supplier status $\ge$ 50.0% local content under DPIIT PPP-MII Order 2017
  - Mandatory identity containment under GFR 2017 Rule 144 and CGST Act 2017 Section 22.

### Step 2: Select Bidder
- **Screen / Route:** `/bidders` $\rightarrow$ Select **Bharat Hydrotech Corp** (Bidder C)
- **What Happens:** Officer selects Bidder C from the 5 participating vendors.
- **Underlying Logic:** Submission `GEM-BID-2026-88192` contains commercial & statutory technical envelope from a large industrial pump vendor claiming compliance with all tender mandates.

### Step 3: Show Document Package
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Ingested Documents
- **What Happens:** System displays the 5 statutory PDFs ingested from `bharat_hydro_bid_pkg.zip`:
  1. `gst_reg06.pdf` (Form GST REG-06 Registration Certificate)
  2. `pan_card.pdf` (Income Tax Department PAN Card)
  3. `udyam_cert.pdf` (Udyam MSME Declaration UDYAM-MH-12-0098765)
  4. `turnover_ca.pdf` (CA Turnover Certificate with ICAI UDIN)
  5. `local_content.pdf` (Make in India Self-Declaration)
- **Underlying Logic:** Content-Addressable Storage (CAS) computes SHA-256 digests and enforces a 100:1 maximum decompression guard to prevent ZIP bomb vulnerabilities.

### Step 4: Show Automatic Extraction
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Extracted Entities Tab
- **What Happens:** Deterministic extraction displays structured key-value tokens parsed in &lt;108ms:
  - **GSTIN:** `33AAACB9999F1Z5` (Confidence: 0.99)
  - **Standalone PAN:** `AAACB1234F` (Confidence: 0.98)
  - **3-Year Average Turnover:** `₹6.10 Crores` (UDIN: `24045123AAAAA9999`)
  - **Declared Local Content:** `45.0%` (Confidence: 0.97)
- **Underlying Logic:** PyMuPDF extracts native digital text tokens and character coordinates without probabilistic hallucinations.

### Step 5: Show PAN-GSTIN Mismatch
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Identity & Cross-Check Matrix
- **What Happens:** System highlights a **severe identity contradiction**:
  - The standalone PAN card submitted is `AAACB1234F`.
  - Characters 3–12 of the submitted GSTIN (`33AAACB9999F1Z5`) embed PAN `AAACB9999F`.
- **Underlying Logic:** Characters 8–9 (`12` vs `99`) fail string equality. The bidder submitted another legal entity's PAN card or an invalid GSTIN.

### Step 6: Click Finding
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Findings List $\rightarrow$ Click `CPCL-GOODS-002`
- **What Happens:** Evaluator clicks finding **"PAN-GSTIN Identity Inconsistency"**.
- **Underlying Logic:** Rule `CPCL-GOODS-002` triggers with severity `FAIL`, citing GFR 2017 Rule 144 and Section 22 of the CGST Act 2017.

### Step 7: Open Evidence on Exact Pages
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Split-Screen Evidence Inspector
- **What Happens:** The dual-pane viewer opens and highlights the exact PDF locations:
  - **Left / Top Pane:** `gst_reg06.pdf`, Page 1, Bounding Box `[120, 85, 340, 110]` highlighting `GSTIN: 33AAACB9999F1Z5`.
  - **Right / Bottom Pane:** `pan_card.pdf`, Page 1, Bounding Box `[140, 160, 310, 185]` highlighting `PAN: AAACB1234F`.
- **Underlying Logic:** Coordinate mapper translates PDF character bounding boxes into responsive visual highlight overlays.

### Step 8: Show Local-Content Discrepancy
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Finding `CPCL-GOODS-003`
- **What Happens:** System displays secondary statutory deficit:
  - Declared Local Content: **45.0%** (in `local_content.pdf`, Page 1).
  - Tender Requirement: **$\ge$ 50.0%** (Class-I Local Supplier under PPP-MII Order 2017).
- **Underlying Logic:** Rule `CPCL-GOODS-003` flags a 5.0% deficit, preventing Class-I purchase preference.

### Step 9: Show Compliance Status
- **Screen / Route:** Compliance Matrix (`/matrix`)
- **What Happens:** Overall Bidder Compliance Status is marked: **`FAIL`**.
- **Underlying Logic:** Deterministic precedence hierarchy: `FAIL > REVIEW > WARN > PASS`. Hard identity failure triggers statutory disqualification.

### Step 10: Show 65/100 HIGH Risk Score
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Risk Gauge Widget
- **What Happens:** Composite Risk Score displays **`65.0 / 100 (HIGH RISK)`**.
- **Underlying Logic:** 0–100 composite risk engine assigns high risk to any unverified or conflicting identity payload.

### Step 11: Show Reason Breakdown
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Risk Breakdown Drawer
- **What Happens:** Score attribution table explains every single point:
  - **Identity Inconsistency Risk:** `+35.0 pts` (PAN-GSTIN mismatch, GFR 144)
  - **Statutory Compliance Gap:** `+25.0 pts` (Local content 45% vs 50% Class-I)
  - **Financial Factor Baseline:** `+5.0 pts` (Routine turnover check)
  - **Total Score:** `35.0 + 25.0 + 5.0 = 65.0 pts`
- **Underlying Logic:** Zero black-box AI reasoning; 100% transparent, explainable arithmetic.

### Step 12: Show AI/System Recommendation
- **Screen / Route:** Bidder Cockpit $\rightarrow$ System Advisory Panel
- **What Happens:** The system provides explicit advisory text:  
  *"Recommended: Not Qualified — identity discrepancy and local content deficit. Officer confirmation required."*
- **Underlying Logic:** Decision support ONLY. The software never autonomously rejects or disqualifies a bidder.

### Step 13: Show Procurement Officer Review
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Officer Adjudication Panel
- **What Happens:** Procurement Officer Shri Ravi Kumar (`officer@cpcl.gov.in`) inspects the highlighted dual-page evidence and evaluates CVC Circular 02/02/2021 regarding clarification limits.
- **Underlying Logic:** CVC guidelines prohibit seeking retrospective technical corrections after bid opening. The discrepancy is fatal and cannot be cured.

### Step 14: Show Final Human Decision
- **Screen / Route:** Bidder Cockpit $\rightarrow$ Decision Action Selector
- **What Happens:** The officer selects **`REJECT`** and enters the mandatory statutory written justification:  
  *"Clarification rejected; statutory PAN-in-GSTIN containment failed. Local content deficit (45% vs 50%) confirmed."*
- **Underlying Logic:** Form validation enforces minimum 15 characters of statutory justification. The human officer makes the final legal decision.

### Step 15: Show Audit Ledger Entry
- **Screen / Route:** `/audit` $\rightarrow$ Audit Trail Explorer
- **What Happens:** The officer's action is committed to the tamper-evident SHA-256 forward ledger:
  - **Event:** `OFFICER_DECISION_RECORDED` (Sequence Block #142)
  - **Officer:** `officer@cpcl.gov.in`
  - **Previous Hash:** `8f9a2b71c402...e491`
  - **Current Block Hash:** `3c7e1d54b899...912f`
- **Underlying Logic:** Clicking **"Verify Ledger Integrity"** recalculates forward hashes across all blocks in milliseconds, confirming unbroken cryptographic continuity. One-click export to CVC Compliance Dossier PDF.

---

## 3. The 7 Core Evaluator Questions Answered

| # | Question | Authoritative Answer for Bharat Hydrotech Corp |
|---|---|---|
| 1 | **WHAT was wrong?** | Standalone PAN card (`AAACB1234F`) contradicts the PAN embedded in the GSTIN (`33AAACB9999F1Z5` embeds `AAACB9999F`), and declared local content is 45% (below the 50% Class-I threshold). |
| 2 | **HOW did the system detect it?** | PyMuPDF extracts digital text and coordinates; a deterministic cross-document validator checks characters 3–12 of the GSTIN against the standalone PAN card. |
| 3 | **WHERE is the evidence?** | `gst_reg06.pdf` (Page 1, box `[120, 85, 340, 110]`) highlighting `33AAACB9999F1Z5`, and `pan_card.pdf` (Page 1, box `[140, 160, 310, 185]`) highlighting `AAACB1234F`. |
| 4 | **WHICH rule caused the finding?** | Rule `CPCL-GOODS-002` (GFR 2017 Rule 144 & CGST Act Section 22) and Rule `CPCL-GOODS-003` (DPIIT PPP-MII Order 2017 Clause 2(b)). |
| 5 | **HOW serious is it?** | **CRITICAL / HIGH RISK (Score 65.0/100)**. Contradictory legal tax identifiers represent a fatal statutory identity failure. |
| 6 | **WHAT does the system recommend?** | *"Recommended: Not Qualified — identity discrepancy and local content deficit. Officer confirmation required."* Advisory decision support only. |
| 7 | **WHO makes the final decision?** | The **Human Procurement Officer** (Shri Ravi Kumar, CPCL), who inspects the evidence, records mandatory written minutes, and commits the signed decision. |

---

## 4. Synthetic Simulation Disclosures & Boundaries

| Component | Current Implementation (Demo) | Production Requirement (Go-Live) |
|---|---|---|
| **External Portals** | Deterministic mock adapters conforming to official GSTN, MCA-21, and Udyam JSON schemas. | Official departmental MoUs, production API credentials, and Hardware Security Modules (HSMs). |
| **Vendor Datasets** | 5 synthetic vendor packages (26 PDFs) with ground truth specifications. | Ingestion of live vendor archives under departmental confidentiality protocols. |
| **Procurement Scope** | 34 CPCL Goods criteria under GFR 2017. | Configuration of Works, Services, and Non-Consultancy procurement rule sets. |
| **Adjudication Role** | Advisory decision support with mandatory human review. | Statutory authority remains exclusively with designated human procurement officers. |

---

## 5. Comparative Evaluation Across All 5 Vendors

| Vendor Submission | Status | Risk Score | Key Evaluator Observation |
|---|---|---|---|
| **1. Meridian Flow Systems Pvt Ltd** | `PASS` | `0.0 (LOW)` | Clean baseline. 100% data parity across GST, PAN, Udyam, CA Turnover (₹14.20 Cr), and Class-I MII (62%). |
| **2. Sri Kaveri Engineering Works** | `REVIEW` | `22.0 (LOW)` | MSE trade name abbreviation handled via 0.82 entity resolution parity. Routed to REVIEW; officer accepts. |
| **3. Bharat Hydrotech Corp** | `FAIL` | `65.0 (HIGH)` | **Primary evaluation scenario**. Hard PAN-GSTIN mismatch and 45% local content deficit. Officer rejects. |
| **4. Nova Pumps & Systems Ltd** | `WARN` | `72.0 (HIGH)` | Format-compliant bid flagged for suspicious PDF metadata inconsistencies (GIMP 2.10 editing tool delta) and hidden white-on-white prompt injection pattern. |
| **5. Zenith Infra Tech Pvt Ltd** | `FAIL` | `95.0 (HIGH)` | Suo-moto cancelled GSTIN and active CPPP national debarment order under GFR Rule 151. |

---

## 6. Demonstration Resources

- **Demo Video:** To be added
- **Live Demo:** To be added
- **REST API Documentation:** Interactive Swagger UI available under `/docs` on the active backend port
- **Full Architecture Specification:** [docs/architecture/REPOSITORY-MAP.md](../architecture/REPOSITORY-MAP.md)
- **SIH 24-Requirement Traceability:** [docs/architecture/SIH26100-REQUIREMENT-MATRIX.md](../architecture/SIH26100-REQUIREMENT-MATRIX.md)
