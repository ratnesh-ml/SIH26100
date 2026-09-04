# VigilBid (SIH26100) — Codebase & Documentation Refactoring Map

This document records all directory movements, documentation consolidations, and file reorganizations performed during the codebase humanization and cleanup phase.

---

## 1. Documentation Relocation & Hierarchy Mapping

| Old File Location | New File Location | Rationale & Architectural Purpose |
|---|---|---|
| `docs/OCR.md` | `docs/ai/OCR.md` | Grouped under dedicated AI and document intelligence domain. |
| `docs/EXTRACTION.md` | `docs/ai/EXTRACTION.md` | Grouped under AI domain alongside OCR and normalization. |
| `docs/NORMALIZATION.md` | `docs/ai/NORMALIZATION.md` | Grouped under AI domain for format standardization specs. |
| `docs/REGISTRY.md` | `docs/ai/REGISTRY.md` | Grouped under AI & verification domain for adapter specs. |
| `docs/RULE-ENGINE.md` | `docs/compliance/RULE-ENGINE.md` | Grouped under dedicated statutory compliance domain. |
| `docs/RISK-ENGINE.md` | `docs/risk/RISK-ENGINE.md` | Grouped under dedicated risk assessment domain. |
| `docs/ANOMALIES.md` | `docs/risk/ANOMALIES.md` | Grouped under risk domain for PDF forensic anomaly analysis. |
| `docs/GRAPH.md` | `docs/risk/GRAPH.md` | Grouped under risk domain for collusion network analysis. |
| `docs/EVIDENCE.md` | `docs/evidence/EVIDENCE.md` | Grouped under dedicated evidentiary traceability domain. |
| `docs/PDF-CONTRACT.md` | `docs/evidence/PDF-CONTRACT.md` | Grouped under evidence domain for CVC dossier generation. |
| `docs/SECURITY.md` | `docs/security/SECURITY.md` | Grouped under security domain alongside security audit. |
| `docs/SECURITY-AUDIT.md` | `docs/security/SECURITY-AUDIT.md` | Grouped under dedicated security domain. |
| `docs/AUTH.md` | `docs/security/AUTH.md` | Grouped under security domain for JWT and RBAC specs. |
| `docs/FINAL-API.md` | `docs/api/FINAL-API.md` | Grouped under dedicated API domain as authoritative contract. |
| `docs/FINAL-DATABASE.md` | `docs/database/FINAL-DATABASE.md` | Grouped under dedicated database domain for schema specs. |
| `docs/FINAL-SETUP.md` | `docs/deployment/FINAL-SETUP.md` | Grouped under deployment domain for setup instructions. |
| `docs/DEVELOPER-GUIDE.md` | `docs/development/DEVELOPER-GUIDE.md` | Grouped under developer onboarding domain. |
| `docs/INTERFACE-CONTRACTS.md` | `docs/development/INTERFACE-CONTRACTS.md` | Grouped under developer domain as internal service contracts. |
| `docs/RELEASE-CHECKLIST.md` | `docs/testing/RELEASE-CHECKLIST.md` | Grouped under testing and release certification domain. |
| `docs/EVALUATION.md` | `docs/testing/EVALUATION.md` | Grouped under testing domain for benchmarks and accuracy stats. |
| `docs/PERFORMANCE.md` | `docs/testing/PERFORMANCE.md` | Grouped under testing domain for latency and throughput audits. |
| `docs/DEMO-SCRIPT.md` | `docs/demo/DEMO-SCRIPT.md` | Grouped under live demo domain as 12-beat presentation runbook. |
| `docs/FINAL-DEMO.md` | `docs/demo/FINAL-DEMO.md` | Grouped under live demo domain as judge Q&A and claims defense. |
| `docs/FINAL-ARCHITECTURE.md` | `docs/architecture/FINAL-ARCHITECTURE.md` | Grouped under architecture domain alongside repository map. |

---

## 2. Archived Historical Documents

| Old File Location | Archived Location (`docs/archive/`) | Status & Superseding Reference |
|---|---|---|
| `docs/00-research-audit.md` | `docs/archive/00-research-audit.md` | Initial hackathon research; preserved for provenance. |
| `docs/01-understanding-requirements-architecture.md` | `docs/archive/01-understanding-...md` | Early architectural decomposition; superseded by `docs/architecture/FINAL-ARCHITECTURE.md`. |
| `docs/02-ai-docai-rag-er-compliance-risk.md` | `docs/archive/02-ai-docai-...md` | Early AI research notes; superseded by `docs/ai/` and `docs/compliance/`. |
| `docs/03-frontend-backend-db-api.md` | `docs/archive/03-frontend-...md` | Early API notes; superseded by `docs/api/FINAL-API.md`. |
| `docs/04-dataset-mockapi-security-devops-mvpcut-team.md` | `docs/archive/04-dataset-...md` | Early mock API design; superseded by `docs/ai/REGISTRY.md`. |
| `docs/05-dependencies-timeline-checklists-skills-git.md` | `docs/archive/05-dependencies-...md` | Historical project timeline checklists. |
| `docs/06-demo-judges-claims-stack-spec-strategy.md` | `docs/archive/06-demo-...md` | Historical demo pitch strategy; superseded by `docs/demo/DEMO-NARRATIVE.md`. |
| `docs/ARCHITECTURE-LOCK.md` | `docs/archive/ARCHITECTURE-LOCK.md` | Phase 1 baseline contract; superseded by Phase 50 handoff. |
| `docs/REPOSITORY-STRUCTURE.md` | `docs/archive/REPOSITORY-STRUCTURE.md` | Superseded by `docs/architecture/REPOSITORY-MAP.md`. |
| `docs/API.md` | `docs/archive/API.md` | Superseded by `docs/api/FINAL-API.md`. |
| `docs/DATABASE.md` | `docs/archive/DATABASE.md` | Superseded by `docs/database/FINAL-DATABASE.md`. |
| `docs/DEPLOYMENT.md` | `docs/archive/DEPLOYMENT.md` | Superseded by `docs/deployment/FINAL-SETUP.md`. |
| `docs/PHASE-47-PLAN.md` | `docs/archive/PHASE-47-PLAN.md` | Phase 47 execution log. |
| `docs/PHASE-47-WALKTHROUGH.md` | `docs/archive/PHASE-47-WALKTHROUGH.md` | Phase 47 completion summary. |
| `docs/E2E-DEMO-RESULTS.md` | `docs/archive/E2E-DEMO-RESULTS.md` | Superseded by `docs/testing/RELEASE-CHECKLIST.md`. |

---

## 3. Root Directory Cleanup

| File / Folder | New Location / Action | Rationale |
|---|---|---|
| `index.html` (root) | `docs/archive/blueprint-viewer/index.html` | Offline marked.js viewer; removed from root to prevent confusion with Vite frontend. |
| `css/` (root) | `docs/archive/blueprint-viewer/css/` | Blueprint viewer styles relocated to archive. |
| `js/` (root) | `docs/archive/blueprint-viewer/js/` | Blueprint viewer scripts relocated to archive. |
| `SIH26100.zip` (root) | Removed (`rm`) | Untracked 2.1 MB binary archive pruned from workspace. |
| `docs/FEATURE-TRACEABILITY.md` | Deduplicated | Consolidated into single authoritative file at `docs/architecture/FEATURE-TRACEABILITY.md`. |

---

## 4. Newly Created Assets

| New Asset Path | Primary Purpose |
|---|---|
| `docs/architecture/DATA-FLOW.md` | Step-by-step pipeline input/output reference with Mermaid topology diagram. |
| `docs/development/WHERE-TO-CHANGE.md` | Developer lookup table mapping common modifications to exact source files. |
| `docs/REPOSITORY-ORGANIZATION-AUDIT.md` | Full repository audit evaluating redundancy, technical jargon, and organization. |
| `docs/REFACTOR-MAP.md` | This file; documents all structural movements and rationale. |
