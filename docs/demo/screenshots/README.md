# VigilBid — 20-Screen High-Fidelity UI Screenshots Directory

This directory contains the authentic high-resolution UI screen captures representing the complete VigilBid public procurement scrutiny portal (matching `"ui vigilbid.zip"` and live deployment at [https://vigilbid-frontend.onrender.com](https://vigilbid-frontend.onrender.com)).

### Complete 20-Screen Interface Catalog

| File | Screen View | Route | Key Scrutiny Capability |
|---|---|---|---|
| [`00-hero-landing.png`](00-hero-landing.png) | **01. Landing & Public Portal** | `#/` / `#/hero` | Live public portal metrics, value proposition, and evaluator entry points |
| [`00-login-options.png`](00-login-options.png) | **02. Role Selector** | `#/login-options` | Role cards for CVO, Technical Member, Auditor, and Admin |
| [`00-login-page.png`](00-login-page.png) | **03. NIC-CERT DSC Login** | `#/login` | Class 3 USB Crypto Token authentication & PIN verification |
| [`01-dashboard.png`](01-dashboard.png) | **04. Executive Dashboard** | `#/dashboard` | Portfolio KPIs, deterministic red-flag scanner, risk posture distribution |
| [`02-tender.png`](02-tender.png) | **05. Tender Scope & NIT** | `#/tender-detail` | Scope of work, technical specifications, and statutory rule sets |
| [`02-tender-upload.png`](02-tender-upload.png) | **07. Tender Ingestion Modal** | *Modal* | Notice Inviting Tender (NIT) package upload with SHA-256 preflight |
| [`02-bidder-list.png`](02-bidder-list.png) | **08. Bidder Directory** | `#/bidders` | Multi-bidder registry with risk scores, compliance chips, and triage CTAs |
| [`03-upload.png`](03-upload.png) | **09. Bidder Submission Ingestion** | *Modal* | Secure ZIP/PDF package ingestion with CAS pre-flight inspection |
| [`04-processing.png`](04-processing.png) | **10. 11-Step Forensic Pipeline** | `#/pipeline` | Asynchronous forensic state machine from unpacking to risk scoring |
| [`04-extraction.png`](04-extraction.png) | **11. Forensic OCR Extraction** | `#/extraction` | Raw OCR extraction inspector with regex rules and raw JSON tokens |
| [`04-registry-verification.png`](04-registry-verification.png) | **12. Registry Verification** | `#/registry` | Real-time cross-checks with MCA21, GSTN, NSDL, and CPPP debarment |
| [`05-compliance-matrix.png`](05-compliance-matrix.png) | **13. Compliance Matrix** | `#/matrix` | 18 criteria across 5 categories comparing participating vendors |
| [`06-bidder-cockpit.png`](06-bidder-cockpit.png) | **14. Bidder Scrutiny Cockpit** | `#/scrutiny` | Primary evaluation cockpit, discrepancy findings, and adjudication panel |
| [`07-evidence.png`](07-evidence.png) | **15. Evidence Inspector** | `#/evidence` | Dual-document PDF viewer with coordinate bounding-box highlights |
| [`08-risk.png`](08-risk.png) | **16. Explainable Risk Posture** | `#/risk` | 0–100 composite risk gauge with factor weights and radar visualization |
| [`09-graph.png`](09-graph.png) | **17. Cartel & Collusion Graph** | `#/graph` | Interactive network graph exposing director overlaps and shared IP subnets |
| [`10-audit.png`](10-audit.png) | **18. Cryptographic Audit Ledger** | `#/audit` | Immutable SHA-256 block feed with client-side zero-tamper verification |
| [`11-report.png`](11-report.png) | **19. CVC Statutory Dossier** | `#/dossier` | Official printable CVC scrutiny dossier and officer signoff sheet |
| [`12-copilot.png`](12-copilot.png) | **20. Grounded AI Copilot** | *Drawer* | Slide-out assistant for instant GFR/CVC regulatory interpretation |

All screen assets are synchronized with the live Vite React application deployed on Render.
