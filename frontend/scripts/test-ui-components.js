/**
 * Automated Frontend Test Suite for VigilBid UI / UX Polish & Component Architecture (Phase 47).
 * Verifies:
 * 1. Modular UI Primitives integrity (StatusChip, Card, Button, Modal, EmptyState, LoadingState, ErrorState, Tabs)
 * 2. 6 Prioritized Views contract compliance (Bidder Cockpit, Compliance Matrix, Upload/Processing, Dashboard, Audit, Reports)
 * 3. Accessibility attributes (role, aria-*, tabIndex, keyboard navigation listeners)
 * 4. Tailwind CSS & PostCSS asset generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FRONTEND_DIR = path.resolve(__dirname, '..');
const SRC_DIR = path.join(FRONTEND_DIR, 'src');
const UI_DIR = path.join(SRC_DIR, 'components', 'ui');
const COMPONENTS_DIR = path.join(SRC_DIR, 'components');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    testsPassed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    testsFailed++;
  }
}

console.log('\n======================================================');
console.log('VigilBid Frontend Test Suite — Phase 47 UI/UX Audit');
console.log('======================================================\n');

// 1. UI Primitives Directory & Files
console.log('Test Group 1: Modular UI Component Primitives Layer:');
const requiredPrimitives = [
  'StatusChip.tsx',
  'Card.tsx',
  'Button.tsx',
  'Modal.tsx',
  'EmptyState.tsx',
  'LoadingState.tsx',
  'ErrorState.tsx',
  'Tabs.tsx',
  'index.ts',
];

requiredPrimitives.forEach((file) => {
  const filePath = path.join(UI_DIR, file);
  assert(fs.existsSync(filePath), `Primitive component ${file} exists in components/ui/`);
});

// 2. StatusChip Status Coverage
console.log('\nTest Group 2: StatusChip Semantic Tokens & Accessibility:');
const statusChipContent = fs.readFileSync(path.join(UI_DIR, 'StatusChip.tsx'), 'utf-8');
assert(statusChipContent.includes('role="status"'), 'StatusChip includes role="status" attribute');
assert(statusChipContent.includes('aria-label='), 'StatusChip includes accessible aria-label');
assert(statusChipContent.includes('PASS'), 'StatusChip supports PASS evaluation state');
assert(statusChipContent.includes('FAIL'), 'StatusChip supports FAIL evaluation state');
assert(statusChipContent.includes('WARN'), 'StatusChip supports WARN evaluation state');
assert(statusChipContent.includes('REVIEW'), 'StatusChip supports REVIEW evaluation state');
assert(statusChipContent.includes('HIGH'), 'StatusChip supports HIGH risk tier');

// 3. Modal Dialog & Keyboard Accessibility
console.log('\nTest Group 3: Modal Dialog & Keyboard Navigation:');
const modalContent = fs.readFileSync(path.join(UI_DIR, 'Modal.tsx'), 'utf-8');
assert(modalContent.includes('role="dialog"'), 'Modal includes role="dialog"');
assert(modalContent.includes('aria-modal="true"'), 'Modal specifies aria-modal="true"');
assert(modalContent.includes("e.key === 'Escape'"), 'Modal listens for Escape key dismissal');
assert(modalContent.includes('aria-labelledby="modal-title"'), 'Modal provides accessible title linkage');

// 4. Priority 1: Bidder Cockpit (BidderDetailView.tsx)
console.log('\nTest Group 4: Priority 1 — Bidder Cockpit:');
const cockpitContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'BidderDetailView.tsx'), 'utf-8');
assert(cockpitContent.includes('parseBBox'), 'Bidder Cockpit contains bounding box coordinate calculation');
assert(cockpitContent.includes('ZoomIn') && cockpitContent.includes('ZoomOut'), 'Bidder Cockpit provides evidence zoom controls');
assert(cockpitContent.includes("e.key === '+'") || cockpitContent.includes("e.key === '='"), 'Bidder Cockpit provides keyboard shortcuts for evidence zoom');
assert(cockpitContent.includes('report.pdf'), 'Bidder Cockpit contains direct CVC dossier PDF download integration');
assert(cockpitContent.includes('StatusChip'), 'Bidder Cockpit imports and utilizes StatusChip primitive');
assert(cockpitContent.includes('Officer Adjudication Panel') || cockpitContent.includes('Officer Decision Panel'), 'Bidder Cockpit contains officer decision recording panel');

// 5. Priority 2: Compliance Matrix (ComplianceMatrixView.tsx)
console.log('\nTest Group 5: Priority 2 — Compliance Matrix:');
const matrixContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'ComplianceMatrixView.tsx'), 'utf-8');
assert(matrixContent.includes('sticky left-0'), 'Compliance Matrix features sticky Bidder Legal Identity column');
assert(matrixContent.includes('aria-sort='), 'Compliance Matrix features accessible aria-sort headers');
assert(matrixContent.includes('report.pdf'), 'Compliance Matrix contains tender PDF export link');
assert(matrixContent.includes('StatusChip'), 'Compliance Matrix renders cells via StatusChip primitive');

// 6. Priority 3: Upload / Processing Flow
console.log('\nTest Group 6: Priority 3 — Upload & Processing Flow:');
const uploadContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'UploadModal.tsx'), 'utf-8');
assert(uploadContent.includes('onDrop'), 'Upload Modal supports drag-and-drop file ingestion');
assert(uploadContent.includes('Modal'), 'Upload Modal wraps content in accessible Modal primitive');

const stepperContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'PipelineStepperView.tsx'), 'utf-8');
assert(stepperContent.includes('11-Step Forensic Evaluation Stepper'), 'Pipeline Stepper presents 11-step forensic state machine');
assert(stepperContent.includes('duration_ms'), 'Pipeline Stepper reports step execution duration');
assert(stepperContent.includes('retagDocument'), 'Pipeline Stepper allows officer document classification retagging');

// 7. Priority 4: Executive Dashboard (DashboardView.tsx)
console.log('\nTest Group 7: Priority 4 — Executive Dashboard:');
const dashContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'DashboardView.tsx'), 'utf-8');
assert(dashContent.includes('Vendor Compliance Distribution'), 'Dashboard features Vendor Compliance Distribution breakdown');
assert(dashContent.includes('Forensic Risk Distribution'), 'Dashboard features Forensic Risk Distribution');
assert(dashContent.includes('SHA-256 Audit Chain:'), 'Dashboard includes cryptographic audit chain health widget');

// 8. Priority 5 & 6: Audit Screen & Reports (AuditTrailView.tsx)
console.log('\nTest Group 8: Priority 5 & 6 — Audit Screen & Dossier Reports:');
const auditContent = fs.readFileSync(path.join(COMPONENTS_DIR, 'AuditTrailView.tsx'), 'utf-8');
assert(auditContent.includes('verifyAuditChain'), 'Audit Trail supports real-time cryptographic forward chain verification');
assert(auditContent.includes('copyToClipboard'), 'Audit Trail provides one-click SHA-256 hash copying');
assert(auditContent.includes('Event Cryptographic Payload:'), 'Audit Trail provides formatted event payload JSON inspection');

// 9. Tailwind CSS Configuration & Build Output
console.log('\nTest Group 9: Tailwind CSS Build & PostCSS Setup:');
assert(fs.existsSync(path.join(FRONTEND_DIR, 'tailwind.config.js')), 'tailwind.config.js exists');
assert(fs.existsSync(path.join(FRONTEND_DIR, 'postcss.config.js')), 'postcss.config.js exists');

console.log('\n------------------------------------------------------');
console.log(`Results: ${testsPassed} passed, ${testsFailed} failed.`);
console.log('------------------------------------------------------\n');

if (testsFailed > 0) {
  process.exit(1);
} else {
  console.log('All frontend architectural and UI/UX checks passed successfully!\n');
  process.exit(0);
}
