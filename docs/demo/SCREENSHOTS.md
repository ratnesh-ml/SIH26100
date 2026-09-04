# VigilBid (SIH26100) — UI Screenshot Plan & Capture Specifications

This document defines the 11 key UI screenshots required for official documentation, competition presentations, and GitHub repository visual assets.

> [!IMPORTANT]
> **Sanitization Guidelines:** All captures must use synthetic demo data only (e.g. `CPCL/MM/2026/PUMP-217`). Ensure browser developer consoles, personal bookmarks, operating system taskbars, and development authentication tokens are cropped or omitted.

---

## 1. Required Screenshot Catalog

| Filename | Screen / Route | Purpose | Key Elements Visible | Sensitive Data to Remove |
|---|---|---|---|---|
| `01-dashboard.png` | Main Dashboard (`/dashboard`) | Executive overview of active PSU tenders and vigilance posture | Active tender cards, total evaluated bidders, risk distribution bar, audit status chip, quick action buttons | OS taskbar, developer extensions |
| `02-tender.png` | Tender Detail (`/tenders/CPCL-PUMP-217`) | Demonstrates procurement parameter configuration & criteria | NIT reference, estimated value (₹18.40 Cr), criteria count (34 rules), MSE preference flags, PPP-MII class | Internal database IDs |
| `03-upload.png` | Upload Modal (`/upload`) | Illustrates safe ingestion of bidder ZIP archives | Drag-and-drop zone, file size indicators, magic byte verification chip, progress percentage indicator | Local workstation directory paths |
| `04-processing.png` | Pipeline Stepper (`/pipeline`) | Visualizes asynchronous 11-step analysis progress | Step indicators: Ingest $\rightarrow$ OCR $\rightarrow$ Extract $\rightarrow$ Verify $\rightarrow$ Rules $\rightarrow$ Risk $\rightarrow$ Report, active worker timestamp | Local hostname / port numbers |
| `05-compliance-matrix.png` | Compliance Matrix (`/compliance-matrix`) | High-density multi-bidder criteria comparison | 5 bidder columns × 34 criteria rows, traffic-light status chips (PASS, WARN, REVIEW, FAIL), filter controls | Any unmasked test tokens |
| `06-bidder-cockpit.png` | Bidder Cockpit (`/bidders/{id}`) | Central scrutiny interface for evaluating officers | Bidder metadata, registry verification pills, extracted financial metrics, finding cards with GFR citations | Workstation IP addresses |
| `07-evidence.png` | Evidence Inspector (`/bidders/{id}/evidence`) | Proves evidence-first verification with visual bounding boxes | Split-screen layout: finding card on left, rendered PDF page on right with yellow bounding box around CA turnover / UDIN | Local file system paths |
| `08-risk.png` | Risk Breakdown Modal (`/bidders/{id}/risk`) | Demonstrates explainability of composite risk scores | 0–100 risk dial, driver contribution bars (Identity, Financial, Compliance, Anomaly), risk factor explanations | None (synthetic factors only) |
| `09-graph.png` | Collusion Network Graph (`/graph`) | Visualizes cross-bidder entity relationships | Node graph connecting bidders via shared PAN, bank accounts, authorized signatories, or identical file hashes | None (synthetic linkages only) |
| `10-audit.png` | Audit Ledger (`/audit`) | Proves cryptographic tamper-evidence of officer decisions | Sequential event list, SHA-256 hash chains, green "Ledger Verified" badge, event timestamp and user role | Real user email addresses |
| `11-report.png` | CVC PDF Dossier Preview (`/reports`) | Demonstrates formal compliance documentation export | Official CPCL header, criteria compliance summary table, highlighted evidence excerpts, digital signature block | Local print driver dialogs |

---

## 2. Recommended Capture Specifications
- **Viewport Resolution:** 1920 × 1080 (Full HD, 16:9 ratio).
- **Color Theme:** Dark mode (VigilBid default aesthetic).
- **Format:** High-quality PNG with lossless compression.
- **Storage Location:** Save all files to `docs/demo/screenshots/`.
