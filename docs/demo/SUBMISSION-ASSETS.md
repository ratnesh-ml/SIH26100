# Final Submission Asset Plan

This document reserves the evaluator-facing locations for final visual and video assets. It contains no fabricated links or screenshots. Replace the placeholders only when the final assets are ready.

## Public links

| Asset | Status / Target | Final action |
|---|---|---|
| Live demo (Frontend) | [https://vigilbid-frontend.onrender.com](https://vigilbid-frontend.onrender.com) | Active public deployment instance on Render. |
| Backend API & Docs | [https://vigilbid-backend.onrender.com/api/v1/docs](https://vigilbid-backend.onrender.com/api/v1/docs) | Active public FastAPI Swagger docs instance. |
| YouTube walkthrough | `[ADD YOUTUBE VIDEO URL]` | Replace with the final public video URL. |
| Project repository | [SIH26100 GitHub repository](https://github.com/ratnesh-ml/SIH26100) | Keep unchanged. |

## Screenshot slots

| Order | Filename | Required content | Caption to use |
|---:|---|---|---|
| 1 | `01-dashboard.png` | Executive dashboard with bidder/risk overview | `VigilBid executive scrutiny dashboard showing the tender risk posture.` |
| 2 | `02-bidder-cockpit.png` | Bharat Hydrotech bidder cockpit | `Bidder cockpit showing extracted documents, findings, and current risk status.` |
| 3 | `03-evidence-inspector.png` | PAN/GSTIN evidence highlighted side by side | `Evidence inspector linking the compliance finding to exact source PDF regions.` |
| 4 | `04-risk-explanation.png` | Risk score and factor decomposition | `Explainable risk view showing how each factor contributes to the composite score.` |
| 5 | `05-audit-ledger.png` | Human decision and audit-chain verification | `Governed officer decision recorded in the tamper-evident audit ledger.` |

Store the final files under `docs/demo/screenshots/`. Keep the filenames stable so README links do not need to change later.

## Video structure

The recommended walkthrough length is 60–90 seconds:

| Time | Content |
|---:|---|
| 0–10 sec | Problem statement and one-sentence solution. |
| 10–25 sec | Open the synthetic Bharat Hydrotech scenario. |
| 25–40 sec | Show the PAN/GSTIN inconsistency and source evidence. |
| 40–55 sec | Show the deterministic rule and explainable risk factors. |
| 55–70 sec | Record or inspect the governed human decision. |
| 70–90 sec | Verify the audit trail and dossier output. |

## Asset quality checklist

Before adding an asset, confirm that the text is readable at normal repository preview size, no real personal or government credentials are visible, every synthetic or simulated value is labeled appropriately, and the screenshot shows the user action and resulting value clearly enough to stand alone.

## Related documentation

- [Evaluator Quickstart](../EVALUATOR-QUICKSTART.md)
- [Judge Mode Specification](../EVALUATOR-JUDGE-MODE.md)
- [Screenshot Guidance](SCREENSHOTS.md)
- [Demo Guide](DEMO-GUIDE.md)

## References

[1]: https://github.com/ratnesh-ml/SIH26100 "SIH26100 GitHub repository"
