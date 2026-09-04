# Evaluator Judge Mode Specification

This document defines a future evaluator-facing route for VigilBid. It is a **presentation and interaction specification**, not a claim that the route already exists. The current local interactive tour remains available at `/#/demo`.

## Purpose

Judge Mode should let an evaluator understand the complete VigilBid value proposition without knowing the repository structure, database schema, or API routes. It should present five intentionally different bidder scenarios and guide the evaluator toward the relevant evidence, rule, risk explanation, human decision, and audit record.

## Proposed route

```text
/#/judge
```

If this route is not implemented before submission, the same scenario order should be used in the local demo tour and the video walkthrough.

## Scenario cards

| Scenario | Expected result | Primary capability demonstrated | Suggested action |
|---|---|---|---|
| **Meridian Flow Systems Pvt Ltd** | PASS / LOW | Clean bidder baseline and data parity | Open the compliance matrix and confirm no critical findings. |
| **Sri Kaveri Engineering Works** | REVIEW | Explainable name variation and controlled review | Open the entity-resolution explanation and review the officer decision path. |
| **Bharat Hydrotech Corp** | FAIL / HIGH | PAN/GSTIN mismatch and local-content deficit | Open the evidence inspector, risk explanation, and audit path. |
| **Nova Pumps & Systems Ltd** | WARN / HIGH | Document metadata anomaly and prompt-injection defense | Open the anomaly finding and show that document text does not override rules. |
| **Zenith Infra Tech Pvt Ltd** | FAIL / HIGH | Registry failure and debarment scenario | Open the simulated registry response and demonstrate the failure-safe outcome. |

## Golden-path card design

Each card should show the following information before the evaluator opens it:

- Bidder name and scenario label.
- PASS, REVIEW, WARN, or FAIL status.
- Risk score and risk band.
- Number of submitted documents.
- One-sentence explanation of the scenario.
- A visible `Try Scenario` or equivalent action.
- A clear `SYNTHETIC DEMO` label.

## Guided result panel

After a scenario is opened, the evaluator should be able to follow this chain in one visible panel:

```text
Source Documents → Extracted Values → Rule Evaluation → Finding → Risk Contribution → Officer Decision → Audit Entry
```

For Bharat Hydrotech Corp, the expected narrative is:

```text
PAN card + GST certificate
        ↓
AAACB1234F versus AAACB9999F
        ↓
CPCL-GOODS-002 fails
        ↓
Identity inconsistency finding
        ↓
Risk contribution is shown
        ↓
Officer review and written justification
        ↓
Decision appears in the audit ledger
```

## Evaluator safeguards

Judge Mode must never imply that the system has connected to live government portals or made an autonomous legal decision. Every simulated registry result should retain a visible `DEMO`, `MOCK`, or `SYNTHETIC` label. The final decision should remain visibly attributable to the human procurement officer.

## Acceptance criteria

Judge Mode is ready for final submission when an evaluator can:

1. Identify the five scenarios without reading technical documentation.
2. Open Bharat Hydrotech Corp in one action.
3. Find the PAN/GSTIN mismatch and its source evidence.
4. See which deterministic rule generated the finding.
5. Understand the risk contribution in plain language.
6. Record or inspect a governed human decision.
7. Verify the corresponding audit entry.
8. Return to the scenario list without losing context.

## Related documentation

- [Evaluator Quickstart](EVALUATOR-QUICKSTART.md)
- [Demo Guide](demo/DEMO-GUIDE.md)
- [One-Minute Tour](ONE-MINUTE-TOUR.md)
- [Project Metrics](release/PROJECT-METRICS.json)
- [Requirement Matrix](architecture/SIH26100-REQUIREMENT-MATRIX.md)

> **Implementation note:** This specification is intentionally additive. It does not replace the existing dashboard or demo tour; it defines a clearer evaluator path that can be implemented later or represented through the existing demo route.

## References

[1]: https://github.com/ratnesh-ml/SIH26100 "SIH26100 GitHub repository"
