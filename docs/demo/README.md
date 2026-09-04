# VigilBid (SIH26100) — Demonstration Suite & Guided Tour Guide

This directory contains resources, guides, scripts, and media guidelines for demonstrating the VigilBid platform during presentations, evaluations, and video walkthroughs.

---

## 1. Overview of the In-App `/demo` Page

VigilBid includes an interactive, high-fidelity demonstration page integrated directly into the React frontend at route `/#/demo` (or `/demo`).

### Key Highlights of `/demo`:
- **Unauthenticated Access:** Evaluators and judges can explore the complete system without logging in.
- **Problem vs Solution Presentation:** Visual comparison between manual procurement bottlenecks (CAG audit statistics) and automated vigilance.
- **Interactive 10-Stage Pipeline Visualizer:** Clickable step-by-step walkthrough showing how documents transform from raw ZIPs into audit-backed compliance findings.
- **Real-World Vendor Scenario Switcher:** Interactive tabbed cards showcasing:
  1. *Meridian Flow Systems:* Clean Tier-1 vendor (`PASS`, Risk: 0/100).
  2. *Sri Kaveri Engineering:* Minor MSE abbreviation variance (`WARN`, Jaro-Winkler score: 0.82).
  3. *Bharat Hydrotech Corp:* Hard PAN-GSTIN structural mismatch (`FAIL`, Risk: 65/100).
  4. *Nova Pumps & Systems:* PDF metadata editing anomaly & indirect prompt injection (`HIGH`, Risk: 76.5/100).
  5. *Zenith Infra Tech:* CVC-debarred entity detected against registry sanctions (`FAIL`, Risk: 95/100).
- **Embedded Video Section:** Dedicated responsive video player with fallback instructions.

---

## 2. How to Run the Demonstration

### Option A: Via Browser Client
1. Start the backend and frontend services:
   ```bash
   # Terminal 1: Backend API
   uvicorn backend.main:app --port 8000

   # Terminal 2: Frontend Client
   cd frontend && npm run dev
   ```
2. Open your browser to:
   ```
   http://localhost:5173/#/demo
   ```
3. Alternatively, if opening the main application (`http://localhost:5173`), click the **"Guided Demo"** button with the pulsating blue badge in the top navigation bar, or click **"Explore Interactive Guided Demo Tour"** on the login screen.

---

## 3. How to Reset and Reseed Demo Data

If live testing has modified bidder records, findings, or audit entries, restore the pristine demonstration state with:

```bash
# Execute the automated demo setup script
python scripts/demo_setup.py
```

This script:
1. Re-initializes tender `CPCL/PROC/2026/PUMP-042` (API-610 Centrifugal Pumps).
2. Seeds all 5 synthetic vendor profiles with complete document packages.
3. Populates mock registry records (GSTN, PAN, MCA, Udyam, Debarment).
4. Runs the 11-step pipeline across all bidders.
5. Populates verified findings, anomalies, risk breakdowns, and hash-chained audit events.

---

## 4. How to Configure the YouTube Video URL

The demo page includes a placeholder for a recorded YouTube walkthrough video.

To insert a real YouTube URL:
1. Open [`frontend/src/components/DemoView.tsx`](file:///frontend/src/components/DemoView.tsx).
2. Locate the constant at line 14:
   ```typescript
   const YOUTUBE_DEMO_URL = ""; // e.g. "https://www.youtube.com/embed/YOUR_VIDEO_ID"
   ```
3. Replace the empty string with your YouTube embed URL (e.g., `"https://www.youtube.com/embed/dQw4w9WgXcQ"`).
4. Save the file. Vite hot-reloads automatically. The demo page will seamlessly transition from the placeholder banner to an interactive embedded player.

---

## 5. Capturing and Adding Screenshots

To add visual screenshots to the documentation:
1. Capture the 11 key screens described in [docs/demo/SCREENSHOTS.md](SCREENSHOTS.md).
2. Save the images in `docs/demo/screenshots/` following the exact naming convention:
   - `01-dashboard.png`
   - `02-tender.png`
   - `03-upload.png`
   - `04-processing.png`
   - `05-compliance-matrix.png`
   - `06-bidder-cockpit.png`
   - `07-evidence.png`
   - `08-risk.png`
   - `09-graph.png`
   - `10-audit.png`
   - `11-report.png`
3. Verify that all sensitive tokens or private credentials are sanitized before committing.

---

## 6. Demonstration Documents & References

- [docs/demo/DEMO-NARRATIVE.md](DEMO-NARRATIVE.md): Chronological 7-minute presentation script.
- [docs/DEMO-SCRIPT.md](../DEMO-SCRIPT.md): Complete 12-beat presentation runbook with contingency plans.
- [docs/FINAL-DEMO.md](../FINAL-DEMO.md): Evaluation summary, claims verification, and judge Q&A guide.
- [docs/demo/SCREENSHOTS.md](SCREENSHOTS.md): Screenshot capture and composition specification.
