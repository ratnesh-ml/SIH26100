# Part 1 — Sections 01–04: Understanding, Decomposition, Requirements, Architecture

---

## 01 — Research Understanding (mental model of the product)

**Working name:** VigilBid *(keep — short, memorable; not trademark-checked → verify before finale)*.

### What are we actually building?
A **buyer-side, human-in-the-loop decision-support web application** that lets a CPCL procurement officer upload a tender's eligibility criteria and each bidder's document package (ZIP of PDFs), and returns — per bidder, per criterion — a **traffic-light status (PASS / WARN / REVIEW / FAIL), the exact evidence (document, page, highlighted region), the rule and legal clause that fired, a transparent risk score, and a hash-chained audit record of the officer's decision** — exported as a PDF compliance dossier.

It is **not**: an autonomous evaluator, a fraud adjudicator, a GeM replacement, or a bidder-side tool.

### Who uses it?
| Persona | Role in system | Frequency |
|---|---|---|
| **Procurement Officer** (Ravi, CPCL Materials Dept.) | Creates tender criteria, uploads bidder packages, reviews findings, records decisions | Daily during bid evaluation |
| **TEC Member / Approver** | Second-pair-of-eyes; approves or dissents on flagged bidders | Per tender |
| **Vigilance / Auditor** (CVC/CAG, read-only) | Inspects audit trail, exports dossier | Ad hoc |
| **Admin** | Manages users, rule library, knowledge base | Rare |

MVP implements Officer + Approver + Auditor(read-only) roles; Admin is seed-data only.

### What problem does it solve?
Steps 3–5 of the CPCL two-bid workflow (unpack ZIPs → manual cross-portal identity checks → hand-filled Excel compliance matrix). These are slow (hours per bidder), error-prone (typos in PAN/GSTIN), unverifiable after the fact (no evidence trail), and blind to cross-document or cross-bidder inconsistencies that a human reading 30 ZIPs sequentially cannot see.

### End-to-end workflow
```
Officer creates Tender → defines/imports Criteria (from template) 
→ uploads Bidder ZIP(s) 
→ [pipeline] unzip → hash → classify each PDF → text-layer or OCR → field extraction 
   → normalise → entity-resolve (is every doc about the same firm?) 
   → verify (format/check-digit/mock registry/debarment) → compliance rules → anomaly signals 
   → risk score → explanation (template, clause-cited) 
→ Officer opens Bidder Compliance Cockpit → inspects evidence → Accept / Override / Request clarification (reason mandatory) 
→ Approver confirms → hash-chained audit log → PDF dossier
```

### What data enters?
Tender: title, NIT no., estimated value, MSE-applicability, criteria list (turnover threshold, experience, mandatory docs, PPP-MII class). Bidder: firm name + ZIP containing (typical CPCL set) GST Registration Certificate (REG-06), PAN card, Udyam Registration Certificate, audited financials / CA turnover certificate (with UDIN), ITR-V acknowledgements (3 yrs), OEM Authorization letter (Annexure-I), signed Integrity Pact, PPP-MII local-content self-declaration, Rule 144(xi) land-border declaration, EMD proof / MSE exemption claim, work-order/completion certificates, bank details, technical compliance sheet.

### What happens to that data?
Stored on local disk under `storage/{tender}/{bidder}/{sha256}.pdf`; text and fields in Postgres JSONB; sensitive identifiers encrypted at rest and masked in UI; nothing leaves the box except an optional, redacted LLM prose-polish call (feature-flagged off by default).

### AI vs deterministic (summary; detail in §05)
AI/ML is used where inputs are unstructured and variable: **document classification (TF-IDF + rules), OCR of scans, fuzzy entity matching, semantic retrieval for Copilot Q&A, optional LLM prose**. Deterministic code owns everything with legal consequence: **format/check-digit validation, cross-document identity consistency, threshold comparison, rule → status mapping, risk aggregation, audit hashing**.

### Outputs
Per-bidder compliance matrix; per-criterion finding cards (status, rule ID, clause, evidence, confidence); risk score 0–100 with driver breakdown; cross-bidder link graph; anomaly list; audit log; PDF dossier; JSON export.

### Where the human intervenes
Every finding requires an officer action before a bidder can be marked "Evaluation Complete": **Accept finding / Override (reason required) / Seek clarification**. FAIL never becomes "disqualified" in the system — the status vocabulary is deliberately *Recommended: Not Qualified*.

---

## 02 — Problem Decomposition

### 02.1 Sub-problems (ordered by legal weight)
1. **Document intake & integrity** — accept ZIP, reject dangerous files, fingerprint everything (SHA-256) so evidence is immutable.
2. **Document typing** — which PDF is the GST certificate vs the PAN vs an OEM letter? (Bidders name files randomly.)
3. **Text acquisition** — digital PDFs have a text layer; scans need OCR; hybrid PDFs have both.
4. **Field extraction** — pull ~40 named fields (GSTIN, PAN, legal name, trade name, constitution, registration date, Udyam no., enterprise category, NIC codes, turnover FY-wise, UDIN, OEM name/validity, declared local-content %, IP signatures…).
5. **Normalisation** — names (Pvt. Ltd. ≡ Private Limited), dates (DD/MM/YYYY vs DD-MM-YYYY), amounts (₹, lakh/crore, commas), addresses.
6. **Entity resolution** — do all documents refer to one legal entity? (name + PAN⊂GSTIN + address + Udyam↔PAN).
7. **Verification** — is each identifier structurally valid and (via registry) live/not-debarred?
8. **Compliance** — does bidder meet each tender criterion?
9. **Anomaly / consistency signals** — PDF metadata oddities, copy-paste artefacts, cross-bidder duplicates, prompt-injection text.
10. **Risk aggregation & explanation** — one number, many drivers, each with a sentence and a citation.
11. **Human decision + audit** — recorded, reasoned, hash-chained, exportable.
12. **Cross-bidder view** — matrix of all bidders × criteria; links between bidders.

### 02.2 What is *hard* vs what merely *looks* hard
| Looks hard, actually easy | Actually hard | Impossible in 36 h (→ future) |
|---|---|---|
| GSTIN/PAN validation (pure regex + checksum) | Robust OCR of poor scans of stamped/hand-annotated pages | Live GSTN/MCA/Udyam integration (onboarding) |
| Cross-doc PAN⊂GSTIN check | Turnover extraction from *unstructured* audited financial statements | Signature forgery detection |
| Hash-chained audit log | Company-name matching with abbreviations/typos at high precision | Collusion ML (no labels) |
| Traffic-light matrix UI | Making a demo reliable on a laptop with OCR in the loop | Multilingual (Tamil) OCR |
| PDF metadata anomalies | Evidence highlighting with coordinates from OCR *and* text-layer paths | Blockchain anchoring |

---

## 03 — Requirements

### 03.1 Functional requirements (derived from research + PS)
| ID | Requirement | Priority | Source |
|---|---|---|---|
| FR-01 | Officer login with role (officer / approver / auditor) | MUST | PS (RBAC, audit) |
| FR-02 | Create tender with metadata + criteria from a **CPCL goods-tender template** (editable thresholds) | MUST | CPCL process |
| FR-03 | Upload bidder package (ZIP or multi-PDF); server validates type/size/count; stores SHA-256 per file | MUST | PS |
| FR-04 | Asynchronous processing with per-step status visible in UI | MUST | Jury metric (time) |
| FR-05 | Classify each PDF into ≥12 doc types with confidence; "UNKNOWN" allowed | MUST | Core |
| FR-06 | Text-layer extraction, OCR fallback with per-page confidence | MUST | PS (OCR accuracy) |
| FR-07 | Extract named fields per doc type with source page + bbox + confidence | MUST | PS (extraction) |
| FR-08 | Validate identifier formats + check digits (GSTIN, PAN, Udyam, CIN, UDIN, IFSC) | MUST | Research §4.2 |
| FR-09 | Cross-document consistency (PAN⊂GSTIN, names, addresses, entity-type letter) | MUST | Core bottleneck |
| FR-10 | Entity resolution score across all docs of a bidder | MUST | Research §7 |
| FR-11 | Verification against **pluggable registry providers** (mock GSTN/PAN/Udyam/MCA + real debarment snapshot) | MUST (mock) | Research §10 #1 |
| FR-12 | Rule engine evaluates every tender criterion → PASS/WARN/REVIEW/FAIL + rule ID + clause | MUST | PS |
| FR-13 | Anomaly signals: PDF metadata, incremental updates, producer mismatch, text-vs-image inconsistency, cross-bidder duplicates, prompt-injection strings | MUST (subset) | Research §10 #3 |
| FR-14 | Risk score 0–100 with driver breakdown, weights visible | MUST | PS (risk) |
| FR-15 | Deterministic, clause-cited explanation per finding | MUST | PS (explainable) |
| FR-16 | Officer decision per finding (Accept / Override / Clarify) with mandatory reason | MUST | PS (human decision) |
| FR-17 | Append-only hash-chained audit log; verify-chain endpoint | MUST | PS (audit) |
| FR-18 | PDF compliance dossier per bidder + tender summary | MUST | PS (report) |
| FR-19 | Tender-level matrix: bidders × criteria heat-map | MUST | "One screen that wins" |
| FR-20 | Evidence viewer: PDF page render with highlight rectangle | MUST | Explainability |
| FR-21 | Cross-bidder link graph (shared identifiers / metadata / near-duplicate text) | SHOULD | Research §10 #2 (downgraded) |
| FR-22 | Compliance Copilot: Q&A over rule KB with citations (retrieval-first, LLM optional) | SHOULD | Research §10 #4 |
| FR-23 | Approver workflow (4-eyes) | SHOULD | Research §8.2 security |
| FR-24 | Signature-presence detection in signature blocks | COULD | Downgraded from SigNet |
| FR-25 | DSC (digital signature) presence/validity via pyHanko | COULD | Research §4.2 #14 |
| FR-26 | Live GSTN/PAN/Udyam/MCA adapters, LayoutLM extraction, GNN, multilingual OCR, blockchain anchor | WON'T | Future |

### 03.2 Non-functional requirements
| Area | Requirement (MVP) |
|---|---|
| **Accuracy** | ≥98% field accuracy on text-layer templated certificates (our seeded set); OCR path: fields with confidence <0.85 auto-routed to REVIEW (never silently PASS/FAIL). |
| **Performance** | Text-layer package (≈10 PDFs, 40 pages): ≤60 s end-to-end on laptop CPU. Scanned pages: ~2–4 s/page, parallel per page. UI polls status every 2 s. |
| **False positives** | Rules are conservative: uncertainty → REVIEW, not FAIL. FAIL only on deterministic evidence (invalid check digit, exact debarment match, threshold clearly unmet with confidence ≥0.9). |
| **Auditability** | Every finding traceable to doc SHA-256 + page + bbox + rule version; every human action hash-chained (prev_hash → curr_hash). |
| **Security** | JWT auth, RBAC on every route, file-type sniffing (magic bytes), size limits, path-traversal-safe unzip, PAN/GSTIN encrypted at rest, masked in UI, no document leaves the host, prompt-injection guard. |
| **Privacy** | DPDP-aware: minimal PII display, redaction before any LLM call, no third-party analytics. |
| **Reliability** | Every AI component has a deterministic fallback; demo dataset precomputed and cached. |
| **Explainability** | No status without rule ID + human-readable reason + clause citation + evidence pointer. |
| **Data integrity** | Immutable stored files (write-once), unique constraints on (bidder, sha256). |
| **Accessibility** | Colour + icon + text for statuses (not colour alone); keyboard-navigable matrix. |
| **Deployability** | `docker compose up` on one laptop; no GPU; no internet required for core path. |

---

## 04 — Complete System Architecture

### 04.1 Layered map (final, after cuts)
```
┌──────────────────────────── BROWSER (React + TS SPA) ─────────────────────────────┐
│ Login · Tender list · Tender detail (matrix) · Upload · Processing status ·        │
│ Bidder Cockpit (findings + evidence viewer + risk + copilot + decision) ·          │
│ Cross-bidder graph · Audit trail · Report download                                │
└───────────────────────────────────────┬───────────────────────────────────────────┘
                                        │ HTTPS/JSON (JWT bearer)
┌───────────────────────────────────────▼───────────────────────────────────────────┐
│ FastAPI monolith  /api/v1                                                         │
│  auth · rbac deps · tenders · bidders · documents · jobs · findings · decisions ·  │
│  audit · reports · copilot · graph · registry(mock)                               │
│  ── enqueue job ──▶ Postgres table `jobs` (status machine)                        │
└──────┬───────────────────────────────────────────────────────────────┬────────────┘
       │                                                               │
┌──────▼──────────── WORKER PROCESS (same codebase, `python -m worker`) ▼──────────┐
│ pipeline/                                                                         │
│  1 ingest      unzip safely · sniff · sha256 · store                              │
│  2 classify    filename hints + TF-IDF/logreg on first-page text + keyword rules  │
│  3 textify     PyMuPDF text layer ─ if empty ─▶ render 300dpi ▶ PaddleOCR/Tesseract│
│  4 extract     per-doctype extractors (anchor+regex+table) → fields{value,page,bbox,conf}│
│  5 normalise   names/dates/amounts/addresses                                      │
│  6 resolve     entity-resolution score across docs                               │
│  7 verify      format/check-digit · RegistryProvider(mock|real) · debarment       │
│  8 rules       compliance rule engine (YAML rules → findings)                     │
│  9 anomaly     pdf forensics · cross-bidder links · injection scan               │
│ 10 risk        weighted aggregation → score + drivers                             │
│ 11 explain     templates + clause citations (+ optional LLM polish)               │
└──────┬─────────────────────────┬──────────────────────────┬───────────────────────┘
       │                         │                          │
┌──────▼──────┐        ┌─────────▼─────────┐      ┌─────────▼───────────┐
│ PostgreSQL  │        │ Local disk storage│      │ Knowledge base       │
│ (JSONB,     │        │ /storage/... PDFs │      │ rules.yaml + kb/*.md │
│  audit log) │        │ + page PNG cache  │      │ (+ in-mem embeddings)│
└─────────────┘        └───────────────────┘      └─────────────────────┘
```

### 04.2 Component explanations
| Component | Responsibility | Why this shape |
|---|---|---|
| **SPA frontend** | All screens; polls job status; renders PDF pages as images from API with overlay boxes | Avoids PDF.js coordinate pain; server renders page PNG once and caches |
| **FastAPI monolith** | Auth, CRUD, enqueue, read models, report generation | 3 people, 36 h: one deployable, one schema, no message broker |
| **Jobs table as queue** | `SELECT … FOR UPDATE SKIP LOCKED` by worker | Zero extra infra; visible status; restart-safe |
| **Worker** | Runs the 11-step pipeline per bidder submission; writes step status | Separate process so OCR never blocks API |
| **RegistryProvider** | Interface `lookup_gstin()`, `lookup_pan()`, `lookup_udyam()`, `lookup_cin()`, `debarment_search()` — `MockProvider` (fixture JSON) + `RealProvider` stubs | Research's "mock now, real later" pattern |
| **Rule engine** | YAML rule definitions → Python evaluators → Finding rows with status, clause, evidence refs | Rules are data → judges can read them; versioned |
| **Anomaly module** | PDF metadata + xref/incremental-update count + text-vs-render mismatch + cross-bidder identifier reuse + injection regex | All deterministic signals, no "fraud" verdict |
| **Risk engine** | Sum of driver weights → clamp 0–100; band Low/Medium/High; drivers list | Transparent; weights in one file |
| **Explainer** | Jinja templates per rule + clause text from KB; optional LLM rewrite | Never depends on LLM |
| **Copilot (SHOULD)** | Retrieval over KB chunks (bge-small or TF-IDF) → cited passages → optional LLM answer | RAG-lite; grounded; falls back to "here are the relevant clauses" |
| **Audit log** | Append-only; `curr_hash = sha256(prev_hash + canonical_json(event))`; `/audit/verify` recomputes chain | Tamper-evidence without blockchain |
| **Report** | WeasyPrint/ReportLab HTML→PDF; embeds evidence thumbnails, findings, decisions, chain head hash | One click; CVC/RTI ready |
| **Postgres** | Relational core + JSONB for extracted fields/evidence + optional pgvector | One engine |
| **Local storage** | Write-once files named by sha256 | Immutability by construction |
