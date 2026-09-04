# VigilBid Compliance Rules Engine Specification

## 1. Executive Architecture

The **VigilBid Compliance Rules Engine** (`pipeline/compliance/engine.py`) provides deterministic statutory evaluation of bidder qualification submissions against tender eligibility criteria (BEC) and Indian public procurement regulations (GFR 2017, CVC Guidelines, Public Procurement Policy for MSEs Order 2012, PPP-MII Order 2017, and DoE OM Rule 144(xi)).

```
┌──────────────────────────────────────────────────────────┐
│                   rules/cpcl_goods_v1.yaml               │
│  - Rule IDs (R-ID-01, R-FIN-01, R-REG-01, R-TEC-01...)   │
│  - Categories (HARD, SOFT, HUMAN, SIGNAL)                │
│  - Evaluator functions, clauses, citations, conditions   │
└────────────────────────────┬─────────────────────────────┘
                             │ Loaded & Versioned (v1.0)
                             ▼
┌──────────────────────────────────────────────────────────┐
│             ComplianceEngine (pipeline/compliance/)       │
│  - evaluate_rule()                                       │
│  - evaluate_bidder() -> BidderComplianceSummary          │
│  - evaluate_cross_document_checks()                      │
└────────────────────────────┬─────────────────────────────┘
                             │ Evaluates Extracted Data
                             ▼
┌──────────────────────────────────────────────────────────┐
│                  Finding Results & Hierarchy             │
│  - RuleFindingResult (status, citation, evidence)        │
│  - Precedence: FAIL > REVIEW > WARN > PASS               │
│  - Recommendation: "Recommended: Not Qualified" etc.     │
└──────────────────────────────────────────────────────────┘
```

---

## 2. Core Operational Principles

1. **Deterministic Primacy**: Where a statutory requirement has a deterministic verification formula (Mod-36 checksum, embedded PAN parity, numerical turnover threshold comparison, negative net worth, debarment list match), evaluation is executed purely with deterministic code.
2. **LLM Boundary**: The Large Language Model (LLM) is **NEVER** permitted to replace, override, or calculate legal, financial, or statutory compliance results. The LLM is restricted solely to Copilot semantic retrieval and optional non-binding explanation polish.
3. **Conservative Legal Phrasing**: The engine strictly enforces non-accusatory audit vocabulary:
   - Never uses words like `"fraud"`, `"fake"`, `"forged"`, or `"tampered"`.
   - Explanations state: `"Potential anomaly detected: ... — human verification required."`
   - Bidders with critical failures receive: `"Recommended: Not Qualified — officer confirmation required"`.

---

## 3. Status Hierarchy & Precedence

Evaluation outcomes map to four standard traffic-light states:

| Status | Category Weight | Definition | Bidder Status Implication |
|---|---|---|---|
| **`FAIL`** | Highest | Direct violation of mandatory eligibility criteria (unmet turnover, invalid checksum, debarment match, negative net worth). | Overrides all other states $\implies$ `Recommended: Not Qualified — officer confirmation required`. |
| **`REVIEW`** | Second | Missing evidence, ambiguous statutory names, unverified document, or required officer judgement. | If no `FAIL`, overrides `WARN` $\implies$ `Needs Review — officer inspection required`. |
| **`WARN`** | Third | Soft non-compliance (missing UDIN on CA certificate, OEM letter omitting tender reference, slight mismatch). | If no `FAIL` or `REVIEW` $\implies$ `Qualified with observations`. |
| **`PASS`** | Lowest | All mandatory parameters satisfied with complete verified evidence. | If all pass $\implies$ `Recommended: Qualified`. |

### Status Precedence Algorithm
```python
def calculate_precedence(statuses: list[str]) -> str:
    if "FAIL" in statuses:
        return "FAIL"
    if "REVIEW" in statuses:
        return "REVIEW"
    if "WARN" in statuses:
        return "WARN"
    return "PASS"
```

---

## 4. Rule Categories

- **HARD**: Mandatory compliance rules where non-compliance results in `FAIL` (e.g. GSTIN checksum, PAN parity, turnover threshold, negative net worth, debarment list match).
- **SOFT**: Advisory requirements where deviations result in `WARN` (e.g. missing 18-character UDIN on CA certificate, OEM letter missing tender NIT number).
- **HUMAN**: Subjective criteria where the system requires officer adjudication resulting in `REVIEW` (e.g. past performance completion certificate verification, land border beneficial ownership).
- **SIGNAL**: Forensics and anomaly detection signals feeding into risk scoring.

---

## 5. Standard Finding Result Contract

Every evaluated rule outputs a `RuleFindingResult`:

```python
@dataclass
class RuleFindingResult:
    rule_id: str
    rule_version: str
    status: str  # "PASS", "FAIL", "WARN", "REVIEW"
    title: str
    explanation: str
    citation: dict[str, Any]  # {"source": clause, "kb": topic}
    evidence: list[dict[str, Any]]
    confidence: float
    extracted: dict[str, Any]
    expected: dict[str, Any]
    category: str
    potential_anomaly_detected: bool = False
```

---

## 6. Documented MVP Rule Catalog (`rules/cpcl_goods_v1.yaml`)

| Rule ID | Category | Title | Condition & Evaluator | Expected Result |
|---|---|---|---|---|
| **`R-ID-01` / `R-GST-01`** | HARD | GSTIN Format & Checksum | `gstin_checksum`: Mod-36 checksum algorithm | Valid $\implies$ `PASS`, Invalid $\implies$ `FAIL`, Missing $\implies$ `REVIEW` |
| **`R-ID-02` / `R-GST-02`** | HARD | PAN Card Parity with GSTIN | `pan_gstin_linkage`: `GSTIN[2:12] == PAN` | Parity $\implies$ `PASS`, Mismatch $\implies$ `FAIL` (Conflicting), Missing $\implies$ `REVIEW` |
| **`R-ID-03` / `R-UDY-01`** | HARD | Udyam Format Validation | `udyam_validation`: `UDYAM-XX-00-0000000` | Valid $\implies$ `PASS`, Invalid $\implies$ `FAIL`, Missing $\implies$ `REVIEW` |
| **`R-UDY-02`** | HARD | Udyam MSE Benefit Eligibility | `udyam_category_mse_benefits`: Category in Micro/Small | Micro/Small $\implies$ `PASS`, Medium $\implies$ `FAIL` (Ineligible) |
| **`R-PAN-01`** | HARD | PAN Card Structure | `pan_checksum_format`: 10-char alphanumeric + entity type | Valid $\implies$ `PASS`, Invalid $\implies$ `FAIL` |
| **`R-FIN-01`** | HARD | Average Annual Turnover | `turnover_threshold`: Avg 3 FY $\ge$ threshold | $\ge$ Threshold $\implies$ `PASS`, $<$ Threshold $\implies$ `FAIL`, Missing $\implies$ `REVIEW` |
| **`R-FIN-02`** | HARD | Net Worth Solvency | `net_worth_positive`: Net worth $> 0$ | $>0 \implies$ `PASS`, $<0 \implies$ `FAIL` (Insolvency), Missing $\implies$ `REVIEW` |
| **`R-FIN-03`** | SOFT | ICAI UDIN Mandate | `udin_validation`: 18-digit UDIN on CA certificate | Valid $\implies$ `PASS`, Missing/Invalid $\implies$ `WARN` |
| **`R-REG-01`** | HARD | Make in India (PPP-MII) | `make_in_india`: Local content $\% \ge$ threshold | $\ge$ Threshold $\implies$ `PASS`, $<$ Threshold $\implies$ `FAIL`, Missing $\implies$ `REVIEW` |
| **`R-REG-02`** | HARD | Land Border Rule 144(xi) | `land_border_144xi`: Beneficial ownership declaration | Compliant $\implies$ `PASS`, Missing $\implies$ `REVIEW`, Border Origin $\implies$ `REVIEW` |
| **`R-REG-03`** | HARD | CPPP / GeM Debarment Check | `debarment_check`: Blacklist search | Not Debarred $\implies$ `PASS`, Debarred $\implies$ `FAIL` (Anomaly) |
| **`R-TEC-01`** | HARD | OEM Authorization Letter | `oem_authorization`: Manufacturer letter | OEM/Tender-ref $\implies$ `PASS`, No Ref $\implies$ `WARN`, Missing $\implies$ `REVIEW` |
| **`R-TEC-02`** | HUMAN | Past Performance Work Orders | `past_performance`: Completed work orders | Verified $\implies$ `PASS`, Unverified/Missing $\implies$ `REVIEW` |
| **`R-COM-01`** | HARD | EMD Guarantee / MSE Exemption | `emd_or_mse_exemption`: EMD paid $\ge$ required or MSE | Paid/Exempt $\implies$ `PASS`, Shortfall/Missing $\implies$ `FAIL` |
| **`R-DOC-01`** | HARD | Mandatory Document Presence | `document_presence`: Required doc in package | Present $\implies$ `PASS`, Missing $\implies$ `REVIEW` |

---

## 7. Handling Missing vs Conflicting Evidence

- **Missing Evidence (`status="REVIEW"` or `"WARN"`)**:
  - If a mandatory document or field is absent, the engine assigns `REVIEW`.
  - It does **not** assume the bidder is disqualified; the document could be misclassified, unreadable by OCR, or submitted under an alternate appendix.
  - If an advisory or non-critical identifier (like UDIN) is absent, the engine assigns `WARN`.
- **Conflicting Evidence (`status="FAIL"`, `potential_anomaly_detected=True`)**:
  - If two authoritative documents within the bidder's package directly contradict each other (e.g. GSTIN embedded PAN is `AAACP1234A` but declared PAN card is `BBBCP5678B`), the engine raises `FAIL` and flags `potential_anomaly_detected = True`.
  - The explanation specifies both values clearly without using accusatory language.
