# Change Safety & Enhancement Rules — VigilBid (SIH26100)

> **Audience:** All engineers and contributors modifying the VigilBid codebase.  
> **Mandate:** Preserve project integrity, statutory compliance, and baseline test stability during enhancement cycles.

---

## 1. Ten Cardinal Enhancement Rules

1. **Existing working functionality must remain working:**
   - Any proposed modification must pass the existing 353 backend tests, 70 frontend tests, and the 20-point release certification audit before merging.

2. **No unnecessary rewrites:**
   - Never replace functioning, battle-tested components (e.g. PyMuPDF text parser, deterministic rule engine, SHA-256 audit ledger) simply to match personal stylistic preferences.

3. **New functionality must be modular:**
   - All enhancements must be encapsulated in dedicated modules or discrete pipeline steps without injecting tight coupling into existing core services.

4. **Existing API contracts should remain backward compatible unless absolutely necessary:**
   - If an endpoint request/response schema must be extended, add optional fields or introduce a versioned endpoint (`/api/v2/`) rather than breaking existing client callers.

5. **Database migrations must be reversible where practical:**
   - Every Alembic migration adding tables or columns must provide a valid, tested `downgrade()` implementation that restores schema state cleanly.

6. **Every new feature requires tests:**
   - New capabilities must include corresponding unit and integration tests covering the happy path, edge cases, and failure modes.

7. **Every new feature requires documentation:**
   - Update `docs/`, OpenAPI schemas, and user guides whenever interfaces, workflows, or CLI commands change.

8. **Never fabricate data, benchmarks, or government integrations:**
   - Document simulated adapters honestly with transparent mock tags. Never claim live production GSTN/MCA-21 integration or unverified performance figures.

9. **Synthetic demo data must be clearly identified:**
   - All sample vendor entities, certificates, and tax identifiers must carry unambiguous synthetic demo markings (`CPCL/MM/2026/PUMP-217`, `seed/demo_packages/`).

10. **Human officer remains final decision-maker:**
    - The platform must never autonomously disqualify a bidder or bypass human oversight. All overrides must strictly mandate written officer justification.

---

## 2. Verification Gates Before Commit

Before committing any enhancement code, run the following three gates:

```bash
# Gate 1: Backend Automated Pytest Suite
pytest tests/ -v

# Gate 2: Frontend Vitest & UI Integrity Checks
cd frontend && npm test && cd ..

# Gate 3: Comprehensive 20-Subsystem Release Audit
python scripts/release_audit.py
```
