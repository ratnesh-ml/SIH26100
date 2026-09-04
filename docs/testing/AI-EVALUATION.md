# Systematic AI Evaluation Framework & Golden Dataset

## Overview

VigilBid includes a systematic, reproducible evaluation framework that benchmarks Document Intelligence, Field Extraction, Entity Resolution, Rule Verification, and RAG Grounding against synthetic golden datasets.

---

## 1. Golden Dataset Structure (`data/ground-truth/`)

Synthetic benchmark test cases covering diverse procurement scenarios:

- `case-01-clean-compliant/`: Clean MSE Class-I vendor with complete UDIN and GSTN parity.
- `case-02-financial-turnover-deficit/`: Vendor with audited turnover deficit failing BEC 2.1.
- `case-03-entity-mismatch-gstin/`: Vendor with PAN mismatch between PAN card and GSTIN.
- `case-04-tampered-document-metadata/`: PDF with suspicious author metadata and prompt injection layers.
- `case-05-collusion-cross-bidder/`: Cross-bidder common director / telephone adjacency graph flag.

Each case specifies:
- `expected-extraction.json`: Target key-value fields and confidence.
- `expected-compliance.json`: Expected rule pass/fail statuses and statutory citations.
- `expected-risk.json`: Expected risk drivers and composite score band.

---

## 2. Evaluation Runner (`make evaluate`)

Run the complete evaluation suite across all benchmark cases:

```bash
make evaluate
```

Or invoke the Python runner directly:
```bash
python scripts/run_evaluation.py
```

Results are saved to `evaluation/results/latest.json` with metrics for:
- Field Extraction F1 Score
- Rule Classification Accuracy
- RAG Retrieval & Citation Precision
- Prompt Injection Neutralization Rate
