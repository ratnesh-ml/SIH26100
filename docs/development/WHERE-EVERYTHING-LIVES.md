# Where Everything Lives — Codebase Location Directory

This directory maps every key concept, subsystem, and operational tool in VigilBid to its exact location in the codebase.

---

## Complete Subsystem Directory

### 1. Where is the frontend?
- **Root Directory:** [`frontend/`](file:///frontend/)
- **Core Views:** [`frontend/src/components/`](file:///frontend/src/components/)
  - Dashboard: `DashboardView.tsx`
  - Compliance Matrix: `ComplianceMatrixView.tsx`
  - Bidder Cockpit: `BidderDetailView.tsx`
  - Audit Trail: `AuditTrailView.tsx`
  - Collusion Graph: `CrossBidderGraphView.tsx`
  - Guided Tour: `DemoView.tsx` (`/#/demo`)
- **Reusable Primitives:** [`frontend/src/components/ui/`](file:///frontend/src/components/ui/) (`Button.tsx`, `Card.tsx`, `StatusChip.tsx`, `Modal.tsx`)
- **API Client:** [`frontend/src/api/client.ts`](file:///frontend/src/api/client.ts)

### 2. Where are the backend APIs?
- **Root Directory:** [`backend/`](file:///backend/)
- **API Entrypoint:** [`backend/main.py`](file:///backend/main.py)
- **REST Endpoints:** [`backend/routers/`](file:///backend/routers/) (tenders, bidders, documents, compliance, risk, copilot, audit, reports)
- **Request/Response Schemas:** [`backend/schemas/`](file:///backend/schemas/)
- **Interactive Swagger Docs:** Exposed at `http://localhost:8000/api/v1/docs`

### 3. Where is authentication?
- **Backend Service:** [`backend/services/auth_service.py`](file:///backend/services/auth_service.py)
- **JWT & Password Hashing:** [`backend/core/security.py`](file:///backend/core/security.py)
- **Role-Based Access Control (RBAC):** [`backend/auth/rbac.py`](file:///backend/auth/rbac.py) (`Officer`, `Approver`, `Auditor`, `Admin`)
- **Frontend Auth View:** [`frontend/src/components/LoginView.tsx`](file:///frontend/src/components/LoginView.tsx)

### 4. Where is document upload?
- **Backend Endpoint:** `POST /api/v1/tenders/{tender_id}/bidders/{bidder_id}/documents/upload`
- **Ingestion Service:** [`backend/services/document_service.py`](file:///backend/services/document_service.py)
- **Archive Extraction & Safety:** [`pipeline/document_processing/ingest.py`](file:///pipeline/document_processing/ingest.py) (Zip bomb, path traversal, magic bytes)
- **Frontend Modal:** [`frontend/src/components/UploadModal.tsx`](file:///frontend/src/components/UploadModal.tsx)

### 5. Where is PDF processing?
- **Text Layer Extraction & 150 DPI Rendering:** [`pipeline/pdf/`](file:///pipeline/pdf/)
- **Render Engine:** [`pipeline/pdf/renderer.py`](file:///pipeline/pdf/renderer.py)
- **Content-Addressable Storage (CAS):** `data/storage/{bidder_id}/{sha256}.pdf`

### 6. Where is OCR?
- **OCR Engine Abstraction:** [`pipeline/ocr/`](file:///pipeline/ocr/)
- **Engine Factory:** [`pipeline/ocr/factory.py`](file:///pipeline/ocr/factory.py)
- **Tesseract Fallback Adapter:** [`pipeline/ocr/fallback_adapter.py`](file:///pipeline/ocr/fallback_adapter.py)
- **Text Acquisition Pipeline Step:** `pipeline/steps/step03_ocr.py`

### 7. Where is document classification?
- **Classification Engine:** [`pipeline/document_processing/classifier.py`](file:///pipeline/document_processing/classifier.py)
- **Pattern Matchers:** TF-IDF keyword vectorizer and structural regex matching 13 Indian tender document categories.

### 8. Where is field extraction?
- **Extractors Directory:** [`pipeline/extraction/`](file:///pipeline/extraction/)
  - GST REG-06: `gst.py`
  - Income Tax PAN: `pan.py`
  - CA Audited Turnover: `financial.py`
  - Udyam MSME: `udyam.py`
  - OEM & Declarations: `declarations.py`

### 9. Where is entity resolution?
- **Matching Algorithms:** [`pipeline/entity_resolution/matcher.py`](file:///pipeline/entity_resolution/matcher.py)
- **Indian Corporate Suffix Normalizer:** [`pipeline/entity_resolution/normalizer.py`](file:///pipeline/entity_resolution/normalizer.py)
- **Sub-string Containment Validators:** [`pipeline/entity_resolution/validators.py`](file:///pipeline/entity_resolution/validators.py)

### 10. Where are mock government registries?
- **Registry Adapters:** [`pipeline/registry_adapters/`](file:///pipeline/registry_adapters/)
- **Mock Implementation:** [`pipeline/registry_adapters/mock_adapter.py`](file:///pipeline/registry_adapters/mock_adapter.py)
- **JSON Registry Payloads:** [`seed/mock_fixtures/`](file:///seed/mock_fixtures/) (`gst_fixtures.json`, `pan_fixtures.json`, `debarment_fixtures.json`)

### 11. Where are compliance rules?
- **Declarative YAML Rules:** [`rules/cpcl_goods_v1.yaml`](file:///rules/cpcl_goods_v1.yaml) (34 rules citing GFR 2017 & CPCL clauses)
- **Rule Engine Evaluator:** [`pipeline/compliance/engine.py`](file:///pipeline/compliance/engine.py)
- **Cross-Document Verifier:** [`pipeline/compliance/cross_verifier.py`](file:///pipeline/compliance/cross_verifier.py)

### 12. Where is risk scoring?
- **Composite Risk Scorer:** [`pipeline/risk/scorer.py`](file:///pipeline/risk/scorer.py)
- **Weight Configurations:** 4 factors (Identity 30%, Financial 25%, Compliance 25%, Anomaly 20%)

### 13. Where is anomaly detection?
- **Forensic Anomaly Scanner:** [`pipeline/risk/anomaly.py`](file:///pipeline/risk/anomaly.py)
- **Tampering Checks:** GIMP metadata detection, inverted timestamps, indirect prompt injection tokens.
- **Collusion Network Graph:** [`pipeline/risk/graph.py`](file:///pipeline/risk/graph.py)

### 14. Where is the evidence system?
- **Evidence Database Model:** [`backend/models/evidence.py`](file:///backend/models/evidence.py)
- **Highlighter & Coordinate Bounding Box:** [`pipeline/evidence/highlighter.py`](file:///pipeline/evidence/highlighter.py)
- **Frontend Split-Screen Canvas:** [`frontend/src/components/BidderDetailView.tsx`](file:///frontend/src/components/BidderDetailView.tsx)

### 15. Where is audit logging?
- **Audit Service:** [`backend/services/audit_service.py`](file:///backend/services/audit_service.py)
- **Cryptographic Chaining:** [`pipeline/audit/hasher.py`](file:///pipeline/audit/hasher.py)
- **Frontend Live Chain Verification:** [`frontend/src/components/AuditTrailView.tsx`](file:///frontend/src/components/AuditTrailView.tsx)

### 16. Where is RAG (Procurement Copilot)?
- **Copilot Service:** [`backend/services/copilot_service.py`](file:///backend/services/copilot_service.py)
- **Local Retriever & Chunker:** [`pipeline/rag/retriever.py`](file:///pipeline/rag/retriever.py) & [`pipeline/rag/chunker.py`](file:///pipeline/rag/chunker.py)
- **Guardrails & Knowledge Corpus:** [`pipeline/rag/guardrails.py`](file:///pipeline/rag/guardrails.py) & [`pipeline/rag/kb_corpus.py`](file:///pipeline/rag/kb_corpus.py)

### 17. Where is the database schema?
- **SQLAlchemy 2.0 Models:** [`backend/models/`](file:///backend/models/) (18 relational tables)
- **Database Engine & Sessions:** [`backend/database.py`](file:///backend/database.py)
- **Specification Document:** [`docs/database/FINAL-DATABASE.md`](file:///docs/database/FINAL-DATABASE.md)

### 18. Where are migrations?
- **Alembic Root:** [`alembic/`](file:///alembic/)
- **Configuration:** [`alembic.ini`](file:///alembic.ini)
- **Version Scripts:** [`alembic/versions/`](file:///alembic/versions/)

### 19. Where is demo data?
- **Synthetic Bidder PDF Packages:** [`seed/demo_packages/`](file:///seed/demo_packages/) (26 PDFs across 5 vendors)
- **Tender Seed Templates:** [`seed/tender_templates/`](file:///seed/tender_templates/)
- **One-Click Seeding Script:** [`scripts/demo_setup.py`](file:///scripts/demo_setup.py)

### 20. Where are tests?
- **Backend Unit & Integration Tests:** [`tests/`](file:///tests/) (353 pytest cases)
- **Frontend Vitest & UI Checks:** [`frontend/src/__tests__/`](file:///frontend/src/__tests__/) (70 checks)
- **Automated Release Certification:** [`scripts/release_audit.py`](file:///scripts/release_audit.py) (20 subsystems)

### 21. Where is deployment?
- **Docker Compose:** [`docker-compose.yml`](file:///docker-compose.yml) (Postgres, API, Frontend, Worker)
- **Deployment Manual:** [`docs/deployment/FINAL-SETUP.md`](file:///docs/deployment/FINAL-SETUP.md)
- **Continuous Integration Workflow:** [`.github/workflows/ci.yml`](file:///.github/workflows/ci.yml)
