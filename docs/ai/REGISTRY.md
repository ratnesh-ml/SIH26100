# VigilBid (SIH26100) — Statutory Government Registry Abstraction Specification

**Document Version:** 1.0.0  
**Date:** September 2026  
**Status:** Locked & Operational  
**Module:** `pipeline/registry_adapters/`

---

## 1. Overview & Architectural Policy

Public procurement evaluation requires cross-referencing bidder submissions against official statutory registries (GSTN, NSDL PAN, Udyam MSME, MCA21, and CPPP Debarment).

### Strict Disclosure Requirement
Per Section 19 of `docs/04-dataset-mockapi-security-devops-mvpcut-team.md`, VigilBid strictly enforces transparency:
- **Mock Provider for MVP:** All external verification responses are fixture-backed local simulations.
- **Explicit UI/API Badge:** Every response and interface widget must explicitly declare:
  > **"Source: Simulated registry (demo)"**
- **No False Claims:** The platform **never** claims or implies live real-time government server connectivity during demo evaluations.
- **Extensible Architecture:** Real external API integrations (GSTN GSP, NSDL TRACES, MCA API) will plug directly behind the identical `RegistryProvider` interface without breaking upstream code.

---

## 2. Interface Contract & Standard Result Shape

All registry verification calls return an immutable `RegistryResult` container ([pipeline/registry_adapters/base.py](pipeline/registry_adapters/base.py)):

```python
@dataclass
class RegistryResult:
    found: bool
    status: str          # ACTIVE, CANCELLED, VALID, SUSPENDED, DEBARRED, CLEAR, NOT_FOUND
    data: dict[str, Any]
    source: str = "Simulated registry (demo)"
    fetched_at: str      # ISO 8601 UTC timestamp
    latency_ms: int      # Simulated or actual execution latency
```

### RegistryProvider Interface
```python
class RegistryProvider(ABC):
    async def verify_gstin(self, gstin: str) -> RegistryResult: ...
    async def verify_pan(self, pan: str) -> RegistryResult: ...
    async def verify_udyam(self, udyam_no: str) -> RegistryResult: ...
    async def verify_cin(self, cin: str) -> RegistryResult: ...
    async def check_debarment(
        self,
        name: Optional[str] = None,
        pan: Optional[str] = None,
        gstin: Optional[str] = None,
        cin: Optional[str] = None,
    ) -> RegistryResult: ...
```

---

## 3. Supported Statutory Registry Verifications

| Portal / Registry | Identifier | Validated Data Attributes | Negative / Anomaly Case |
|---|---|---|---|
| **GSTN (Goods & Services Tax)** | 15-char GSTIN | Legal Name, Trade Name, Status (`ACTIVE`), Taxpayer Type, Filing Status, Address | `CANCELLED` (Suo-moto cancellation for non-filing); `NOT_FOUND` |
| **NSDL / Income Tax** | 10-char PAN | Status (`VALID`), Entity Type (`Company`, `Firm`), Incorporation Date | `NOT_FOUND` |
| **Ministry of MSME** | Udyam Number | Status (`ACTIVE`), Category (`MICRO`, `SMALL`, `MEDIUM`), Major Activity (`MANUFACTURING`, `SERVICES`) | `MEDIUM` enterprise illegally claiming MSE EMD exemption |
| **MCA21 (Ministry of Corporate Affairs)** | 21-char CIN | Company Status (`ACTIVE`), RoC, Class, Authorized & Paid-up Capital | `NOT_FOUND` |
| **CPPP / GeM Debarment** | PAN, Name, GSTIN | Blacklist status (`DEBARRED`), Order Number, Debarring Ministry, Effective Period, Reason | Hard failure candidate triggering vigilance human review |

---

## 4. Artificial Latency & Demo Animation

In production, parallel external API calls take between 300 ms and 800 ms. To ensure realistic demonstration and allow UI pipeline animations to visually demonstrate a concurrent "fan-out" verification:
- `MockRegistryProvider` simulates randomized artificial latency (default: 300–800 ms).
- Latency simulation can be toggled via `simulate_latency=False` or `SIMULATE_REGISTRY_LATENCY=false` for instantaneous automated unit testing.

---

## 5. Local Fixtures ([data/fixtures/registry/](data/fixtures/registry/))

The mock provider is backed by deterministic JSON fixture databases representing the standard 4+1 demo bidder profiles:
1. `gstin.json`: Active GSTIN for Apex Industrial Solutions, and Suo-moto Cancelled GSTIN for Coromandel Engineering Works.
2. `pan.json`: Verified PANs with entity classification (Company vs Partnership).
3. `udyam.json`: Verified Small and Medium MSME certificates.
4. `cin.json`: Corporate ROC registration details.
5. `debarment.json`: CPPP blacklist records with debarment orders, banning periods, and violation reasons.

---

## 6. REST API Endpoints

VigilBid exposes authenticated registry endpoints ([backend/api/router.py](backend/api/router.py)):
- `GET /api/v1/registry/gstin/{gstin}`
- `GET /api/v1/registry/pan/{pan}`
- `GET /api/v1/registry/udyam/{udyam_no}`
- `GET /api/v1/registry/cin/{cin}`
- `GET /api/v1/registry/debarment?pan={pan}&name={name}&gstin={gstin}`

Every API response returns the standard `RegistryResult` payload with `"source": "Simulated registry (demo)"`.
