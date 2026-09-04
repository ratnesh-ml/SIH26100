# Phase 47: Comprehensive UI/UX Polish, Modular Design System & Ergonomics

Polish the VigilBid frontend user interface without altering backend API contracts or business logic. Establish a modular UI component abstraction layer (`components/ui/`) so the presentation layer can be easily restyled or replaced in the future without disturbing domain logic or data models.

## User Review Required

> [!IMPORTANT]
> - **Zero Business Logic Mutations:** All API schemas, endpoints, compliance rules, GFR 2017/CVC 2021 terminology, and backend models remain 100% strictly intact.
> - **Tailwind & PostCSS Setup:** Missing `tailwind.config.js` and `postcss.config.js` will be added to ensure Tailwind utilities compile into real CSS instead of falling back to default browser styles.
> - **Design System Architecture:** Adding modular UI primitives in `frontend/src/components/ui/` (`StatusChip`, `Card`, `Button`, `Modal`, `EmptyState`, `LoadingState`, `ErrorState`, `Tabs`) to isolate styling from business views.

## Open Questions
None. The priority order, visual requirements (spacing, hierarchy, accessibility, keyboard navigation, evidence readability, responsive layouts), and restrictions (no unnecessary animations, no API rewrites) are clear.

---

## Proposed Changes

### 1. Build & Styling Foundation (`frontend/`)

#### [NEW] [tailwind.config.js](file:///c:/Users/ritik/Downloads/SIH26100/frontend/tailwind.config.js)
- Configure Tailwind CSS content scanning paths: `"./index.html"`, `"./src/**/*.{js,ts,jsx,tsx}"`.
- Extend dark-mode theme color palette with tailored slate, sky, emerald, amber, rose, and purple tokens.
- Add accessible ring offsets, elevation shadows, and custom font stacks.

#### [NEW] [postcss.config.js](file:///c:/Users/ritik/Downloads/SIH26100/frontend/postcss.config.js)
- Wire `tailwindcss` and `autoprefixer` plugins for Vite build pipeline.

#### [MODIFY] [index.css](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/index.css)
- Refine base CSS with modern dark palette, accessible `focus-visible` styling, smooth custom scrollbars, and high-contrast text rendering.

---

### 2. Modular Design System Primitives (`frontend/src/components/ui/`)

#### [NEW] [StatusChip.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/ui/StatusChip.tsx)
- Reusable, accessible status badge for all evaluation states (`PASS`, `FAIL`, `WARN`, `REVIEW`, `PENDING`, `QUALIFIED`, `NOT_QUALIFIED`) and risk tiers (`LOW`, `MEDIUM`, `HIGH`).
- Supports semantic iconography (`CheckCircle2`, `XCircle`, `AlertTriangle`, `AlertCircle`, `Clock`, `ShieldCheck`, `ShieldAlert`), size variants (`xs`, `sm`, `md`), and explicit ARIA labels.

#### [NEW] [Card.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/ui/Card.tsx)
- Structural card primitives: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`.
- Standardizes container hierarchy, subtle borders, backdrop blur, and spacing.

#### [NEW] [Button.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/ui/Button.tsx)
- Unified button component with variants (`primary`, `secondary`, `destructive`, `ghost`, `outline`, `link`), sizes, loading spinner support, and accessible focus states.

#### [NEW] [Modal.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/ui/Modal.tsx)
- Reusable accessible modal dialog with backdrop blur, `Escape` key close handler, `role="dialog"`, `aria-modal="true"`, and focus trapping.

#### [NEW] [EmptyState.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/ui/EmptyState.tsx)
- Clean empty state placeholder with contextual icon, descriptive text, and optional action CTA.

#### [NEW] [LoadingState.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/ui/LoadingState.tsx)
- Accessible loading skeleton and progress indicators with `aria-live="polite"` and screen-reader announcements.

#### [NEW] [ErrorState.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/ui/ErrorState.tsx)
- Standardized error banner with retry trigger, alert role (`role="alert"`), and dismiss capability.

#### [NEW] [Tabs.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/ui/Tabs.tsx)
- Keyboard-accessible tab navigation (`role="tablist"`, `role="tab"`, ArrowLeft/ArrowRight navigation, Enter/Space activation).

---

### 3. Screen Polish by Priority

#### [MODIFY] [BidderDetailView.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/BidderDetailView.tsx) *(Priority 1: Bidder Cockpit)*
- **Spacing & Hierarchy:** Refine header bar with canonical vs declared names, confidence chip, and tax ID tags.
- **Criteria Rail (Left):** Categorized groups with badge counts, keyboard-navigable filter tabs, confidence progress bars, and clear active selection outline.
- **Evidence Canvas (Center):** High-readability canvas, smooth zoom controls (+/- / 100%), page stepper, accessible original PDF link, high-contrast bounding box highlight with field label tag, and quote callout block.
- **Decision Panel (Right):** Structured segmented action buttons (Accept, Clarify, Override, Reject), explicit justification requirements when overriding, submit button with loader, and chronological audit history with copyable SHA-256 hash chips.
- **Bottom Drawer:** Collapsible risk driver points and structural document anomaly drawer with clean count indicators.

#### [MODIFY] [ComplianceMatrixView.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/ComplianceMatrixView.tsx) *(Priority 2: Compliance Matrix)*
- **KPI Summary Cards:** 6 status chips showing Total, Pass, Warn, Review, Fail, Pending counts with matching color accents.
- **Toolbar:** Status chips filter, Risk filter, search input with instant filtering.
- **Matrix Table:** Sticky bidder column, sortable headers (`aria-sort`), cell tooltips for quick inspection of finding explanations, and clean responsive layout.
- **Export & Empty States:** Integrated CVC Dossier export button and accessible empty state.

#### [MODIFY] [UploadModal.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/UploadModal.tsx) *(Priority 3: Upload Flow)*
- Drag-and-drop zone with visual feedback when active, file size formatting, remove file action, accessible keyboard navigation (`ESC` to close), and CAS deduplication security badge.

#### [MODIFY] [PipelineStepperView.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/PipelineStepperView.tsx) *(Priority 3: Processing Flow)*
- 11-step forensic state machine with step durations (`meta.duration_ms`), status chips, retry action, and document classification tags.

#### [MODIFY] [TenderCreateModal.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/TenderCreateModal.tsx) *(Priority 3: Tender Creation)*
- Clean accessible modal dialog, form validation feedback, and keyboard navigation.

#### [MODIFY] [DashboardView.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/DashboardView.tsx) *(Priority 4: Executive Dashboard)*
- 5 KPI metric cards with hover feedback, Vendor Compliance Distribution bar with GFR 2017 compliant labels, Forensic Risk Distribution, and Cryptographic Chain Verification Health widget.

#### [MODIFY] [AuditTrailView.tsx](file:///c:/Users/ritik/Downloads/SIH26100/frontend/src/components/AuditTrailView.tsx) *(Priority 5: Audit Screen & Reports)*
- Cryptographic verification banner with instant "Verify Chain" action, search and filter toolbar, copyable SHA-256 hashes with checkmark feedback, and expandable JSON payload inspector.

---

### 4. Verification & Testing (`frontend/package.json`, test scripts)

#### [MODIFY] [package.json](file:///c:/Users/ritik/Downloads/SIH26100/frontend/package.json)
- Add `"test": "tsc --noEmit && node scripts/test-ui-components.js"` or test script for frontend verification.

#### [NEW] [scripts/test-ui-components.js](file:///c:/Users/ritik/Downloads/SIH26100/frontend/scripts/test-ui-components.js)
- Automated verification script checking that all UI primitives, views, exports, and build outputs compile with zero errors and satisfy design tokens.

---

### 5. Documentation & GitHub Push

#### [MODIFY] [BUILD-STATUS.md](file:///c:/Users/ritik/Downloads/SIH26100/docs/BUILD-STATUS.md)
- Update with Phase 47 Complete milestone summary, architectural documentation of UI primitives, accessibility audit results, and verification metrics.

#### [EXECUTE] Commit & Git Push
- Commit all updated code and documentation.
- Push to GitHub remote `origin/main` to make progress accessible to all team members.

---

## Verification Plan

### Automated Tests
1. **Frontend TypeCheck & Build Verification:**
   ```powershell
   npm run build --prefix frontend
   ```
2. **Frontend UI Primitives Verification:**
   ```powershell
   npm test --prefix frontend
   ```
3. **Backend Full Test Suite Verification (Regression check):**
   ```powershell
   python -m pytest tests/test_tenders.py tests/test_dashboard_audit_api.py -q
   ```

### Manual Verification
1. Inspect Bidder Cockpit (Bidder B PAN mismatch, Bidder D prompt injection): verify zoom controls, bounding box highlight, decision action recording, and audit history.
2. Inspect Compliance Matrix: verify KPI counts, sorting, filters, sticky column, and CVC Dossier export button.
3. Inspect Upload Modal: drag and drop interaction, validation, and keyboard ESC dismiss.
4. Inspect Pipeline Stepper: 11-step progress indicators and document retagging dropdown.
5. Inspect Executive Dashboard: compliance distribution progress bar and cryptographic chain status widget.
6. Inspect Audit Trail: SHA-256 hash copy-to-clipboard, filter by action/role, and payload JSON expansion.
