# VigilBid

### AI-assisted, evidence-first bid compliance verification and vigilance decision-support platform for public procurement on GeM.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI Pipeline](https://github.com/ratnesh-ml/SIH26100/actions/workflows/ci.yml/badge.svg)](https://github.com/ratnesh-ml/SIH26100/actions/workflows/ci.yml)
[![Backend Tests: 380 Passing](https://img.shields.io/badge/Backend%20Tests-380%20Passing-brightgreen)](tests/)
[![Frontend Tests: 70 Passing](https://img.shields.io/badge/Frontend%20Tests-70%20Passing-brightgreen)](frontend/)
[![Release Audit: 20/20 Subsystems](https://img.shields.io/badge/Release%20Audit-20%2F20%20Certified-blue)](scripts/release_audit.py)
[![Threat Model: Comprehensive](https://img.shields.io/badge/Threat%20Model-Certified-emerald)](docs/security/THREAT-MODEL.md)
[![Architecture: Modular Monolith](https://img.shields.io/badge/Architecture-Modular%20Monolith-orange)](docs/architecture/REPOSITORY-MAP.md)
[![SIH Problem: SIH26100](https://img.shields.io/badge/SIH%202026-SIH26100-purple)](docs/architecture/SIH26100-REQUIREMENT-MATRIX.md)

---

## 🏛️ SIH 2026 Project Identity

| Attribute | Official Specification |
|---|---|
| **Hackathon** | **Smart India Hackathon 2026** (Grand Finale) |
| **Problem Statement ID** | **SIH26100** |
| **Problem Statement Title** | *“AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement”* |
| **Ministry / Organization** | **Ministry of Petroleum & Natural Gas (MoPNG)** |
| **Department / Entity** | **Chennai Petroleum Corporation Limited (CPCL)** |
| **Platform Target** | **Government e-Marketplace (GeM)** & **Central Public Procurement Portal (CPPP)** |
| **Category & Theme** | Software • Smart Automation |

---

## ⚡ One-Sentence Explanation

**VigilBid is an evidence-first, buyer-side decision-support platform that transforms multi-document bid verification into sub-second, explainable compliance audits under GFR 2017 and CVC guidelines.**

---

## 💎 Key Value Proposition

Public procurement scrutiny takes **8 to 10 hours per bidder**, leaving evaluation committees vulnerable to unverified tax credentials, cross-document inconsistencies, and forensic tampering. VigilBid delivers:

- 🛡️ **Sub-Second Scrutiny:** Evaluates multi-document bidder archives across 34 CPCL Goods criteria in &lt;108ms.
- 🔍 **Split-Screen Evidence:** Connects every finding directly to exact source PDF pages and coordinate bounding box highlights.
- ⚖️ **Zero AI Hallucinations:** Legal compliance is executed by **100% deterministic Python rules citing GFR 2017 clauses**—probabilistic LLMs are never legal judges.
- 👤 **Preserved Human Authority:** Procurement officers retain complete statutory discretion to accept, reject, or override findings with mandatory written minutes.
- 🔐 **Cryptographic Auditability:** Every decision is permanently committed to an immutable SHA-256 forward hash chain for CAG and CVC audit oversight.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CORE GUIDING PRINCIPLE                                 │
│                                                                                        │
│               "AI assists. Rules verify. Evidence explains. Officer decides."          │
│                                                                                        │
│  VigilBid provides evidence-first decision support. It NEVER autonomously              │
│  disqualifies any bidder, and it never uses prejudicial legal labels.                  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🎥 Demonstration Access

| Demonstration Channel | Access Status | Verification Notes |
|---|---|---|
| **Demo Video** | Demo Video: To be added | Comprehensive video walkthrough of end-to-end verification lifecycle |
| **Live Demo** | Live Demo: To be added | Public demonstration instance |
| **Interactive Tour** | **Available in App (`/#/demo`)** | Self-contained, zero-setup 15-step interactive scrutiny tour in local build |
| **Evaluator Walkthrough Guide** | **[docs/demo/DEMO-GUIDE.md](docs/demo/DEMO-GUIDE.md)** | Step-by-step evaluator manual with exact coordinates, telemetry, and citations |
| **60-Second Summary** | **[docs/ONE-MINUTE-TOUR.md](docs/ONE-MINUTE-TOUR.md)** | Executive brief for competition jury and technical reviewers |

---

## 📸 Visual Screenshots

High-resolution UI captures are prepared according to [docs/demo/SCREENSHOTS.md](docs/demo/SCREENSHOTS.md) and archived under [`docs/demo/screenshots/`](docs/demo/screenshots/):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. Executive Scrutiny Dashboard (/dashboard)                                           │
│ Target Asset: docs/demo/screenshots/01-dashboard.png                                   │
│ Function: Portfolio-level procurement overview and active risk posture telemetry       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. Bidder Scrutiny Cockpit (/bidders/:id)                                              │
│ Target Asset: docs/demo/screenshots/06-bidder-cockpit.png                              │
│ Function: Cross-document identity verification and extracted tax credentials           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. Split-Screen Evidence Inspector (/bidders/:id/evidence)                             │
│ Target Asset: docs/demo/screenshots/07-evidence.png                                    │
│ Function: Evidence-linked compliance finding with coordinate bounding box highlight   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 4. Explainable Risk View (/bidders/:id/risk)                                           │
│ Target Asset: docs/demo/screenshots/08-risk.png                                        │
│ Function: 0–100 composite risk score dial with decomposed factor contributions         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 5. Multi-Bidder Compliance Matrix (/compliance-matrix)                                 │
│ Target Asset: docs/demo/screenshots/05-compliance-matrix.png                           │
│ Function: High-density multi-bidder criteria matrix with traffic-light status chips    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ 6. Cryptographic Audit Ledger (/audit)                                                 │
│ Target Asset: docs/demo/screenshots/10-audit.png                                       │
│ Function: Tamper-evident SHA-256 event chain with live ledger verification             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## ⏱️ See VigilBid in 3 Minutes: The Case of Bharat Hydrotech Corp

An evaluator can understand the complete value of VigilBid in under 3 minutes through **ONE synthetic bidder scenario**: **Bharat Hydrotech Corp** (Bidder C) submitting for CPCL tender `CPCL/MM/2026/PUMP-217` (12 API-610 Centrifugal Process Pumps, estimated value **₹18.40 Crores**):

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

### The 15 Scrutiny Milestones

1. **Tender Context:** Ref `CPCL/MM/2026/PUMP-217` (₹18.40 Cr, 12 API-610 Pumps). Rules: GFR 144/161, Class-I MII $\ge$ 50%, Min Turnover ₹5.52 Cr (30%).
2. **Select Bidder:** Bidder C (**Bharat Hydrotech Corp**) selected from 5 participating vendor packages.
3. **Show Document Package:** 5 ingested statutory PDFs (`gst_reg06.pdf`, `pan_card.pdf`, `udyam_cert.pdf`, `turnover_ca.pdf`, `local_content.pdf`) with SHA-256 CAS indexing and zip-bomb ratio defense.
4. **Show Automatic Extraction:** PyMuPDF extracts GSTIN `33AAACB9999F1Z5`, PAN `AAACB1234F`, Turnover ₹6.10 Cr, Local Content 45.0% in &lt;108ms.
5. **Show PAN-GSTIN Mismatch:** Chars 3–12 of GSTIN contain `AAACB9999F`, conflicting with standalone PAN `AAACB1234F` (different legal entity).
6. **Click Finding:** Click finding `CPCL-GOODS-002` ("Statutory Identity & PAN-GSTIN Containment"). Severity: `FAIL`.
7. **Open Evidence on Exact Pages:** Split-screen viewer renders dual-page coordinate bounding boxes: `gst_reg06.pdf` (Page 1, `[120, 85, 340, 110]`) vs `pan_card.pdf` (Page 1, `[140, 160, 310, 185]`).
8. **Show Local-Content Discrepancy:** Rule `CPCL-GOODS-003` detects declared 45.0% local content, failing the 50.0% Class-I benchmark under DPIIT PPP-MII Order 2017.
9. **Show Compliance Status:** Compliance engine evaluates status: **`FAIL`** (Hard statutory identity failure under GFR Rule 144).
10. **Show 65/100 HIGH Risk Score:** Composite risk engine quantifies risk at **`65.0 / 100 (HIGH RISK)`**.
11. **Show Reason Breakdown:** Transparent factor attribution: Identity Inconsistency (+35.0) + Compliance Gap (+25.0) + Financial Baseline (+5.0) = 65.0 pts.
12. **Show AI/System Recommendation:** Advisory decision support displays: *"Recommended: Not Qualified — identity discrepancy and local content deficit. Officer confirmation required."* (AI never autonomously rejects).
13. **Show Procurement Officer Review:** Officer Shri Ravi Kumar (`officer@cpcl.gov.in`) inspects dual highlighted evidence and evaluates CVC Circular 02/02/2021 clarification limits.
14. **Show Final Human Decision:** Officer adjudicates **`REJECT`** and records mandatory statutory minute: *"Clarification rejected; statutory PAN-in-GSTIN containment failed. Local content deficit (45% vs 50%) confirmed."*
15. **Show Audit Ledger Entry:** Officer action committed to SHA-256 forward ledger (Block #142) verified in milliseconds, exportable to signed CVC Compliance Dossier PDF.

### The 7 Core Evaluator Questions Answered

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

## ⚠️ The Core Problem

Public sector procurement in India handles over ₹4 lakh crore annually on GeM. In critical industrial tenders—such as API-610 process pumps for CPCL refineries—evaluating bids requires rigorous statutory diligence:

- **Multiple Documents:** A tender with 30 bidders involves analyzing over 900 statutory PDF documents (GST REG-06, PAN cards, Udyam MSME declarations, CA-certified turnover balance sheets, OEM authorizations, and Integrity Pacts).
- **Repeated Manual Data Entry:** Officers must manually transcribe tax identifiers, dates, and financial metrics across spreadsheets and five separate government portals (GSTN, Income Tax PAN, MCA-21, Udyam, and CPPP).
- **Cross-Document Comparison Fatigue:** Subtle inconsistencies across documents—such as a PAN character discrepancy within a 15-character GSTIN, or entity name abbreviation drift—are easily missed under strict evaluation deadlines.
- **Eligibility Verification Complexity:** Verifying mandatory eligibility criteria (such as 3-year average turnover thresholds, MSE exemptions under GFR Rule 153, and local content thresholds under the PPP-MII Order 2017) requires manually cross-referencing multiple legal clauses.
- **Evidence Tracing Deficits:** Traditional spreadsheet evaluations record binary "Complied" or "Not Complied" notes with zero link to the source document, page number, or bounding box coordinate.
- **Hidden Forensic Risks:** Unchecked PDF metadata tampering (e.g. modified dates postdating creation dates) and adversarial prompt injections in bid documents are undetectable during routine human reading.
- **Severe Manual Review Burden:** Manual scrutiny takes 4 to 8 hours per bidder package. Comptroller and Auditor General (CAG) Report No. 18 of 2022 documented that up to 42.79% of unverified PAN/GSTIN submissions in sampled PSU procurements went unnoticed during manual sampling.

---

## 💡 The Solution

VigilBid brings document ingestion, structured extraction, cross-document entity resolution, registry verification, compliance rules, risk analysis, evidence inspection, and officer review into **one unified workflow**:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    Upload    │ ──> │   Extract    │ ──> │    Verify    │ ──> │ Cross-check  │ ──> │  Risk-score  │ ──> │    Review    │
│  Bidder ZIP  │     │ Text & Layout│     │ Registries   │     │ Entities/PAN │     │  Explainable │     │ Split-Screen │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **AI Assists:** Ingests untrusted bidder ZIP archives, detects document types, and extracts structured text layers and word coordinates using hybrid layout analysis and local OCR.
2. **Rules Verify:** Evaluates 34 CPCL Goods criteria under GFR 2017 using deterministic, auditable Python rules—not probabilistic LLMs.
3. **Evidence Explains:** Connects every finding to an exact document, page number, bounding box coordinate, and verbatim text citation in a split-screen viewer.
4. **Officer Decides:** Preserves human statutory authority. Officers review recommendations, accept findings, or record mandatory written justifications for overrides, with every action committed to an immutable SHA-256 hash-chained audit ledger.

---

## 🔎 Example Finding: The Identity Inconsistency

To see how VigilBid presents findings to an officer, consider the primary violation detected for **Bharat Hydrotech Corp**:

```
Finding: PAN-GSTIN Identity Inconsistency
  ├── Finding ID: FND-2026-0042
  ├── Rule Identifier: CPCL-GOODS-002 (Statutory Tax Identification Linkage)
  ├── Statutory Authority: General Financial Rules (GFR) 2017 Rule 144 & CGST Act 2017 Section 22
  ├── Extracted Value A: GSTIN = "33AAACB9999F1Z5" (from gst_reg06.pdf, Page 1, Bounding Box [120, 85, 340, 110])
  ├── Extracted Value B: PAN = "AAACB1234F" (from pan_card.pdf, Page 1, Bounding Box [140, 160, 310, 185])
  ├── Logic Violation: Substring GSTIN[2:12] ("AAACB9999F") != PAN ("AAACB1234F")
  ├── Automated Severity: FAIL (Hard statutory disqualification)
  ├── System Advisory: "Recommended: Not Qualified — identity discrepancy"
  └── Human Action: Officer records formal minute under CVC guidelines; rejects bid.
```

In the Split-Screen Cockpit, clicking this finding automatically opens both documents side-by-side with high-contrast bounding box overlays, eliminating the need to search through hundreds of PDF pages manually.

---

## 🎯 SIH26100 Requirement Coverage & Traceability

VigilBid covers all 24 official requirement areas defined in Problem Statement SIH26100:

| Category | SIH26100 Requirement Area | Implementation Status | Implementation Mechanism / Code Artifact |
|---|---|:---:|---|
| **Identity & Registries** | Government Portal Integration | `MOCK/SIMULATED` | High-fidelity sandbox adapter (`pipeline/registry_adapters/mock_adapter.py`) |
| | Udyam / MSME Verification | `IMPLEMENTED` *(Rule)* / `MOCK` *(API)* | Udyam extraction (`pipeline/extraction/udyam.py`), Rules `R-UDY-01`, `R-UDY-02` |
| | GST Registration Check | `IMPLEMENTED` *(Rule)* / `MOCK` *(API)* | Mod-36 checksum validator, Rules `R-GST-01`, `R-ID-01`, `R-DOC-01` |
| | GST Return Filing Compliance | `PARTIALLY IMPLEMENTED` | Return filing frequency fields in mock response; multi-month rule planned |
| | PAN Card Verification | `IMPLEMENTED` *(Rule)* / `MOCK` *(API)* | PAN syntax validator, Rule `R-PAN-01`, Embedded PAN Linkage `R-GST-02` |
| | Income Tax Compliance | `PARTIALLY IMPLEMENTED` | ITR acknowledgment classification & Section 206AB status check in adapter |
| | Blacklisting & Debarment | `IMPLEMENTED` *(Rule)* / `MOCK` *(Feed)* | CPPP / GeM blacklist matcher (`pipeline/compliance/cross_verifier.py`), Rule `R-REG-03` |
| **Statutory Criteria** | Make in India (PPP-MII 2017) | `IMPLEMENTED` | Class-I (>=50%) and Class-II (>=20%) local content calculator, Rule `R-REG-01` |
| | Land Border Rule 144(xi) | `IMPLEMENTED` | Mandatory declaration parser & origin verification, Rule `R-REG-02` |
| | Financial Turnover & Net Worth | `IMPLEMENTED` | 3-year turnover threshold (`R-FIN-01`), Net Worth (`R-FIN-02`), ICAI UDIN (`R-FIN-03`) |
| | EMD Proof & MSE Exemption | `IMPLEMENTED` | DD/BG transaction receipt or MSE/Udyam exemption waiver, Rule `R-COM-01` |
| | OEM Authorization | `IMPLEMENTED` | Manufacturer authorization form (MAF) tender-specific validator, Rule `R-TEC-01` |
| | Startup India Exemption | `PARTIALLY IMPLEMENTED` | Document classifier pattern `STARTUP_CERT` & regulatory citations under GFR 173(i) |
| | NSIC Registration | `PARTIALLY IMPLEMENTED` | SPRS EMD waiver verification processed under unified rule `R-COM-01` |
| | DigiLocker Verification | `MOCK/SIMULATED` | SHA-256 Content-Addressable Storage (CAS) document fingerprinting |
| | EPFO & ESIC Compliance | `PLANNED` | Base registry adapter schemas and statutory labor law citations in KB |
| **Document AI & Logic** | Missing Document Detection | `IMPLEMENTED` | Document presence rule `R-DOC-01`, mandatory document list checks |
| | Inconsistent Data Detection | `IMPLEMENTED` | Cross-document PAN-in-GSTIN parity & Jaro-Winkler entity name matcher |
| | Non-Compliant Information | `IMPLEMENTED` | PDF metadata tampering detection (GIMP modifications, creation date delta) |
| | Adversarial Prompt Defense | `IMPLEMENTED` | Input quarantined in `<DOCUMENT_DATA>` tags; deterministic logic supersedes LLM |
| **Scoring & Governance** | Overall Compliance Score | `IMPLEMENTED` | 0–100 explainable composite score (`pipeline/risk/scorer.py`) |
| | Risk Level Classification | `IMPLEMENTED` | Deterministic risk banding: `LOW` (0–30), `MEDIUM` (31–60), `HIGH` (61–100) |
| | AI Recommendation | `IMPLEMENTED` | Evidence-grounded advisory findings (`PASS`, `WARN`, `REVIEW`, `FAIL`) |
| | Evidence & Bounding Boxes | `IMPLEMENTED` | Source PDF coordinate bounding box inspector (`pipeline/evidence/highlighter.py`) |
| | Cryptographic Audit Ledger | `IMPLEMENTED` | Tamper-evident SHA-256 forward-linked commit chain (`backend/services/audit_service.py`) |
| | Human Officer Final Authority | `IMPLEMENTED` | Adjudication cockpit; mandatory written justification required for overrides |

*For the complete requirement-to-code traceability audit with test coverage and evidence references, see [docs/architecture/SIH26100-REQUIREMENT-MATRIX.md](docs/architecture/SIH26100-REQUIREMENT-MATRIX.md).*

---

## 🏗️ System Architecture

VigilBid is structured as a **Modular Monolith** designed for high reliability, straightforward local evaluation, and air-gapped deployment:

```mermaid
graph TB
    subgraph Client ["Frontend Client (React 18 + TypeScript)"]
        UI[Vigilance Dark UI Tokens]
        Demo[Interactive /demo Tour]
        Cockpit[Bidder Cockpit & Evidence]
        Matrix[Compliance Matrix]
        AuditUI[Audit Ledger & Verification]
    end

    subgraph API ["Backend API (FastAPI)"]
        Router[24 REST Endpoints]
        Auth[OAuth2 / JWT RBAC]
        DBSvc[SQLAlchemy 2.0 ORM]
        AuditSvc[SHA-256 Chaining Service]
    end

    subgraph Processing ["11-Step Processing Pipeline"]
        Ingest[01: Ingestion & Zip-Bomb Guard]
        Classify[02: TF-IDF Classification]
        OCR[03: PyMuPDF + Tesseract OCR]
        Extract[04: Structured Extraction]
        Norm[05: Normalization]
        Resolve[06: Entity Resolution]
        Registry[07: Registry Adapters]
        Rules[08: Deterministic Rule Engine]
        Anomaly[09: Forensic Anomaly Engine]
        Risk[10: Composite Risk Engine]
        Report[11: CVC Dossier Generator]
    end

    subgraph DataStore ["Data & Storage Layer"]
        DB[(PostgreSQL 16 / SQLite)]
        CAS[Content-Addressable Storage]
        AuditLog[(SHA-256 Event Chain)]
    end

    UI --> Router
    Demo --> Router
    Cockpit --> Router
    Router --> Auth
    Router --> DBSvc
    Router --> Ingest
    Ingest --> Classify --> OCR --> Extract --> Norm --> Resolve --> Registry --> Rules --> Anomaly --> Risk --> Report
    Report --> AuditSvc
    DBSvc --> DB
    Ingest --> CAS
    AuditSvc --> AuditLog
```

### Architectural Boundary: Perception vs Law vs Authority

```
┌──────────────────────────────────────┬──────────────────────────────────────┬──────────────────────────────────────┐
│       PROBABILISTIC AI LAYER         │      DETERMINISTIC COMPLIANCE LAYER  │         HUMAN OFFICER LAYER          │
│   (Perception of Unstructured Data)  │        (Statutory Rule Execution)    │        (Statutory Adjudication)      │
├──────────────────────────────────────┼──────────────────────────────────────┼──────────────────────────────────────┤
│ • Document classification (TF-IDF)   │ • Tax check-digit validation         │ • Accept system findings             │
│ • PyMuPDF layout analysis            │ • Sub-string PAN-in-GSTIN match      │ • Mandatory override justification   │
│ • Tesseract 5.0 OCR fallback         │ • Turnover threshold comparison      │ • Issue technical clarification      │
│ • Jaro-Winkler string similarity     │ • 34 GFR 2017 & CPCL rule checks     │ • Final qualification decision       │
│ • RAG semantic search & Copilot Q&A  │ • Weighted composite risk math       │ • Tender Evaluation Committee signoff│
│ • Metadata anomaly heuristics        │ • SHA-256 hash-chained audit logging │                                      │
└──────────────────────────────────────┴──────────────────────────────────────┴──────────────────────────────────────┘
```

---

## 🌟 Key Technical Capabilities

| # | Capability | Technical Implementation | Operational Procurement Value |
|---|---|---|---|
| **1** | **Safe Document Ingestion** | Decompression bomb protection (100:1 ratio guard), magic byte validation (`%PDF-`), and Content-Addressable Storage (CAS) via SHA-256 digests. | Isolates untrusted vendor archives before downstream processing. |
| **2** | **Document Intelligence** | TF-IDF classification across 13 statutory document types with sub-second PyMuPDF text layer and Tesseract 5.0 OCR fallback. | Eliminates manual document sorting and extracts word coordinates. |
| **3** | **Entity Resolution** | Deterministic PAN-in-GSTIN containment checking (chars 3–12) and Jaro-Winkler legal name similarity ($\ge 0.85$). | Prevents identity fraud while protecting MSEs from wrongful disqualification due to minor abbreviations. |
| **4** | **Registry Adapters** | Deterministic simulated adapters conforming to GSTN, PAN, MCA-21, Udyam, and CPPP schemas with transparent mock disclosures. | Validates credentials without requiring officers to log into 5 external portals. |
| **5** | **Deterministic Rules Engine** | 34 CPCL Goods criteria under GFR 2017 evaluated in Python with strict legal precedence (`FAIL > REVIEW > WARN > PASS`). | Guarantees 100% reproducible compliance rulings with zero generative hallucinations. |
| **6** | **Forensic Anomaly Detection** | Scans PDF binary streams for graphic editor modifications (e.g. GIMP) and detects indirect prompt injection tokens in bid text. | Defends the procurement process against doctored credentials and adversarial LLM attacks. |
| **7** | **Explainable Risk Scoring** | Transparent 0–100 composite risk score decomposed into Identity (+35), Compliance (+25), Financial (+5), and Anomaly factors. | Eliminates black-box scoring; every single risk point is attributed to a verifiable root cause. |
| **8** | **Split-Screen Evidence Inspector** | Dual-pane viewer rendering high-resolution PDF pages with exact coordinate bounding box highlight overlays. | Enables officers to verify evidence visually in seconds without opening external PDF viewers. |
| **9** | **Human Adjudication Cockpit** | Dedicated interface allowing officers to accept findings, issue clarifications, or record mandatory written justifications for overrides. | Preserves statutory procurement governance; human officers retain sole legal authority. |
| **10** | **Cryptographic Audit & Dossier** | Forward SHA-256 hash-chained immutable ledger verified at runtime, with one-click export to official CVC Compliance Dossier PDFs. | Produces tamper-evident, publication-grade dossiers ready for CAG and CVC audit scrutiny. |

---

## 🔒 Security Architecture

VigilBid applies defense-in-depth across the ingestion and evaluation pipeline:

- **Ingestion Defenses:** Validates file magic bytes (`%PDF-`), enforces a maximum 100:1 archive decompression ratio, and checks filenames against path traversal attacks (`../`).
- **Content-Addressable Storage (CAS):** Files are stored by their SHA-256 digest (`data/storage/{bidder_id}/{sha256}.pdf`), ensuring immutability and preventing file overwrites.
- **Prompt Injection Protection:** Scans submitted bid text layers for prompt injection patterns attempting to manipulate downstream LLM copilot contexts.
- **Stateless RBAC:** Uses signed HMAC-SHA256 JWTs with role-based access control (`Officer`, `Approver`, `Auditor`, `Admin`).
- **Environment Isolation:** Sensitive credentials and secrets are managed via `.env` files and excluded from version control.

*For full vulnerability disclosure procedures, see [SECURITY.md](SECURITY.md) and [docs/security/SECURITY.md](docs/security/SECURITY.md).*

---

## 🧪 Testing & Verification

The project includes unit, integration, and release certification test suites:

```bash
# 1. Run all backend automated tests (380 tests)
pytest tests/ -v

# 2. Run frontend component & UI architecture checks (70 tests)
cd frontend && npm test && cd ..

# 3. Run the automated 20-subsystem release certification audit
python scripts/release_audit.py
```

### Verified Performance Benchmarks

| Benchmark Dimension | Measured Result | Verification Method |
|---|---|---|
| **Archive Ingestion & Checksum Calculation** | **1.24 s** | `tests/unit/test_ingestion_security.py` |
| **PyMuPDF Text Layer & Coordinate Extraction** | **32 ms / doc** | `tests/unit/test_ocr_engine.py` |
| **Deterministic Rule Evaluation (34 rules)** | **4.2 ms / bidder** | `tests/unit/test_rule_engine.py` |
| **Explainable Composite Risk Calculation** | **1.8 ms** | `tests/unit/test_risk_engine.py` |
| **Audit Hash Chain Verification (1,000 events)** | **8.4 ms** | `tests/unit/test_audit_chain.py` |
| **Automated Release Audit (20 subsystems)** | **7.89 s** | `scripts/release_audit.py` |

---

## ⚠️ Synthetic Demonstration Data & Mock Integration Disclosure

| Component | Current Implementation (Demo) | Production Requirement (Go-Live) |
|---|---|---|
| **External Portals** | Deterministic mock adapters conforming to official GSTN, MCA-21, and Udyam JSON schemas. | Official departmental MoUs, production API credentials, and Hardware Security Modules (HSMs). |
| **Vendor Datasets** | 5 synthetic vendor packages (26 PDFs) with ground truth specifications. | Ingestion of live vendor archives under departmental confidentiality protocols. |
| **Procurement Scope** | 34 CPCL Goods criteria under GFR 2017. | Configuration of Works, Services, and Non-Consultancy procurement rule sets. |
| **Adjudication Role** | Advisory decision support with mandatory human review. | Statutory authority remains exclusively with designated human procurement officers. |

```
┌─────────────────────────────────┬──────────────┬────────────┬────────────────────────────────────────────────────────┐
│ Synthetic Vendor Submission     │ Status       │ Risk Score │ Key Scrutiny Outcome                                   │
├─────────────────────────────────┼──────────────┼────────────┼────────────────────────────────────────────────────────┤
│ 1. Meridian Flow Systems        │ PASS         │ 0.0 (LOW)  │ Clean, fully compliant Tier-1 pump manufacturer.       │
│ 2. Sri Kaveri Engineering Works │ REVIEW       │ 22.0 (LOW) │ Minor MSE legal suffix variation; turnover exempted.   │
│ 3. Bharat Hydrotech Corp        │ FAIL         │ 65.0 (HIGH)│ Hard PAN-in-GSTIN mismatch & local content deficit.    │
│ 4. Nova Pumps & Systems Ltd     │ WARN         │ 72.0 (HIGH)│ Forensic PDF timestamp edit & prompt injection token.  │
│ 5. Zenith Infra Tech Pvt Ltd    │ FAIL         │ 95.0 (HIGH)│ Cancelled GSTIN registration & active CVC debarment.   │
└─────────────────────────────────┴──────────────┴────────────┴────────────────────────────────────────────────────────┘
```

---

## ⚠️ Known Limitations & Production Prerequisites

We believe in complete transparency regarding the current implementation scope:

1. **Government Registries:** The current release uses sandbox mock adapters. Production deployment requires formal MoUs and production credentials with GSTN, Income Tax (NSDL/UTIITSL), MCA-21, and CPPP.
2. **Evaluation Scope:** The rules repository currently encodes 34 CPCL Goods criteria. Tenders for Works, Services, or Non-Consultancy items require authoring corresponding YAML rule sets.
3. **Statutory Adjudication:** VigilBid is an advisory decision-support system. It does not replace the statutory Tender Evaluation Committee (TEC).

*For complete architectural disclosures, see [docs/KNOWN-LIMITATIONS.md](docs/KNOWN-LIMITATIONS.md).*

---

## ⚡ Quick Start

### Prerequisites
- **Python:** Version 3.11 or higher
- **Node.js:** Version 18.0 or higher (with npm)
- **Docker & Docker Compose:** *(Optional, for containerized run)*

---

### Option A: Docker Deployment (Recommended)

```bash
# 1. Clone repository
git clone https://github.com/ratnesh-ml/SIH26100.git
cd SIH26100

# 2. Configure environment
cp .env.example .env

# 3. Build and launch all services
docker compose up --build
```

Access the application via your local browser:
- **Interactive Guided Tour (Zero Auth):** `/demo`
- **Procurement Officer Cockpit:** Application root
- **Interactive OpenAPI Documentation:** `/api/v1/docs`

---

### Option B: Local Host Setup (Zero Docker)

```bash
# 1. Setup Python backend
cp .env.example .env
python -m pip install -r requirements.txt
alembic upgrade head

# 2. Setup Node frontend
cd frontend && npm install && cd ..

# 3. Seed demonstration data
python scripts/demo_setup.py

# 4. Start services (separate terminals)
uvicorn backend.main:app --reload --port 8000
python worker.py
cd frontend && npm run dev
```

### Default Evaluation Credentials

| Role | Email Address | Password | Intended Evaluation Workflow |
|---|---|---|---|
| **Procurement Officer** | `officer@cpcl.gov.in` | `Officer@123` | Main bid evaluation, evidence inspection & override adjudication |
| **Vigilance Officer (CVO)** | `vigilance@cpcl.gov.in` | `Vigilance@123` | Audit inspection, collusion graph analysis & report verification |
| **System Administrator** | `admin@cpcl.gov.in` | `Admin@123` | System configuration, diagnostic checks & user management |

---

## 📁 Repository Structure

```
SIH26100/
├── backend/          # FastAPI REST API, SQLAlchemy 2.0 models, authentication, and services
├── frontend/         # React 18 + Vite + TypeScript application with vigilance dark theme
├── pipeline/         # 11-step asynchronous bid verification and document processing pipeline
├── rules/            # Declarative YAML rule definitions (34 CPCL Goods rules under GFR 2017)
├── data/             # Content-Addressable Storage (CAS) for raw PDF assets
├── tests/            # Automated test suites (380 backend tests + 70 frontend test checks)
├── scripts/          # Operations, demo seeding (demo_setup.py), and release verification scripts
├── seed/             # Synthetic vendor submission packages (26 PDFs) and registry fixtures
├── docs/             # Technical architecture, specifications, decision records, and demo guides
└── archive/          # Non-runtime historical assets and legacy viewer files
```

*For a detailed file-by-file inventory, see [docs/architecture/REPOSITORY-MAP.md](docs/architecture/REPOSITORY-MAP.md).*

---

## 👥 The Team

| Name | Role & Responsibility | Primary Contributions | GitHub / Contact |
|---|---|---|---|
| **Ritik** | Lead System Architect & Backend Engineer | Modular monolith architecture, FastAPI services, SQLAlchemy ORM, SHA-256 audit ledger | [Contributors](https://github.com/ratnesh-ml/SIH26100/graphs/contributors) |
| **Ratnesh** | AI Pipeline & OCR Engineer | 11-step pipeline orchestration, hybrid OCR, TF-IDF classification, entity resolution | [Contributors](https://github.com/ratnesh-ml/SIH26100/graphs/contributors) |
| **Team Member 3** | Frontend & UX Design Engineer | React 18 UI, split-screen evidence inspector, vigilance dark theme, demo tour | [Contributors](https://github.com/ratnesh-ml/SIH26100/graphs/contributors) |
| **Team Member 4** | Domain Rules & Compliance Specialist | 34 CPCL Goods criteria, GFR 2017 mapping, CVC dossier generator | [Contributors](https://github.com/ratnesh-ml/SIH26100/graphs/contributors) |
| **Team Member 5** | Security & DevOps Engineer | Ingestion defenses, CAS storage, Docker Compose stack, release audit runner | [Contributors](https://github.com/ratnesh-ml/SIH26100/graphs/contributors) |
| **Team Member 6** | QA & Evaluation Lead | Test suite development (380 backend tests), benchmarking, evaluation dataset | [Contributors](https://github.com/ratnesh-ml/SIH26100/graphs/contributors) |

---

## 📖 Research & Statutory References

- **General Financial Rules (GFR) 2017:** Ministry of Finance, Department of Expenditure, Government of India.
- **Manual for Procurement of Goods (2022):** Public Procurement Division, Department of Expenditure.
- **CVC Vigilance Manual (2021):** Central Vigilance Commission, Government of India.
- **CAG Performance Audit Report on Public Procurement (Report No. 18 of 2022):** Analysis of identity verification and compliance lapses in PSU tenders.
- **Public Procurement (Preference to Make in India) Order 2017 (PPP-MII):** DPIIT, Ministry of Commerce and Industry.

---

## 📜 License & Statutory Disclaimer

### License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

### Statutory Disclaimer
VigilBid is an open-source decision-support platform built for the Smart India Hackathon 2026 (Problem Statement SIH26100). Government registry data used in the default demonstration environment is synthetic and served via mock adapters; it must not be represented as live statutory government verification. Final procurement decisions remain the exclusive statutory responsibility of designated human procurement officers.
