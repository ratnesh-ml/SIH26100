# ADR-003: Mock Government Registry Adapters with Standardized Schemas

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Core Architecture Team, SIH26100  

---

## 1. Context
Statutory bid evaluation requires cross-verifying bidder credentials against official Government of India registries: GSTN (tax status), Income Tax/CBDT (PAN validity), MCA-21 (company incorporation and active status), Ministry of MSME (Udyam registration), and Central Public Procurement Portal (CPPP / CVC Debarment and Blacklist records). 

However, live production government API credentials require formal departmental memorandums of understanding (MoUs), IP whitelisting, HSM certificates, and production sandbox access that cannot be obtained or exposed during an open-source competition hackathon.

## 2. Decision
We implement a **Registry Adapter Architecture** (`pipeline/registry/`):
- Formal abstract interface `BaseRegistryAdapter` defining methods: `verify_gstin()`, `verify_pan()`, `verify_mca()`, `verify_udyam()`, and `check_debarment()`.
- Implementation `MockRegistryAdapter` backed by standardized JSON fixtures in `seed/mock_fixtures/`.
- All response schemas strictly mirror production Indian Government API response payloads (e.g. GSTN Common Portal schema with status `Active`, `Cancelled`, `Suspended`, and constitutional entity types).
- Production-ready `LiveGovRegistryAdapter` stub ready for API key and client certificate injection upon PSU deployment.

## 3. Reason
- **100% Deterministic Demo Reliability:** Live government APIs experience frequent downtime, rate-limiting, and CAPTCHA interventions that would break live evaluations.
- **Air-Gap Capability:** Allows the entire platform to operate inside secure, network-isolated refinery perimeters.
- **Transparent Honesty:** The system never fabricates live API calls; documentation, UI badges, and logs explicitly state: *"Verified against simulated registry fixture (Adapter Pattern)"*.

## 4. Alternatives Considered
- **Direct Web Scraping of Government Portals:**
  - *Rejected:* Highly brittle, frequently breaks due to CAPTCHA defenses, and strictly prohibited under government website terms of service and CVC guidelines.
- **Skipping Registry Verification Entirely:**
  - *Rejected:* Fails the core requirement of SIH26100, which demands cross-portal verification.

## 5. Consequences
- **Positive:** Guaranteed zero demo downtime; realistic testing of edge cases (debarred bidders, cancelled GSTINs, mismatching names); seamless transition path to live APIs by changing an environment variable (`REGISTRY_MODE=live`).
- **Negative:** Evaluators must be reminded that demonstrated registry results originate from synthetic test fixtures.
