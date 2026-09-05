# VigilBid (SIH26100) — Comprehensive Security Audit & Hardening Report

**Date:** September 2026  
**Audit Scope:** Full Application Stack (FastAPI Backend, PostgreSQL Engine, PDF Pipeline, Copilot RAG, Client REST APIs)  
**Security Posture Baseline:** Hardened & Tested (381 automated tests passing, 0 security failures)  
**Auditor / Engineering Role:** VigilBid Security & Defensive Architecture Team  

---

## 1. Executive Summary & Threat Profile

VigilBid operates in public sector procurement under **GFR 2017**, **CVC Vigilance Guidelines**, and **Right to Information (RTI) Act** mandates. It processes statutory filings containing sensitive business data (PAN, GSTIN, CA turnover certificates, UDINs) and provides decision support for multi-crore public tenders.

The primary threat actors and attack surfaces considered in this security audit:
1. **Malicious Bidders:** Attempting to submit tampered documents, ZIP bombs, directory traversal payloads, or prompt-injection text designed to trick automated scoring or LLM evaluators.
2. **Unauthorized Parties / Network Snooping:** Attempting brute-force credential attacks, credential stuffing, CORS session hijacking, or eavesdropping on unencrypted identifiers.
3. **Internal Malfeasance / Collusion:** Attempting to manipulate past evaluation logs or inject unauthorized decisions without audit trails.

---

## 2. Comprehensive Security Vector Evaluation (17 Core Vectors)

| # | Security Vector | Audit Scope & Mechanism | Risk Level | Status | Remediations Implemented |
|---|---|---|---|---|---|
| **1** | **Authentication** | PBKDF2-HMAC-SHA256 (100,000 rounds) with per-user 16-byte random salt. Constant-time password verification via `hmac.compare_digest`. | HIGH | ✅ SECURE | Added sliding-window rate limiter (10 attempts/min) and password length boundary (max 128 chars) to stop PBKDF2 compute DoS. |
| **2** | **RBAC (Role-Based Access)** | Granular `require_role(...)` dependency with hierarchical synonym mapping (`OFFICER`, `EVALUATOR`, `APPROVER`, `VIGILANCE`, `AUDITOR`, `ADMIN`). | HIGH | ✅ SECURE | Verified role isolation across all 35+ API endpoints. Non-privileged roles blocked from decision overrides and document retagging. |
| **3** | **JWT Handling** | PyJWT with explicit `HS256` signature enforcement, timestamp checks (`exp`, `iat`), and `TokenPayload` validation. | HIGH | ✅ SECURE | Pinned algorithm parameter, sanitized decode error responses to prevent internal stack leakages, and added production secret key guard. |
| **4** | **File Upload Safety** | PDF magic byte checking (`%PDF-`), 25 MB single PDF ceiling, 100 MB ZIP package ceiling, SHA-256 CAS deduplication. | HIGH | ✅ SECURE | Files failing magic bytes or exceeding quotas are rejected with HTTP 422/413 before disk allocation. |
| **5** | **ZIP Traversal Defense** | Pre-extraction inspection via `is_path_traversal()` rejecting `..`, absolute paths, leading slashes, and Windows drive colons (`C:`). | CRITICAL | ✅ SECURE | In-archive inspection blocks archive extraction completely if any malicious entry is detected. Zero files extracted upon traversal trigger. |
| **6** | **Storage Path Traversal** | Content-Addressable Storage (`{sha256}.pdf`) and filesystem containment validation. | CRITICAL | ✅ SECURE | Implemented `is_safe_storage_path()` enforcing canonical `.resolve().is_relative_to(STORAGE_DIR)` check on document file and thumbnail streaming. |
| **7** | **Malicious File Handling** | PyMuPDF text-layer extraction without JavaScript execution; regex-based page counting (`count_pdf_pages_safely`). | HIGH | ✅ SECURE | Safe PDF parser mode disables embedded executable actions and embedded script execution. |
| **8** | **SQL Injection** | 100% SQLAlchemy 2.0 type-safe construct utilization (`select()`, `where()`, bound parameters). | CRITICAL | ✅ SECURE | Verified 0 instances of dynamic raw SQL string interpolation (`f"SELECT..."`). Completely immune to traditional SQL injection. |
| **9** | **XSS & Response Splitting** | JSON responses by default; React DOM automatic output escaping; HTTP header sanitization. | MEDIUM | ✅ SECURE | Added filename regex sanitization (`re.sub(r'[\r\n"\\;]', '_', ...)`) in `Content-Disposition` headers and deployed defensive security headers. |
| **10** | **API Validation** | Pydantic v2 schemas validating data types, UUID formats, string constraints, and numeric ranges. | MEDIUM | ✅ SECURE | Bounded string lengths on `LoginRequest` (email 254 chars, password 128 chars) and document pagination bounds (`ge=1`, `le=100`). |
| **11** | **Secret Leakage Defense** | Configuration loaded via `.env` with explicit `.gitignore` exclusions. | HIGH | ✅ SECURE | Implemented `validate_production_secrets()` raising fatal exceptions if default development secrets are used in production environments. |
| **12** | **Logging & Privacy** | Centralized Python logging avoiding plain passwords, unhashed tokens, or sensitive payloads. | MEDIUM | ✅ SECURE | Verified that passwords, JWT tokens, and decrypted keys are never written to logger statements or console output. |
| **13** | **Sensitive Data Exposure** | Fernet symmetric cipher encrypting sensitive tax identifiers (`encrypted_pan`, `encrypted_gstin`) at rest in PostgreSQL. | HIGH | ✅ SECURE | Identifiers masked in public schemas (`mask_pan`, `mask_gstin`); `UserOut` strictly excludes `password_hash`. |
| **14** | **Document Access Control** | Authentication (`get_current_user`) and RBAC checks required on document download, raw file streaming, and page PNG renders. | HIGH | ✅ SECURE | All document routes require verified Bearer JWT tokens. Unauthorized and unauthenticated requests rejected with HTTP 401/403. |
| **15** | **Prompt Injection Detection & Isolation** | Dual-layer heuristic scanner: `PromptInjectionGuard` for Copilot RAG queries and `AnomalyDetector` (`A-INJ-01`) for ingested documents. Untrusted text isolated in `<DOCUMENT_DATA>`. | HIGH | ✅ SECURE | Scans heuristic adversarial patterns ("ignore previous instructions", "override all rules", "DAN mode") and quarantines unverified text. |
| **16** | **CORS Configuration** | Restricted CORS middleware specifying trusted frontend origins and credential isolation. | HIGH | ✅ SECURE | Replaced wildcard `allow_origins=["*"]` + `allow_credentials=True` with explicit origins whitelist (`localhost:5173`, `3000`, etc.) and regex. |
| **17** | **Rate Limiting** | In-memory thread-safe sliding-window rate limiter protecting sensitive API routes. | HIGH | ✅ SECURE | Enforces 10 requests/minute on `/api/v1/auth/login` to prevent credential stuffing and brute-force attacks. Returns HTTP 429 with `Retry-After`. |

---

## 3. High-Priority Remediations Executed

### 3.1 Rate Limiting & DoS Defense (`backend/core/rate_limit.py` & `backend/schemas/auth.py`)
- **Vulnerability:** Unthrottled login endpoint allowed automated brute-force attacks against user credentials. An attacker could also submit an oversized (e.g. 10MB) password payload causing CPU exhaustion during PBKDF2 hashing (100,000 iterations).
- **Remediation:** 
  1. Implemented `SlidingWindowRateLimiter` thread-safe in-memory rate limiter enforcing a strict 10 requests/minute threshold on `/api/v1/auth/login`.
  2. Added Pydantic constraints on `LoginRequest`: `email` (max 254 characters) and `password` (max 128 characters, min 1 character), terminating malicious DoS payloads at the serialization layer before invoking hashing algorithms.

### 3.2 CORS Hardening & Isolation (`backend/main.py` & `backend/core/config.py`)
- **Vulnerability:** Starlette/FastAPI CORS middleware previously specified `allow_origins=["*"]` with `allow_credentials=True`. Standard W3C Fetch specs and modern browsers disallow wildcards with credentials, creating credential leakage risks or blocking valid frontend requests.
- **Remediation:** 
  1. Added `BACKEND_CORS_ORIGINS` setting specifying explicit trusted frontend origins (`http://localhost:5173`, `http://127.0.0.1:5173`, `http://localhost:3000`, `http://localhost:8000`, `http://localhost:8080`).
  2. Applied origin regex matching `^https?://(localhost|127\.0\.0\.1)(:\d+)?$` for local development, blocking untrusted third-party origins.

### 3.3 OWASP Security Response Headers (`backend/main.py`)
- **Vulnerability:** API responses lacked standard security headers, exposing users to MIME type sniffing, clickjacking, and cross-site scripting risks.
- **Remediation:** Deployed an ASGI middleware attaching the following defensive headers to all HTTP responses:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy: default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';`

### 3.4 Document Path Containment Check (`backend/api/router.py` & `backend/services/document_service.py`)
- **Vulnerability:** Document serving routes (`/download`, `/file`, `/pages/{n}.png`) fetched `doc.storage_path` directly from the database and passed it to `FileResponse` / `fitz.open()`. If a database path was manipulated to point to system files (e.g. `/etc/passwd` or `C:\Windows\System32`), arbitrary file read was possible.
- **Remediation:** Enforced canonical path resolution via `is_safe_storage_path()` verifying that `doc_path.resolve().is_relative_to(settings.STORAGE_DIR)`. Access outside the designated root raises `HTTP 403 Forbidden` and logs a security alert.

### 3.5 Content-Disposition Header Injection Defense (`backend/api/router.py`)
- **Vulnerability:** Embedding `doc.original_filename` directly in `Content-Disposition: attachment; filename="{filename}"` allowed HTTP response splitting or cookie injection if a filename contained CRLF (`\r\n`) or escaped quotation marks.
- **Remediation:** Filenames are sanitized with `re.sub(r'[\r\n"\\;]', '_', doc.original_filename or f"{doc_id}.pdf")` prior to header construction.

### 3.6 Production Secret Key Enforcement (`backend/core/config.py`)
- **Vulnerability:** Hardcoded default fallback secrets (`dev-secret-key-...`) could be mistakenly retained in production deployments.
- **Remediation:** Added `settings.validate_production_secrets()` that executes on startup, raising fatal runtime exceptions if default keys are detected in `production` environments.

---

## 4. Automated Security Test Suite Verification

A dedicated attack simulation test suite was created in [`tests/test_security_audit.py`](tests/test_security_audit.py).

### Test Suite Execution Output
```
tests/test_security_audit.py::test_login_rate_limiting_blocks_after_threshold PASSED [  7%]
tests/test_security_audit.py::test_oversized_password_rejected_with_422 PASSED [ 15%]
tests/test_security_audit.py::test_invalid_email_format_or_empty PASSED  [ 23%]
tests/test_security_audit.py::test_security_response_headers_present PASSED [ 30%]
tests/test_security_audit.py::test_cors_allowed_origin_handling PASSED   [ 38%]
tests/test_security_audit.py::test_document_download_blocks_path_traversal_escape PASSED [ 46%]
tests/test_security_audit.py::test_content_disposition_sanitizes_crlf_and_quotes PASSED [ 53%]
tests/test_security_audit.py::test_zip_path_traversal_detection PASSED   [ 61%]
tests/test_security_audit.py::test_ingester_rejects_zip_traversal PASSED [ 69%]
tests/test_security_audit.py::test_zip_bomb_ratio_defense PASSED         [ 76%]
tests/test_security_audit.py::test_prompt_injection_guard_detects_and_sanitizes PASSED [ 84%]
tests/test_security_audit.py::test_fernet_encryption_and_decryption PASSED [ 92%]
tests/test_security_audit.py::test_user_out_schema_does_not_expose_password_hash PASSED [100%]

============================= 13 passed in 5.27s ==============================
============================ 381 passed in 30.50s =============================
```

All 13 security test cases passed cleanly with zero regressions across the entire 381-test platform suite.

---

## 5. Security & Operational Hardening Checklist for Production

Prior to live CPCL deployment:
- [x] Configure production environment variable `ENVIRONMENT=production`.
- [x] Generate 64-character cryptographic `SECRET_KEY` (`openssl rand -hex 32`).
- [x] Generate 32-byte URL-safe base64 `FERNET_KEY` via `cryptography.fernet.Fernet.generate_key()`.
- [x] Ensure PostgreSQL enforces SSL connections (`sslmode=require`).
- [x] Verify Docker container runs as non-root user (`USER appuser`).
- [x] Ensure reverse proxy (NGINX / Caddy) enforces HTTPS with TLS 1.3.
- [x] Back up PostgreSQL append-only cryptographic audit trail (`audit_log`) daily.

---

## 6. Audit Conclusion

The VigilBid implementation meets and exceeds public procurement security standards under GFR 2017 and CVC directives. High-priority vulnerabilities identified during this review (CORS misconfiguration, unthrottled login endpoints, PBKDF2 compute DoS, path containment validation, and header injection vectors) have been **fully resolved and verified with automated test coverage**.
