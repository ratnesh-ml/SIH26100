# VigilBid — SIH26100 Research-to-Execution Blueprint

**Problem Statement:** SIH26100 — AI-Powered Integrated Bid Compliance Verification Platform for GeM Procurement
**Organisation:** Chennai Petroleum Corporation Limited (CPCL) · Ministry of Petroleum & Natural Gas

This repository is the **single source of truth** for a 3-person SIH Grand Finale team. It converts the raw research dump (`research/`) into a critically audited, executable 36-hour engineering plan (`docs/`), and ships a browsable viewer (`index.html`).

> No product code is written yet — by design. The brief was: *understand → decompose → specify → divide → then build.*

## Currently completed
- ✅ Research dump archived (`research/sih26100-research-dump.txt`)
- ✅ **00 Research Audit** — every major recommendation classified (Research-backed / Official requirement / Engineering decision / MVP decision / Future feature / Assumption / Legal flag), contradictions listed, hallucination risks flagged
- ✅ **01–04** Understanding, decomposition, functional + non-functional requirements, final layered architecture
- ✅ **05–10** AI-vs-rules matrix, Document AI pipeline & OCR decision, RAG verdict (optional, retrieval-first), Entity-Resolution algorithm & weights, 34-rule Compliance Engine, Risk/Anomaly engine with legal vocabulary rule
- ✅ **11–14** 8 MVP screens, backend module layout & job state machine, PostgreSQL schema (17 tables), 24 REST endpoints
- ✅ **15–20** Synthetic demo dataset (1 tender, 4+1 bidders), mock government-API strategy, security (incl. indirect prompt injection), DevOps, MVP cut line, 3-person team architecture with cross-ownership
- ✅ **21–25** Dependency graph / critical path, hour-by-hour 36-h plan, per-person checklists with DoD, skill-gap analysis, Git & project management
- ✅ **26–32** 6.5-min demo script, "one screen that wins" spec, 32 judge attack questions, claim-defense table, final tech lock, final technical specification, winning strategy
- ✅ Web viewer with TOC (`index.html`, `css/style.css`, `js/main.js`)

## Entry points
| Path | Purpose |
|---|---|
| `index.html` | Browsable blueprint (loads all `docs/*.md`, builds TOC, deep-linkable `#section` anchors) |
| `docs/00-research-audit.md` | Read this first — what in the research is trustworthy |
| `docs/01-…` → `docs/06-…` | Sections 01–32 in order |
| `research/sih26100-research-dump.txt` | Original research input (unchanged) |

## Key decisions (summary)
- **Decision support, never adjudication:** statuses are PASS/WARN/REVIEW/FAIL; bidder label is "Recommended: Not Qualified — officer confirmation required". No "fraud/forged/fake" wording anywhere.
- **Rules where the law is clear, AI where documents are messy:** OCR, classification, fuzzy matching, retrieval = AI. Checksums, cross-document identity, thresholds, risk aggregation, audit hashing = deterministic.
- **Cut from MVP:** LayoutLMv3/Donut/VLM, GNN collusion model, SigNet, blockchain, Celery/Redis/MinIO/Keycloak/K8s, live government APIs, multilingual OCR.
- **Kept & de-risked:** PyMuPDF text-layer → PaddleOCR → Tesseract; TF-IDF classifier; rapidfuzz entity resolution; YAML rule engine with clause citations; PDF anomaly signals; cross-bidder attribute graph; hash-chained audit; WeasyPrint dossier; mock `RegistryProvider` with honest "simulated" badge.

## Not yet implemented
- The product itself (backend, pipeline, frontend) — starts at Hackathon Hour 0 per `docs/05-…` §22
- Verification of external figures marked ⚠️ in the audit (CAG PDF, arXiv IDs, GFR rule numbers) — assigned as pre-finale homework

## Recommended next steps
1. All three members read `docs/00` and `docs/06 §31–32` (spec + strategy) — 30 min.
2. Each member reads their own checklist in `docs/05 §23` and the skill-gap row in §24; do the pre-hackathon homework.
3. Hour 0: freeze OpenAPI from `docs/03 §14`, agree evidence bbox convention, scaffold the monorepo (`backend/`, `frontend/`, `infra/`, `seed/`).
4. Verify every ⚠️ claim before the pitch; delete anything that can't be sourced.

## Data / storage
This site is static documentation; no tables or persistent storage are used. The future product's PostgreSQL schema is specified in `docs/03 §13`.
