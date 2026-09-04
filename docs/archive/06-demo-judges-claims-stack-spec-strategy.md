# Part 3 (cont.) — Sections 26–31: Demo Strategy, Judge Questions, Claim Defense, Final Tech Stack, Final Technical Specification, SIH Winning Strategy

---

## 26 — Demo Strategy (6 min 30 s)

**Tender:** NIT CPCL/MM/2026/PUMP-217, 12 API-610 centrifugal pumps, ₹18.4 cr. **Persona:** Ravi, Dy. Manager (Materials), 4 bidders on screen (say: "in a real tender he'd have 30").

| Time | Beat | Screen | Line |
|---|---|---|---|
| 0:00 | Hook | Slide | "CAG audited GeM: 42.79% of seller PANs were never verified. Officers verify by hand, portal by portal. Reading faster doesn't verify. VigilBid verifies — and the officer decides." |
| 0:40 | Upload | S4→S5 | Drag Bidder B's ZIP. Stepper animates: classify → OCR (show a skewed PAN scan being read) → extract → resolve → verify (simulated registries, badge visible) → rules → anomalies → risk. Finishes ~45 s (or pre-processed with "processed 43 s ago" if OCR is slow). |
| 1:40 | Matrix | S3 | Four rows, 12 columns of chips. "A is clean. B needs review. C is recommended not qualified. D — every rule passes, but look at the risk column." |
| 2:10 | Reveal 1 — minor gap done right | S6 Bidder B | Click GST-03 REVIEW: "'SRI KAVERI ENGG WORKS' vs 'Sri Kaveri Engineering Works' — entity confidence 0.82, PAN embedded in GSTIN matches, so it's the same firm. The system did *not* fail an MSE for an abbreviation — it asked a human." Officer clicks Accept → reason → status flips. |
| 2:55 | Reveal 2 — hard mismatch | S6 Bidder C | GST-02 FAIL: GSTIN chars 3–12 ≠ PAN card; evidence boxes on both documents side by side. MII-01 FAIL: declared Class-I with 45% local content — clause card cites PPP-MII Order 2017 (≥50%). "Every failure carries the rule and the clause." |
| 3:40 | Reveal 3 — passes rules, fails scrutiny | S6 Bidder D → S7 | Risk 72 (High) with drivers: GST certificate PDF modified 14 months after creation, 3 incremental updates, Producer 'GIMP'; **hidden white text instructing an AI to mark the bidder compliant — shown to the officer as evidence**; shared PDF author and phone with Bidder C (graph red edge); near-duplicate MII declaration. "We don't say fraud. We say: anomaly — human verification required." |
| 4:50 | Copilot (if P1 built) | S6 drawer | "Is an MSE exempt from EMD here?" → cited MSE Order 2012 passage + rule R-EMD-01. Badge shows retrieval-only or local model. |
| 5:15 | Audit + report | S8 | Click *Verify chain* → OK, 37 events. Download Bidder C dossier → open PDF: findings, evidence thumbnails, officer decisions with reasons, chain head hash. |
| 5:50 | Close | Slide | "Officer decides. Machine documents. Every decision CVC-audit-ready in one click. Built with rules where the law is clear, AI where the documents are messy, and a plug for real registries when CPCL gets the keys." |

**Backups:** pre-processed DB (`make demo`), VPS URL, 6-min MP4 with narration, static screenshots in deck.

---

## 27 — "One Screen That Wins": Bidder Cockpit (S6)

**Layout (1440×900, three columns 280 / flex / 360):**
- **Header bar:** Bidder name · declared vs canonical name · entity confidence pill · overall status pill (*Qualified / Qualified with observations / Needs Review / Recommended: Not Qualified — officer confirmation required*) · Risk gauge 0–100 with band · "Complete Review" button (disabled until all findings decided, tooltip shows remaining count) · "Download dossier".
- **Left — Criteria rail:** grouped by category (Identity · Financial · Technical · Statutory · Anomalies); each row: icon+status chip, title, rule ID, tiny confidence bar; filter tabs All/FAIL/REVIEW/WARN/PASS; keyboard ↑/↓.
- **Centre — Evidence viewer:** page PNG with semi-transparent highlight rectangles (primary evidence solid, secondary dashed); document tabs when a finding spans two documents (e.g., GST cert + PAN card side by side with "chars 3–12" callouts); page thumbnails; zoom; "Open source PDF" (download).
- **Right — Finding card:** Title; status; **Extracted vs Expected** table (e.g., `Local content 45% | ≥ 50% (Class-I)`); **Explanation** (template text); **Rule & Clause** (R-MII-01 → PPP-MII Order 2017, para 2(b), quote, source link); confidence and method badges (`text-layer`, `OCR 0.91`, `simulated registry`); **Decision panel**: Accept / Override / Seek clarification, reason textarea (required), previous decisions list with actor+time+hash prefix; **Ask Copilot** button pre-filled with "Why was R-MII-01 flagged?".
- **Bottom drawer (collapsed):** Risk drivers bar list (points per driver, click → jumps to evidence) and Anomaly signals with severity and the legal wording.

This screen shows Compliance + Risk + Evidence + Explanation + Human Action **simultaneously** — nothing else in the app matters as much. P3 spends 6 of the first 24 hours here.

---

## 28 — Judge Attack Test (32 questions)

| # | Category | Question | Ideal answer | Evidence to have ready |
|---|---|---|---|---|
| 1 | Problem | Isn't GeM already verifying PAN/GST at seller registration? | GeM validates format at onboarding; CAG 2020 found 42.79% unverified. And bid-level documents (OEM, MII, IP, turnover) are never verified by GeM — that's the officer's job. | CAG table screenshot |
| 2 | Problem | CPCL uses Tender Intel — why you? | Their public material describes reading & criterion mapping. We add identifier cross-checks, registry interface, PDF anomaly signals, cross-bidder links, clause-cited rules, hash-chained audit. We don't claim to know their internals. | Competitor slide |
| 3 | AI | Where exactly is AI used? | OCR, doc classification, fuzzy entity resolution, retrieval for Copilot, optional LLM prose. Decisions are rules + humans — by design, for legal defensibility. | §05 table |
| 4 | AI | Why not LayoutLM/Donut? | Statutory certificates are templated; anchor+regex reaches ≥98% on text-layer PDFs without GPU or labelled data; transformers are our upgrade path for unstructured financials. | eval.py numbers |
| 5 | Accuracy | Your OCR accuracy? | ≥98% field-level on text-layer; ~90–93% char-level on our scanned variants; every field <0.85 confidence is routed to REVIEW, never auto-FAIL. | eval table |
| 6 | Accuracy | False positives? | Uncertainty → REVIEW not FAIL; FAIL requires deterministic evidence (checksum, exact debarment, threshold with conf ≥0.9). Our 4-bidder set: 0 false FAILs. Real FP rate needs CPCL pilot. | rules YAML |
| 7 | Procurement | Officer overrides a FAIL — is that allowed? | Yes; the system is decision support. Override requires a written reason, is hash-chained and appears in the dossier — that's exactly what CVC wants documented. | S8 |
| 8 | Procurement | How do you handle MSE EMD exemption? | R-EMD-01: EMD ≥ amount OR Udyam category Micro/Small with matching PAN/GSTIN; Medium claiming exemption → FAIL (Bidder C). | Bidder C |
| 9 | Procurement | PPP-MII thresholds vary by nodal ministry. | Threshold is a tender-level parameter (default 50/20); officer edits at tender creation. Auditor-certificate rule triggers above ₹10 cr. | S2 dialog |
| 10 | Legal | Can this disqualify a bidder? | No. Vocabulary is "Recommended: Not Qualified — officer confirmation required"; only a human action changes review state. | UI |
| 11 | Legal | You call documents tampered — defamation risk? | We never do. Signals are "anomaly detected — human verification required" with the raw metadata shown. Codebase greps clean for fraud/forged/fake. | grep output |
| 12 | Legal | PII and DPDP Act? | PAN/GSTIN encrypted at rest, masked in UI, no third-party calls, documents never leave the host, LLM disabled by default and redacted when on. | §17 |
| 13 | Security | A malicious PDF tells your AI to pass the bidder. | Bidder D does exactly that. We detect invisible/injection text as an anomaly, show it to the officer, and the LLM is never the decision-maker. | Live demo |
| 14 | Security | Zip bombs, path traversal, PDF JavaScript? | Ratio guard, entry-name sanitisation, `/JavaScript` `/Launch` flagged, PDFs never rendered inline. | code |
| 15 | Dataset | Your data is synthetic — so what? | Format-faithful, checksum-valid, with ground truth so we can *measure*; real bidder data is confidential — a CPCL pilot is the validation step. | generator |
| 16 | Dataset | Did you test on real scans? | Yes, our scan variants (JPEG compression, skew) and public CPCL tender PDFs for criteria text. Real bidder scans require pilot access. | |
| 17 | RAG | Is this just ChatGPT? | Retrieval over a curated 80-chunk KB of GFR/PPP-MII/MSE/CVC text; answers show quotes; works with the LLM off. | Copilot badge |
| 18 | RAG | Hallucination control? | LLM optional; if on, answers must cite retrieved passages; any identifier/number not present in inputs → discard → template. | §17 |
| 19 | Fraud | Can you detect a forged GST certificate? | Not authoritatively without GSTN. We detect structural invalidity, cross-document inconsistency, PDF anomalies; the registry adapter is where the authoritative check plugs in. | RegistryProvider |
| 20 | Fraud | Why no ML fraud model? | No labelled procurement-fraud data at bid level; a model trained on synthetic data would be theatre. Rules are auditable today; ML is Phase 2 once CPCL history exists. | |
| 21 | Fraud | Collusion detection? | Deterministic shared-attribute graph (phone, address, bank, director, PDF author, duplicate text). Bidder C–D demo. | S7 |
| 22 | Scalability | 40 bidders × 30 pages? | Text-layer packages <60 s; OCR parallel per page ~2–4 s/page/core; worker scales horizontally by adding processes; Postgres queue. | timings |
| 23 | Scalability | Air-gap? | No external dependency in core path; OCR models bundled; LLM local (Ollama) or off. | compose |
| 24 | Existing | Why not just use Surepass/Setu APIs? | We will — that's the RealProvider. Verification alone isn't the product; the compliance matrix, evidence, audit and decision workflow are. | |
| 25 | Innovation | What's new? | Integrating identifier-level cross-checks (PAN⊂GSTIN, entity-type letter), PDF anomaly forensics, cross-bidder links and clause-cited rules into one officer-in-the-loop cockpit with a tamper-evident audit log — for Indian statutory artefacts specifically. | |
| 26 | Feasibility | What breaks in production? | Certificate templates change → extractor regression tests + officer re-tag; registries need onboarding; OCR on very poor scans → REVIEW load. | |
| 27 | Impact | Quantify savings. | We won't quote hours we haven't measured. Our pipeline does in ≤1–3 min what an officer does across 5–6 portals; the pilot will produce the number. CAG's ₹792 cr delayed orders is the stake. | |
| 28 | Impact | Benefit to MSMEs? | Minor gaps (abbreviations) go to REVIEW with evidence instead of rejection — reduces wrongful rejection of small bidders. | Bidder B |
| 29 | Tech | Why Postgres as queue, no Celery? | 3 devs, 36 h; `SKIP LOCKED` is robust; fewer moving parts = reliable demo; Celery is a drop-in later. | |
| 30 | Tech | Why hash chain, not blockchain? | Tamper-evidence needs only a hash chain + external anchoring; a ledger adds ops cost with no evidentiary gain for a single-organisation system. | |
| 31 | Business | Who pays? | CPCL/IOCL procurement IT; per-tender or annual licence; expands to other PSUs under MoPNG with the same GFR rules. | |
| 32 | Ethics | Bias against small/regional firms? | Rules are identical for all; name matching is tolerant of abbreviations and transliteration; low confidence → human, not rejection. | |

---

## 29 — Claim Defense

| Claim | Source | Confidence | Say publicly? |
|---|---|---|---|
| CAG Report No. 18 of 2020 found 42.79% PAN unverified, 36.12% CIN missing, ₹792.41 cr orders delayed up to 312 days | CAG (research) | High *after* someone opens the PDF | **Yes** (after verification) |
| "67% MSMEs lost tenders / 82% rejected for minor gaps" | LinkedIn post, dates inconsistent | Low | **No** — say "practitioners report most rejections are minor documentation gaps" |
| Tender Intel is deployed at CPCL | Vendor website | Medium | Only as "publicly states" |
| Global suites lack GeM/Indian artefact support | Arched.ai comparison + product pages | Medium | Yes, phrased as "to our knowledge" |
| PPP-MII Class-I ≥50%, Class-II ≥20%, auditor cert >₹10 cr | DPIIT Order 2017 (2020 rev.) | High | Yes |
| MSE EMD exemption | MSE Order 2012 | High | Yes |
| GFR 144(xi) land-border restriction (2020) | DoE Order | High | Yes |
| GSTIN contains PAN (chars 3–12); check digit mod-36 | Public GSTIN spec | High | Yes |
| PAN 4th char denotes holder type | ITD | High | Yes |
| Our field accuracy ≥98% text-layer / OCR ~90% | eval.py on our data | High (about our data) | Yes, with "on our synthetic test set" |
| "8 h → 12 min" | Practitioner estimate | Low | **No**; show measured pipeline time |
| LayoutLMv3 96.56% CORD, PaddleOCR-VL 91.66% | Papers (unverified IDs) | Medium | Only if someone opened the papers; otherwise omit |
| GNN collusion detection works | Gomes 2024 | n/a | **No** — we don't ship it |
| Blockchain audit | — | n/a | **No** — we don't ship it; hash chain instead |
| "Detects fraud/forgery" | — | — | **Never.** "Anomaly signals for human verification." |

---

## 30 — Final Technology Lock

**PRIMARY STACK**
- Backend: Python 3.11 · FastAPI · Pydantic v2 · SQLAlchemy 2 · Alembic · PostgreSQL 16 · Uvicorn
- Pipeline: PyMuPDF · pdfplumber · PaddleOCR PP-OCRv4 (en) · OpenCV · rapidfuzz · jellyfish · scikit-learn · networkx · PyYAML · Jinja2 · WeasyPrint · cryptography (Fernet) · rank_bm25 · sentence-transformers (`bge-small-en-v1.5`)
- Frontend: Vite · React 18 · TypeScript · Tailwind · shadcn/ui · TanStack Query · React Router · Recharts · react-force-graph-2d · MSW · openapi-typescript
- Infra: Docker Compose (db, api, worker, web/nginx) · GitHub Actions (lint/test/build) · one VPS + demo laptop

**FALLBACK ONLY WHERE NECESSARY**
- OCR: Tesseract 5 (if PaddleOCR fails to install/run on demo laptop)
- Retrieval: TF-IDF cosine (if sentence-transformers download blocked)
- LLM: none → templates (default); Ollama `qwen2.5:3b` if available
- PDF report: ReportLab (if WeasyPrint system deps fail)
- Deploy: laptop compose (if VPS down) → MP4 (if laptop dies)

---

## 31 — Final Technical Specification (what we are building)

**Product.** VigilBid — buyer-side bid-compliance decision-support web app for CPCL two-bid tenders (GeM/CPPP).
**Users.** Officer, Approver, Auditor (read-only), Admin (seed).
**Screens.** 8: Login, Tenders, Compliance Matrix, Upload, Processing Status, Bidder Cockpit, Cross-Bidder Links, Audit & Reports.
**APIs.** 24 REST endpoints under `/api/v1` (§14), JWT, OpenAPI-first.
**Database.** PostgreSQL 16, 17 tables (§13), JSONB for fields/evidence, Fernet-encrypted identifiers, append-only hash-chained `audit_log`.
**Pipeline.** 11 steps (ingest, classify, textify, extract, normalise, resolve, verify, rules, anomaly, risk, explain), Postgres-backed job queue, worker process, re-run-from-step.
**AI models.** PaddleOCR PP-OCRv4 (OCR); TF-IDF+LogReg (classifier); bge-small (retrieval); optional local LLM (prose/Q&A only).
**RAG.** Retrieval-first Copilot over ~80 curated regulatory chunks with mandatory citations; generation optional.
**OCR.** Text-layer first; 300-dpi render → deskew → PaddleOCR (Tesseract fallback); per-word confidence; <0.85 → REVIEW.
**Compliance engine.** 34 YAML rules, categories HARD/SOFT/HUMAN/SIGNAL, statuses PASS/WARN/REVIEW/FAIL, each with clause citation and template explanation; bidder label vocabulary legally conservative.
**Risk engine.** Transparent weighted sum (§10.2), bands Low/Medium/High, drivers exposed.
**Entity resolution.** Normalisation + weighted identifier/name/address score, bands ≥0.85 / 0.60–0.85 / <0.60.
**Anomaly signals.** PDF metadata/xref/producer/fonts/invisible text/injection/PDF actions; cross-bidder shared attributes and near-duplicate text; debarment fuzzy match. Never worded as fraud.
**Dataset.** Synthetic, format-faithful, checksum-valid: 1 tender, 4 (+1 hidden) bidders, 11 doc types, clean + scan variants, ground truth + eval script; real CPPP/World Bank debarment snapshots.
**Mock APIs.** `RegistryProvider` with `MockProvider` (fixtures) and `RealProvider` stubs; UI always labels source.
**Security.** JWT+RBAC, upload hardening, PDF-action flags, encryption, masking, injection guard, read-only KB, audit chain.
**Deployment.** `docker compose up`; images bundle OCR models; laptop + VPS; `make demo` restores precomputed state.
**Demo.** 6.5-minute scripted flow (§26) with three reveals + audit + report; MP4 backup.
**Metrics (report only these).** Field accuracy (text/OCR), classification accuracy, ER band correctness, rule-outcome match vs expected, per-bidder processing time, audit-chain verification time, false FAILs on clean bidders (=0).
**Future scope.** Real registry adapters (GSTN/PAN/Udyam/MCA/DigiLocker), LayoutLM/VLM for unstructured financials, learned risk model on CPCL history, signature verification against registry, multilingual OCR, SSO/AD, multi-PSU tenancy, regulator read-only portal.

---

## 32 — SIH Winning Strategy

**Why this can win SIH26100**
1. **Problem strength** — CAG-audited, ₹-quantified, ministry-owned pain; every judge from a PSU has lived it.
2. **Research strength** — we can show we *read* the regulation (GFR 144/151/153, PPP-MII, MSE Order) and encoded it as inspectable rules with citations.
3. **Technical complexity** — a real 11-step document pipeline with OCR, extraction with coordinates, entity resolution, rule engine, forensics, graph, audit chain — all working live.
4. **AI depth (honest)** — AI exactly where inputs are messy, deterministic where the law is clear, and an explicit injection defence — a mature stance judges rarely see.
5. **Government relevance** — decision-support not automation, CVC-style audit trail, MSE fairness (Bidder B story), Rule 144(xi), PPP-MII.
6. **Innovation** — identifier-level cross-document logic (PAN⊂GSTIN, entity-type letter), PDF anomaly signals surfaced as evidence, cross-bidder attribute graph, clause-cited findings, hash-chained overrides — integrated into one cockpit.
7. **Demonstrability** — four bidders, three reveals, one click to a dossier; deterministic and precomputed → zero-failure demo.
8. **Scalability** — provider interface, horizontal workers, Postgres queue; clear Phase-2 path.
9. **Measurable impact** — we show measured pipeline time and accuracy on our set and frame the pilot as the measurement.
10. **Defensibility** — every claim in §29 is either verified or not spoken; every "AI" question has a deterministic answer.

**THE 3 THINGS WE MUST PERFECT**
1. **The Bidder Cockpit (S6)** with evidence highlights that visibly match the finding — this is where trust is won or lost.
2. **The four-bidder story** reproducing exactly (B review-not-fail, C hard mismatches, D rules-pass-anomalies-catch) — rehearsed, precomputed, backed up.
3. **The vocabulary and the audit chain** — "recommended", "anomaly — human verification required", override with reason, verify chain live. This is what makes it a government-grade DSS instead of a hackathon toy.

**THE 3 THINGS WE MUST NOT WASTE TIME ON**
1. Any trained deep-learning model (LayoutLM, Donut, GNN, SigNet, XGBoost) — no data, no GPU, no time; the judges reward working evidence, not model names.
2. Infrastructure theatre — Celery/Redis/MinIO/Keycloak/Kubernetes/blockchain.
3. Live government APIs — build the interface, mock the provider, label it honestly, move on.
