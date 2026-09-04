# ADR-006: Human-in-the-Loop Adjudication & Mandated Override Justification

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Core Architecture Team, SIH26100  

---

## 1. Context
Under Indian public procurement law, the authority to qualify, reject, or award contracts to bidders rests exclusively with designated public servants (Tender Inviting Authority, Tender Evaluation Committee members, and Competent Financial Authorities). Automated software cannot possess legal authority to disqualify commercial vendors.

Furthermore, procurement officers may possess valid contextual reasons to accept an apparent anomaly (e.g. an official government gazette notification exempting a specific state PSU from EMD, or a documented legal name change merger awaiting registrar certificate update).

## 2. Decision
We establish three immutable principles in the application workflow:
1. **Decision Support, Never Autonomous Disqualification:** VigilBid strictly emits advisory findings (`PASS`, `WARN`, `REVIEW`, `FAIL`) and summary recommendations: `"Recommended: Not Qualified — officer confirmation required"`. The platform NEVER marks a bidder as formally rejected or disqualified autonomously.
2. **Three Officer Actions:** For every finding, the evaluating officer must choose:
   - `Accept`: Agree with the system-generated status.
   - `Override`: Change the status (e.g. from `FAIL` to `PASS`).
   - `Seek Clarification`: Flag the item to generate an official GeM representation notice to the bidder.
3. **Mandated Written Justification for Overrides:** The UI strictly disables the "Save Override" button unless the officer enters a non-empty text justification (`override_reason`). This justification is cryptographically chained into the SHA-256 audit ledger.

## 3. Reason
- **Statutory Compliance:** Aligns with Central Vigilance Commission guidelines and GFR 2017 Chapter 6 rules.
- **Accountability Defense:** If an officer overrides a system alert to favor a vendor, that decision cannot be hidden or erased; it is permanently stamped with their user ID, timestamp, and justification.
- **Officer Empowerment:** Rather than resisting AI automation, officers embrace the tool because it preserves their final authority and provides verifiable documentation.

## 4. Alternatives Considered
- **Fully Autonomous Bidder Disqualification:**
  - *Rejected:* Legally invalid under Indian procurement jurisprudence; would expose PSUs to immediate writ petitions in High Court.
- **Optional Override Justifications:**
  - *Rejected:* Creates vigilance loopholes where officers could override critical integrity warnings without leaving a paper trail.

## 5. Consequences
- **Positive:** Full statutory validity; robust auditability; high institutional trust from procurement leadership.
- **Negative:** Requires officer interaction on flagged criteria before a tender evaluation can be finalized.
