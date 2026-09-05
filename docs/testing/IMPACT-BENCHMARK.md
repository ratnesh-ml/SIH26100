# VigilBid Impact Benchmark

This benchmark separates **measured system performance** from **human-review impact**. It prevents synthetic pipeline latency from being presented as a measured reduction in procurement-officer effort.

## What is measured today

The repository already measures the automated path using [`scripts/evaluate.py`](../../scripts/evaluate.py) against five synthetic bidder packages and their published ground truth. The current benchmark covers classification, extraction, entity resolution, rule correctness, anomaly handling, and end-to-end pipeline time. These results are reproducible engineering measurements, not claims about live government data.

| Measurement | Current evidence | Interpretation |
|---|---|---|
| Automated evaluation workload | 5 synthetic bidders, 26 PDF filings | Controlled demonstration coverage. |
| Ground-truth status alignment | 5/5 expected bidder outcomes | Reproduces the published synthetic scenarios. |
| Automated processing time | Recorded by `scripts/evaluate.py` | Pipeline latency, excluding human review time. |
| Human-review time reduction | **Not yet measured** | Requires a defined reviewer protocol and timed participants. |

## Human-review study protocol

To claim operational impact, run the same five packages through two conditions: manual review using the source PDFs and assisted review using the deployed VigilBid workflow. Use at least three reviewers who understand procurement-document scrutiny. Randomize package order, record time from package opening to initial disposition, and record every missed or incorrectly escalated finding. Do not use real vendor data without authorization.

| Field | Manual condition | VigilBid condition |
|---|---:|---:|
| Reviewers | Record participant IDs without personal data | Same reviewers, counterbalanced order |
| Packages | Same five synthetic bidder packages | Same five packages |
| Median time to disposition | **TBD — measure** | **TBD — measure** |
| Findings correctly identified | **TBD — measure** | **TBD — measure** |
| Unsupported decisions | **TBD — measure** | **TBD — measure** |
| Evidence lookup errors | **TBD — measure** | **TBD — measure** |

## Reporting rule

The final submission may report a time-savings percentage only after the human-baseline study is completed and recorded with the repository commit, date, reviewer protocol, operating environment, and raw timing sheet. Until then, describe the project as demonstrating **automated scrutiny latency** and **decision-support workflow coverage**, not measured officer productivity improvement.

## Reproduction command

```bash
python scripts/evaluate.py
```

The generated [`docs/EVALUATION.md`](../EVALUATION.md) is the authoritative output for the synthetic system benchmark.

## Related documentation

- [Demonstration benchmark](DEMO-BENCHMARK.md)
- [Evaluator quickstart](../EVALUATOR-QUICKSTART.md)
- [Known limitations](../KNOWN-LIMITATIONS.md)
