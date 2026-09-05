# Statutory Government Registry Simulator & Demo Failure Engine

> [!IMPORTANT]
> **DISCLAIMER: DEMO / MOCK / SYNTHETIC (SIMULATED PORTAL)**
> The statutory registry integration module in VigilBid is a controlled synthetic simulation environment. It **does NOT** connect to live production government APIs (GSTN, NSDL, Udyam, MCA21, CPPP) and does not pretend to be a live government system. All responses are deterministically generated from curated fixtures and controlled scenario states for demonstration, evaluation, and CI/CD stress-testing.

---

## 1. Architectural Overview

VigilBid verifies bidder statutory credentials against a standardized abstract provider contract ([`RegistryProvider`](pipeline/registry_adapters/base.py)).

The architecture supports five statutory government domains:
1. **GST Registry (GSTN)**: Verifies 15-character GSTIN structure, active vs. cancelled registration status, legal/trade name, and return filing history.
2. **PAN Portal (NSDL / Income Tax Department)**: Verifies 10-character PAN validity, entity classification (Company, Firm, Individual), and legal taxpayer name.
3. **Udyam MSME Registry (Ministry of MSME)**: Verifies MSME registration numbers, enterprise classification (`MICRO`, `SMALL`, `MEDIUM`), and major business activities.
4. **MCA21 Registry (Ministry of Corporate Affairs)**: Verifies 21-character Corporate Identification Numbers (CIN), authorized/paid-up capital, and company status.
5. **National Debarment Registry (CPPP / GeM / CVC)**: Cross-checks bidder identity tokens against debarment and blacklist records under Rule 151 of GFR 2017.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Bidder Submission Document Intake                    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    Entity Resolution & Extraction                       │
│                   (PAN, GSTIN, Udyam, CIN, Legal Name)                  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Abstract RegistryProvider API                       │
│       (pipeline.registry_adapters.mock_adapter.MockRegistryProvider)    │
└────────┬──────────────┬──────────────┬──────────────┬───────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
   GSTN Portal     NSDL PAN     Udyam MSME        MCA21         CPPP Debarment
   (Simulated)    (Simulated)   (Simulated)    (Simulated)        (Simulated)
         │              │              │              │                │
         └──────────────┴───────┬──────┴──────────────┴────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Cross-Document Parity Verifier Engine                 │
│              - Checks status (ACTIVE, CANCELLED, VALID)                 │
│              - Handles API_UNAVAILABLE (Status -> REVIEW)               │
│              - Attaches audit citation & DEMO source badge              │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Standard Registry Result Contract

Every registry check returns a strict [`RegistryResult`](pipeline/registry_adapters/base.py) object:

```json
{
  "found": true,
  "status": "ACTIVE",
  "data": {
    "gstin": "33AABCC1234F1Z5",
    "legal_name": "APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED",
    "trade_name": "Apex Solutions",
    "status": "ACTIVE",
    "state": "Tamil Nadu",
    "pan": "AABCC1234F"
  },
  "source": "GST Registry — DEMO (Simulated Portal)",
  "fetched_at": "2026-09-04T14:00:00.000000+00:00",
  "latency_ms": 420
}
```

---

## 3. Deterministic Simulation Scenarios

The simulator provides 6 deterministic scenarios via the [`RegistryScenario`](pipeline/registry_adapters/base.py) enumeration:

| Scenario | Return Status | Data Payload Highlights | System Decision Impact |
| :--- | :--- | :--- | :--- |
| **`NORMAL`** | `ACTIVE` / `VALID` | Authoritative registered taxpayer data matching fixture records. | `PASS` |
| **`MISMATCH`** | `ACTIVE` / `VALID` | Divergent legal entity name or conflicting PAN token. | `FAIL` (Anomaly Detected) |
| **`EXPIRED`** | `CANCELLED` / `INOPERATIVE` | Suo-moto cancelled GSTIN or inoperative PAN under Sec 139AA. | `FAIL` (Statutory Invalidation) |
| **`NOT_FOUND`** | `NOT_FOUND` | `found=False`, missing registration record in statutory database. | `WARN` / `REVIEW` |
| **`API_UNAVAILABLE`** | `API_UNAVAILABLE` | HTTP 503 Gateway Timeout simulation. | `REVIEW` (`PENDING_VERIFICATION`) |
| **`DEBARRED`** | `DEBARRED` | Active debarment order under CPPP / GeM / MoPNG blacklist. | `FAIL` (Disqualification Alert) |

### Scenario Triggering Mechanisms

Presenters and test suites can trigger scenarios through three decoupled mechanisms:

1. **Explicit API Argument**:
   ```python
   result = await provider.verify_gstin("33AABCC1234F1Z5", scenario=RegistryScenario.EXPIRED)
   ```
2. **Global Simulation State**:
   ```python
   provider.set_scenario(RegistryScenario.API_UNAVAILABLE)
   ```
3. **Identifier Token Suffixes** (Self-contained test data):
   - `33AABCC1234F1Z5_UNAVAILABLE` → triggers `API_UNAVAILABLE`
   - `33AABCC1234F1Z5_MISMATCH` → triggers `MISMATCH`
   - `33AABCC1234F1Z5_EXPIRED` → triggers `EXPIRED`
   - `33AABCC1234F1Z5_NOTFOUND` → triggers `NOT_FOUND`
   - `33AABCC1234F1Z5_DEBARRED` → triggers `DEBARRED`

---

## 4. Failure Handling & Non-Compliance Invariant

> [!CAUTION]
> **PROCUREMENT GOVERNANCE INVARIANT: NEVER GRANT COMPLIANCE ON REGISTRY FAILURE**
> Under General Financial Rules (GFR) Rule 173(v), if an external verification system is unreachable or times out, the software **MUST NOT** grant compliance or default to an assumed-valid status.

When the simulated registry portal experiences downtime (`API_UNAVAILABLE` / 503):
- **Finding Status**: Explicitly set to `REVIEW` (`PENDING_VERIFICATION`).
- **Confidence**: Scaled down to `0.50` with an explanatory notification:
  > *"Simulated statutory registry portal (GST Registry — DEMO (Simulated Portal)) is currently unavailable (503 Gateway Timeout). Status set to REVIEW / PENDING_VERIFICATION. Compliance cannot be automatically granted."*
- **Officer Routing**: The finding is highlighted on the officer review queue with options to retry statutory lookup or request attested physical filings.

---

## 5. Presenter Chaos & Demo Failure Simulator

For live evaluation and interactive demonstration, the [`ChaosSimulator`](pipeline/demo/chaos_simulator.py) engine provides 5 single-click failure injections:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   CHAOS FAILURE DEMONSTRATION ENGINE                   │
├──────────────────────┬─────────────────────────────────────────────────┤
│ Failure Mode         │ Controlled Graceful Handling Response           │
├──────────────────────┼─────────────────────────────────────────────────┤
│ OCR_FAILURE          │ Traps low confidence (<0.40); routes to officer │
│                      │ for manual transcription without crashing.       │
├──────────────────────┼─────────────────────────────────────────────────┤
│ REGISTRY_TIMEOUT     │ Intercepts 503 gateway timeout; sets status to  │
│                      │ PENDING_VERIFICATION; auto-compliance withheld.  │
├──────────────────────┼─────────────────────────────────────────────────┤
│ MISSING_DOCUMENT     │ Flags missing envelope requirement; generates  │
│                      │ GFR 173(v) clarification notice draft.          │
├──────────────────────┼─────────────────────────────────────────────────┤
│ MALFORMED_PDF        │ Traps invalid EOF/binary corruption safely;     │
│                      │ isolates stream into quarantine state.          │
├──────────────────────┼─────────────────────────────────────────────────┤
│ MISMATCHED_IDENTITY  │ Triggers entity resolution disparity alert with │
│                      │ exact character diff between PAN and GSTIN.     │
└──────────────────────┴─────────────────────────────────────────────────┘
```

### REST API Endpoints

- `GET /api/v1/registry/scenarios`: Returns available simulation scenarios and descriptions.
- `GET /api/v1/demo/failure-modes`: Returns list of chaos demonstration modes.
- `POST /api/v1/demo/simulate-failure`: Executes a simulated failure mode and returns the structured graceful handling response.
  ```bash
  curl -X POST "http://localhost:8000/api/v1/demo/simulate-failure" \
    -H "Authorization: Bearer <TOKEN>" \
    -H "Content-Type: application/json" \
    -d '{"failure_mode": "REGISTRY_TIMEOUT", "context": {"registry": "GST Registry — DEMO"}}'
  ```

---

## 6. UI Representation & Demarcation

All UI components displaying simulated registry data are clearly labeled:
- **Registry Badge**: `GST Registry — DEMO (Simulated Portal)`
- **Disclaimers**: Amber-colored banner explicitly informing officers that simulated data is in use for the evaluation sandbox.
- **Latency Animation**: Realistic simulated network latency (300–800ms) with interactive spinner feedback to demonstrate real-world asynchronous fan-out verification.
