# VigilBid in 60 Seconds: Executive One-Minute Tour

**Project Name:** VigilBid (SIH26100)  
**Track:** Smart India Hackathon 2026 Grand Finale  
**Domain:** Public Procurement & Vigilance · GeM & CPCL (Ministry of Petroleum & Natural Gas)  
**Status:** Certified Release Candidate · 100% Tests Passing (380 Backend, 70 Frontend, 20/20 Release Audit)

---

## 1. What is VigilBid?
VigilBid is a **buyer-side, human-in-the-loop decision-support platform** that automates the technical and eligibility evaluation of public procurement tenders under **GFR 2017** and **CVC guidelines**. It ingests bidder document packages (ZIP of PDFs), performs hybrid extraction and deterministic compliance checking, and produces tamper-evident, audit-ready compliance dossiers.

> **What it is NOT:** It is *not* an autonomous judge, it does *not* replace GeM, and it *never* automatically disqualifies bidders. It assists human procurement officers with evidence-backed findings.

---

## 2. Who Uses It?
- **Procurement Officers (CPCL Materials Dept):** Evaluate tender submissions in minutes rather than days, eliminating manual verification fatigue across 30+ documents per bidder.
- **Tender Evaluation Committee (TEC) Members:** Review compliance matrices, cross-bidder risk comparisons, and inspect highlighted PDF evidence before signing off.
- **Vigilance & Oversight Bodies (CVC / CAG):** Inspect an unalterable, SHA-256 hash-chained cryptographic ledger verifying every officer decision and override.

---

## 3. How Does It Work?
```
Bidder ZIP Upload
   │
   ▼
[1] Ingest & Security Check (Zip Bomb & Magic Byte Protection, SHA-256 Fingerprinting)
   │
   ▼
[2] Document Intelligence (Classify 13+ types, PyMuPDF layer + Tesseract OCR fallback)
   │
   ▼
[3] Entity Resolution & Registry Verification (GSTN, PAN, MCA, Udyam, Debarment sandbox)
   │
   ▼
[4] Deterministic Rules (34 CPCL Goods Rules evaluated under GFR 2017)
   │
   ▼
[5] Forensic Anomaly Engine & Explainable Risk Scoring (0–100 weighted factor score)
   │
   ▼
[6] Officer Decision Cockpit (Accept / Override with mandatory reason) ──► Cryptographic Audit Ledger
```

---

## 4. What is Genuinely Innovative?
1. **Evidence-First Verification:** Every finding (`PASS`, `WARN`, `REVIEW`, `FAIL`) is tied to an exact document name, page number, bounding box coordinates, and verbatim text citation.
2. **Deterministic Rules Over Black-Box LLMs:** AI is used strictly for noisy perception (OCR, layout parsing); all legal decisions and compliance calculations use deterministic Python logic.
3. **Cross-Document Entity Resolution:** Catches hidden discrepancies across documents (e.g., PAN within GSTIN mismatch, differing entity names across Udyam vs PAN).
4. **Forensic Anomaly Triggers:** Flags PDF metadata tampering (e.g., GIMP modified date preceding creation date) and indirect adversarial prompt injections.
5. **Cryptographic Integrity:** Every action is chained into an immutable SHA-256 ledger modeled on git commit trees.

---

## 5. What the Demo Shows
The included demonstration environment loads a synthetic CPCL Centrifugal Pump tender scenario (`CPCL/PROC/2026/PUMP-042`) with 5 realistic bidders:
- **Meridian Pumps Pvt Ltd:** Clean, fully compliant Tier-1 vendor.
- **Kaveri Flow Systems LLP:** Minor MSE abbreviation variance (`LLP` vs `Limited Liability Partnership`), flagged as `WARN` for human review.
- **Bharat Hydrotech Corp:** Hard PAN-GSTIN mismatch (`AAACB1234F` vs `AAACB9999F`), correctly flagged as `FAIL`.
- **Nova Impellers Ltd:** Forensic anomaly (GIMP metadata alteration) & indirect prompt injection attempt, flagged with elevated risk (76.5/100).
- **Zenith Valves & Controls:** CVC-debarred entity detected against simulated registry sanctions.

---

## 6. What is Simulated vs Real?
| Component | Implementation Status | Note for Evaluators |
|---|---|---|
| **Document Ingestion & OCR** | **100% Real Code** | PyMuPDF + Tesseract 5.0 run locally on real synthetic PDF packages. |
| **Deterministic Rules Engine** | **100% Real Code** | 34 CPCL Goods rules executed natively via Python rule engine. |
| **Risk & Anomaly Engine** | **100% Real Code** | Weighted mathematical model and PDF metadata forensics. |
| **Cryptographic Audit Ledger** | **100% Real Code** | SHA-256 hash chaining actively verified on every request. |
| **Government Registries** | **Simulated Sandbox** | Live GSTN/MCA/Udyam APIs require government production whitelisting. VigilBid uses a high-fidelity mock adapter architecture adhering to official schemas. |

---

## 7. Where to Inspect the Code
- **Rules Engine:** [`pipeline/compliance/engine.py`](../pipeline/compliance/engine.py) & [`rules/cpcl_goods_v1.yaml`](../rules/cpcl_goods_v1.yaml)
- **Entity Resolution:** [`pipeline/entity_resolution/matcher.py`](../pipeline/entity_resolution/matcher.py)
- **Risk Scoring:** [`pipeline/risk/scorer.py`](../pipeline/risk/scorer.py)
- **Forensic Anomalies:** [`pipeline/risk/anomaly.py`](../pipeline/risk/anomaly.py)
- **Cryptographic Audit:** [`backend/services/audit_service.py`](../backend/services/audit_service.py)
- **Interactive UI Cockpit:** [`frontend/src/components/BidderDetailView.tsx`](../frontend/src/components/BidderDetailView.tsx)
- **Interactive Guided Demo Page:** [`frontend/src/components/DemoView.tsx`](../frontend/src/components/DemoView.tsx)
