# ADR-004: Deterministic Compliance Rule Engine over LLM Reasoning

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Core Architecture Team, SIH26100  

---

## 1. Context
Public procurement evaluation is legally binding and governed by strict statutory instruments: General Financial Rules (GFR) 2017, CVC guidelines, and PSU-specific procurement manuals. When a bidder is found non-compliant, that finding can be challenged in the High Court or Central Vigilance Commission. 

Many contemporary AI hackathon solutions attempt to feed complete bidder documents into Large Language Models (LLMs) with prompts like: *"Analyze if this bidder meets the turnover criterion of ₹5.52 Crores and answer Yes or No."*

## 2. Decision
We strictly enforce a **Deterministic Rule Engine Architecture** (`pipeline/rules/rule_engine.py`):
- All 34 compliance rules are defined declaratively in YAML (`rules/cpcl_goods_rules.yaml`).
- Rule evaluation is executed via deterministic Python comparison logic (mathematical comparisons, check-digit algorithms, regex patterns, date delta calculations).
- Status outputs are strictly restricted to deterministic enums: `PASS`, `WARN`, `REVIEW`, `FAIL`.
- LLMs are strictly excluded from generating compliance statuses, legal decisions, or pass/fail determinations.

## 3. Reason
- **100% Reproducibility:** Given the identical extracted inputs, the deterministic engine produces the exact same evaluation outcome 1,000,000 times out of 1,000,000. LLMs inherently suffer from non-deterministic variance and temperature drift.
- **Elimination of Hallucination Liability:** An LLM might misread an Indian numerical format (e.g. confusing 5,50,00,000 with 55,00,000) or hallucinate a compliance justification. A deterministic math operator (`turnover >= threshold`) never hallucinates.
- **Legal Defensibility in Audit:** CVC and CAG auditors require statutory clause citations and verifiable arithmetic, not probabilistic neural token probabilities.

## 4. Alternatives Considered
- **Pure LLM-as-a-Judge Prompting:**
  - *Rejected:* High risk of hallucination, lack of mathematical determinism, high API latency, token context limits, and zero legal standing in court.
- **Fine-Tuned Small Language Models (SLMs):**
  - *Rejected:* Better than general LLMs, but still probabilistic; unsuitable for statutory pass/fail thresholds.

## 5. Consequences
- **Positive:** Absolute consistency; instantaneous evaluation (<5ms per rule); explainable audit trails; full compliance with CVC vigilance standards.
- **Negative:** Requires explicit rule authoring in YAML when new tender categories (e.g., Works or Services) are introduced.
