# ADR-001: Modular Monolith over Microservices Architecture

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Core Architecture Team, SIH26100  

---

## 1. Context
Public sector tender evaluation for CPCL involves sequential document processing, relational data models (tenders, bidders, documents, criteria, findings, audits), and high data consistency requirements. The platform must be easily deployable in air-gapped environments, on-premises PSU workstations, single Docker containers, and live hackathon demonstration environments without complex orchestration overhead.

## 2. Decision
We adopt a **Modular Monolith** architecture:
- Single FastAPI ASGI backend application (`backend/`) encapsulating 24 REST endpoints, authentication, and database models.
- Discrete, decoupled pipeline processing modules (`pipeline/`) executed either sequentially in-process or via an asynchronous database-backed polling worker (`worker.py`).
- Shared relational database (SQLite for local dev/demo, PostgreSQL 16 for production).
- Standalone Vite + React 18 TypeScript Single Page Application (`frontend/`).

## 3. Reason
- **Deployment Simplicity:** A modular monolith can be packaged into a single Docker Compose stack with zero service-mesh or distributed transaction complexity.
- **Relational Integrity:** Foreign keys, cascade operations, and atomic transactions ensure that findings, evidence records, and audit events never fall out of sync.
- **Developer Velocity:** Allows rapid cross-module refactoring and end-to-end integration testing without network mocking or distributed tracing overhead.
- **Resource Footprint:** Operates smoothly on a standard laptop with under 2 GB of RAM during evaluations and air-gapped pitches.

## 4. Alternatives Considered
- **Distributed Microservices (DocService, OCRService, RuleService, RiskService, AuditService):**
  - *Rejected:* Introduces massive deployment friction, network latency, distributed consensus challenges, and network failure points during live evaluations.
- **Serverless / Lambda Functions:**
  - *Rejected:* Incompatible with PSU air-gapped security mandates and stateful local content-addressable storage requirements.

## 5. Consequences
- **Positive:** Zero distributed failure modes; sub-second transactional consistency; effortless Docker deployment (`docker compose up`).
- **Negative:** Horizontal scaling of individual compute-heavy pipeline steps requires process-level worker clustering rather than independent service autoscaling.
