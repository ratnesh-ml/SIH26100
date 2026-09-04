# VigilBid Stable Evidence Model & Provenance Specification

## 1. Executive Summary

The **VigilBid Evidence Subsystem** (`pipeline/evidence/highlighter.py`) establishes the core provenance contract connecting every compliance finding, cross-document verification, forensic anomaly, and risk factor back to verifiable source material.

It empowers the frontend and procurement officers to answer:
> **"Show me exactly where this result came from."**

```
┌────────────────────────────────────────────────────────┐
│                   Raw Evidence Sources                 │
│  - Document Text Layer (Character stream & BBoxes)     │
│  - OCR Engine Outputs (Tesseract/PaddleOCR words)      │
│  - PDF Metadata Dictionary (Trailers, Info, Catalogs)  │
│  - Simulated Government Registries (GSTN, PAN, Udyam)  │
│  - Cross-Bidder Linked Identifiers                     │
└───────────────────────────┬────────────────────────────┘
                            │ Structured via EvidenceItem
                            ▼
┌────────────────────────────────────────────────────────┐
│                  Stable Evidence Contract              │
│  - document: File identifier or statutory portal       │
│  - page: 1-indexed page number                         │
│  - field: Extracted parameter name                     │
│  - quote: Exact textual snippet                        │
│  - bounding_box: (x0, y0, x1, y1) & CSS percentages    │
│  - source: Origin layer (text_layer, ocr, registry)    │
│  - method: Extraction/Inspection algorithm             │
│  - confidence: Probabilistic confidence (0.0 to 1.0)   │
└───────────────────────────┬────────────────────────────┘
                            │ Aggregated via EvidenceTrace
                            ▼
┌────────────────────────────────────────────────────────┐
│                Frontend Evidence Viewer                │
│  - Side-by-side multi-document split tabs              │
│  - Semi-transparent responsive highlight overlays      │
│  - Solid box (conf ≥ 0.85) vs Dashed box (conf < 0.85) │
│  - Instant PDF page zoom and quote callouts            │
└────────────────────────────────────────────────────────┘
```

---

## 2. Stable Evidence Contract (`EvidenceItem`)

Every finding links to one or more `EvidenceItem` instances:

```python
@dataclass
class EvidenceItem:
    document: str                        # File name or statutory registry source
    page: int                            # 1-indexed page number
    field: str                           # Field or parameter identifier (e.g. 'gstin')
    quote: Optional[str] = None          # Exact text snippet from document
    bounding_box: Optional[BoundingBox]  # (x0, y0, x1, y1) in PDF points (72 DPI)
    source: str = "document_text_layer"  # document_text_layer, document_ocr, simulated_registry, pdf_metadata, cross_bidder
    method: str = "anchor_regex"         # anchor_regex, tesseract_ocr, api_lookup, timestamp_audit, etc.
    confidence: float = 1.0              # 0.0 to 1.0
    metadata: dict[str, Any]             # Supplemental provenance (e.g. checksum status, anomaly codes)
```

### Property Aliases for Universal Compatibility
- `item.page_no == item.page`
- `item.document_id == item.document`
- `item.bbox == item.bounding_box.to_dict()`

---

## 3. BoundingBox & Responsive Overlay Percentages

Bounding boxes in PDF point space $(x_0, y_0, x_1, y_1)$ are automatically normalized to responsive CSS percentage coordinates for rendering in web browsers:

$$\text{left} = \frac{x_0}{\text{width}} \times 100\%$$
$$\text{top} = \frac{y_0}{\text{height}} \times 100\%$$
$$\text{width} = \frac{x_1 - x_0}{\text{width}} \times 100\%$$
$$\text{height} = \frac{y_1 - y_0}{\text{height}} \times 100\%$$

### Visual Confidence Styling
- **`solid` rectangle**: High confidence ($\ge 0.85$). Standard verification.
- **`dashed` rectangle**: Moderate / low confidence ($< 0.85$). Officer attention requested.

---

## 4. Multi-Document Provenance Tracing (`EvidenceTrace`)

When a finding spans multiple documents (such as cross-document verification between a GST Certificate and a PAN card):

```
┌─────────────────────────────────────────────────────────────┐
│                    Multi-Document Trace                     │
│  Item 1: GST_REG_06.pdf p.1 [gstin]                         │
│          Quote: "33AABCC1234F1Z5" via anchor_regex (1.00)   │
│  Item 2: PAN_Card.pdf p.1 [pan]                             │
│          Quote: "AABCC1234F" via tesseract_ocr (0.92)       │
│                                                             │
│  Summary: Characters 3–12 match PAN card exactly.           │
└─────────────────────────────────────────────────────────────┘
```

The `EvidenceTrace.is_multi_document` flag automatically signals the frontend Cockpit to open the dual-document split viewer for side-by-side review.
