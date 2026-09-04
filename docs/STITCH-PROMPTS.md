# VigilBid (SIH26100) — Google Stitch UI Design Blueprint & Master Prompts
**Design System Reference:** `DESIGN-apple.md` (Apple Human Interface / Museum Gallery Web Architecture)  
**Target Platform:** Google Stitch (AI UI Generation Studio)  
**Application:** VigilBid — AI-Powered Human-in-the-Loop Procurement Decision Support Platform (CPCL / IndianOil / Ministry of Petroleum & Natural Gas — SIH26100)

---

## 1. Executive Summary & Design Translation

This blueprint translates **VigilBid (SIH26100)** into **9 production-grade screen prompts** crafted specifically for **Google Stitch**. Every prompt rigorously adheres to the design specification in `DESIGN-apple.md`.

### The Apple Aesthetic Applied to Public Procurement
Public procurement platforms (GeM, CPPP, NIC) are historically cluttered, tabular, and visually chaotic. VigilBid breaks this paradigm by adopting Apple’s signature **museum gallery** aesthetic:
- **Product/Artifact First:** Statutory certificates (Form GST REG-06, PAN cards, Udyam certificates, CA Turnover sheets) are presented like revered artifacts resting on pedestals. The UI chrome recedes completely.
- **Alternating Full-Bleed Canvases:** Pure White (`#ffffff`), Parchment (`#f5f5f7`), and Near-Black (`#272729` / `#000000`) tiles provide structural rhythm without tacky dividers or borders.
- **Monochromatic Discipline with a Single Interactive Color:** Exactly one brand action color carries all click signals: **Action Blue (`#0066cc`)** for light tiles and **Sky Link Blue (`#2997ff`)** for dark tiles. No secondary brand colors exist.
- **Pill Geometry (`rounded.pill` 9999px):** All primary actions, category filters, and status chips use the signature Apple capsule shape. Utility cards use `rounded.lg` (18px) with 1px hairline borders (`#e0e0e0`).
- **Signature Single Drop Shadow:** Exactly **one** drop shadow exists in the entire system: `rgba(0, 0, 0, 0.22) 3px 5px 30px 0`, applied solely to document artifacts resting on surfaces.
- **Typographic Cadence:** SF Pro Display with negative letter-spacing (`-0.28px` to `-0.374px`) for display headlines, paired with 17px SF Pro Text with 1.47 leading for comfortable, deliberate reading.
- **Conservative Legal Tone:** "Recommended: Not Qualified — officer confirmation required", "Potential anomaly detected — human verification required". Zero accusatory words ("fraud", "fake", "forgery").

---

## 2. Master Screen Architecture & Feature Map

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                      VIGILBID SCREEN & WORKFLOW TAXONOMY                         │
├───────────────────┬──────────────────────────────────┬───────────────────────────┤
│ Screen ID         │ Name                             │ Primary User / Purpose    │
├───────────────────┼──────────────────────────────────┼───────────────────────────┤
│ Screen 01 (S0)    │ Executive Command Center         │ Chief Vigilance / Officer │
│ Screen 02 (S2)    │ Tender Portfolio & PQC Builder   │ Procurement Officer (Tender)│
│ Screen 03 (S3)    │ Compliance Matrix Heatmap        │ Tender Evaluation Board   │
│ Screen 04 (S4)    │ Secure Ingestion Dropzone        │ Officer / Bid Ingestion   │
│ Screen 05 (S5)    │ 11-Step Forensic Pipeline Stepper│ Technical Evaluator       │
│ Screen 06 (S6)    │ Primary Bidder Cockpit (Crown)   │ Officer / Adjudication    │
│ Screen 07 (S7)    │ Cross-Bidder Entity Link Graph   │ Vigilance / Anti-Collusion│
│ Screen 08 (S8)    │ Tamper-Evident Audit & Dossier   │ Auditor / CVC Compliance  │
│ Screen 09 (S9)    │ Procurement Copilot Assistant    │ Legal / Regulatory Counsel│
└───────────────────┴──────────────────────────────────┴───────────────────────────┘
```

---

## 3. Global Design System Rules for Google Stitch Prompts

When pasting into Google Stitch, every prompt shares the following design foundation:
```yaml
Colors:
  Primary Action: "#0066cc" (Action Blue pill CTAs, links)
  Primary Focus: "#0071e3" (2px solid outline)
  Primary Dark Link: "#2997ff" (Sky Link Blue on dark tiles)
  Body Text: "#1d1d1f" (Near-black ink, 17px/1.47)
  Body Muted: "#7a7a7a" (Caption & secondary text)
  Canvas Pure: "#ffffff" (Pure white card/canvas)
  Canvas Parchment: "#f5f5f7" (Signature Apple off-white background)
  Tile Dark: "#272729" (Dark hero / highlight tile)
  Nav Black: "#000000" (Persistent 44px global bar)
  Hairline: "#e0e0e0" (1px utility border)
  Hairline Soft: "rgba(0, 0, 0, 0.06)"

Typography:
  Headline Hero: "SF Pro Display, 56px, 600 weight, -0.28px tracking, 1.07 line-height"
  Headline Section: "SF Pro Display, 40px, 600 weight, 0 tracking, 1.10 line-height"
  Sub-Headline: "SF Pro Text, 24px, 400 weight, 1.25 line-height"
  Body Default: "SF Pro Text, 17px, 400 weight, -0.374px tracking, 1.47 line-height"
  Body Strong: "SF Pro Text, 17px, 600 weight, -0.374px tracking, 1.24 line-height"
  Caption / Tags: "SF Pro Text, 14px, 400 weight, -0.224px tracking, 1.43 line-height"
  Nav Link: "SF Pro Text, 12px, 400 weight, -0.12px tracking"

Elevation:
  Product Shadow: "rgba(0, 0, 0, 0.22) 3px 5px 30px 0 (applied ONLY to resting document pages)"
  Chrome Shadow: "NONE (zero drop shadows on cards, buttons, or nav)"
  Frosted Glass: "backdrop-filter: blur(20px) saturate(180%); background: rgba(245, 245, 247, 0.82)"

Geometry:
  Pill: "border-radius: 9999px (CTAs, status chips, search input, option pills)"
  Card: "border-radius: 18px (utility cards, preview containers)"
  Button Utility: "border-radius: 8px"
```

---

## 4. Google Stitch Master Prompts (Screen-by-Screen)

---

### Screen 01: Executive Command Center (Dashboard)

#### Role & Feature Scope
Executive procurement overview for CPCL / IndianOil senior officers and Chief Vigilance Officer. Tracks active tenders, qualification velocity, critical risk anomalies, and real-time hash-chained pipeline activity stream.

#### Google Stitch Master Prompt
```markdown
Create a high-end, museum-gallery web dashboard titled "VigilBid — Executive Procurement Command Center" for Chennai Petroleum Corporation Limited (CPCL), designed strictly according to the Apple Web Design System (SF Pro typography, Action Blue #0066cc accent, alternating light and dark canvases, zero decorative gradients, no card drop shadows).

Layout & Canvas Hierarchy:
1. Global Navigation (Top Pinned, 44px, background #000000 pure black):
   - Left: Sleek CPCL • VigilBid emblem in pure white.
   - Center links: "Command Center" (active, white), "Tenders", "Matrix", "Bidders", "Link Graph", "Audit Ledger".
   - Right: Live Engine Health Pill (small green dot + "PostgreSQL 16 & OCR Online", 12px SF Pro Text) and User Profile Capsule ("Ravi K. • Dy. Manager Materials").

2. Sub-Navigation (Pinned below global nav, 52px, frosted parchment #f5f5f7 at 85% opacity with blur(20px) backdrop-filter, 1px bottom hairline #e0e0e0):
   - Left: Page title "Procurement Overview" in SF Pro Display 21px / 600.
   - Center: Quick timeframe selector chips ("Fiscal 2026", "Last 30 Days", "Active Tenders Only") in #ffffff pill chips.
   - Right: Action Blue pill button ("+ Create Tender", 14px SF Pro Text, #0066cc background, white text, 9999px rounded, 8px 18px padding).

3. Hero Overview Section (Full-bleed Parchment Canvas #f5f5f7, padding 64px 80px):
   - Centered headline in SF Pro Display 40px / 600 with negative tracking (-0.35px): "Public Procurement. Verified with Precision."
   - Subtitle in SF Pro Text 17px / 400 (#7a7a7a): "AI-assisted, human-in-the-loop compliance evaluation under GFR 2017 & CVC Guidelines."
   - 4-Column Metric Grid (Cards in pure white #ffffff, 18px rounded, 1px solid #e0e0e0 hairline, 24px padding, zero shadows):
     - Metric 1: "Active Tenders" -> "14" (Large 34px SF Pro Display 600), subtext "₹142.8 Cr total estimated value".
     - Metric 2: "Bidders Evaluated" -> "58" (34px 600), subtext "41 Qualified • 11 Under Review • 6 Not Qualified".
     - Metric 3: "Identifier Parity Rate" -> "94.2%" (34px 600), subtext "PAN ↔ GSTIN ↔ MCA cross-verified".
     - Metric 4: "Forensic Signals Flagged" -> "7" (34px 600, with subtle 14px warning pill "Human Review Required"), subtext "3 PDF anomalies • 4 Related-party links".

4. Active High-Stakes Tenders (Section in Pure White Canvas #ffffff, padding 64px 80px):
   - Section header: "High-Priority Two-Bid Tenders" (SF Pro Display 28px / 600) with a right-aligned "View All 14 Tenders →" text link in #0066cc.
   - 3 Column Grid of Tender Utility Cards (white surface, 18px rounded, 1px hairline #e0e0e0, 24px padding):
     - Card 1: "NIT CPCL/MM/2026/PUMP-217" • "12 API-610 Centrifugal Pumps" • Value: "₹18.40 Cr" • Bidders: "4 Filings" • Status Chip: "Evaluation Phase" (pill #f5f5f7, text #1d1d1f) • Action Blue pill CTA: "Open Compliance Matrix".
     - Card 2: "NIT CPCL/ENG/2026/VALVE-104" • "High-Pressure Gate Valves" • Value: "₹6.80 Cr" • Bidders: "8 Filings" • Status Chip: "Verification in Progress" • Ghost pill CTA: "View Progress".
     - Card 3: "NIT CPCL/REF/2026/PIPE-089" • "Seamless Alloy Steel Piping" • Value: "₹31.20 Cr" • Bidders: "12 Filings" • Status Chip: "Audit Closed" • Ghost pill CTA: "Download Dossier".

5. Real-Time Cryptographic Activity & Pipeline Feed (Full-bleed Near-Black Canvas #272729, padding 64px 80px, text in #ffffff):
   - Headline: "Live Forensic Event Stream" in SF Pro Display 28px / 600 (negative tracking).
   - Subtitle: "Every ingestion, verification check, and officer decision is cryptographically hash-chained."
   - Event Stream List (stacked horizontal rows, hairline divider #333333):
     - Row 1: "02:44:12" • Officer Decision • "Accepted minor MSE name variation for Sri Kaveri Engineering Works" • Actor: "Ravi K. (Dy. Mgr)" • SHA-256: "7f9a...3b21" • Action link: "Inspect Evidence →" (in Sky Link Blue #2997ff).
     - Row 2: "02:41:05" • Anomaly Detected • "Document metadata indicates Producer 'GIMP 2.10' with 3 incremental updates on GST Certificate (Apex Hydro)" • Severity: "REVIEW" • Link: "View Forensic Trace →".
     - Row 3: "02:38:50" • Registry Check • "Udyam Enterprise UDYAM-TN-02-0048192 verified with Ministry of MSME" • Latency: "420ms" • Status: "PASS".

6. Minimalist Apple Footer (Parchment #f5f5f7, padding 48px 80px, hairline top border #e0e0e0, text #7a7a7a, 12px SF Pro Text):
   - Left: "VigilBid • Decision Support System for Chennai Petroleum Corporation Limited (CPCL / MoPNG)."
   - Right: "Compliant with GFR 2017 Rule 144(xi), PPP-MII Order 2017 & CVC Guidelines 2021 • v2.34.0".
```

---

### Screen 02: Tender Portfolio & PQC Specification Builder (Tenders Screen + Modal)

#### Role & Feature Scope
Allows procurement officers to inspect existing two-bid tenders and configure new tender requirements under GFR 2017, Public Procurement (Preference to Make in India) Order, and MSE Policy.

#### Google Stitch Master Prompt
```markdown
Design an elegant, museum-gallery web interface titled "VigilBid — Tender Portfolio & PQC Configuration" for public sector procurement officers at CPCL, styled following the Apple Web Design Guidelines (SF Pro Display & Text, Action Blue #0066cc, pure white cards with 18px rounded corners, parchment backgrounds #f5f5f7, zero decorative gradients, no drop shadows on UI cards).

Layout & Components:
1. Global Navigation Bar (44px, pure black #000000, 12px SF Pro Text in pure white):
   - CPCL emblem, navigation items: "Tenders" (active), "Matrix", "Bidders", "Link Graph", "Audit Ledger". Right profile indicator.

2. Sub-Navigation Bar (52px, frosted glass #f5f5f7 at 80% opacity, backdrop-filter blur(20px), bottom hairline #e0e0e0):
   - Left: "Tenders Portfolio" (21px SF Pro Display 600).
   - Center: Search Input in pill shape (9999px rounded, #ffffff background, 1px hairline border #e0e0e0, search icon, 14px text "Filter by NIT Number or Item description...").
   - Right: Primary Action Blue pill button ("+ Create New Tender", 11px 22px padding, #0066cc, white text).

3. Main Surface (Canvas Parchment #f5f5f7, padding 48px 80px):
   - Header Block:
     - Title: "Active Procurement Contracts" (40px SF Pro Display 600, -0.35px tracking).
     - Subtext: "Two-bid tenders published on GeM and CPPP under GFR 2017 statutory evaluation."
   
   - Filter & Filter Pills Row:
     - Tappable capsule filter chips: "All (14)", "Goods Tenders (8)", "Works & Services (4)", "Evaluation Active (5)", "Dossier Certified (9)". Active chip has 2px solid #0071e3 border.

   - Master Tender Grid (Grid of 3 cards across, Pure White #ffffff cards, 18px border radius, 1px solid #e0e0e0 hairline, 28px padding):
     - Card 1 (Featured Hero Card):
       - Header: NIT Number badge "CPCL/MM/2026/PUMP-217" in 12px pill chip.
       - Title: "Supply of 12 Units API-610 11th Edition Centrifugal Pumps for Resid Upgrade Project" (21px SF Pro Display 600, #1d1d1f).
       - Key Specifications Grid (2x2 micro-grid inside card):
         - Estimated Value: "₹18,40,00,000 (₹18.40 Cr)"
         - Bid Submission Deadline: "18 September 2026, 15:00 IST"
         - Mandatory Turnover: "₹5.52 Cr / year (Avg 3 FYs)"
         - Make in India: "Class-I Local Supplier (≥ 50%)"
       - Bidder Submission Tracker: "4 Bidder Packages Ingested" with status indicator pills (1 Clean, 1 Review, 1 Critical Mismatch, 1 Forensic Anomaly).
       - Card Footer Actions: Left text-link "Configure PQC Rules" in #0066cc; Right primary Action Blue pill CTA "Open Compliance Matrix →".
     
     - Card 2:
       - NIT Number "CPCL/ENG/2026/VALVE-104" • Title "High Pressure Forged Steel Gate & Globe Valves (Class 1500)" • Value "₹6.80 Cr" • Status "8 Bidders • Evaluation 75% Complete". Action: "View Matrix".
     
     - Card 3:
       - NIT Number "CPCL/MAINT/2026/HEX-311" • Title "Shell & Tube Heat Exchanger Bundle Replacement" • Value "₹9.25 Cr" • Status "6 Bidders • All Verified". Action: "View Matrix".

4. Centered Modal Dialog — "Configure New Tender PQC Requirements" (Simulated open state floating above parchment backdrop):
   - Dialog Dimensions: 720px width, pure white #ffffff background, 18px rounded, 1px hairline border #e0e0e0, subtle 30px black backdrop-blur.
   - Header: "New Two-Bid Tender Specification" (24px SF Pro Display 600) with a close button (44px circular translucent chip #d2d2d7).
   - Form Fields Stack (17px SF Pro Text, 12px 16px padding, 9999px rounded inputs or 8px utility rects):
     - Field 1: NIT Number (e.g. "CPCL/MM/2026/COMP-402") & Tender Title.
     - Field 2: Portal Selection ("GeM Custom Bid" vs "CPPP e-Procure").
     - Field 3: Estimated Tender Value in INR (e.g. "₹ 25,00,00,000").
     - PQC Rule Configuration Box (Parchment background #f5f5f7, 14px rounded, 20px padding):
       - Financial Turnover Threshold: "30% of value (₹ 7.50 Cr) with mandatory UDIN on CA Certificate".
       - Net Worth Requirement: "Positive net worth in audited FY 2024-25 balance sheet".
       - Make In India Class: Option pill toggle: "[Class-I (≥50%)]" (selected, blue outline) vs "[Class-II (≥20%)]".
       - Land Border Restriction: Checkbox "Enforce GFR Rule 144(xi) registration requirement".
       - MSE EMD Exemption: Checkbox "Exempt Micro & Small Enterprises with valid Udyam registration".
   - Footer: Left "Cancel" text button; Right Action Blue pill button "Save & Publish Tender PQC (cpcl_goods_v1)".
```

---

### Screen 03: The Compliance Matrix Heatmap (Screen S3 — "The One Screen That Wins")

#### Role & Feature Scope
The central evaluation screen comparing all bidders across statutory criteria. Allows the tender evaluation committee to spot qualifications, warnings, reviews, and hard failures across the entire field at a glance.

#### Google Stitch Master Prompt
```markdown
Create a magnificent, museum-gallery comparative compliance matrix web view titled "VigilBid — Tender Compliance Matrix" for CPCL Tender NIT CPCL/MM/2026/PUMP-217 (₹18.40 Cr, 12 API-610 Centrifugal Pumps). Follow the Apple Web Design System strictly: SF Pro typography, Action Blue #0066cc accents, pure white #ffffff and parchment #f5f5f7 surfaces, hairline 1px borders #e0e0e0, zero decorative gradients, no drop shadows on table cells.

Layout & Structural Elements:
1. Global Navigation Bar (44px, pure black #000000, pure white typography):
   - CPCL emblem, links to Command Center, Tenders, Matrix (active), Bidders, Link Graph, Audit Ledger. Right profile pill.

2. Sub-Navigation Frosted Strip (52px, parchment #f5f5f7 at 80% opacity, backdrop-filter blur(20px), bottom hairline #e0e0e0):
   - Left: Breadcrumb "Tenders / NIT CPCL/MM/2026/PUMP-217 / Compliance Matrix" (21px SF Pro Display 600).
   - Center: Quick filter tabs in pill capsules ("All 4 Bidders", "Qualified (1)", "Requires Review (2)", "Not Qualified (1)").
   - Right: Button cluster with secondary pill "Upload Bidder Package" and primary Action Blue pill CTA "Export Committee Dossier PDF" (#0066cc, 9999px rounded).

3. Tender Summary Banner (Pure White Canvas #ffffff, padding 32px 80px, 1px bottom hairline #e0e0e0):
   - Left Block: Large title "API-610 Centrifugal Pumps Evaluation Matrix" (34px SF Pro Display 600, -0.37px tracking) • Estimated Value: "₹18.40 Cr" • Published by: "Ravi K., Materials Dept".
   - Right KPI Stat Cluster (4 compact metrics in utility boxes, 14px rounded, 1px hairline #e0e0e0):
     - "Bidders Ingested: 4" • "Criteria Rules: 12" • "Average Entity Parity: 91%" • "Cryptographic Hash Chain: Verified (37 events)".

4. Interactive Matrix Grid (Parchment Canvas #f5f5f7, padding 32px 80px):
   - Top Filter Bar: Search by bidder name, status dropdown, risk level toggle ("All", "Low 0-25", "Med 26-60", "High 61-100").
   - Legend Bar (Apple caption style, 14px SF Pro Text):
     - "✔ PASS (Statutory criterion fully satisfied)"
     - "⚠ WARN (Informational observation — does not disqualify)"
     - "👁 REVIEW (Discrepancy detected — officer confirmation required)"
     - "✖ FAIL (Mandatory statutory condition violated)"
   
   - The Matrix Table (Pure white background #ffffff, 18px rounded outer container, 1px solid #e0e0e0 hairline, overflow horizontal scroll with sticky left bidder column):
     - Table Header Row (Parchment tint #f5f5f7, 14px SF Pro Text 600, 16px vertical padding, border-bottom 1px #e0e0e0):
       - Col 1 (Sticky): "Bidder Identification & Canonical Name"
       - Col 2: "Overall Recommendation"
       - Col 3: "Risk Gauge"
       - Col 4: "PAN ↔ GST (R-GST-01)"
       - Col 5: "Turnover ≥ ₹5.52 Cr (R-FIN-01)"
       - Col 6: "UDIN Verification (R-FIN-02)"
       - Col 7: "MII Class-I ≥ 50% (R-MII-01)"
       - Col 8: "OEM Auth (R-OEM-01)"
       - Col 9: "MSE Status (R-EMD-01)"
       - Col 10: "Land Border (R-LB-01)"
       - Col 11: "Integrity Pact (R-IP-01)"
       - Col 12: "Debarment Check (R-DEB-01)"
       - Col 13: "Forensic Signals"

     - Row 1 — Bidder A: "Flowserve India Controls Pvt Ltd"
       - Sticky Col: "Flowserve India Controls Pvt Ltd" • Declared: "Flowserve India Controls" • Parity 98% (green pill) • PAN: AAACF****K
       - Overall: Pill badge "Qualified" (subtle neutral fill, green text checkmark)
       - Risk: "12 / 100 • LOW"
       - Matrix Cells: All 10 statutory cells show "✔ PASS" in clean, crisp capsules. Forensic: "Clean".

     - Row 2 — Bidder B: "Sri Kaveri Engineering Works"
       - Sticky Col: "Sri Kaveri Engineering Works" • Declared: "SRI KAVERI ENGG WORKS" • Parity 82% • Micro MSE Enterprise
       - Overall: Pill badge "Needs Review" (subtle neutral fill, blue text eye)
       - Risk: "28 / 100 • MEDIUM"
       - Cells:
         - PAN ↔ GST: "👁 REVIEW" (Abbreviation discrepancy: "SRI KAVERI ENGG WORKS" on GST vs "Sri Kaveri Engineering Works" on PAN, same PAN embedded in GSTIN)
         - Turnover: "✔ PASS (MSE Exempt from ₹5.52 Cr turnover threshold)"
         - UDIN: "✔ PASS"
         - MII: "✔ PASS (62% local content)"
         - OEM Auth: "✔ PASS"
         - MSE Status: "✔ PASS (UDYAM-TN-02-0048192 verified)"
         - Forensic: "Clean (1 doc scan deskewed)"

     - Row 3 — Bidder C: "PetroFlow Systems Ltd"
       - Sticky Col: "PetroFlow Systems Ltd" • Declared: "PetroFlow Systems Limited" • Parity 64%
       - Overall: Pill badge "Recommended: Not Qualified — officer confirmation required" (subtle red outline, neutral fill)
       - Risk: "68 / 100 • HIGH"
       - Cells:
         - PAN ↔ GST: "✖ FAIL" (Chars 3-12 of GSTIN do not match PAN card: AABCP****M vs AAACP****M)
         - Turnover: "✔ PASS (₹14.2 Cr)"
         - UDIN: "✔ PASS"
         - MII: "✖ FAIL" (Declared Class-I but certificate specifies 45% local content; minimum required is 50%)
         - OEM Auth: "✔ PASS"
         - MSE Status: "✖ FAIL" (Medium enterprise claiming MSE EMD exemption)
         - Forensic: "Clean"

     - Row 4 — Bidder D: "Apex Hydrocarbons Equipment Pvt Ltd"
       - Sticky Col: "Apex Hydrocarbons Equipment Pvt Ltd" • Parity 92%
       - Overall: Pill badge "Needs Scrutiny"
       - Risk: "74 / 100 • HIGH" (Highlighted risk driver)
       - Cells:
         - Rules Col 4 to 12: All show "✔ PASS" on surface statutory thresholds.
         - Forensic Signals Col: "👁 ANOMALIES FLAGGED" (Producer 'GIMP 2.10', 3 incremental updates on GST cert, hidden microscopic white-on-white text detected, shared director with Bidder C).

   - Bottom Interaction Strip:
     - Clicking any cell or bidder row highlights the cell and provides an Action Blue link: "Open Bidder Cockpit at Finding R-MII-01 →".
```

---

### Screen 04: Secure Ingestion & Forensic Document Dropzone (Screen S4)

#### Role & Feature Scope
Ingestion modal and view for uploading multi-bidder ZIP archives or individual statutory PDFs. Features pre-flight validation (SHA-256 CAS, magic byte verification, zip-bomb ratio protection, and path-traversal containment).

#### Google Stitch Master Prompt
```markdown
Create an immaculate Apple-inspired document ingestion web view titled "VigilBid — Secure Document Ingestion Portal" for CPCL materials procurement officers. Adhere strictly to the Apple Web Design System: SF Pro typography, Action Blue #0066cc interactive buttons, pure white and parchment backgrounds, 18px rounded cards, 1px subtle hairlines, zero decorative gradients, and realistic Indian procurement document metadata.

Layout & Component Hierarchy:
1. Global Navigation (44px, pure black #000000, white text):
   - CPCL logo, Navigation links, User profile capsule ("Ravi K. • Dy. Manager Materials").

2. Sub-Nav (52px, frosted parchment #f5f5f7 at 80% opacity, blur(20px), bottom hairline #e0e0e0):
   - Left: "Upload Bidder Filing Package / NIT CPCL/MM/2026/PUMP-217" in SF Pro Display 21px / 600.
   - Right: "Security Standard: GFR 2017 & CERT-In Compliant Ingestion".

3. Main Upload Canvas (Canvas Parchment #f5f5f7, padding 64px 80px):
   - Centered Header:
     - Title: "Ingest Bidder Dossier" (40px SF Pro Display 600, -0.35px tracking).
     - Subtitle: "Upload multi-document ZIP archives or individual statutory PDFs. All files undergo cryptographic SHA-256 CAS indexing, magic byte verification, and zip-bomb inspection before processing."
   
   - Bidder Profile Card (Pure White #ffffff, 18px rounded, 1px hairline #e0e0e0, 32px padding, max-width 900px, centered):
     - Input Field 1: "Declared Bidder Legal Name" (17px SF Pro Text in 9999px rounded input, value: "Sri Kaveri Engineering Works").
     - Input Field 2: "Bidder Contact Email & Phone" (e.g. "tenders@srikaveriengg.com • +91 98401 23456").
     - Input Field 3: "Tender Selection" (Pill capsule showing "NIT CPCL/MM/2026/PUMP-217 — Centrifugal Pumps").

   - The Master Drag-and-Drop Pedestal (Pure White #ffffff, 18px rounded, 2px dashed #0066cc border, padding 48px, text-center):
     - Center Graphic: Crisp minimalist document bundle icon (44px circular capsule in #d2d2d7 translucent gray).
     - Headline: "Drag and drop bidder ZIP archive or statutory PDFs here" (21px SF Pro Display 600).
     - Subtext: "Supports .zip archives containing up to 200 documents or standalone .pdf files up to 100 MB."
     - Action: Primary Action Blue pill button ("Browse Files on Computer", 11px 22px padding, #0066cc, white text, 9999px rounded).

   - Pre-Flight Security & Parsing Checkpoints (Three horizontal pill badges centered below dropzone):
     - Checkpoint 1: "✔ Magic Byte Verification (%PDF- & PK\x03\x04)"
     - Checkpoint 2: "✔ Zip-Bomb Compression Ratio Guard (Max 100:1)"
     - Checkpoint 3: "✔ Path Traversal & Shell Injection Defenses Active"

   - Ingested Documents Manifest Table (Appears once files are dropped/selected, Pure White #ffffff, 18px rounded, 1px hairline #e0e0e0, 24px padding):
     - Table Header: "File Name" • "File Size" • "SHA-256 CAS Digest" • "Detected File Type" • "Status"
     - Row 1: "01_GST_Registration_Certificate.pdf" • "1.42 MB" • "e3b0c44298fc1c149afbf4c8...996" • "Statutory PDF (Form GST REG-06)" • Status: "Validated (Ready)"
     - Row 2: "02_PAN_Card_SriKaveri.pdf" • "480 KB" • "8f434346648f6b96df89dda9...102" • "Statutory ID (NSDL PAN)" • Status: "Validated (Ready)"
     - Row 3: "03_Udyam_Registration_Certificate.pdf" • "890 KB" • "6a992d5529f459a44e72a2...450" • "MSME Certificate" • Status: "Validated (Ready)"
     - Row 4: "04_CA_Certified_Turnover_UDIN.pdf" • "2.10 MB" • "7d21b0e352c2635905d2c5...881" • "Financial Statement" • Status: "Validated (Ready)"
     - Row 5: "05_Make_In_India_Declaration.pdf" • "610 KB" • "4b227777d4dd1fc61c6f88...312" • "Local Content Annexure" • Status: "Validated (Ready)"

   - Submission Action Bar:
     - Centered Action Blue pill CTA: "Submit Bidder Package & Run 11-Step Forensic Pipeline →" (14px 28px padding, SF Pro Text 18px 300, #0066cc background, white text, 9999px rounded).
```

---

### Screen 05: Real-Time Forensic Pipeline Stepper (Screen S5 — Processing Status)

#### Role & Feature Scope
Live visual execution stepper for the 11-step forensic analysis pipeline. Provides step-by-step progress, duration benchmarking, real-time OCR confidence tracking, and allows procurement officers to re-tag any misclassified document.

#### Google Stitch Master Prompt
```markdown
Design an ultra-clean, museum-gallery web execution monitor titled "VigilBid — 11-Step Forensic Processing Pipeline" for CPCL Tender NIT CPCL/MM/2026/PUMP-217. Strictly adhere to the Apple Web Design System (SF Pro Display & Text, Action Blue #0066cc, alternating parchment #f5f5f7 and near-black #272729 surfaces, pure white utility cards, 1px hairlines #e0e0e0, zero decorative gradients, no card drop shadows).

Layout & Elements:
1. Global Navigation (44px, pure black #000000, white text):
   - CPCL • VigilBid logo, navigation links, and active health monitor.

2. Sub-Navigation (52px, frosted parchment #f5f5f7 at 80% opacity, backdrop-filter blur(20px), 1px bottom hairline #e0e0e0):
   - Left: "Job ID: job_srikav_9281 • Bidder: Sri Kaveri Engineering Works" (21px SF Pro Display 600).
   - Right: Live 2s polling indicator ("● Live Stream Connected") and "Cancel Pipeline" text link in #7a7a7a.

3. Master Pipeline Header (Pure White Canvas #ffffff, padding 48px 80px, 1px bottom hairline #e0e0e0):
   - Title: "11-Step Document AI & Forensic Verification" (40px SF Pro Display 600, -0.35px tracking).
   - Subtitle: "End-to-end execution combining deterministic rule evaluation, computer vision OCR, entity resolution, and government registry simulations."
   - Execution Summary Banner: "Overall Progress: Step 8 of 11 in progress (73%) • Total Elapsed Time: 34.2 seconds • 5 Documents Ingested".

4. The 11-Step Visual Stepper Rail (Canvas Parchment #f5f5f7, padding 48px 80px):
   - Horizontal & Vertical Progress Stepper (Pure White container #ffffff, 18px rounded, 1px hairline #e0e0e0, 32px padding):
     - Step 1: "1. Safe Ingestion & CAS Storage" • Status: "Completed (0.8s)" • Checkmark pill in Action Blue #0066cc • "SHA-256 CAS hash generated, magic bytes verified".
     - Step 2: "2. Document Classification" • Status: "Completed (1.4s)" • "5/5 statutory types resolved via anchor heuristics & TF-IDF".
     - Step 3: "3. Textification & Unlimited-OCR" • Status: "Completed (6.2s)" • "PyMuPDF text layer extracted; 1 scanned page processed via PaddleOCR (conf: 0.93)".
     - Step 4: "4. Structured Field Extraction" • Status: "Completed (2.1s)" • "GSTIN, PAN, UDIN, Turnover, and Directors extracted with bbox coordinates".
     - Step 5: "5. Field Normalization" • Status: "Completed (0.4s)" • "Company suffixes unified, dates ISO-formatted, INR currency parsed".
     - Step 6: "6. Entity Resolution & Parity" • Status: "Completed (1.1s)" • "Score: 0.82 (Declared vs Canonical) • Strong PAN-in-GSTIN parity confirmed".
     - Step 7: "7. Government Registry Verification" • Status: "Completed (1.8s)" • "GSTN, NSDL PAN, Udyam MSME, and CPPP Debarment lists checked via simulated provider".
     - Step 8 (Active Pulse State): "8. Statutory Compliance Rules" • Status: "RUNNING NOW (0.6s...)" • Spinner icon in Action Blue #0066cc • "Evaluating 34 rules under cpcl_goods_v1 YAML engine...".
     - Step 9 (Pending): "9. Forensic Anomaly Detection" • Status: "Queued" • "PDF metadata, incremental xrefs, microscopic text, prompt injection scan".
     - Step 10 (Pending): "10. Risk Composite Scoring" • Status: "Queued" • "Weighted risk calculation 0-100 and driver allocation".
     - Step 11 (Pending): "11. Evidence Packaging & Audit Hash" • Status: "Queued" • "Forward SHA-256 hash-chaining and CVC dossier readiness".

5. Document Filings & Inline Re-Tagging Grid (Below Stepper, Pure White #ffffff, 18px rounded, 1px hairline #e0e0e0, 24px padding):
   - Section Title: "Ingested Document Classification & OCR Confidence" (21px SF Pro Display 600).
   - Explanatory note: "If any document was automatically misclassified, select the correct statutory type from the dropdown to re-run from Step 4."
   - 4-Column Card Grid of Documents (Parchment fill #f5f5f7, 14px rounded, 16px padding):
     - Doc 1: "Form GST REG-06" • Conf: "99.4%" • OCR: "Text Layer (100%)" • Tag Dropdown: "[Form GST REG-06 ▼]"
     - Doc 2: "NSDL PAN Card" • Conf: "94.1%" • OCR: "PaddleOCR (91.2%)" • Tag Dropdown: "[Permanent Account Number (PAN) ▼]"
     - Doc 3: "Udyam Certificate" • Conf: "98.7%" • OCR: "Text Layer (100%)" • Tag Dropdown: "[Udyam MSME Certificate ▼]"
     - Doc 4: "CA Turnover Certificate" • Conf: "96.5%" • OCR: "Text Layer (100%)" • Tag Dropdown: "[Turnover & Net Worth with UDIN ▼]"

6. Bottom Action Bar:
   - Left: "Auto-refreshing every 2 seconds" with subtle animated pulse dot.
   - Right: Action Blue pill CTA (enabled once Step 11 finishes): "Open Bidder Cockpit →".
```

---

### Screen 06: Primary Bidder Cockpit (Screen S6 — "The One Screen That Wins")

#### Role & Feature Scope
The central, pivotal screen of VigilBid. Procurement officers spend 80% of their time here. Displays the Criteria Rail, Dual-Document Evidence Viewer with pixel-accurate bounding box overlays, Finding Cards with statutory clause citations, Human-in-the-Loop Decision Panel (Accept/Override/Clarify/Reject), and Forensic Risk Drawer.

#### Google Stitch Master Prompt
```markdown
Create the definitive, museum-gallery web interface for "VigilBid — Primary Bidder Evaluation Cockpit" (Screen S6) for Chennai Petroleum Corporation Limited (CPCL). This is the centerpiece of the platform. Adhere strictly to the Apple Web Design System from DESIGN-apple.md: SF Pro Display (negative letter-spacing on headlines), SF Pro Text (17px body / 1.47 line-height), Action Blue #0066cc for all interactive elements, alternating Pure White #ffffff and Parchment #f5f5f7 surfaces, 18px rounded utility cards, 9999px pill capsules, zero decorative gradients, and exactly ONE drop shadow (rgba(0,0,0,0.22) 3px 5px 30px) under the resting document page.

Display Resolution & 3-Column Layout (1440px wide viewport):
1. Top Global Navigation Bar (44px, pure black #000000, 12px SF Pro Text in white):
   - CPCL logo, navigation items, and active officer badge.

2. Sub-Navigation Cockpit Header (52px, frosted parchment #f5f5f7 at 80% opacity, blur(20px), bottom hairline #e0e0e0):
   - Left: Bidder name "Sri Kaveri Engineering Works" (SF Pro Display 21px / 600) • Declared name: "SRI KAVERI ENGG WORKS" (14px SF Pro Text #7a7a7a).
   - Center Indicators:
     - Entity Parity Pill: "Parity 82% (High Confidence)" in pill chip.
     - Status Pill: "Needs Review — Officer Confirmation Required" in pill chip.
     - Risk Score Gauge: "Risk: 28 / 100 • MEDIUM" (subtle neutral pill).
   - Right Actions:
     - Secondary pill button: "Download CVC Dossier PDF" (14px, #ffffff background, hairline border #e0e0e0, #1d1d1f text).
     - Primary Action Blue pill CTA: "Complete Review (1 Finding Remaining)" (Action Blue #0066cc, white text, 9999px rounded, 11px 22px padding).

3. Main 3-Column Cockpit Workspace (Parchment Canvas #f5f5f7, height 780px, padding 20px 32px, 3-column flex grid: 280px / 1fr / 380px):

   A. LEFT COLUMN: Criteria & Finding Rail (280px width, Pure White #ffffff, 18px rounded, 1px hairline #e0e0e0, padding 16px):
      - Top Filter Pill Row: "[All (12)]" "[FAIL (0)]" "[REVIEW (1)]" "[WARN (1)]" "[PASS (10)]" in compact 12px pills.
      - Categorized Criteria Stack:
        - Category: "1. Statutory & Identity"
          - Item 1 (Selected/Active, 2px solid #0066cc left indicator border):
            - Title: "R-GST-03: PAN ↔ GST Legal Name Parity"
            - Status: Pill chip "👁 REVIEW" (Neutral pill, blue text)
            - Subtext: "SRI KAVERI ENGG WORKS vs Sri Kaveri Engineering Works"
          - Item 2: "R-GST-01: GSTIN Structure & Checksum" • Status: "✔ PASS"
          - Item 3: "R-PAN-01: Permanent Account Number Format" • Status: "✔ PASS"
        - Category: "2. Financial PQC"
          - Item 4: "R-FIN-01: Annual Turnover ≥ ₹5.52 Cr" • Status: "✔ PASS (MSE Exempt)"
          - Item 5: "R-FIN-02: UDIN Verification on CA Cert" • Status: "✔ PASS"
        - Category: "3. Technical & Local Content"
          - Item 6: "R-MII-01: Make in India Class-I (≥ 50%)" • Status: "✔ PASS (62% Local)"
          - Item 7: "R-OEM-01: OEM Manufacturer Authorization" • Status: "✔ PASS"
        - Category: "4. Government Registries"
          - Item 8: "R-EMD-01: MSE EMD Exemption Claim" • Status: "✔ PASS (Micro Enterprise)"
          - Item 9: "R-DEB-01: CPPP & MoPNG Debarment List" • Status: "✔ PASS (Clean)"

   B. CENTER COLUMN: Dual-Document Evidence Viewer (Flex width, Pure White #ffffff, 18px rounded, 1px hairline #e0e0e0, padding 20px, flex flex-col):
      - Top Viewer Control Toolbar:
        - Left: Document Tabs: "[Tab 1: Form GST REG-06 (Page 1)]" (Active) and "[Tab 2: NSDL PAN Card (Page 1)]".
        - Center: Page Navigation "< Page 1 of 3 >" and Zoom Controls "[ - ] 100% [ + ]".
        - Right: Text link "Open Original PDF ↗" in #0066cc.
      - The Document Canvas (Parchment backdrop #f5f5f7, flex-1 flex items-center justify-center p-6 relative overflow-hidden):
        - The Document Page Itself (Crisp pure white A4 raster render, with the single Apple product drop-shadow: rgba(0, 0, 0, 0.22) 3px 5px 30px 0, sharp typography simulating real Government of India Form GST REG-06):
          - Government Emblem of India at top center.
          - "Government of India — Registration Certificate — Form GST REG-06".
          - Table row showing Registration Number: "33AAACF4921K1ZF".
          - Bounding Box Highlight 1 (Golden-orange translucent rectangle #f59e0b20 with 2px solid #f59e0b border):
            - Surrounds Box: "Legal Name: SRI KAVERI ENGG WORKS".
            - Floating callout pill above box: "Extracted Legal Name: 'SRI KAVERI ENGG WORKS'".
          - Bounding Box Highlight 2 (Blue translucent rectangle #0066cc20 with 2px solid #0066cc border):
            - Surrounds Characters 3 to 12 of GSTIN: "AAACF4921K".
            - Floating callout pill: "Embedded PAN: AAACF4921K (Matches PAN Card Exactly)".
      - Bottom Trace Strip:
        - "Showing primary evidentiary trace from storage/tenders/PUMP-217/bidders/srikaveri/gst_reg06.pdf (SHA-256 CAS verified)."

   C. RIGHT COLUMN: Finding Card & Officer Decision Panel (380px width, Pure White #ffffff, 18px rounded, 1px hairline #e0e0e0, padding 24px, flex flex-col justify-between overflow-y-auto):
      - Top Finding Header:
        - Badge: "Rule R-GST-03 • Classification: REVIEW" in neutral pill capsule.
        - Title: "Name Variation Detected Between GST and PAN Filings" (21px SF Pro Display 600, #1d1d1f).
      - Extracted vs Expected Comparison Box (Parchment fill #f5f5f7, 14px rounded, 16px padding):
        - Row 1: "Declared in Bid:" -> "Sri Kaveri Engineering Works"
        - Row 2: "Form GST REG-06:" -> "SRI KAVERI ENGG WORKS"
        - Row 3: "NSDL PAN Card:" -> "SRI KAVERI ENGINEERING WORKS"
        - Row 4: "Identifier Parity:" -> "PAN 'AAACF4921K' matches identically across all records"
      - Statutory Clause Reference:
        - Title: "CVC Circular 02/02/2021 & GFR 2017 Rule 144":
        - Quote text (14px SF Pro Text, #7a7a7a): "'Minor commercial abbreviations shall not constitute grounds for disqualification where statutory tax identifier integrity is independently verified.'"
        - Verification Source Badge: "Source: Verified against Simulated GSTN & NSDL Registry (latency 420ms)".
      - Officer Human-In-The-Loop Decision Panel (Border-t 1px #e0e0e0 pt-4):
        - Action Selector (Segmented pill buttons):
          - "[ ✔ Accept Name Variation ]" (Selected, Action Blue outline)
          - "[ ✎ Seek Clarification ]"
          - "[ ✖ Reject / Disqualify ]"
        - Justification Textarea (Mandatory for compliance audit):
          - Label: "Officer Audit Justification (Recorded in CVC Dossier):"
          - Value (pre-typed or editable): "Accepted minor abbreviation 'ENGG' for 'Engineering'. The 10-character PAN embedded in GSTIN matches the PAN card and Udyam certificate without discrepancy."
        - Confirm Button: Action Blue pill button ("Record Officer Decision & Sign Audit Hash", 11px 22px padding, #0066cc, white text, 9999px rounded).

4. Collapsible Bottom Drawer (Pinned to bottom of cockpit, frosted parchment #f5f5f7, 44px collapsed height showing "▲ Forensic Signals & Anomaly Inspector (0 Critical Anomalies • Clean PDF Forensics)"):
   - When expanded, shows the PDF metadata inspector, Producer tool 'PyMuPDF', zero incremental updates, clean font tables.
```

---

### Screen 07: Cross-Bidder Entity Link Graph (Screen S7 — Collusion Detection)

#### Role & Feature Scope
Interactive NetworkX-powered SVG canvas revealing hidden relationships, common directorships, identical physical addresses, shared phone numbers, and identical PDF creator metadata across competing bidders under CVC related-party heuristics.

#### Google Stitch Master Prompt
```markdown
Create an astonishing, museum-gallery web interface titled "VigilBid — Cross-Bidder Entity Link Graph & Collusion Detector" (Screen S7) for CPCL Tender NIT CPCL/MM/2026/PUMP-217. Built strictly following the Apple Web Design System: SF Pro typography, Action Blue #0066cc interactive elements, pure white cards with 18px rounded corners, parchment #f5f5f7 canvas, hairline borders #e0e0e0, zero decorative gradients, no card drop shadows.

Layout & Component Architecture:
1. Global Navigation (44px, pure black #000000, 12px SF Pro Text in white):
   - CPCL emblem, navigation links with "Link Graph" active, and officer badge.

2. Sub-Navigation Strip (52px, frosted parchment #f5f5f7 at 80% opacity, blur(20px), bottom hairline #e0e0e0):
   - Left: "Cross-Bidder Collusion & Related-Party Heuristics" (21px SF Pro Display 600).
   - Center: Link filter chips ("[All Links]", "[Shared Directors (1)]", "[Shared Phone/Email (1)]", "[PDF Author Metadata (1)]").
   - Right: Action Blue pill button ("Export CVC Collusion Report PDF", 9999px rounded, #0066cc).

3. Main Working Canvas (Parchment #f5f5f7, padding 32px 80px):
   - Alert Banner (Pure white card #ffffff, 18px rounded, 1px solid #e0e0e0 hairline, 20px padding, flex items-center justify-between):
     - Left: Icon + Text: "Potential Collusion Anomaly Detected: Bidder C (PetroFlow Systems Ltd) and Bidder D (Apex Hydrocarbons Equipment Pvt Ltd) share common beneficial ownership attributes."
     - Right: CVC Citation pill: "CVC Guidelines 2021 Para 4.3 (Related-Party Bidding)".

   - 2-Column Graph & Inspector Workspace (Height 700px, 2-column layout: Flex-1 Graph Canvas / 380px Inspector Sidebar):
     
     A. LEFT: Interactive Node-Link Canvas (Pure White #ffffff, 18px rounded, 1px hairline #e0e0e0, padding 20px, relative):
        - Canvas Background: Very subtle dot grid on pure white.
        - Graph Nodes (Rendered as circular capsules with clean typography):
          - Node 1 (Bidder Node): "Bidder A: Flowserve India" (Large circular pill, Action Blue #0066cc outline, standalone/clean).
          - Node 2 (Bidder Node): "Bidder B: Sri Kaveri Engg" (Large circular pill, Action Blue #0066cc outline, standalone/clean).
          - Node 3 (Bidder Node, High Risk): "Bidder C: PetroFlow Systems Ltd" (Large circular pill, 2px solid #1d1d1f border, #fafafc fill).
          - Node 4 (Bidder Node, High Risk): "Bidder D: Apex Hydrocarbons Equipment" (Large circular pill, 2px solid #1d1d1f border, #fafafc fill).
          - Shared Attribute Node 1: "Director: Rajesh V. Sharma (DIN: 08492011)" (Small pill capsule, connected by solid red links to both Bidder C and Bidder D).
          - Shared Attribute Node 2: "Phone: +91 98200 44123" (Small pill capsule, connected by dashed red links to both Bidder C and Bidder D).
          - Shared Attribute Node 3: "PDF Creator: GIMP 2.10.34 & Author 'rsharma'" (Small pill capsule, connecting Bidder C's MII document to Bidder D's GST filing).
        - Floating Canvas Controls (Bottom right):
          - Circular translucent buttons (44px, #d2d2d7 at 64% alpha): "[ + ] Zoom In", "[ - ] Zoom Out", "[ ⛶ Fit to View ]".

     B. RIGHT: Entity & Evidence Inspector Sidebar (380px width, Pure White #ffffff, 18px rounded, 1px hairline #e0e0e0, padding 24px, overflow-y-auto):
        - Header: "Selected Link Investigation" (SF Pro Display 21px / 600).
        - Target Pair: "PetroFlow Systems Ltd ↔ Apex Hydrocarbons Equipment Pvt Ltd".
        - Forensic Link Weight: "Collusion Weight: 85 / 100 • Critical Observation".
        - Identified Commonalities Stack:
          - Observation 1: "Common Directorship"
            - Detail: "MCA21 records reveal Rajesh V. Sharma holds 42% equity in PetroFlow Systems Ltd and 51% equity in Apex Hydrocarbons Equipment Pvt Ltd."
            - Evidence: "MCA Form DIR-12 dated 14/03/2023".
          - Observation 2: "Document Metadata & Technical Signature"
            - Detail: "Both bidders submitted Make in India declarations authored on the identical machine by user 'rsharma' with PDF Producer 'GIMP 2.10.34' within 18 minutes of each other."
            - Evidence: "PDF metadata cross-analysis".
          - Observation 3: "Identical Bank Branch & Contact Phone"
            - Detail: "Both bidders share primary contact number +91 98200 44123 on Gem registration."
        - Officer Action Section:
          - Status: "Observation Logged for Tender Committee".
          - Action Blue pill button: "Open Side-by-Side Document Comparison →" (11px 22px padding, #0066cc, white text, 9999px rounded).

4. Collusion Pairs Summary Table (Below Graph, Pure White #ffffff, 18px rounded, 1px hairline #e0e0e0, 24px padding):
   - Table: "Bidder Pair" • "Shared Attributes" • "Network Weight" • "CVC Classification" • "Action"
   - Row 1: "PetroFlow Systems Ltd & Apex Hydrocarbons Equipment" • "Director (DIN), Phone, PDF Author" • "85/100" • "Related Party (Rule 144)" • "Review Evidence".
   - Row 2: "Flowserve India & All Others" • "None" • "0/100" • "Independent Bidder" • "Cleared".
```

---

### Screen 08: Tamper-Evident Audit Trail & Cryptographic Dossier (Screen S8)

#### Role & Feature Scope
Cryptographic accountability ledger. Displays the forward SHA-256 hash-chained event timeline recording every officer decision, override justification, upload event, and verification. Includes live "Verify Chain Integrity" re-computation engine and one-click CVC / RTI-ready PDF compliance dossier generation.

#### Google Stitch Master Prompt
```markdown
Design an authoritative, museum-gallery web ledger titled "VigilBid — Tamper-Evident Cryptographic Audit Trail" (Screen S8) for CPCL and CVC regulatory auditors. Adhere strictly to the Apple Web Design System: SF Pro typography, Action Blue #0066cc interactive buttons, alternating Pure White #ffffff and Parchment #f5f5f7 surfaces, 18px rounded utility cards, 9999px pill capsules, hairline borders #e0e0e0, zero decorative gradients, no drop shadows.

Layout & Structural Hierarchy:
1. Global Navigation Bar (44px, pure black #000000, 12px SF Pro Text in pure white):
   - CPCL emblem, navigation links with "Audit Ledger" active, and officer badge.

2. Sub-Navigation Frosted Strip (52px, parchment #f5f5f7 at 80% opacity, blur(20px), bottom hairline #e0e0e0):
   - Left: "Audit Trail & Cryptographic Verification / NIT CPCL/MM/2026/PUMP-217" (21px SF Pro Display 600).
   - Right: Primary Action Blue pill button ("Export CVC Compliance Dossier PDF", 11px 22px padding, #0066cc, white text, 9999px rounded).

3. Cryptographic Continuity Verification Banner (Pure White #ffffff, 18px rounded, 1px solid #e0e0e0 hairline, padding 32px 80px, mb-6):
   - Left Block:
     - Headline: "Forward SHA-256 Hash Chain: 100% Cryptographically Valid" (28px SF Pro Display 600, -0.35px tracking).
     - Subtext: "All 37 recorded events form an unbroken sequential cryptographic chain anchored to Genesis Block 0000000000000000."
     - Genesis Hash: "0000000000000000000000000000000000000000000000000000000000000000"
     - Chain Head Hash: "9a82fbc410294e019284cb510395728a49c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6"
   - Right Block:
     - Live Verification Action Button: Action Blue pill button ("Recompute & Verify Hash Chain Integrity", 9999px rounded, #0066cc, white text).
     - Status Indicator: "Verified 37/37 blocks in 12ms • Zero broken pointers".

4. The Audit Event Timeline Table (Pure White #ffffff container, 18px rounded, 1px solid #e0e0e0 hairline, 24px padding):
   - Table Controls: Filter by Actor ("All", "Ravi K. (Officer)", "Automated Pipeline", "System Admin"), Filter by Action Type ("Decisions Only", "Uploads", "Overrides").
   - Table Columns: "Seq #" • "Timestamp (IST)" • "Actor & Role" • "Action Taken" • "Target Entity" • "Officer Justification / Details" • "SHA-256 Current Hash"

   - Row 1 (Seq 37, Latest):
     - Seq: "#037" • Timestamp: "05 Sep 2026, 02:44:12"
     - Actor: "Ravi K. (Dy. Manager, Materials)"
     - Action: "OFFICER_DECISION_ACCEPT" (Neutral pill chip, blue text)
     - Target: "Sri Kaveri Engineering Works (Finding R-GST-03)"
     - Justification: "Accepted minor abbreviation 'ENGG' for 'Engineering'. The 10-character PAN embedded in GSTIN matches the PAN card and Udyam certificate without discrepancy."
     - Hash: "9a82fbc4...d5e6" (monospaced capsule)

   - Row 2 (Seq 36):
     - Seq: "#036" • Timestamp: "05 Sep 2026, 02:41:05"
     - Actor: "Automated Forensic Engine"
     - Action: "ANOMALY_SIGNAL_RECORDED"
     - Target: "Apex Hydrocarbons Equipment Pvt Ltd"
     - Justification: "Detected PDF Producer 'GIMP 2.10.34' with 3 incremental xref updates on GST certificate."
     - Hash: "8f71eba1...c4b2"

   - Row 3 (Seq 35):
     - Seq: "#035" • Timestamp: "05 Sep 2026, 02:38:50"
     - Actor: "Government Registry Adapter"
     - Action: "REGISTRY_VERIFICATION_PASS"
     - Target: "Sri Kaveri Engineering Works (Udyam)"
     - Justification: "Udyam registration UDYAM-TN-02-0048192 verified with Ministry of MSME API (Micro Enterprise)."
     - Hash: "7e60dca0...b3a1"

   - Row 4 (Seq 34):
     - Seq: "#034" • Timestamp: "05 Sep 2026, 02:35:10"
     - Actor: "Ravi K. (Dy. Manager, Materials)"
     - Action: "BIDDER_PACKAGE_INGESTED"
     - Target: "4 Bidder Packages (NIT CPCL/MM/2026/PUMP-217)"
     - Justification: "Ingested multi-document archive with SHA-256 CAS verification."
     - Hash: "6d50cb9f...a290"

5. CVC Compliance Dossier Preview Drawer (Parchment #f5f5f7, 18px rounded, 1px hairline #e0e0e0, padding 28px):
   - Left: PDF Cover thumbnail resting with the signature Apple drop shadow (rgba(0,0,0,0.22) 3px 5px 30px 0):
     - "Chennai Petroleum Corporation Limited — Vigilance & Audit Dossier — NIT CPCL/MM/2026/PUMP-217".
   - Right: Description: "Formal CVC / RTI-ready procurement compliance package. Contains full decision history, criteria evaluations, side-by-side evidence bounding boxes, and the complete cryptographic chain head."
   - Action: Primary Action Blue pill button ("Download Certified Dossier (PDF, 4.2 MB) →", 9999px rounded, #0066cc).
```

---

### Screen 09: Procurement AI Copilot & Regulatory Assistant (Modal / Drawer)

#### Role & Feature Scope
Specialized regulatory conversational assistant querying GFR 2017, CVC Manual, PPP-MII Order 2017, and MSE Policy. Answers procurement questions with strict statutory citations, page references, and zero hallucinations.

#### Google Stitch Master Prompt
```markdown
Design an elegant, conversational museum-gallery drawer interface titled "VigilBid — Procurement AI Copilot & Statutory Assistant" for CPCL materials procurement officers. Follow the Apple Web Design System strictly: SF Pro Display & Text, Action Blue #0066cc accents, pure white #ffffff and parchment #f5f5f7 surfaces, hairline borders #e0e0e0, 9999px pill buttons and input capsules, zero decorative gradients, no drop shadows.

Layout & Component Architecture:
1. Copilot Drawer Container (Right-side slide-over drawer or floating modal, 520px width, Pure White #ffffff background, 1px left hairline border #e0e0e0, backdrop-blur overlay):
   - Header Bar (Frosted parchment #f5f5f7 at 80% opacity, 64px height, padding 16px 24px, 1px bottom hairline #e0e0e0):
     - Left: "Procurement Copilot" (SF Pro Display 21px / 600, #1d1d1f).
     - Subtitle: "Grounded in GFR 2017, CVC 2021 & CPCL Tender Rules".
     - Right: Close button (44px circular translucent button in #d2d2d7 at 64% alpha).

2. Knowledge Domains & Safety Guardrails Bar (Padding 12px 24px, 1px bottom hairline #e0e0e0, Parchment #f5f5f7):
   - 4 Domain Status Pills:
     - "[ ✔ GFR 2017 (80 Chunks) ]"
     - "[ ✔ PPP-MII Order 2017 ]"
     - "[ ✔ MSE Order 2012 ]"
     - "[ ✔ CPCL PQC Template ]"
   - Safety Badge: "Prompt Injection Defense: Active • LLM Overrides Prohibited".

3. Conversational Message Stream (Padding 24px, flex-1 overflow-y-auto space-y-6):
   - Message 1 (Officer User Bubble, right-aligned, 18px rounded with bottom-right corner 4px, Pure White #ffffff, 1px hairline #e0e0e0, padding 14px 20px, max-width 85%):
     - Text (17px SF Pro Text, #1d1d1f): "Is Sri Kaveri Engineering Works eligible for EMD exemption despite having a declared turnover below ₹5.52 Cr?"

   - Message 2 (Copilot Response Card, left-aligned, 18px rounded with bottom-left corner 4px, Parchment #f5f5f7, 1px hairline #e0e0e0, padding 20px, max-width 90%):
     - Top Badge: "Verified Legal Finding • Rule R-EMD-01" in Action Blue pill chip.
     - Core Answer (17px SF Pro Text, #1d1d1f, 1.47 line-height):
       - "Yes, Sri Kaveri Engineering Works is fully eligible for EMD exemption. Under the Public Procurement Policy for MSEs Order 2012 and CPCL PQC Clause 4.2, Micro and Small Enterprises holding a valid Udyam Registration are exempted from both EMD (Earnest Money Deposit) and prior turnover criteria for manufactured goods."
     - Exact Statutory Citation Box (Pure white card #ffffff inside response, 14px rounded, 1px hairline #e0e0e0, 16px padding):
       - Statutory Title: "Public Procurement Policy for MSEs Order 2012, Para 4":
       - Quoted Clause (14px SF Pro Text, #7a7a7a): "'Micro and Small Enterprises registered with Udyam shall be provided tender documents free of cost and shall be exempt from payment of Earnest Money Deposit.'"
       - Evidence Verification Link: "Udyam Certificate UDYAM-TN-02-0048192 verified with Ministry of MSME [Inspect Evidence →]" in Action Blue #0066cc.

   - Message 3 (Officer User Bubble, right-aligned):
     - Text: "Why did Bidder C fail the Make in India requirement?"

   - Message 4 (Copilot Response Card, left-aligned):
     - Top Badge: "Statutory Disqualification Recommendation • Rule R-MII-01".
     - Answer: "Bidder C (PetroFlow Systems Ltd) declared themselves as a Class-I Local Supplier. However, their submitted self-declaration specifies 45% local content. Under DPIIT PPP-MII Order 2017 (2020 revision), Class-I requires minimum 50% local content. As the tender strictly mandates Class-I local suppliers, the filing violates the statutory threshold."
     - Citation: "DPIIT Order No. P-45021/2/2017-PP (BE-II) para 2(b)".

4. Suggested Query Quick-Chips (Above input bar, horizontal scrollable pills):
   - Chip 1: "Explain GFR 144(xi) Land Border Rule"
   - Chip 2: "Check CVC Related-Party Guidelines"
   - Chip 3: "Show Turnover Calculation for MSEs"

5. Input Field Bar (Bottom pinned, 72px height, padding 16px 24px, 1px top hairline #e0e0e0, Pure White #ffffff):
   - Input Container: 9999px full-pill input box, #ffffff background, 1px solid #0066cc border, 12px 20px padding.
   - Text Placeholder: "Ask a statutory or PQC question regarding this tender..."
   - Right Action: Action Blue pill button ("Send", 9999px rounded, #0066cc, white text).
```

---

## 5. Workflow Guide: Using These Prompts with Google Stitch & Stitch MCP

### Step 1: Create Screens in Google Stitch
1. Open [Google Stitch](https://stitch.withgoogle.com/) (or your Stitch workspace).
2. Create a new project titled **VigilBid — CPCL Procurement DSS**.
3. For each of the **9 screens**, copy the corresponding **Google Stitch Master Prompt** from Section 4 above and paste it into the prompt box.
4. Review the generated visual interfaces. Notice how Stitch applies:
   - The authentic Apple museum-gallery spacing and SF Pro typography.
   - The single Action Blue (`#0066cc`) interactive accent.
   - The realistic CPCL tender, bidder names, statutory citations, and hash-chain data.

### Step 2: Connect Stitch MCP to Antigravity IDE (When Ready)
Once you have generated your desired screen designs in Google Stitch:
1. Grant permission to `StitchMCP` in Antigravity IDE.
2. Run `list_projects` to discover your project ID.
3. Call `list_screens` to inspect the generated UI components and screens.
4. Export or sync the design system directly into your React + Vite frontend (`frontend/src/`).
