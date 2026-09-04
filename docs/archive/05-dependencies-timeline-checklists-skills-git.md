# Part 3 — Sections 21–25: Dependency Graph, 36-Hour Timeline, Individual Checklists, Skill Gap, Git/Project Management

---

## 21 — Dependency Graph

### Critical path (anything late here slips the demo)
```
H0  Architecture lock + OpenAPI freeze + evidence/bbox convention + step names
 └─▶ H2  DB schema + Alembic + auth (P1)
      └─▶ H6  Upload → job row → worker skeleton that runs "no-op steps" and writes status (P1)
           └─▶ H12 Pipeline steps 1–8 plugged in (P2 modules imported by runner)   ← P2's extractors/rules are on the critical path from here
                └─▶ H18 Findings/risk persisted; /matrix, /findings, /risk return real data
                     └─▶ H22 Frontend switches from MSW mocks to real API (P3)
                          └─▶ H26 End-to-end on 4 demo bidders; report PDF
                               └─▶ H30 Freeze; deploy; precompute; rehearse
```

### Parallel tracks (independent until the join points)
| Track | Who | Independent from | Joins at |
|---|---|---|---|
| Synthetic doc generator + ground truth | P2 | everything | H8 (feeds P2's own extractor tests; P1's seed at H18) |
| Extractors/validators/ER/rules as **pure functions with pytest** on local PDFs | P2 | DB, API | H12 (runner imports) |
| Frontend with **MSW mock server** generated from frozen OpenAPI + fixture JSON | P3 | backend | H22 |
| Report HTML/Jinja template | P3 → P1 | pipeline | H24 |
| Deck + demo script + backup video | P3 | code | H32 |
| Docker/CI/VPS | P1 | pipeline | H30 |

**Anti-wait rule:** P3 never waits — MSW fixtures (`frontend/src/mocks/fixtures/*.json`) are hand-written at H2–4 to mirror the exact response schemas. P2 never waits — pure-function modules with CLI (`python -m pipeline.extract sample.pdf`) run without DB.

---

## 22 — 36-Hour Execution Plan

| Hours | P1 Backbone | P2 Brain | P3 Face | Checkpoint |
|---|---|---|---|---|
| **0–2** Architecture lock | Write OpenAPI skeleton (all endpoints, schemas) with P3; decide step names; repo scaffold; compose skeleton | Agree fields/findings/evidence JSON shapes; list doc types & rules; start doc-generator templates | Co-write OpenAPI; wireframe 8 screens (paper/Excalidraw); choose Vite+shadcn; MSW setup | **CP0**: OpenAPI frozen, repo pushed, everyone runs `docker compose up db` |
| **2–6** Foundation | Alembic schema; models; auth+JWT+RBAC; tenders CRUD + template; upload endpoint with ZIP safety + sha256 + storage; jobs table; worker loop with no-op steps | Doc generator for GST/PAN/Udyam/CA/ITR-V (clean + scan variants); ground_truth.json; textify (PyMuPDF words) + OCR wrapper w/ Tesseract first, Paddle after | Login, Tenders list/create, Upload screen, Status stepper — all on MSW | **CP1 (H6)**: upload a ZIP → job appears → steps flip to DONE (no-op) |
| **6–12** Core modules | `/jobs`, `/bidders`, `/documents/pages/{n}.png` (render+cache), `/matrix` read model (from findings table), audit chain + verify, seed users | Classifier (rules + TF-IDF); extractors GST/PAN/Udyam/CA/ITR-V; normaliser; validators/checksums; ER scorer; unit tests vs ground truth; CLI | Matrix screen; Cockpit layout with evidence viewer overlay (using fixture bbox); status chips; masking util | **CP2 (H12)**: P2 CLI extracts all 4 bidders' fields ≥95% vs ground truth; P3 cockpit renders fixtures; P1 pages PNG served |
| **12–18** Intelligence | Wire runner to P2 modules step-by-step; persist pages/fields/findings/risk_drivers; `/findings`, `/risk` real; decisions endpoint + status recompute; error handling per step | Rule engine + YAML 34 rules; mock registry + debarment loader; anomaly module (metadata/xref/producer/invisible-text/injection); risk weights; explanation templates + citations; remaining extractors (OEM/IP/MII/LB/EMD/work-order); generate Bidders A–D full packages incl. D's tampered PDFs | Decision panel; risk gauge + drivers; findings list filters; Audit screen; graph screen shell; error/empty states | **CP3 (H18)**: `POST bidder` on Bidder A → all steps real → findings visible in API |
| **18–24** Integration | Report PDF (WeasyPrint) with P3 template; `/graph` endpoint from bidder_links; complete-review; seed script that ingests 4 bidders; fix integration bugs | Cross-bidder links; tune ER thresholds on variants; eval.py metrics; KB markdown (GFR/MII/MSE/CVC/IP) + retrieval | Switch to real API (feature flag `VITE_USE_MOCKS=false`); fix shape mismatches; report template HTML; Copilot drawer UI | **CP4 (H24)**: all 4 bidders processed end-to-end in UI; report downloads; `main` updated |
| **24–30** Hardening + P1 features | Performance (parallel page OCR, PNG cache), log timings, retries, DB dump of processed demo, VPS deploy, health checks | Copilot `/copilot/query` retrieval + citations; optional Ollama polish + injection guard + output post-check; refine explanations wording (legal vocabulary); approve rules text with P3 | Graph screen real data; copilot wired; polish matrix (sticky headers, keyboard nav); accessibility pass; record backup video of full flow | **CP5 (H30)**: FREEZE features. Demo laptop + VPS both run `main`. Backup video saved. |
| **30–34** Demo polish | Precompute all demo bidders; verify restore from `demo.sql` <1 min; run full demo 3× on laptop; fix P0 only | Verify every demo reveal (B name variant, C mismatches, D anomalies/injection, E debarred) reproduces; prepare metric numbers from eval.py; write Claim Defense card | Deck (10 slides) finalised with real screenshots; demo script timed 6 min; judge Q&A cards; README/DEMO.md | **CP6 (H34)**: 3 clean rehearsals, timing ≤7 min |
| **34–36** Presentation + backup | Standby: laptop, VPS, USB with repo+dump+video | Standby: answer AI/legal questions | Presents; drives demo | Finale |

---

## 23 — Individual Checklists

### PERSON 1 — Core Platform
| # | Task | Pri | Est | Depends | Definition of Done |
|---|---|---|---|---|---|
| 1.1 | Repo scaffold, compose (db/api/worker/web), Makefile | P0 | 1 h | — | `make up` starts all; `/health` 200 |
| 1.2 | OpenAPI skeleton with all §14 routes returning stubs | P0 | 1.5 h | — | `/docs` shows every route; P3 exports schema for MSW |
| 1.3 | Alembic schema (§13) + models | P0 | 2 h | 1.1 | migration applies; FK/unique tests pass |
| 1.4 | Auth (bcrypt, JWT) + `require_role` | P0 | 1.5 h | 1.3 | 401/403 tests |
| 1.5 | Tenders CRUD + criteria template loader | P0 | 1.5 h | 1.4 | create tender → 12 criteria rows |
| 1.6 | Upload endpoint: ZIP safety, sniff, sha256, storage, documents rows, job row | P0 | 2.5 h | 1.5 | zip-slip test rejected; duplicate sha → 409 |
| 1.7 | Worker loop (SKIP LOCKED) + runner with step status writes + re-run-from-step | P0 | 2 h | 1.6 | steps JSON updates live |
| 1.8 | Page PNG render endpoint + disk cache | P0 | 1 h | 1.6 | <150 ms cached |
| 1.9 | Audit chain service + `/audit/verify` + hook into all mutations | P0 | 1.5 h | 1.3 | tamper a row → verify returns broken seq |
| 1.10 | Read models: `/matrix`, `/findings`, `/risk`, `/bidders/{id}` | P0 | 2 h | 1.7 + P2 tables | responses match OpenAPI |
| 1.11 | Decisions endpoint + status recompute + complete-review | P0 | 1.5 h | 1.10 | override changes bidder status; audit event |
| 1.12 | Wire P2 pipeline modules into runner; per-step exception capture | P0 | 3 h | P2 CP2 | Bidder A end-to-end |
| 1.13 | Report PDF (WeasyPrint) per bidder + tender | P0 | 3 h | 1.10, P3 template | opens, contains evidence thumbs + chain head |
| 1.14 | `/graph` endpoint | P1 | 1 h | P2 links | JSON nodes/edges |
| 1.15 | Seed: users, template, fixtures, 4 bidders ingest, `demo.sql` dump/restore | P0 | 2 h | 1.12 | `make demo` <1 min |
| 1.16 | Parallel page OCR (ProcessPool), timing logs | P1 | 1.5 h | 1.12 | Bidder B <3 min |
| 1.17 | VPS deploy + laptop deploy; CI | P0 | 2 h | 1.15 | both URLs pass demo |
| 1.18 | Backup USB (repo, images tar, dump, video) | P0 | 0.5 h | H30 | verified restore |

### PERSON 2 — AI / Document Intelligence
| # | Task | Pri | Est | Depends | DoD |
|---|---|---|---|---|---|
| 2.1 | Doc generator (HTML→PDF) for 11 doc types + scan variant + ground_truth.json | P0 | 4 h | — | 4 bidder packages generated by script |
| 2.2 | textify: PyMuPDF words + text-layer detection; OCR wrapper (Paddle→Tesseract fallback), deskew | P0 | 2.5 h | — | scan variant of PAN → ≥90% char accuracy |
| 2.3 | Classifier (rules + TF-IDF/logreg, pickled) | P0 | 1.5 h | 2.1 | ≥97% on generated set, UNKNOWN on junk |
| 2.4 | Extractors GST/PAN/Udyam/CA-cert/ITR-V with bbox+conf | P0 | 4 h | 2.2 | ≥98% field accuracy text-layer; ≥90% OCR |
| 2.5 | Extractors OEM/IP/MII/LB/EMD/work-order | P0 | 3 h | 2.4 | fields for A–D correct |
| 2.6 | Normaliser + validators (GSTIN mod-36, PAN, Udyam, CIN, UDIN, IFSC, dates, amounts) | P0 | 1.5 h | — | unit tests incl. generated-valid GSTINs |
| 2.7 | Entity resolution scorer + thresholds + tests on 50 name variants | P0 | 2 h | 2.6 | B → 0.82 REVIEW, C → <0.6 |
| 2.8 | Registry interface + mock fixtures + debarment CSV loader (exact + fuzzy) | P0 | 1.5 h | — | provider swap via env |
| 2.9 | Rule engine + YAML (34 rules) + explanations + citations | P0 | 4 h | 2.4–2.8 | expected statuses for A–D match table §15.4 |
| 2.10 | Anomaly module (metadata, xref count, producer, fonts, invisible text, injection regex, PDF actions) | P0 | 2.5 h | 2.2 | D triggers A-PDF-01/02/03, A-INJ-01; A clean |
| 2.11 | Risk weights + aggregation + drivers | P0 | 1 h | 2.9, 2.10 | A≈4, B≈38, C≈85, D≈72 (±10) |
| 2.12 | Cross-bidder links (shared attrs, metadata, simhash) → bidder_links | P1 | 2 h | 2.10 | C–D edges present |
| 2.13 | KB markdown (≈80 chunks) + retrieval (bge-small or TF-IDF) + `/copilot/query` service | P1 | 3 h | — | 10 test questions return correct clause |
| 2.14 | Optional LLM adapter (Ollama) + untrusted-text wrapper + output post-check | P2 | 1.5 h | 2.13 | disabling LLM changes nothing functionally |
| 2.15 | eval.py → metrics table for slide | P1 | 1 h | 2.4–2.11 | printed table committed to docs |
| 2.16 | Claim Defense card + legal vocabulary review of all explanation strings | P0 | 1 h | 2.9 | no "fraud/fake/forged" in codebase strings |

### PERSON 3 — Product / Frontend / Demo
| # | Task | Pri | Est | Depends | DoD |
|---|---|---|---|---|---|
| 3.1 | Vite+TS+Tailwind+shadcn scaffold; router; auth store; API client from OpenAPI (`openapi-typescript`) | P0 | 1.5 h | 1.2 | typed client compiles |
| 3.2 | MSW mocks + fixtures for all endpoints (A–D shapes) | P0 | 2 h | 1.2 | app fully navigable offline |
| 3.3 | S1 Login, S2 Tenders (+create dialog w/ template) | P0 | 2 h | 3.1 | role badge; validation |
| 3.4 | S4 Upload (dropzone, ZIP listing, errors) + S5 Status stepper (poll) | P0 | 2.5 h | 3.2 | shows 11 steps live; retag chip |
| 3.5 | S3 Compliance Matrix (sticky headers, chips, risk column, filters, legend) | P0 | 3 h | 3.2 | click cell → cockpit deep-link |
| 3.6 | S6 Cockpit: findings list, evidence viewer w/ overlay (scale bbox to rendered size), finding card, risk gauge/drivers, decision panel, masking | P0 | 6 h | 3.2 | all 4 bidders' fixtures render; decision requires reason |
| 3.7 | S8 Audit trail + verify + report downloads | P0 | 1.5 h | 3.2 | broken chain banner |
| 3.8 | Report HTML/Jinja template (with P1) | P0 | 2 h | — | renders A & C nicely |
| 3.9 | Switch to real API; fix contract drift with P1 | P0 | 3 h | CP3 | end-to-end in browser |
| 3.10 | S7 Graph screen (force graph + edge evidence list) | P1 | 2 h | 1.14 | C–D red edge clickable |
| 3.11 | Copilot drawer (question → answer + citations; "no generative model" badge) | P1 | 1.5 h | 2.13 | works with LLM off |
| 3.12 | Empty/loading/error states; keyboard nav; colour+icon+text; responsive ≥1280 px | P0 | 2 h | 3.5–3.7 | manual checklist |
| 3.13 | Demo script (6 min, timed), pitch deck (10 slides, real screenshots), judge Q&A cards, README + DEMO.md | P0 | 4 h | CP4 | 3 rehearsals ≤7 min |
| 3.14 | Backup screen recording of full demo flow (with narration) | P0 | 1 h | CP5 | MP4 on laptop + USB |

---

## 24 — Skill Gap Analysis

| Person | MUST KNOW BEFORE START | LEARN DURING BUILD | DO NOT LEARN — USE LIBRARY |
|---|---|---|---|
| P1 | FastAPI + Pydantic v2, SQLAlchemy 2 + Alembic, Postgres basics, Docker Compose, JWT flow | `FOR UPDATE SKIP LOCKED` pattern; WeasyPrint quirks; PyMuPDF page render; hash-chain design | Password hashing (passlib), rate limiting (slowapi), PDF gen (WeasyPrint), ZIP safety (write 20 lines, don't research for hours) |
| P2 | Python regex fluency, PyMuPDF words/bbox API, pandas/pdfplumber tables, rapidfuzz, scikit-learn basics | PaddleOCR install/tuning, deskew with OpenCV, PDF internals (xref, incremental updates, `/Producer`), GSTIN checksum algorithm, simhash | OCR models (never train), embeddings (sentence-transformers), BM25 (rank_bm25), phonetic (jellyfish), graph (networkx) |
| P3 | React+TS, Tailwind, React Router, TanStack Query, fetch/JWT handling | shadcn component composition, MSW, coordinate scaling for overlays, react-force-graph, openapi-typescript | Charts (Recharts), tables (TanStack Table), drag-drop (react-dropzone), toasts (sonner) |
| All | Git branching/PR flow, reading OpenAPI, the 4-bidder story, the legal vocabulary rule | — | — |

Pre-hackathon homework (if allowed): P2 installs PaddleOCR + Tesseract and OCRs one scanned PDF; P1 builds a FastAPI+Alembic hello-world with a jobs table; P3 sets up Vite+shadcn+MSW template.

---

## 25 — Git & Project Management

- **Branches:** `main` (protected, demoable), `dev`, `feat/p1-upload`, `feat/p2-extract-gst`, `feat/p3-cockpit`…
- **Commits:** Conventional Commits — `feat(pipeline): gst extractor with bbox`, `fix(api): 409 on duplicate sha`, `docs:`, `chore:`, `test:`.
- **PRs:** small, into `dev`, one reviewer, CI green. Merge `dev → main` at CP1…CP6 only.
- **Issues/labels:** `area:backend|pipeline|frontend|demo`, `P0 demo-breaking`, `P1 important`, `P2 polish`, `blocked`, `contract-change` (any OpenAPI change must have this label and notify all three).
- **Definition of Done:** code merged to `dev`; tests or manual check noted in PR; no `TODO` in demo path; API changes reflected in OpenAPI + MSW fixtures; strings pass legal-vocabulary grep (`grep -riE "fraud|forged|fake|tamper(ed)?" backend/ frontend/src` returns only allow-listed files).
- **Checkpoints:** CP0–CP6 above; 10-minute stand-up at every checkpoint: *what's blocked, what contract changed, what's cut*.
- **Bug priority:** P0 = breaks demo path (fix now, anyone); P1 = wrong data/UX in demo path (fix before CP5); P2 = polish (after CP5 only if idle).
- **Cut authority:** P3 (demo owner) may cut any P1/P2 feature at CP4 without discussion; P0 cuts require all three.
