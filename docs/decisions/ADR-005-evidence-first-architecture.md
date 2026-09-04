# ADR-005: Evidence-First Architecture with Exact Coordinate Citations

**Status:** Accepted  
**Date:** September 2026  
**Deciders:** Core Architecture Team, SIH26100  

---

## 1. Context
In traditional manual bid evaluation, procurement officers spend hours leafing through hundreds of PDF pages to locate the specific line where an audited turnover figure, a UDIN number, or a local content percentage is stated. When automated tools merely report a boolean status (e.g. *"Turnover: Valid"*), the human officer cannot trust the system without independently re-reading the document to verify where that number came from.

## 2. Decision
We mandate an **Evidence-First Architecture**:
- Every extracted field and compliance finding MUST store an explicit `Evidence` record (`backend/models/evidence.py`).
- Each evidence record contains:
  - `document_id`: Unique reference to the underlying source document.
  - `page_number`: Exact 1-indexed page where the fact was located.
  - `bounding_box`: Normalized coordinate rectangle `[x1, y1, x2, y2]` in points.
  - `text_snippet`: Verbatim raw extracted text surrounding the value.
  - `source_file_sha256`: Cryptographic hash of the source PDF.
- The UI features a **Split-Screen Evidence Inspector**: clicking any finding immediately scrolls the source PDF to the target page and renders a highlighted bounding box over the extracted text.

## 3. Reason
- **Instant Officer Verification:** An evaluating officer can verify a critical turnover or OEM validity claim in 2 seconds simply by looking at the highlighted bounding box.
- **Trust & Adoption:** Human officers trust AI systems when the system proves *where* it obtained the information.
- **Auditable Dossiers:** When exporting the CVC compliance dossier to PDF, the exact page and snippet citations are embedded directly beneath each criterion table.

## 4. Alternatives Considered
- **Document-Level Only Citations (e.g., "Found in file `turnover.pdf`"):**
  - *Rejected:* Insufficient for 50-page audited balance sheets where the officer must still manually search for Note 18.
- **Page-Level Citations without Coordinates:**
  - *Rejected:* Better than document-level, but still leaves visual search fatigue on dense tables.

## 5. Consequences
- **Positive:** Dramatic reduction in verification time; 100% evidentiary transparency; visual proof during competition evaluations.
- **Negative:** Requires storing coordinate geometry in the database and rendering responsive highlight overlays in the frontend PDF canvas.
