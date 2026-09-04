# VigilBid Demonstration Benchmark

This document defines the reproducible benchmark for the synthetic VigilBid demonstration. It is intended for evaluator verification, not for claiming production accuracy on live government data.

## Benchmark scope

The benchmark uses the five synthetic bidder packages in `seed/demo_packages/`. Each scenario is designed to test a distinct decision-support behavior. The expected statuses below should remain aligned with [`docs/release/PROJECT-METRICS.json`](../release/PROJECT-METRICS.json).

## Scenario matrix

| Scenario | Expected status | Expected risk | Primary behavior tested | Evidence expected |
|---|---|---:|---|---|
| Meridian Flow Systems Pvt Ltd | PASS | 0.0 / LOW | Clean baseline and cross-document parity | Yes |
| Sri Kaveri Engineering Works | REVIEW | 22.0 / LOW | Name variation and controlled review | Yes |
| Bharat Hydrotech Corp | FAIL | 65.0 / HIGH | PAN/GSTIN mismatch and local-content deficit | Yes |
| Nova Pumps & Systems Ltd | WARN | 72.0 / HIGH | PDF metadata anomaly and prompt-injection defense | Yes |
| Zenith Infra Tech Pvt Ltd | FAIL | 95.0 / HIGH | Simulated registry failure and debarment scenario | Yes |

## Results to record before final submission

Run the demo from a clean reset and record the actual values in the table below. Do not replace `TBD` with estimates. Use the same environment and commit hash for every row.

| Scenario | Actual status | Actual risk | Documents processed | Rules evaluated | Processing time | Dossier generated | Audit verified |
|---|---|---:|---:|---:|---:|---|---|
| Meridian Flow Systems Pvt Ltd | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Sri Kaveri Engineering Works | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Bharat Hydrotech Corp | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Nova Pumps & Systems Ltd | TBD | TBD | TBD | TBD | TBD | TBD | TBD |
| Zenith Infra Tech Pvt Ltd | TBD | TBD | TBD | TBD | TBD | TBD | TBD |

## Reproducibility record

| Field | Value |
|---|---|
| Repository commit | `TBD — add the final verified commit hash` |
| Verification date | `TBD` |
| Operating system | `TBD` |
| Python version | `TBD` |
| Node.js version | `TBD` |
| Database mode | `TBD` |
| Demo reset command | `TBD — record the exact command used` |
| Benchmark command | `TBD — record the exact command used` |

## Interpretation rules

A result is **reproducible** only when the demo is reset before execution and the same scenario produces the same status, evidence references, and risk score. A simulated registry timeout or unavailable external verification must never improve a bidder’s status. Any mismatch between expected and actual results should be documented as a finding rather than silently corrected.

The benchmark is intentionally small. Its purpose is to demonstrate coverage of clean, ambiguous, inconsistent, anomalous, and serious statutory scenarios in a way that an evaluator can reproduce quickly.

## Final submission checklist

Before final submission, complete the following:

- Replace every `TBD` with a measured value or an explicit `Not applicable`.
- Add the final commit hash and verification date.
- Confirm that the five scenario names match the README, demo guide, seed directories, and screenshots.
- Confirm that all registry results remain labeled as simulated or demo data.
- Link the benchmark from the evaluator quickstart and README.

## Related documentation

- [Evaluator Quickstart](../EVALUATOR-QUICKSTART.md)
- [Judge Mode Specification](../EVALUATOR-JUDGE-MODE.md)
- [Project Metrics](../release/PROJECT-METRICS.json)
- [Release Readiness](../release/RELEASE-READINESS.md)
- [Testing Evaluation](EVALUATION.md)

## References

[1]: https://github.com/ratnesh-ml/SIH26100 "SIH26100 GitHub repository"
