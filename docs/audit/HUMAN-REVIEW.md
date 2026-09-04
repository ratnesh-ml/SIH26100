# Governed Human Review & Procurement Officer Decision Model

## Core Philosophy

$$\text{OFFICER DECIDES} \longleftrightarrow \text{MACHINE DOCUMENTS}$$

VigilBid is a **Human-in-the-Loop Decision Support Cockpit**. It does **NOT** autonomously make legally binding procurement decisions. The Procurement Officer and Tender Evaluation Committee (TEC) retain sovereign statutory authority.

---

## 1. Supported Decision Actions

The system supports four explicit decision actions:

1. `APPROVE`: The officer confirms technical and pre-qualification compliance.
2. `REJECT`: The officer disqualifies the bidder based on unresolvable criterion failure.
3. `REQUEST_CLARIFICATION`: The committee issues a formal request for clarification under GFR 2017 Rule 173(v).
4. `OVERRIDE`: When permitted by role, the officer overrides an automated machine recommendation with mandatory justification.

---

## 2. Mandatory Justification & Immutable Audit Chain

Whenever an officer overrides a machine recommendation:
- **Mandatory Justification**: The justification field cannot be blank or trivial.
- **Cryptographic Chaining**: The event is recorded in the `AuditLog` table using SHA-256 hash chaining ($H_i = \text{SHA-256}(H_{i-1} \parallel \text{EventData})$).
- **RTI / CVC Audit Readiness**: Every override can be exported with full digital provenance and timestamps.
