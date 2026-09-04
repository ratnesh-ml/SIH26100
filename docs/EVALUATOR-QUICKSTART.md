# VigilBid Evaluator Quickstart

This guide is the shortest path for a judge or technical reviewer to understand and verify **VigilBid (SIH26100)**. It is intentionally concise; detailed architecture, security, testing, and statutory documentation remain available in the linked project documents.

## 1. What the project solves

VigilBid is an evidence-first, buyer-side decision-support platform for public-procurement bid scrutiny. It helps procurement officers compare bidder documents, detect statutory inconsistencies, connect findings to source evidence, explain risk, and record a governed human decision.

The guiding principle is:

> **AI assists. Rules verify. Evidence explains. Officer decides.**

The current repository contains a reproducible synthetic demonstration environment. Government registry adapters are intentionally simulated and clearly separated from production integration requirements.

## 2. Evaluator assets

The following assets will be added before the final submission. The placeholders are intentional so the repository can be prepared now without requiring last-minute restructuring.

| Asset | Status | Link / Target |
|---|---|---|
| Public live demo | Active | [https://vigilbid-frontend.onrender.com](https://vigilbid-frontend.onrender.com) |
| Backend API & Swagger | Active | [https://vigilbid-backend.onrender.com/api/v1/docs](https://vigilbid-backend.onrender.com/api/v1/docs) |
| YouTube walkthrough | To be added | `[ADD YOUTUBE VIDEO URL]` |
| Dashboard screenshot | To be added | `docs/demo/screenshots/01-dashboard.png` |
| Bidder cockpit screenshot | To be added | `docs/demo/screenshots/02-bidder-cockpit.png` |
| Evidence inspector screenshot | To be added | `docs/demo/screenshots/03-evidence-inspector.png` |
| Explainable risk screenshot | To be added | `docs/demo/screenshots/04-risk-explanation.png` |
| Audit ledger screenshot | To be added | `docs/demo/screenshots/05-audit-ledger.png` |

## 3. Fastest local verification path

### Recommended Docker path

```bash
git clone https://github.com/ratnesh-ml/SIH26100.git
cd SIH26100
cp .env.example .env
make docker-up
```

After the services become healthy, open:

| Component | URL |
|---|---|
| VigilBid cockpit | `http://localhost:5173` |
| Interactive demo tour | `http://localhost:5173/#/demo` |
| Backend health check | `http://localhost:8000/health` |
| Swagger API documentation | `http://localhost:8000/api/v1/docs` |

If Docker is unavailable, follow the native setup in the main [README](../README.md) and [final setup guide](deployment/FINAL-SETUP.md).

## 4. Three-minute golden-path demonstration

Use the synthetic **Bharat Hydrotech Corp** scenario. It is designed to demonstrate the complete decision-support workflow without requiring real government credentials.

| Step | Evaluator action | Expected result |
|---:|---|---|
| 1 | Open the demo tour or dashboard | The tender and synthetic bidder scenarios are visible. |
| 2 | Select Bharat Hydrotech Corp | The bidder cockpit shows the submitted document package and extracted values. |
| 3 | Open the identity finding | The system shows the PAN-versus-GSTIN inconsistency. |
| 4 | Open source evidence | The relevant PDF pages and coordinate highlights are displayed. |
| 5 | Open the risk explanation | The composite score is decomposed into understandable factors. |
| 6 | Review the compliance rule | The deterministic rule and statutory reference are visible. |
| 7 | Record a human decision | The officer decision requires written justification where applicable. |
| 8 | Open the audit ledger | The decision appears in the tamper-evident audit history. |
| 9 | Generate the dossier | The evidence-backed compliance report is available for review. |

For the detailed version of this flow, see [docs/demo/DEMO-GUIDE.md](demo/DEMO-GUIDE.md) and [docs/ONE-MINUTE-TOUR.md](ONE-MINUTE-TOUR.md). The planned scenario-card experience is specified in [Judge Mode](EVALUATOR-JUDGE-MODE.md).

## 5. What the evaluator should verify

The evaluator should focus on five questions:

1. **What problem is detected?** The system identifies cross-document and compliance inconsistencies in a bidder submission.
2. **How is it detected?** Deterministic extraction, normalization, registry responses, and declarative compliance rules work together.
3. **Where is the evidence?** Findings link back to source documents, pages, and coordinate regions.
4. **Who has authority?** The procurement officer remains the final decision-maker.
5. **Can the result be audited?** Decisions and supporting actions are recorded in a verifiable audit chain.

## 6. Verification commands

```bash
# Backend test suite
pytest tests/ -v

# Frontend tests and UI integrity checks
npm test --prefix frontend

# Frontend production build
npm run build --prefix frontend

# Release and security checks
python scripts/release_audit.py
```

The authoritative current metrics should be read from [`docs/release/PROJECT-METRICS.json`](release/PROJECT-METRICS.json), generated from the repository rather than manually copied into several documents.

## 7. Prototype scope disclosure

This repository is **demo-ready and hackathon-ready**, not a claim of production deployment against live government systems. Registry responses are simulated, the bidder packages are synthetic, and live production operation would require approved integrations, credentials, infrastructure, security review, and institutional agreements.

That limitation is intentional: the prototype demonstrates the workflow, evidence model, explainability, human governance, and auditability without using real citizen or vendor data.

## 8. Detailed references

- [Main README](../README.md)
- [Demo guide](demo/DEMO-GUIDE.md)
- [Release readiness](release/RELEASE-READINESS.md)
- [Project metrics](release/PROJECT-METRICS.json)
- [Requirement traceability matrix](architecture/SIH26100-REQUIREMENT-MATRIX.md)
- [Security threat model](security/THREAT-MODEL.md)
- [Known limitations](KNOWN-LIMITATIONS.md)
- [Testing and evaluation](testing/EVALUATION.md)
- [Demonstration benchmark](testing/DEMO-BENCHMARK.md)
- [Judge Mode specification](EVALUATOR-JUDGE-MODE.md)
- [Final submission asset plan](demo/SUBMISSION-ASSETS.md)

> **Submission reminder:** Before the final submission, replace the URL placeholders and add the screenshots listed in Section 2. No structural rewrite should be required after that point.

## References

[1]: https://github.com/ratnesh-ml/SIH26100 "SIH26100 GitHub repository"

[2]: https://github.com/ratnesh-ml/SIH26100/blob/main/docs/release/PROJECT-METRICS.json "Generated project metrics"

[3]: https://github.com/ratnesh-ml/SIH26100/blob/main/docs/release/RELEASE-READINESS.md "Release readiness documentation"
