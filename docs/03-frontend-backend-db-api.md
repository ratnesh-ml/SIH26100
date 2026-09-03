# Part 2 — Sections 11–14: Frontend, Backend, Database, APIs

---

## 11 — Frontend

**Stack:** Vite + React 18 + TypeScript, Tailwind CSS, shadcn/ui, TanStack Query (polling), React Router, Recharts (risk bars), `react-force-graph-2d` (link graph), server-rendered page PNGs + absolutely-positioned `<div>` overlays for evidence.

### 11.1 MVP screens (8) — everything else is cut
| # | Screen | Purpose | Components | APIs | Data | Actions | Edge cases |
|---|---|---|---|---|---|---|---|
| S1 | **Login** | Role-based entry | form, role badge | `POST /auth/login` | user, role | login | wrong creds; token expiry → redirect |
| S2 | **Tenders** | List + create | table, "New Tender" dialog (template picker) | `GET/POST /tenders` | tenders, counts | create, open | empty state |
| S3 | **Tender Detail — Compliance Matrix** (*the one screen that wins*, see §27) | Bidders × criteria heat-map; risk; status | matrix grid, legend, risk column, filters, "Upload bidder" button, "Export tender report" | `GET /tenders/{id}/matrix` | statuses, risk, progress | click cell → S6 at that finding; click bidder → S6; upload → S4 | processing bidders shown with spinner column; >15 criteria → horizontal scroll with sticky first col |
| S4 | **Upload Bidder Package** | Drag-drop ZIP/PDFs | dropzone, bidder name input, file list with sizes, validation errors | `POST /tenders/{id}/bidders`, `POST /bidders/{id}/documents` | job id | submit → S5 | non-PDF inside ZIP (listed, skipped); >100 MB; duplicate SHA |
| S5 | **Processing Status** | Live pipeline progress | 11-step stepper with per-step timing, per-document classification chips (editable) | `GET /jobs/{id}` (poll 2 s) | steps, doc types | re-tag doc type → re-run from step 4 | step failure → shows error + "retry step" |
| S6 | **Bidder Cockpit** | Findings + evidence + risk + decision | left: criteria list with statuses; centre: evidence viewer (page PNG + highlight, prev/next evidence); right: finding card (rule, clause, explanation, confidence, extracted vs expected), risk gauge + drivers, decision panel (Accept/Override/Clarify + reason), Copilot drawer | `GET /bidders/{id}/findings`, `GET /documents/{id}/pages/{n}.png`, `GET /bidders/{id}/risk`, `POST /findings/{id}/decision`, `POST /copilot/query` | findings, evidence, risk, decisions | decide; ask copilot; open raw PDF | unresolved findings counter; cannot "Complete Review" until all decided; low-confidence badge |
| S7 | **Cross-Bidder Links** | Graph of shared attributes | force graph, edge list with evidence, severity filter | `GET /tenders/{id}/graph` | nodes, edges | click edge → both bidders' evidence | no edges → "No shared attributes detected" |
| S8 | **Audit Trail & Reports** | Chain view + export | timeline table (actor, action, target, hash prefix), "Verify chain" button, download buttons | `GET /tenders/{id}/audit`, `GET /audit/verify`, `GET /bidders/{id}/report.pdf`, `GET /tenders/{id}/report.pdf` | events, chain status | verify, download | chain broken → red banner (demo option) |

Approver role: same S3/S6 but decision panel shows "Concur / Dissent". Auditor role: read-only everywhere + S8.

### 11.2 UI rules
- Status chips always: icon + text + colour (`✔ PASS`, `⚠ WARN`, `👁 REVIEW`, `✖ FAIL`).
- Never display raw PAN/Aadhaar-like numbers unmasked: `AAACX****K`. Full value on hover for officer role only (logged).
- Every number shown in a finding is clickable → jumps to its evidence box.
- Empty/loading/error states for all 8 screens (P3 checklist).

---

## 12 — Backend

**Stack:** Python 3.11, FastAPI, SQLAlchemy 2 + Alembic, Pydantic v2, PostgreSQL 16, PyMuPDF, pdfplumber, PaddleOCR / pytesseract, rapidfuzz, jellyfish, scikit-learn, networkx, Jinja2 + WeasyPrint (PDF), python-jose (JWT), passlib (bcrypt), cryptography (Fernet), rank_bm25, sentence-transformers (optional), httpx (LLM optional).

### 12.1 Module layout
```
backend/
  app/
    main.py            # FastAPI app, routers, CORS, exception handlers
    core/{config,security,deps,audit}.py
    db/{session,models,migrations/}
    routers/{auth,tenders,bidders,documents,jobs,findings,decisions,audit,reports,copilot,graph,registry}.py
    schemas/*.py       # Pydantic
    services/{tender_service,bidder_service,report_service,audit_service}.py
  pipeline/
    runner.py          # step orchestration + status writes
    ingest.py classify.py textify.py ocr.py extract/{gst,pan,udyam,fin,itr,oem,ip,mii,lb,emd,work}.py
    normalize.py resolve.py verify.py rules/{engine.py, cpcl_goods_v1.yaml} anomaly.py risk.py explain.py
    registry/{base.py, mock_provider.py, real_provider_stub.py, fixtures/*.json, debarment_snapshot.csv}
    kb/{*.md} copilot.py
  worker.py            # poll jobs table, run pipeline
  tests/
  seed/{users.py, tender_template.py, demo_bidders/}
```

### 12.2 Job state machine
`QUEUED → RUNNING(step k of 11) → DONE | FAILED(step k, error)`; `jobs.steps JSONB` = `[{name, status, started_at, ended_at, meta}]`. Worker loop: `SELECT id FROM jobs WHERE status='QUEUED' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1`. Re-run from step N supported (used when officer re-tags a document).

### 12.3 Auth / RBAC
JWT (HS256, 8 h) with `sub, role`. Dependency `require_role("officer","approver")`. Roles matrix: officer = CRUD tenders/bidders + decide; approver = read + concur/dissent; auditor = read + audit/report; admin = seed only. Every mutating route emits an audit event.

### 12.4 Audit chain
```
event = {seq, ts, actor_id, role, action, target_type, target_id, payload}
curr_hash = sha256(prev_hash + json.dumps(event, sort_keys=True, separators=(',',':')))
```
Genesis prev_hash = 64×'0'. Inserted inside the same DB transaction as the mutation. `/audit/verify` recomputes and returns `{ok, length, first_broken_seq}`.

---

## 13 — Database (PostgreSQL 16)

```sql
users(id uuid pk, email citext unique, password_hash, full_name, role text check(role in ('officer','approver','auditor','admin')), created_at)

tenders(id uuid pk, nit_no text unique, title, portal text, estimated_value numeric(16,2), bid_due_date date,
        mse_applicable bool, mii_class_required text, requires_oem bool, created_by fk users, created_at)
criteria(id uuid pk, tender_id fk, code text, title, description, threshold jsonb, required_doc_types text[],
         rule_ids text[], sort_order int, unique(tender_id, code))

bidders(id uuid pk, tender_id fk, declared_name text, canonical_name text, pan_enc bytea, gstin_enc bytea, udyam_no text,
        cin text, address jsonb, contact jsonb, entity_confidence numeric(4,3), overall_status text, risk_score int,
        risk_band text, review_state text default 'PENDING', created_at)
   index (tender_id), index (canonical_name)

documents(id uuid pk, bidder_id fk, original_filename, sha256 char(64), storage_path, mime, page_count int,
          doc_type text, doc_type_conf numeric(4,3), doc_type_source text,  -- 'model'|'rule'|'officer'
          text_source text, -- 'text_layer'|'ocr'|'mixed'
          metadata jsonb, forensic jsonb, created_at, unique(bidder_id, sha256))
   index (bidder_id), index (doc_type)
document_pages(id bigserial pk, document_id fk, page_no int, text text, words jsonb, ocr_conf numeric(4,3),
               png_path text, unique(document_id, page_no))

extracted_fields(id bigserial pk, document_id fk, field_name text, value text, value_norm text, raw text,
                 page_no int, bbox jsonb, confidence numeric(4,3), method text, unique(document_id, field_name))
   index (document_id), index (field_name)

verification_events(id bigserial pk, bidder_id fk, document_id fk null, verifier text, provider text, -- 'mock'|'real'|'local'
                    request jsonb, response jsonb, status text, checked_at)

findings(id uuid pk, bidder_id fk, criterion_id fk null, rule_id text, rule_version text, status text check(status in ('PASS','WARN','REVIEW','FAIL','INFO')),
         title, explanation text, citation jsonb, evidence jsonb, -- [{document_id,page_no,bbox,field_name,value}]
         confidence numeric(4,3), extracted jsonb, expected jsonb, created_at)
   index (bidder_id), index (rule_id)
anomaly_signals(id bigserial pk, bidder_id fk, code text, severity text, points int, description, evidence jsonb)
risk_drivers(id bigserial pk, bidder_id fk, driver text, points int, source_ref jsonb)

decisions(id uuid pk, finding_id fk, bidder_id fk, actor_id fk users, action text check(action in ('ACCEPT','OVERRIDE','CLARIFY','CONCUR','DISSENT')),
          reason text not null, resulting_status text, created_at)
bidder_links(id bigserial pk, tender_id fk, bidder_a fk, bidder_b fk, link_type text, weight int, evidence jsonb)

jobs(id uuid pk, bidder_id fk, status text, current_step int, steps jsonb, error text, created_at, started_at, ended_at)
   index (status, created_at)

audit_log(seq bigserial pk, ts timestamptz, actor_id uuid, role text, action text, target_type text, target_id text,
          payload jsonb, prev_hash char(64), curr_hash char(64) unique)
reports(id uuid pk, tender_id fk, bidder_id fk null, path text, chain_head char(64), generated_by fk users, created_at)

kb_chunks(id serial pk, source text, clause text, url text, effective_date date, content text, embedding vector(384) null)  -- pgvector optional; else in-memory
```
Encryption: `pan_enc`, `gstin_enc` with Fernet; plaintext never persisted in `bidders` (fields table stores masked value + hash for joins: add `value_hash char(64)`). Immutability: no UPDATE/DELETE grants on `audit_log`, `documents`, `extracted_fields` for the app role (worker role can insert).

---

## 14 — API (`/api/v1`, JSON, bearer JWT unless noted)

| Endpoint | Method | Request | Response | Auth | DB | AI |
|---|---|---|---|---|---|---|
| `/auth/login` | POST | `{email,password}` | `{access_token, role, user}` | public | users | — |
| `/auth/me` | GET | — | user | any | users | — |
| `/tenders` | GET | `?page,limit` | list | any | tenders | — |
| `/tenders` | POST | `{nit_no,title,estimated_value,bid_due_date,mse_applicable,mii_class_required,requires_oem,template:"cpcl_goods_v1",criteria_overrides[]}` | tender + criteria | officer | tenders, criteria, audit | — |
| `/tenders/{id}` | GET | — | tender, criteria, bidder summaries | any | | |
| `/tenders/{id}/matrix` | GET | — | `{criteria[], bidders[{id,name,status,risk,cells[{criterion_id,status,finding_id}]}]}` | any | findings | — |
| `/tenders/{id}/bidders` | POST | multipart: `declared_name`, `files[]` (zip/pdf) | `{bidder_id, job_id, accepted[], rejected[]}` | officer | bidders, documents, jobs, audit | — |
| `/bidders/{id}` | GET | — | bidder + documents + status | any | | |
| `/bidders/{id}/documents/{doc_id}/retag` | POST | `{doc_type}` | job_id (re-run from step 4) | officer | documents, jobs, audit | — |
| `/jobs/{id}` | GET | — | `{status,current_step,steps[]}` | any | jobs | — |
| `/bidders/{id}/findings` | GET | `?status=` | findings[] with evidence + decisions | any | findings | — |
| `/bidders/{id}/risk` | GET | — | `{score,band,drivers[],anomalies[],entity_confidence}` | any | risk_drivers | — |
| `/documents/{id}/pages/{n}.png` | GET | `?dpi=110` | image/png | any | pages | — |
| `/documents/{id}/file` | GET | — | application/pdf | officer/approver/auditor | | |
| `/findings/{id}/decision` | POST | `{action,reason}` | decision + new bidder status | officer (ACCEPT/OVERRIDE/CLARIFY), approver (CONCUR/DISSENT) | decisions, findings, audit | — |
| `/bidders/{id}/complete-review` | POST | — | bidder | officer | bidders, audit | — |
| `/tenders/{id}/graph` | GET | — | `{nodes[],edges[]}` | any | bidder_links | — |
| `/copilot/query` | POST | `{question, bidder_id?, finding_id?}` | `{answer,citations[],used_llm}` | any | kb_chunks | retrieval (+LLM opt.) |
| `/tenders/{id}/audit` | GET | `?page` | events[] | any | audit_log | — |
| `/audit/verify` | GET | — | `{ok,length,first_broken_seq}` | any | audit_log | — |
| `/bidders/{id}/report.pdf` | GET | — | PDF | any | all | — |
| `/tenders/{id}/report.pdf` | GET | — | PDF | any | all | — |
| `/registry/{kind}/{value}` | GET | kind∈gstin,pan,udyam,cin,debarment | provider response | officer | verification_events | — |
| `/health` | GET | — | `{db,ocr,llm}` | public | — | — |

Error contract: `{error:{code,message,details}}`; 401/403/404/409(duplicate sha)/413(size)/422.
