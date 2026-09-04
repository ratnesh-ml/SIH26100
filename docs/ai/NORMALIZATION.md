# VigilBid (SIH26100) — Field Normalization & Statutory Validation Specification

**Document Version:** 1.0.0  
**Date:** September 2026  
**Status:** Locked & Operational  
**Module:** `pipeline/entity_resolution/`

---

## 1. Overview & Design Philosophy

The Field Normalization and Statutory Validation subsystem standardizes, sanitizes, and verifies statutory fields extracted from tender bids.

Public procurement compliance requires exact mathematical parity (such as embedded PAN matching in GSTIN) and semantic disambiguation. Crucially, the system enforces **Anti-Collision Safeguards** so that unrelated companies with common prefixes (e.g. *Apex Solutions Private Limited* vs *Apex Technologies Private Limited*, or *Tata Steel Limited* vs *Tata Motors Limited*) are never merged.

---

## 2. Statutory Validators ([pipeline/entity_resolution/validators.py](file:///c:/Users/ritik/Downloads/SIH26100/pipeline/entity_resolution/validators.py))

All validators return a standardized `ValidationResult`:

```python
@dataclass
class ValidationResult:
    is_valid: bool
    error_message: Optional[str] = None
    normalized_value: Optional[Any] = None
```

### 2.1 PAN Format Validator (`validate_pan`)
- **Pattern:** `^[A-Z]{5}[0-9]{4}[A-Z]$` (exactly 10 characters).
- **Structure:**
  - Characters 1–3: Alphabetic series.
  - Character 4: Taxpayer entity type (`C`=Company, `P`=Individual, `H`=HUF, `F`=Firm/LLP, `T`=Trust, etc.).
  - Character 5: First letter of surname/company name.
  - Characters 6–9: Sequential 4 digits.
  - Character 10: Alphabetic check digit.

### 2.2 GSTIN Format & Checksum Validator (`validate_gstin`)
- **Pattern:** `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$` (exactly 15 characters).
- **State Code Check:** Characters 1–2 must match valid Indian State/UT code (01–38, 97, or 99).
- **Embedded PAN Check:** Characters 3–12 must be structurally valid PAN format.
- **Mod-36 Checksum (`validate_gstin_checksum`):** Base-36 Luhn-like weighted check digit computation for character 15.

### 2.3 Udyam Registration Validator (`validate_udyam`)
- **Pattern:** `^UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7}$`.
- Verifies state code alphabets, district numeric digits, and 7-digit serial number.

### 2.4 Date Validator (`validate_date`)
- Parses Indian and standard date patterns (`DD/MM/YYYY`, `DD-MM-YYYY`, `YYYY-MM-DD`, `DD Month YYYY`).
- Verifies Gregorian calendar validity (rejects impossible dates like `31/02/2024` or zero dates `00/00/0000`).
- Validates plausibility range (years 1900–2100).
- Normalizes output to ISO 8601: `YYYY-MM-DD`.

### 2.5 Financial Value Validator (`validate_financial_value`)
- Parses Indian monetary expressions:
  - `"Rs. 8.42 Crores"` $\to$ `84200000.0`
  - `"₹ 45.5 Lakhs"` $\to$ `4550000.0`
  - `"1,25,00,000"` $\to$ `12500000.0`
- Supports `min_value` and `max_value` boundary enforcement.
- Returns normalized `float` in INR.

### 2.6 Company Name Validator (`validate_company_name`)
- Validates minimum length ($\ge 2$ characters).
- Enforces at least 2 alphabetic characters (rejecting purely numeric or symbol-only names).

### 2.7 Address Validator (`validate_address`)
- Validates physical address length ($\ge 8$ characters).
- Enforces presence of 6-digit Indian PIN code (`^[1-9][0-9]{5}$`) or standard postal markers (Plot, Street, Road, Estate, Nagar, Sector).

---

## 3. Normalization Pipeline ([pipeline/entity_resolution/normalizer.py](file:///c:/Users/ritik/Downloads/SIH26100/pipeline/entity_resolution/normalizer.py))

### 3.1 Whitespace Normalization (`normalize_whitespace`)
- Converts tabs and non-breaking spaces (`\xa0`) to standard space.
- Collapses consecutive newlines and carriage returns.
- Collapses multiple whitespace runs to a single space and strips leading/trailing edges.

### 3.2 Punctuation Normalization (`normalize_punctuation`)
- Standardizes `&` $\to$ `AND`.
- Normalizes em-dashes and en-dashes (`—`, `–`) $\to$ `-`.
- Strips quotes, backticks, parentheses, and brackets.

### 3.3 Legal Abbreviations & Dotted Acronyms (`normalize_legal_abbreviations`)
- Removes honorific prefixes: `M/S`, `MESSRS`, `SHRI`, `SMT`.
- Collapses dotted corporate acronyms:
  - `L.L.P.` $\to$ `LLP`
  - `P.V.T.` $\to$ `PVT`
  - `L.T.D.` $\to$ `LTD`
  - `O.P.C.` $\to$ `OPC`
- Expands statutory abbreviations: `GOVT` $\to$ `GOVERNMENT`, `REGD` $\to$ `REGISTERED`, `ESTD` $\to$ `ESTABLISHED`, `DEPT` $\to$ `DEPARTMENT`.

### 3.4 Company Suffix Standardizations (`LEGAL_FORM_MAPPINGS`)
Standardizes legal form variations to canonical uppercase:
- `PVT. LTD.`, `PRIVATE LIMITED`, `PVT LTD` $\to$ `PRIVATE LIMITED`
- `LTD.`, `LIMITED` $\to$ `LIMITED`
- `LLP`, `L.L.P.` $\to$ `LLP`
- `OPC` $\to$ `OPC`
- `INC.`, `INCORPORATED` $\to$ `INCORPORATED`
- `CORP.`, `CORPORATION` $\to$ `CORPORATION`

### 3.5 Address Normalization (`normalize_address`)
Expands postal abbreviations and extracts structured metadata:
- `RD` $\to$ `ROAD`, `ST` $\to$ `STREET`, `NR` $\to$ `NEAR`, `OPP` $\to$ `OPPOSITE`
- `FLR` $\to$ `FLOOR`, `INDL EST` $\to$ `INDUSTRIAL ESTATE`, `SEC` $\to$ `SECTOR`
- Extracts 6-digit PIN code and detects Indian state names.

---

## 4. Anti-Collision Safeguards ("Do Not Accidentally Merge Unrelated Companies")

Naive entity normalizers strip legal forms and sector tokens, causing dangerous false collisions between independent firms. VigilBid prevents this via multi-tier safeguards:

### 4.1 Distinctive Sector Isolation (`DISTINCTIVE_SECTORS`)
Words identifying business domains are strictly preserved and compared:
`{"STEEL", "POWER", "MOTORS", "CHEMICALS", "PETROCHEMICALS", "ENERGY", "TECH", "TECHNOLOGIES", "SOLUTIONS", "INDUSTRIES", "ENTERPRISES", "ENGINEERING", "SYSTEMS", "PHARMA", "INFRASTRUCTURE", "LOGISTICS", "GLOBAL", "INDIA"}`

If two company names contain conflicting distinctive tokens, they are **strictly rejected**:
- `Apex Solutions Private Limited` vs `Apex Technologies Private Limited` $\implies$ **FALSE (conflicting: SOLUTIONS vs TECHNOLOGIES)**
- `Tata Steel Limited` vs `Tata Motors Limited` $\implies$ **FALSE (conflicting: STEEL vs MOTORS)**
- `Reliance Petrochemicals Limited` vs `Reliance Infrastructure Limited` $\implies$ **FALSE (conflicting: PETROCHEMICALS vs INFRASTRUCTURE)**

### 4.2 Legal Form Mismatch Detection
A Private Limited company and a Public Limited company sharing the same root are distinct legal persons under the Companies Act 2013:
- `Apex Engineering Private Limited` vs `Apex Engineering Limited` $\implies$ **FALSE (Legal form mismatch)**

### 4.3 Safe Positive Merges
Legitimate representations of the same company are accurately reconciled:
- `M/s. Apex Industrial Solutions Pvt. Ltd.` == `APEX INDUSTRIAL SOLUTIONS PRIVATE LIMITED` $\implies$ **TRUE (Confidence 1.0 / 0.95)**
- `Kaveri & Sons Engineering Works` == `Kaveri and Sons Engineering Works` $\implies$ **TRUE (Confidence 1.0)**
- `Siemens Energy India Ltd.` == `SIEMENS ENERGY INDIA LIMITED` $\implies$ **TRUE (Confidence 0.95)**
