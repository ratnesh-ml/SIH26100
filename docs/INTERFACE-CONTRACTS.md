# VigilBid (SIH26100) — Interface Contracts Specification

**Status:** LOCKED  
**Version:** 1.0.0  
**Effective Date:** September 2026  

---

## 1. REST API Specification (`/api/v1`)

All endpoints communicate via JSON over HTTPS. Bearer JWT is required on all routes except `/auth/login` and `/health`.

### Standard Error Response
```json
{
  "error": {
    "code": "BAD_REQUEST | NOT_FOUND | UNAUTHORIZED | FORBIDDEN | CONFLICT | UNPROCESSABLE_ENTITY | INTERNAL_ERROR",
    "message": "Human-readable explanation of error",
    "details": {}
  }
}
```

### Endpoint Catalog (24 Endpoints)

| # | Endpoint | Method | Role | Request Payload | Response Payload |
|---|---|---|---|---|---|
| 1 | `/auth/login` | `POST` | Public | `{"email": str, "password": str}` | `{"access_token": str, "token_type": "bearer", "role": str, "user": UserOut}` |
| 2 | `/auth/me` | `GET` | Any | — | `UserOut` |
| 3 | `/tenders` | `GET` | Any | `?page=1&limit=20` | `Page[TenderSummary]` |
| 4 | `/tenders` | `POST` | Officer | `TenderCreate` | `TenderDetail` |
| 5 | `/tenders/{id}` | `GET` | Any | — | `TenderDetail` |
| 6 | `/tenders/{id}/matrix` | `GET` | Any | — | `ComplianceMatrix` |
| 7 | `/tenders/{id}/bidders` | `POST` | Officer | multipart: `name`, `files[]` | `{"bidder_id": UUID, "job_id": UUID, "accepted": [], "rejected": []}` |
| 8 | `/bidders/{id}` | `GET` | Any | — | `BidderDetail` |
| 9 | `/bidders/{id}/documents/{doc_id}/retag` | `POST` | Officer | `{"doc_type": str}` | `{"job_id": UUID, "status": "QUEUED"}` |
| 10 | `/jobs/{id}` | `GET` | Any | — | `JobStatus` |
| 11 | `/bidders/{id}/findings` | `GET` | Any | `?status=FAIL` | `List[FindingOut]` |
| 12 | `/bidders/{id}/risk` | `GET` | Any | — | `RiskProfileOut` |
| 13 | `/documents/{id}/pages/{n}.png` | `GET` | Any | `?dpi=110` | `image/png` |
| 14 | `/documents/{id}/file` | `GET` | Auth | — | `application/pdf` |
| 15 | `/findings/{id}/decision` | `POST` | Officer/Approver | `DecisionCreate` | `DecisionOut` |
| 16 | `/bidders/{id}/complete-review` | `POST` | Officer | — | `BidderDetail` |
| 17 | `/tenders/{id}/graph` | `GET` | Any | — | `{"nodes": [], "edges": []}` |
| 18 | `/copilot/query` | `POST` | Any | `CopilotQuery` | `CopilotAnswer` |
| 19 | `/tenders/{id}/audit` | `GET` | Any | `?page=1&limit=50` | `List[AuditEventOut]` |
| 20 | `/audit/verify` | `GET` | Any | — | `{"ok": bool, "length": int, "first_broken_seq": Optional[int]}` |
| 21 | `/bidders/{id}/report.pdf` | `GET` | Any | — | `application/pdf` (Compliance Dossier) |
| 22 | `/tenders/{id}/report.pdf` | `GET` | Any | — | `application/pdf` (Tender Evaluation Summary) |
| 23 | `/registry/{kind}/{value}` | `GET` | Officer | — | `{"status": "ACTIVE|INACTIVE", "canonical_name": str, "details": {}}` |
| 24 | `/health` | `GET` | Public | — | `{"status": "healthy", "components": {"db": str, "ocr": str, "llm": str}}` |

---

## 2. 11-Step Pipeline Step Signatures

Every pipeline step accepts and updates a typed context dataclass `PipelineContext`:

```python
class PipelineContext:
    tender_id: str
    bidder_id: str
    job_id: str
    storage_dir: str
    documents: list[dict]
    extracted_fields: dict[str, dict]
    canonical_entity: dict
    verifications: list[dict]
    findings: list[dict]
    anomalies: list[dict]
    risk_profile: dict
```

### Step Methods
- `step_01_ingest(ctx: PipelineContext) -> StepResult`
- `step_02_classify(ctx: PipelineContext) -> StepResult`
- `step_03_textify(ctx: PipelineContext) -> StepResult`
- `step_04_extract(ctx: PipelineContext) -> StepResult`
- `step_05_normalize(ctx: PipelineContext) -> StepResult`
- `step_06_entity_resolution(ctx: PipelineContext) -> StepResult`
- `step_07_verify(ctx: PipelineContext) -> StepResult`
- `step_08_compliance_rules(ctx: PipelineContext) -> StepResult`
- `step_09_anomalies(ctx: PipelineContext) -> StepResult`
- `step_10_risk_score(ctx: PipelineContext) -> StepResult`
- `step_11_explain(ctx: PipelineContext) -> StepResult`

---

## 3. Cryptographic Audit Chain Contract

Every mutating action generates an audit event inserted into `audit_log`:

```python
event_payload = {
    "seq": int,                   # Monotonically increasing sequence number
    "ts": str,                    # ISO 8601 UTC timestamp
    "actor_id": str,              # User UUID or 'system'
    "role": str,                  # 'officer' | 'approver' | 'auditor' | 'system'
    "action": str,                # e.g., 'CREATE_TENDER', 'DECISION_ACCEPT', 'OVERRIDE'
    "target_type": str,           # 'tender' | 'bidder' | 'finding' | 'document'
    "target_id": str,             # Target entity UUID
    "payload": dict               # State mutation delta
}

# Cryptographic chaining:
curr_hash = sha256(prev_hash + json.dumps(event_payload, sort_keys=True, separators=(',', ':')))
# Genesis prev_hash is 64 '0' characters: '0000...0000'
```

---

## 4. Registry Provider Contract

```python
from abc import ABC, abstractmethod

class RegistryProvider(ABC):
    @abstractmethod
    def verify_gstin(self, gstin: str) -> dict: ...
    
    @abstractmethod
    def verify_pan(self, pan: str) -> dict: ...
    
    @abstractmethod
    def verify_udyam(self, udyam_no: str) -> dict: ...
    
    @abstractmethod
    def verify_cin(self, cin: str) -> dict: ...
    
    @abstractmethod
    def check_debarment(self, name: str, pan: str) -> dict: ...
```
