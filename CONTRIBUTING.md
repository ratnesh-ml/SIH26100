# Contributing to VigilBid (SIH26100)

Thank you for your interest in contributing to **VigilBid**, an AI-powered integrated bid compliance verification platform designed for GeM public procurement and Chennai Petroleum Corporation Limited (CPCL).

We welcome contributions from developers, researchers, and vigilance professionals. Please take a moment to review this guide to ensure a smooth collaboration process.

---

## 1. Code of Conduct & Statutory Neutrality

All contributors are expected to uphold a professional, respectful, and legally sound development environment:
- **Strict Legal Vocabulary:** Never use accusatory terminology such as *"fraud"*, *"fake"*, *"forged"*, or *"disqualified"* in UI text, code comments, commit messages, or documentation. Always use statutory decision-support language: `"Potential anomaly detected — human verification required"` and `"Recommended: Not Qualified — officer confirmation required"`.
- **Statutory Alignment:** All compliance rules must cite official regulatory clauses from GFR 2017 or CVC Procurement Manuals.
- **Deterministic Separation:** Do not replace deterministic comparison logic (tax math, check-digit calculations, threshold comparisons) with probabilistic LLM prompts.

---

## 2. Getting Started & Development Setup

1. **Fork and Clone:**
   ```bash
   git clone https://github.com/ratnesh-ml/SIH26100.git
   cd SIH26100
   ```
2. **Environment Configuration:**
   ```bash
   cp .env.example .env
   ```
3. **Backend Setup:**
   ```bash
   python -m pip install -r requirements.txt
   alembic upgrade head
   python scripts/demo_setup.py
   ```
4. **Frontend Setup:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

For detailed architectural and debugging guides, refer to [docs/development/DEVELOPER-GUIDE.md](docs/development/DEVELOPER-GUIDE.md).

---

## 3. Branching & Commit Conventions

### Branch Naming
Create feature branches from `main` using descriptive prefixes:
- `feat/add-udyam-validation-rule`
- `fix/pan-gstin-check-digit-logic`
- `docs/update-adr-registries`
- `perf/optimize-ocr-tier1-pipeline`
- `test/add-risk-engine-edge-cases`

### Commit Message Format
We follow the Conventional Commits specification:
```
<type>(<scope>): <short imperative description>

[optional body explaining context and rationale]

[optional footer referencing issue/requirement ID]
```

Examples:
- `feat(rules): add CPCL-DOC-012 integrity pact signatory check`
- `fix(pipeline): handle zero-byte scanned PDFs in OCR tier-2 fallback`
- `docs(api): update OpenAPI schemas for audit verification endpoint`

---

## 4. Code Style & Quality Standards

- **Python (Backend & Pipeline):**
  - Follow PEP 8 style guidelines.
  - Run type checking and formatting:
    ```bash
    flake8 backend pipeline tests
    black --check backend pipeline
    ```
- **TypeScript / React (Frontend):**
  - Follow standard ESLint / React 18 hooks rules.
  - Maintain type safety (avoid `any` where possible).
  - Run linter and typecheck:
    ```bash
    cd frontend && npm run build && cd ..
    ```

---

## 5. Testing Requirements

Every pull request must pass all automated test tiers before merging:

```bash
# 1. Backend unit and integration tests
pytest tests/ -v

# 2. Frontend Vitest and UI integrity tests
cd frontend && npm test && cd ..

# 3. Full 20-subsystem release certification audit
python scripts/release_audit.py
```

- **Unit Tests:** Add unit tests for every new extraction pattern, rule evaluator, or API endpoint in `tests/unit/`.
- **No Regressions:** PRs that cause existing tests to fail will not be merged.

---

## 6. Pull Request Process

1. Ensure your branch is up-to-date with `main` (`git pull origin main`).
2. Run the full test suite (`pytest tests/ -v` and `python scripts/release_audit.py`).
3. Push your branch to your fork and submit a Pull Request against `main`.
4. In the PR description, explain:
   - What problem this PR addresses.
   - Which SIH26100 requirement or ADR it relates to.
   - Any breaking changes or database migration requirements.
5. A maintainer will review your PR and provide feedback.

---

## 7. Reporting Bugs & Proposing Features

- **Bug Reports:** Open an issue on GitHub detailing the steps to reproduce, expected vs actual behavior, and relevant logs. Ensure no private credentials or live bidder documents are attached.
- **Feature Proposals:** For architectural changes (e.g. introducing new extraction models or storage backends), open a discussion or draft an Architecture Decision Record (ADR) under `docs/decisions/`.
