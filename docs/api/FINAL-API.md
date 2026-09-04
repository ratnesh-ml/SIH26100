# VigilBid (SIH26100) — Final REST API Specification

**Document Version:** 1.0.0 (Final Release Baseline)  
**Date:** September 2026  
**Target:** Smart India Hackathon 2026 Grand Finale — Problem Statement SIH26100  
**Ministry / PSU:** Ministry of Petroleum & Natural Gas / Chennai Petroleum Corporation Limited (CPCL)  
**Protocol:** HTTP/1.1 REST over TLS (OpenAPI 3.1.0 Compliant)  
**Base URL:** `http://localhost:8000/api/v1` (or production host)  
**Interactive Documentation:** `/docs` (Swagger UI), `/redoc` (ReDoc), `/openapi.json` (Raw Schema)  

---

## 1. Gateway Security & Client Policy

### 1.1 Authentication & Authorization
* **Mechanism:** OAuth2 Password Bearer flow issuing HS256 JWT tokens.
* **Header:** `Authorization: Bearer <JWT_ACCESS_TOKEN>`
* **Role-Based Access Control (RBAC):**
  * `officer`: Primary procurement adjudicator. Can view tenders, upload filings, evaluate findings, and record decisions.
  * `evaluator`: Technical scrutiny committee member. Can view tenders, run evaluations, and propose observations.
  * `vigilance`: Chief Vigilance Officer (CVO) / Auditor. Read-only access to all evidence, collusion graphs, and cryptographic audit chains.
  * `admin`: System administrator. Manages user provisioning, system configuration, and demo seeding.

### 1.2 Rate Limiting & Protection
* **Rate Limit:** 60 requests per minute per IP address on sensitive authentication and ingestion endpoints (`/auth/login`, `/bidders/{id}/documents`).
* **OWASP Headers:** Strict enforcement of `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and strict Content Security Policy.

---

## 2. API Endpoint Directory (All 16 Categories)

```
/api/v1
├── /auth
│   ├── POST   /auth/login                       -> Authenticate user & issue JWT
│   ├── GET    /auth/me                          -> Return authenticated user profile
│   └── POST   /auth/logout                      -> Invalidate current session
├── /tenders
│   ├── GET    /tenders                          -> List paginated tenders with status filter
│   ├── POST   /tenders                          -> Create new tender with GFR criteria
│   ├── GET    /tenders/{id}                     -> Retrieve tender details & criteria
│   ├── PATCH  /tenders/{id}                     -> Update tender configuration
│   ├── GET    /tenders/{id}/matrix              -> Comparative compliance matrix heatmap
│   ├── GET    /tenders/{id}/graph               -> Cross-bidder collusion network graph
│   ├── GET    /tenders/{id}/audit               -> Tender-scoped cryptographic audit events
│   └── GET    /tenders/{id}/report.pdf          -> Summary tender evaluation PDF report
├── /bidders
│   ├── GET    /bidders                          -> List registered bidders
│   ├── POST   /bidders                          -> Register new bidder for tender
│   ├── GET    /bidders/{id}                     -> Bidder profile, canonical name & risk
│   ├── PATCH  /bidders/{id}                     -> Update bidder metadata
│   ├── GET    /bidders/{id}/findings            -> Criteria findings (optional ?pending=true)
│   ├── GET    /bidders/{id}/documents           -> List ingested filings
│   ├── POST   /bidders/{id}/documents           -> Ingest ZIP/PDF filing package
│   ├── POST   /bidders/{id}/documents/{doc_id}/retag -> Manual document reclassification
│   ├── POST   /bidders/{id}/complete-review     -> Finalize bidder review state
│   └── GET    /bidders/{id}/report.pdf          -> CVC compliance dossier PDF
├── /bids
│   ├── GET    /bids                             -> List bid submissions
│   ├── POST   /bids                             -> Create bid entry
│   ├── GET    /bids/{id}                        -> Get bid status & timestamps
│   └── POST   /bids/{id}/complete-review        -> Finalize bid adjudication
├── /documents
│   ├── GET    /documents/{id}                   -> Document metadata & classification
│   ├── GET    /documents/{id}/file              -> Raw PDF stream with CAS integrity
│   └── GET    /documents/{id}/pages/{n}.png     -> Rendered 150 DPI page image
├── /jobs
│   ├── GET    /jobs/{id}                        -> Pipeline execution status & steps
│   ├── POST   /jobs/{id}/process                -> Trigger full 11-step pipeline
│   └── POST   /jobs/{id}/process-ocr            -> Trigger OCR-only execution fallback
├── /findings
│   ├── GET    /findings/{id}                    -> Finding details & bounding boxes
│   └── POST   /findings/{id}/decision           -> Record officer adjudication
├── /risk
│   ├── GET    /risk/profile/{bidder_id}         -> Composite risk score & drivers
│   └── POST   /risk/graph                       -> Generate NetworkX collusion graph
├── /anomalies
│   └── GET    /anomalies/{bidder_id}            -> Technical forensic anomaly signals
├── /audit
│   ├── GET    /audit/trail                      -> Global append-only audit ledger
│   ├── GET    /audit/verify                     -> Verify SHA-256 forward hash chain
│   └── POST   /audit/verify                     -> Force cryptographic re-validation
├── /copilot
│   ├── POST   /copilot/query                    -> Statutory procurement RAG query
│   └── GET    /copilot/knowledge-domains        -> List segregated regulatory domains
└── /health
    └── GET    /health                           -> DB connectivity, dialect & latency
```

---

## 3. Core API Request & Response Contracts

### 3.1 Authentication
#### `POST /api/v1/auth/login`
Authenticates user credentials and issues a signed JWT token.
* **Request (Form Data / JSON):**
  ```json
  {
    "username": "officer@cpcl.gov.in",
    "password": "Officer@123"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "role": "officer",
    "user_id": "11111111-1111-4111-8111-111111111111",
    "name": "Ravi (Dy. Manager - Materials)"
  }
  ```

---

### 3.2 Compliance Matrix Heatmap
#### `GET /api/v1/tenders/{tender_id}/matrix`
Returns the comparative evaluation grid across all bidders and statutory criteria.
* **Response (200 OK):**
  ```json
  {
    "tender_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "tender_ref": "NIT CPCL/MM/2026/PUMP-217",
    "criteria": [
      {"id": "11111111-0001-4000-8000-000000000001", "code": "C-01", "title": "GST & PAN Statutory Parity"},
      {"id": "11111111-0002-4000-8000-000000000002", "code": "C-02", "title": "Average Annual Turnover Benchmark"}
    ],
    "bidders": [
      {
        "id": "bbbbbbbb-1111-4111-8111-111111111111",
        "name": "Meridian Flow Systems Pvt Ltd",
        "risk_score": 0,
        "risk_band": "LOW",
        "overall_status": "Qualified",
        "findings": {
          "C-01": {"status": "PASS", "rule_id": "R-ID-01", "confidence": 0.98},
          "C-02": {"status": "PASS", "rule_id": "R-FIN-01", "confidence": 0.99}
        }
      },
      {
        "id": "bbbbbbbb-3333-4333-8333-333333333333",
        "name": "Bharat Hydro Equipments Ltd",
        "risk_score": 65,
        "risk_band": "HIGH",
        "overall_status": "Recommended: Not Qualified — officer confirmation required",
        "findings": {
          "C-01": {"status": "FAIL", "rule_id": "R-ID-02", "confidence": 0.98},
          "C-02": {"status": "PASS", "rule_id": "R-FIN-01", "confidence": 0.99}
        }
      }
    ]
  }
  ```

---

### 3.3 Safe Ingestion & Document CAS Storage
#### `POST /api/v1/bidders/{bidder_id}/documents`
Uploads a statutory vendor package (ZIP or PDF). Enforces CAS deduplication and safety guards.
* **Request:** `multipart/form-data` with file binary.
* **Response (201 Created):**
  ```json
  {
    "id": "cccccccc-1111-4111-8111-111111111111",
    "filename": "gst_certificate.pdf",
    "doc_type": "GST_REG_06",
    "sha256": "3c7fc7e7dc88ee40...",
    "size_bytes": 142850,
    "page_count": 1,
    "created_at": "2026-09-04T11:00:00Z"
  }
  ```
* **Error Response (409 Conflict):**
  ```json
  {
    "detail": "Duplicate document: SHA-256 (3c7fc7e7...) already ingested for this bidder"
  }
  ```

---

### 3.4 Finding Adjudication with Mandatory CVC Reason
#### `POST /api/v1/findings/{finding_id}/decision`
Records a human officer adjudication. Requires written justification on overrides under CVC rules.
* **Request (JSON):**
  ```json
  {
    "action": "OVERRIDE",
    "resulting_status": "WARN",
    "reason": "Officer override: Technical inspection committee verified physical facility; file escalated to CVO."
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "decision_id": "dddddddd-1111-4111-8111-111111111111",
    "finding_id": "ffffffff-1111-4111-8111-111111111111",
    "actor_id": "11111111-1111-4111-8111-111111111111",
    "action": "OVERRIDE",
    "resulting_status": "WARN",
    "audit_ref": "audit-bbbbbbbb-4444-4444-8444-444444444444",
    "created_at": "2026-09-04T11:05:00Z"
  }
  ```

---

### 3.5 Cryptographic Audit Trail Verification
#### `GET /api/v1/audit/verify`
Executes forward recalculation of the SHA-256 hash chain from Genesis to Head.
* **Response (200 OK):**
  ```json
  {
    "ok": true,
    "length": 12,
    "genesis_hash": "0000000000000000000000000000000000000000000000000000000000000000",
    "head_hash": "661a9b0e64b3bd86e4c7d0d0c3fae8b15d2a8019a3b68078dbb7ce583c21b5d1",
    "verification_time_ms": 11.2,
    "tampering_detected": false
  }
  ```

---

### 3.6 Procurement Copilot Statutory RAG
#### `POST /api/v1/copilot/query`
Answers officer inquiries against tender parameters and statutory regulations with mandatory citations.
* **Request (JSON):**
  ```json
  {
    "query": "Is an MSE bidder exempt from paying EMD in this tender?",
    "tender_id": "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    "bidder_id": "bbbbbbbb-2222-4222-8222-222222222222"
  }
  ```
* **Response (200 OK):**
  ```json
  {
    "answer": "Yes. Under the Public Procurement Policy for MSEs Order 2012 (Rule R-EMD-01), Micro and Small Enterprises registered under Udyam are exempt from Earnest Money Deposit (EMD) requirements. Bidder B has submitted valid Udyam Registration UDYAM-TN-01-0012345 qualifying as a Small manufacturing enterprise.",
    "citations": [
      {
        "source": "Public Procurement Policy for MSEs Order 2012",
        "clause": "Paragraph 4 / Rule 153 GFR 2017",
        "document": "udyam_cert.pdf",
        "page": 1
      }
    ],
    "method": "retrieval-only",
    "confidence": 0.99
  }
  ```

---

## 4. API Categorization & Implementation Matrix

| Endpoint Group | What We Built | What Is Simulated | What Is Research-Backed | What Is An Engineering Decision | What Is Not Implemented | What Is Required for Production |
|---|---|---|---|---|---|---|
| **Authentication (`/auth`)** | JWT HS256 issuance; PBKDF2 hashing; RoleChecker for 4 roles; sliding-window rate limit. | None. Security tokens and password checks are 100% real. | RFC 7519 (JWT); NIST SP 800-63B password guidelines. | In-memory sliding-window rate limiter for zero-dependency standalone execution. | Multi-Factor Authentication (TOTP / SMS OTP). | SAML 2.0 / OpenID Connect bridge to CPCL Active Directory; Hardware Token / PKI DSC login. |
| **Tenders & Matrix (`/tenders`)** | CRUD endpoints; criteria cloning; 5x8 compliance matrix aggregation; risk integration. | None. DB persistence and query aggregation execute live. | GFR 2017 Two-Bid tender evaluation standards. | Single-endpoint matrix aggregation (`/matrix`) returning all bidders and criteria to prevent client N+1 queries. | Dynamic custom criteria formula builder. | Integration with GeM API / CPPP XML data sync feeds. |
| **Bidders & Bids (`/bidders`)** | Bidder registration; Fernet encrypted fields; canonical name resolution; complete-review validation. | None. Data persistence and review gating are fully functional. | CVC Guidelines on Bidder Qualification and Integrity Pacts. | Review completion blocked until all mandatory findings are adjudicated by an officer. | Automatic vendor blacklisting without human sign-off. | Automated ERP vendor master code mapping (SAP ECC/S4HANA). |
| **Documents & Pages (`/documents`)** | Multipart upload; CAS SHA-256 deduplication; magic byte check; 150 DPI cached page streaming. | None. Document streaming and CAS file storage are real. | OWASP File Upload Security Cheat Sheet. | Two-tier image caching (memory + disk) returning pre-rendered PNGs in 0.0044ms. | On-the-fly PDF watermarking with viewer IP/session. | Distributed S3-compatible CAS object storage cluster. |
| **Pipeline Jobs (`/jobs`)** | Job status tracking; 11-step progress telemetry; full pipeline execution; OCR fallback endpoint. | None. Asynchronous worker execution is operational. | 11-stage statutory document processing lifecycle. | HTTP polling / job status model supported by async DB workers. | WebSocket bi-directional streaming events. | Celery / RabbitMQ job broker with distributed Redis queue. |
| **Findings & Decisions (`/findings`)** | Finding details with pixel bboxes; officer decision recording; mandatory justification validation. | None. Finding queries and adjudication persistence are real. | Central Vigilance Commission (CVC) override accountability norms. | Written justification enforced strictly on `OVERRIDE` actions (min 15 chars). | Bulk override of multiple bidders simultaneously. | Digital signature (DSC) signing on individual officer override records. |
| **Risk & Anomalies (`/risk`, `/anomalies`)** | Transparent 0–100 risk score composite; risk driver breakdown; binary PDF anomaly signals; collusion graph. | None. Forensic analysis and NetworkX graphs execute live. | Forensic analysis of PDF structure (ISO 32000-1); CCI collusion indicators. | Separate risk engine from compliance engine to ensure transparent, inspectable point weights. | Deep neural graph embeddings (Node2Vec). | Enterprise-wide multi-year procurement collusion database graph. |
| **Audit Trail (`/audit`)** | Immutable forward SHA-256 hash chain; forward hash recalculation; tamper-evident verification API. | None. Real cryptographic hashing and ledger verification. | Merkle tree / Git commit hash chaining principles. | Zero-blockchain architecture: lightweight SHA-256 hashing within relational DB tables. | Zero-knowledge cryptographic proofs (zk-SNARKs). | Hardware Security Module (HSM) daily cryptographic timestamp anchoring. |
| **Copilot & RAG (`/copilot`)** | BM25 retrieval over 80 regulatory chunks; prompt injection defense; structured statutory citations. | LLM generation optional; template prose fallback is active. | Grounded QA in Legal and Procurement Texts; Injection Guardrails. | Factual responses strictly bound to retrieved passages; no open-ended LLM hallucination. | External internet browsing or uncurated document QA. | Air-gapped self-hosted LLM (Qwen-2.5 7B / Llama-3 8B) on PSU infrastructure. |
| **Health Probe (`/health`)** | Active database connectivity check; dialect detection; query latency measurement. | None. Real DB ping executed on every probe. | Cloud Native Health Check API patterns. | Comprehensive JSON payload returning dialect, connected status, and latency in milliseconds. | Distributed dependency health tracing. | Prometheus metrics endpoint (`/metrics`) with Grafana dashboards. |

---

**API Status:** Audited, Tested, and Frozen for SIH 2026 Grand Finale.
