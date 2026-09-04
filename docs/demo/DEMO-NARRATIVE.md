# VigilBid (SIH26100) — 7-Minute Judge Demonstration Narrative

**Demonstration Title:** Automated Tender Compliance Verification for CPCL & GeM Procurement  
**Presentation Persona:** Procurement Officer (Ravi, Contracts & Materials Dept., CPCL Manali Refinery)  
**Target Tender:** `CPCL/MM/2026/PUMP-217` — 12 API-610 Centrifugal Process Pumps (₹18.40 Crores)  
**Tone & Vocabulary:** Strict CVC statutory terminology (*"The system recommends; the procurement officer decides"*). Never use words like *"fake"*, *"fraud"*, or *"disqualified"*.

---

## Chronological Demonstration Flow

```
  00:00        00:30        01:00             02:00                    03:00                  04:00                05:00                     06:00          07:00
┌────────────┬────────────┬─────────────────┬────────────────────────┬──────────────────────┬────────────────────┬─────────────────────────┬──────────────┐
│  Problem   │   Tender   │   Bid Upload    │  Document Intelligence │     Verification     │  Compliance & Risk │   Evidence & Decision   │ Audit Trail  │
│ Statement  │   Setup    │ & Decomposition │  (OCR & Classification)│ (Registries & Entity)│  (Rules & Anomaly) │ (Cockpit & Justification│  & Dossier   │
└────────────┴────────────┴─────────────────┴────────────────────────┴──────────────────────┴────────────────────┴─────────────────────────┴──────────────┘
```

---

### Beat 1: Problem Statement (00:00 – 00:30)
- **Screen:** Dashboard / Hero View (`/dashboard` or `/demo`)
- **Action:** Open browser to VigilBid Dashboard. Point to the procurement volume metrics.
- **Narrative:**
  > *"Respected Judges, public sector procurement in India handles over ₹4 lakh crore annually on GeM. In high-value tenders for PSUs like Chennai Petroleum Corporation Limited (CPCL), evaluating a single tender with 30 bidders requires manually cross-verifying more than 900 statutory documents across 5 disparate government portals. A CAG audit revealed that 42.79% of unverified PANs go unnoticed in manual review. VigilBid is a buyer-side, human-in-the-loop decision-support platform that automates eligibility verification under GFR 2017 while keeping the officer in absolute control."*
- **What Judges See:** A clean, professional vigilance dashboard displaying live tenders, bidder status distributions, and active audit health.

---

### Beat 2: Tender Setup & Criteria Definition (00:30 – 01:00)
- **Screen:** Tender Detail View (`/tenders/CPCL-PUMP-217`)
- **Action:** Click into `CPCL/MM/2026/PUMP-217` (₹18.40 Cr, Centrifugal Process Pumps). Open the "Criteria Library".
- **Narrative:**
  > *"Here is a live CPCL tender. The system ingests standard GeM tender parameters: ₹18.40 Crore value, 3-year average turnover threshold of ₹5.52 Crores, Class-I Local Supplier requirement (minimum 50% local content under PPP-MII), and mandatory land-border declarations under GFR Rule 144(xi). These 34 rules are loaded from declarative, auditable YAML files—not hardcoded into software."*
- **What Judges See:** Structured criteria cards with GFR and CPCL clause citations, threshold amounts, and mandatory document requirements.

---

### Beat 3: Bid Upload & Document Ingestion (01:00 – 02:00)
- **Screen:** Document Ingestion Modal / Bidder Upload View
- **Action:** Select Bidder C (`Bharat Hydro Equipments Ltd`), drag-and-drop the submission ZIP file (`bharat_hydro_bid_pkg.zip`). Click "Start Ingestion & Analysis".
- **Narrative:**
  > *"In public procurement, bidder submissions represent untrusted inputs. Our ingestion gateway immediately validates magic bytes (%PDF-), computes SHA-256 fingerprints for content-addressable storage, and applies decompression bomb defense to block archives exceeding safe ratios. Within 3 seconds, 12 PDF files are extracted, fingerprinted, and queued for multi-stage processing."*
- **What Judges See:** Progress stepper animating through Ingest $\rightarrow$ Decompress $\rightarrow$ Fingerprint $\rightarrow$ Queue. Decompression ratio: 1.8:1 (well within the 100:1 safety threshold).

---

### Beat 4: Document Intelligence (02:00 – 03:00)
- **Screen:** Processing Pipeline Stepper & Document Classification View
- **Action:** Expand the Document Processing pipeline view. Highlight the classification badges and OCR confidence metrics.
- **Narrative:**
  > *"Bidders submit documents with random filenames like 'scan_001.pdf'. Our hybrid classification model combines TF-IDF token vectorization with structural heuristics to automatically classify 13 document types—including GST REG-06, PAN cards, Udyam certificates, and CA turnover sheets. For digital PDFs, PyMuPDF extracts the native text layer in milliseconds. For scanned or stamped pages, the system automatically falls back to our local Tesseract OCR engine, capturing word bounding-box coordinates for audit verification."*
- **What Judges See:** Clean document cards: `scan_001.pdf` tagged as `GST_CERTIFICATE` (Confidence: 98.4%), `doc_04.pdf` tagged as `UDYAM_CERTIFICATE` (Confidence: 99.1%).

---

### Beat 5: Verification & Entity Resolution (03:00 – 04:00)
- **Screen:** Bidder Cockpit — Entity Resolution & Registry Verification Grid
- **Action:** Show Bidder B (`Sri Kaveri Engineering Works`) vs Bidder C (`Bharat Hydro Equipments Ltd`).
- **Narrative:**
  > *"Does every document in the package belong to the same legal entity? In Bidder B, we see an entity resolution alert: the PAN card says 'Sri Kaveri Engineering Works LLP', but the GST certificate says 'Sri Kaveri Engineering Works Limited Liability Partnership'. Our Jaro-Winkler string distance engine calculates a similarity score of 0.82 and normalizes this common legal abbreviation, marking it as a minor review rather than a failure.*
  >
  > *Now look at Bidder C: the PAN extracted from their PAN card is `AAACB1234F`, but characters 3–12 of their GSTIN are `AAACB9999F`. This is a hard structural mismatch. Simultaneously, our government registry adapters cross-check status against GSTN and CVC Debarment lists."*
- **What Judges See:** Clear entity comparison table highlighting matching and conflicting fields; registry verification badges showing active vs flagged status.

---

### Beat 6: Compliance Rules & Risk Scoring (04:00 – 05:00)
- **Screen:** Compliance Matrix (`/compliance-matrix`) & Risk Breakdown
- **Action:** Open the Compliance Matrix tab. Display the multi-bidder comparison table.
- **Narrative:**
  > *"Here is the automated Compliance Matrix. 5 bidders evaluated across 34 criteria simultaneously:
  > - Meridian Pumps: All green PASS, Risk Score 0/100.
  > - Sri Kaveri: Amber WARN on turnover, but green PASS on MSE exemption under GFR Rule 153.
  > - Bharat Hydro: Red FAIL on PAN-GSTIN identity consistency.
  > - Nova Pumps: Amber on compliance, but our forensic engine detected PDF metadata anomalies—the creation timestamp postdates the modification timestamp, and an indirect prompt injection was detected in the technical bid.*
  >
  > *Our risk engine doesn't output a black-box number: it breaks down the score into Identity Risk, Financial Risk, Compliance Gap, and Anomaly Signals with exact percentage drivers."*
- **What Judges See:** High-density traffic-light compliance matrix; risk score cards showing driver breakdowns and weighted contributions.

---

### Beat 7: Evidence Inspector & Officer Adjudication (05:00 – 06:00)
- **Screen:** Bidder Cockpit — Split-Screen Evidence Viewer & Action Dock
- **Action:** Click into Bidder B (`Sri Kaveri`). Click the turnover finding card. Show the split-screen PDF evidence viewer with yellow bounding box. Click "Accept Finding". Then switch to an override scenario.
- **Narrative:**
  > *"Crucially, VigilBid does not make the final decision. Look at this split-screen cockpit: on the left is the finding; on the right is the actual source PDF, automatically scrolled to page 3 with the exact CA turnover figure and UDIN highlighted.
  >
  > If the procurement officer agrees, they click 'Accept'. If they choose to 'Override' a finding, our system mandates an official written justification. Without a documented reason, the system will not allow the override. The system strictly recommends: 'Recommended: Not Qualified — officer confirmation required'. The officer retains statutory responsibility."*
- **What Judges See:** Instant document scrolling to target page with yellow highlight overlay; modal dialog requiring written justification for override actions.

---

### Beat 8: Cryptographic Audit Trail & Dossier Export (06:00 – 07:00)
- **Screen:** Audit View (`/audit`) & Generated PDF Dossier (`/reports`)
- **Action:** Navigate to Audit Trail. Click "Verify Ledger Integrity". Then click "Download CVC Compliance Dossier".
- **Narrative:**
  > *"Finally, every login, document upload, OCR run, finding generation, and officer override is recorded in an immutable, SHA-256 hash-chained audit ledger. Let's click 'Verify Ledger Integrity'—the system verifies 100% of cryptographic hashes from genesis to head, proving no records have been altered in the database.
  >
  > With one click, the officer exports a formal CVC-compliant PDF dossier containing every finding, evidence citation, and officer signature—ready for immediate submission to the Tender Evaluation Committee and CAG audit.
  >
  > That is VigilBid: Faster procurement, zero unverified documents, and 100% auditable vigilance."*
- **What Judges See:** Green verification badge: *"Audit Chain Verified: 100% Tamper-Evident"*; high-resolution PDF preview with official CPCL header, compliance tables, and signature blocks.
