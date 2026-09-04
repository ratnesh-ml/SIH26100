# VigilBid (SIH26100) — Authentication & Role-Based Access Control (RBAC)

**Specification Version:** 1.0.0  
**Target:** SIH Grand Finale — Problem Statement SIH26100  
**Compliance Standards:** GFR 2017, CVC Guidelines, IT Act 2000 (Section 65B Electronic Records)

---

## 1. Security Philosophy & Principles

In public procurement evaluation for CPCL, integrity and strict accountability are paramount:
1. **Never Store Plaintext Passwords:** Passwords are never stored in plaintext. They are hashed using PBKDF2-HMAC-SHA256 with 100,000 iterations and a cryptographically secure 16-byte random salt.
2. **Never Log Passwords or Raw Tokens:** Neither incoming password fields nor full JWT access tokens are ever logged in stdout, system logs, or error stack traces.
3. **Stateless JWT Authentication:** Authentication relies on signed JSON Web Tokens (HS256) with standard claims (`sub`, `role`, `exp`, `iat`). Refresh tokens are avoided to prevent token hoarding in high-security procurement environments.
4. **Strict Role Separation (Four-Eyes Principle):** Procurement Officers who prepare evaluations cannot unilaterally approve them; Evaluators/Approvers review findings and concur/dissent; Vigilance Auditors possess independent, read-only audit verification powers; Administrators manage infrastructure and seed baselines.

---

## 2. Core User Roles & Responsibilities

VigilBid defines four distinct roles aligned with public procurement governance:

| Role Name | System Key | Aliases | Operational Scope |
|---|---|---|---|
| **Procurement Officer** | `officer` | `procurement_officer` | Uploads tender criteria, ingests bidder packages, triggers evaluation jobs, overrides individual criteria findings with written justification, re-tags documents. |
| **Evaluator** | `evaluator` | `approver` | Technical Evaluation Committee (TEC) member. Reviews findings, inspects evidence, records official concurrence or dissent on officer decisions. |
| **Vigilance** | `vigilance` | `auditor` | Independent External Monitor (IEM) / Chief Vigilance Officer (CVO) / CAG auditor. Full read-only visibility, inspects cryptographic audit logs, verifies SHA-256 hash chains, exports RTI dossiers. |
| **Administrator** | `admin` | `administrator` | System operations, initial template provisioning, seed user management, environment configuration. |

---

## 3. JWT Specification & Claims

Tokens are signed using HMAC-SHA256 (`HS256`) with the server's `SECRET_KEY`.

### Token Payload Structure
```json
{
  "sub": "11111111-1111-4111-8111-111111111111",
  "role": "officer",
  "exp": 1725444800,
  "iat": 1725416000
}
```

| Claim | Type | Description |
|---|---|---|
| `sub` | `UUID string` | The unique `users.id` identifier of the authenticated user. |
| `role` | `string` | The active role (`officer`, `evaluator`, `vigilance`, `admin`). |
| `exp` | `integer` | UNIX timestamp for token expiration (default: 8 hours / 480 minutes). |
| `iat` | `integer` | UNIX timestamp when the token was issued. |

---

## 4. API Endpoints

### 4.1 Login: `POST /api/v1/auth/login`
Authenticates user credentials and issues a signed JWT access token.

**Request:**
```http
POST /api/v1/auth/login HTTP/1.1
Content-Type: application/json

{
  "email": "officer@cpcl.gov.in",
  "password": "Officer@CPCL2026!"
}
```

**Successful Response (`200 OK`):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "role": "officer",
  "user": {
    "id": "11111111-1111-4111-8111-111111111111",
    "email": "officer@cpcl.gov.in",
    "full_name": "A. Ramanathan, Senior Manager (Contracts & Materials)",
    "role": "officer",
    "created_at": "2026-09-03T17:30:00Z"
  }
}
```

**Failed Response (`401 Unauthorized`):**
```json
{
  "detail": "Invalid email or password"
}
```

---

### 4.2 Current User: `GET /api/v1/auth/me`
Retrieves the profile of the currently authenticated user.

**Request:**
```http
GET /api/v1/auth/me HTTP/1.1
Authorization: Bearer <access_token>
```

**Successful Response (`200 OK`):**
```json
{
  "id": "11111111-1111-4111-8111-111111111111",
  "email": "officer@cpcl.gov.in",
  "full_name": "A. Ramanathan, Senior Manager (Contracts & Materials)",
  "role": "officer",
  "created_at": "2026-09-03T17:30:00Z"
}
```

---

### 4.3 Logout: `POST /api/v1/auth/logout`
Stateless logout confirming that the client must discard the token from memory/localStorage.

**Request:**
```http
POST /api/v1/auth/logout HTTP/1.1
Authorization: Bearer <access_token>
```

**Successful Response (`200 OK`):**
```json
{
  "status": "ok",
  "message": "Logged out successfully. Please discard the access token from client storage."
}
```

---

## 5. RBAC Endpoint Protection Matrix

| Route | Method | Allowed Roles | Description |
|---|---|---|---|
| `/auth/login` | `POST` | Public | Authenticate and obtain JWT. |
| `/auth/me` | `GET` | All authenticated | Read current user profile. |
| `/auth/logout` | `POST` | All authenticated | Acknowledge session termination. |
| `/tenders` | `GET` | All authenticated | List active procurement tenders. |
| `/tenders` | `POST` | `officer`, `admin` | Create tender from CPCL template. |
| `/tenders/{id}` | `GET` | All authenticated | Get tender detail and criteria. |
| `/tenders/{id}/matrix` | `GET` | All authenticated | View compliance heat-map matrix. |
| `/tenders/{id}/bidders` | `POST` | `officer`, `admin` | Upload bidder package & trigger pipeline. |
| `/bidders/{id}` | `GET` | All authenticated | Get bidder details & status. |
| `/bidders/{id}/documents/{d}/retag` | `POST` | `officer` | Correct document classification. |
| `/bidders/{id}/complete-review` | `POST` | `officer` | Finalize evaluation once all findings decided. |
| `/findings/{id}/decision` | `POST` | `officer`, `evaluator` | Record Accept/Override/Clarify/Concur. |
| `/audit/verify` | `GET` | `vigilance`, `officer`, `admin` | Cryptographic SHA-256 hash-chain verification. |
| `/tenders/{id}/audit` | `GET` | `vigilance`, `officer`, `evaluator`, `admin` | View tamper-evident audit events. |
| `/bidders/{id}/report.pdf` | `GET` | All authenticated | Export RTI/CVC compliance dossier. |

---

## 6. Pre-Configured Development Accounts

| Role | Email | Password | Full Name |
|---|---|---|---|
| **Procurement Officer** | `officer@cpcl.gov.in` | `Officer@CPCL2026!` | A. Ramanathan, Sr. Manager (Contracts & Materials) |
| **Evaluator** | `evaluator@cpcl.gov.in` | `Evaluator@CPCL2026!` | Dr. K. Swaminathan, CGM (Refinery Projects) |
| **Vigilance** | `vigilance@cvc.gov.in` | `Vigilance@CVC2026!` | R. Venkatram, Independent External Monitor |
| **Administrator** | `admin@vigilbid.local` | `Admin@VigilBid2026!` | VigilBid System Administrator |

To re-seed development users:
```bash
python seed/seed_users.py
```

---

## 7. Testing & Verification

The test suite validates:
- Valid login across all 4 roles.
- Rejection of invalid passwords and non-existent users (HTTP 401).
- Rejection of missing, malformed, or expired tokens (HTTP 401).
- Authorization success for permitted roles.
- Enforcement of HTTP 403 Forbidden when a role lacks permissions.
- Stateless logout behavior.

Run the test suite:
```bash
pytest tests/test_auth.py -v
```
