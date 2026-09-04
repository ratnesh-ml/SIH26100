# ADR-008: Multi-Factor Weighted Risk Scoring & Explainability Engine

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Core Architecture Team, SIH26100  

---

## 1. Context
To prioritize review queues, procurement officers need to know which bidders present high risk and which appear clean. However, monolithic risk scores (e.g. *"Bidder Risk: 75%"*) without explanation cause frustration, distrust, and legal challenge. Evaluators must understand exactly *why* a risk score was assigned and which specific factors contributed to it.

## 2. Decision
We implement a **Deterministic, Weighted Multi-Factor Risk Engine** (`pipeline/risk/risk_engine.py`):
1. **Four Orthogonal Risk Dimensions:**
   - **Identity & Legal Risk (Weight: 30%):** PAN-GSTIN structural consistency, MCA status, Udyam entity match, debarment records.
   - **Financial & Commercial Risk (Weight: 25%):** Turnover deficit relative to criteria, UDIN verification status, net-worth solvency.
   - **Eligibility & Compliance Gap (Weight: 25%):** Count and severity of rule non-compliances (`FAIL` vs `WARN`).
   - **Forensic & Document Anomaly (Weight: 20%):** PDF creation metadata discrepancies, image tampering signatures, prompt injection attempts.
2. **Normalized Composite Score (0–100):**
   - `0 – 25`: Low Risk (Green)
   - `26 – 60`: Medium / Review Risk (Amber)
   - `61 – 100`: High Risk (Red)
3. **Mandatory Driver Breakdown:** The API and UI decompose the composite score into exact mathematical drivers:
   ```json
   {
     "composite_score": 65.0,
     "level": "HIGH",
     "drivers": [
       {"factor": "Identity Inconsistency", "points": 30.0, "reason": "PAN AAACB1234F does not match GSTIN AAACB9999F"},
       {"factor": "Turnover Deficit", "points": 20.0, "reason": "Average turnover ₹3.1 Cr is below required ₹5.52 Cr"},
       {"factor": "Rule Failures", "points": 15.0, "reason": "3 mandatory criteria failed"}
     ]
   }
   ```

## 3. Reason
- **Full Explainability:** Officers can immediately see that a score of 65 is driven primarily by an identity mismatch rather than an arbitrary statistical calculation.
- **Configurable Risk Policies:** Different PSU procurement categories (Goods vs EPC Works) can tune category weights without code changes.
- **Zero Black-Box Scoring:** CVC inspectors can audit the exact arithmetic used to compute the risk ranking.

## 4. Alternatives Considered
- **Unsupervised Machine Learning Clustering (Isolation Forests, Autoencoders):**
  - *Rejected:* Hard to explain why a specific bid was assigned high risk; unlabelled data and absence of ground-truth procurement fraud training sets lead to high false-positive rates.
- **Binary Pass/Fail Filter:**
  - *Rejected:* Fails to differentiate between a minor typo (abbreviation) and a major forensic anomaly.

## 5. Consequences
- **Positive:** Transparent, defensible, and intuitive risk assessment; officers gain instant clarity on where to focus scrutiny.
- **Negative:** Requires continuous review of weight coefficients as real-world procurement data patterns evolve.
