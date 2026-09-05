# VigilBid (SIH26100) — Structured Document Field Extraction Specification

**Document Version:** 1.0.0  
**Date:** September 2026  
**Status:** Locked & Operational  
**Module:** `pipeline/extraction/`

---

## 1. Overview & Architecture

The Field Extraction subsystem extracts typed, validated, and normalized data points from unstructured and semi-structured statutory documents submitted by tender bidders. 

### Core Architectural Principles
1. **Deterministic-First:** Prioritizes text-layer extraction, statutory anchor phrases (e.g. `Form GST REG-06`, `Permanent Account Number`, `UDIN`), and canonical regexes. Avoids unpredictable generative hallucinations for legal identifiers.
2. **Provenance & Auditability:** Every extracted field preserves its origin:
   - `value`: Raw extracted string.
   - `normalized_value`: Standardized format (ISO dates, uppercase identifiers, float turnover in INR).
   - `confidence`: Confidence score (0.0 to 1.0) derived from pattern and OCR clarity.
   - `source_document`: Originating file name.
   - `page`: 1-indexed page number.
   - `extraction_method`: `"regex"`, `"anchor"`, `"table"`, or `"heuristic"`.
   - `is_valid` / `validation_error`: Boolean validity flag and error diagnostic.
3. **Statutory Validation:** Mathematical and structural verification (Mod-36 GSTIN checks, PAN 4th character entity type classification, Udyam format verification, ICAI 18-character UDIN validation).

---

## 2. Document Extractors & Field Matrix

| Document Type | Target Fields | Extraction Method | Normalization & Validation |
|---|---|---|---|
| **GST Registration (`GST_CERT`)** | `gstin`, `legal_name`, `trade_name`, `constitution`, `address`, `registration_date`, `status`, `pan` | Regex on `\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]`; Anchors for names, address, and date | Mod-36 check; state code 01–38 validation; PAN embedded derivation; ISO 8601 date |
| **PAN Card (`PAN_CARD`)** | `pan`, `legal_name`, `registration_date`, `entity_type`, `status` | Regex on `[A-Z]{5}\d{4}[A-Z]`; Label adjacent search for cardholder name and DOB/incorporation date | 4th char entity type classification (`C`=Company, `P`=Individual, etc.); ISO 8601 date |
| **Udyam Certificate (`UDYAM_CERT`)** | `udyam_number`, `legal_name`, `enterprise_type`, `major_activity`, `registration_date`, `address`, `pan`, `status` | Regex `UDYAM-[A-Z]{2}-\d{2}-\d{7}`; Label anchors for enterprise name, type (`MICRO`/`SMALL`/`MEDIUM`), activity | Enterprise type validation; Udyam hyphenated uppercase normalization |
| **CA Turnover / Financials (`CA_TURNOVER_CERT`, `AUDITED_FINANCIALS`)** | `turnover`, `financial_year`, `udin`, `company_name`, `ca_name`, `membership_no`, `status` | Regex `FY ?20\d\d-\d\d.*?₹?[\d,]+`; 18-character UDIN regex `\d{8}[A-Z]{6}\d{4}` | Turnover parsed to numeric INR float (`Rs. 8.42 Crores` -> `84200000.0`); UDIN format verification |

---

## 3. ExtractedFieldDTO Contract

All extractors return instances of `ExtractedFieldDTO` ([pipeline/extraction/base.py](pipeline/extraction/base.py)):

```python
@dataclass
class ExtractedFieldDTO:
    field_name: str
    value: Optional[str]
    normalized_value: Optional[str]
    confidence: float
    source_document: Optional[str] = None
    page: int = 1
    extraction_method: str = "deterministic_anchor"
    raw: Optional[str] = None
    bbox: Optional[dict[str, Any]] = None
    is_valid: bool = True
    validation_error: Optional[str] = None
```

---

## 4. Normalization & Validation Standards

### 4.1 Legal Org Name Normalization (`normalize_org_name`)
- Collapses `M/S` and `MESSRS` prefixes.
- Converts `&` to `AND`.
- Standardizes corporate abbreviations (`PVT` / `PVT.` -> `PRIVATE`, `LTD` / `LTD.` -> `LIMITED`, `CO` -> `COMPANY`).
- Uppercases and collapses multiple whitespaces.

### 4.2 Monetary Normalization (`normalize_turnover`)
- Automatically detects magnitude suffixes (`Crores`, `Lakhs`, `Cr`, `Lacs`).
- Returns raw numeric float in Indian National Rupees (INR):
  - `"Rs. 8.42 Crores"` $\to$ `84200000.0`
  - `"₹ 45.5 Lakhs"` $\to$ `4550000.0`
  - `"1,25,00,000"` $\to$ `12500000.0`

### 4.3 Date Normalization (`normalize_date`)
- Parses Indian and statutory formats (`DD/MM/YYYY`, `DD-MM-YYYY`, `DD Month YYYY`, `YYYY-MM-DD`).
- Standardizes to ISO 8601 string: `YYYY-MM-DD`.

---

## 5. Background Pipeline Integration

The Field Extraction subsystem is invoked in Step 4 of the asynchronous evaluation pipeline ([backend/services/job_service.py](backend/services/job_service.py)):

1. In Step 2, `RuleBasedDocumentClassifier` assigns `Document.doc_type`.
2. In Step 3, `PDFProcessor` and `OCRProvider` populate `document_pages`.
3. In Step 4, `extract_document_fields()` queries the registry for the document type extractor.
4. Each extracted field is persisted into the PostgreSQL `extracted_fields` table, with SHA-256 integrity hashes (`value_hash`), page provenance, confidence, and validation markers.
5. Job Step 4 is marked `DONE`.
