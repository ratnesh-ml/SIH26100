# VigilBid Risk Engine & Anomaly Detection Specification

## 1. Executive Architecture

The **VigilBid Risk Engine** (`pipeline/risk/scorer.py`) and **Anomaly Detector** (`pipeline/risk/anomaly.py`) compute an explainable, transparent composite risk score (0–100) and identify driver-level risk signals across statutory compliance findings, forensic metadata, cross-document discrepancies, and cross-bidder collusion links.

```
┌────────────────────────────────────────────────────────┐
│                   Input Signal Sources                 │
│  - Compliance Findings (HARD FAIL, REVIEW, WARN)       │
│  - Entity Resolution Confidence (<0.60 / 0.60-0.85)    │
│  - Missing Mandatory Documents                         │
│  - Expired Certificates on Bid Due Date                │
│  - Government Registry Failures (Cancelled GSTN etc.)  │
│  - Forensic PDF Signals (Producer, XREF revisions)     │
│  - Adversarial Prompt Injection Patterns               │
│  - Cross-Bidder Collusion (Shared Author, Phone, Bank) │
│  - National Debarment / Blacklist Matches              │
└───────────────────────────┬────────────────────────────┘
                            │ Evaluated by RiskScorer
                            ▼
┌────────────────────────────────────────────────────────┐
│             Risk Composite & Classification            │
│  - Score = min(100, Σ points)                          │
│  - Risk Bands: LOW (0–24), MEDIUM (25–54), HIGH (55+) │
│  - Top Risk Drivers Breakdown                          │
│  - Conservative Legal Narrative (No "fraud" wording)   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Legal Vocabulary Rule

Per Section 10.1 of `docs/02`:
- The system **never** outputs accusatory words such as `"fraud"`, `"fraudulent"`, `"fake"`, `"forged"`, or `"tampered"`.
- All outputs are framed strictly as **anomaly signals**:
  - Explanations state: `"Potential anomaly detected — human verification required."`
  - High-risk signals state: `"Risk signal: ... — requires review."`
  - Bidders with critical failures state: `"Recommended: Not Qualified — officer confirmation required"`.

---

## 3. Weight Point Allocations (`rules/risk_weights.yaml`)

| Driver Category | Source | Points Incurred | Maximum Cap |
|---|---|---|---|
| **HARD Rule FAIL** | Compliance Engine | +25 per rule | 50 points |
| **REVIEW Criterion** | Compliance Engine | +8 per criterion | 24 points |
| **WARN Observation** | Compliance Engine | +3 per observation | 12 points |
| **Low Entity Resolution** | EntityMatcher | +20 (<0.60) / +10 (0.60–0.85) | 20 points |
| **Missing Mandatory Document** | Document Ingestion | +10 per document | 30 points |
| **Expired Certificate on Due Date** | CrossVerifier | +15 per certificate | 30 points |
| **Government Registry Failure** | RegistryProvider | +25 (Cancelled / Invalid) | 40 points |
| **Medium Enterprise Claiming MSE** | CrossVerifier | +20 points | 20 points |
| **Forensic: Producer Software** | AnomalyDetector | +6 (GIMP / Word on statutory cert) | 6 points |
| **Forensic: Inverted Timestamps** | AnomalyDetector | +6 (ModDate < CreationDate) | 6 points |
| **Forensic: Incremental Revisions** | AnomalyDetector | +8 (xref count $\ge 2$) | 8 points |
| **Forensic: Adversarial Injection** | AnomalyDetector | +20 (Prompt override strings) | 20 points |
| **Collusion: Shared PDF Author** | AnomalyDetector | +10 across distinct bidders | 10 points |
| **Collusion: Shared Phone/Bank** | AnomalyDetector | +15 across distinct bidders | 15 points |
| **Debarment Registry Match** | RegistryProvider | +35 points | 35 points |

Composite score is calculated as:
$$\text{Total Score} = \min(100, \sum \text{driver points})$$

---

## 4. Risk Bands & Operational Semantics

| Risk Band | Point Range | Color / Indicator | Officer Action Requirement |
|---|---|---|---|
| **`LOW`** | 0 – 24 | 🟢 Green | Standard risk profile. Standard verification routine; proceed with normal evaluation. |
| **`MEDIUM`** | 25 – 54 | 🟡 Amber | Elevated risk signals. Officer verification required on flagged drivers prior to qualification. |
| **`HIGH`** | 55 – 100 | 🔴 Red | Substantial risk signals. Thorough second-pair-of-eyes review required before any qualification. |

---

## 5. Result Contract (`RiskBreakdown` & `RiskFactor`)

```python
@dataclass
class RiskFactor:
    factor_id: str
    category: str
    title: str
    weight: int
    score: int
    evidence_reference: Optional[dict[str, Any]]
    explanation: str

@dataclass
class RiskBreakdown:
    total_score: int
    risk_band: str  # 'LOW' | 'MEDIUM' | 'HIGH'
    recommendation: str
    drivers: list[RiskFactor]
    driver_count: int
    top_drivers: list[RiskFactor]
```
