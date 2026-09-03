# VigilBid (SIH26100) — PDF Processing Output Contract & Specification

**Document Version:** 1.0.0  
**Target:** SIH Grand Finale — Problem Statement SIH26100  
**Layer:** `pipeline/pdf/`

---

## 1. Architectural Philosophy

1. **Text-Layer First Protocol**:
   Whenever a PDF page contains an embedded text layer with sufficient character density (`char_count ≥ 50` non-whitespace characters), the platform extracts text and bounding boxes directly from the vector stream with `confidence = 1.0`. Optical Character Recognition (OCR) is invoked only on scanned, low-density, or degraded pages to save computational latency.
2. **Deterministic Geometry**:
   Every word is assigned a normalized bounding box (`[x0, y0, x1, y1]`) along with its reading order coordinates (`block_no`, `line_no`, `word_no`).
3. **Forensic Integrity Check**:
   Document trailers, catalogs, and cross-reference streams are parsed for active scripts (`/JavaScript`, `/Launch`, `/EmbeddedFiles`, `/OpenAction`). Detected scripts trigger forensic anomaly flags (`A-PDF-06`) rather than executing.
4. **On-Demand Cached Rendering**:
   Page raster images (PNG at 150 DPI) are computed on-demand and cached to `data/storage/{bidder_id}/pages/` by document hash and page number, ensuring sub-10ms UI page loads.

---

## 2. Output Data Contracts

### 2.1 Complete Document Result (`PDFProcessResult`)

```json
{
  "is_valid": true,
  "error_message": null,
  "page_count": 2,
  "overall_text_source": "TEXT_LAYER",
  "doc_metadata": {
    "title": "Turnover Certificate FY 2024-25",
    "author": "M/s Ramanathan & Co Chartered Accountants",
    "subject": "CPCL Tender Pump-217",
    "keywords": "UDIN, Turnover, CA",
    "creator": "Adobe Acrobat Pro DC",
    "producer": "Adobe PDF Library 15.0",
    "creation_date": "D:20260301120000Z",
    "mod_date": "D:20260301120500Z",
    "format": "PDF 1.6",
    "encryption": null
  },
  "forensic": {
    "has_javascript": false,
    "has_launch": false,
    "has_embedded_files": false,
    "has_open_action": false,
    "is_incremental_update": false,
    "suspicious_flags": []
  },
  "pages": [
    {
      "page_no": 1,
      "text": "TO WHOMSOEVER IT MAY CONCERN...",
      "confidence": 1.0,
      "png_path": "data/storage/cache/doc123_page_1.png",
      "metadata": {
        "page_no": 1,
        "width": 595.32,
        "height": 841.92,
        "rotation": 0,
        "char_count": 842,
        "word_count": 124,
        "image_count": 1,
        "has_text_layer": true,
        "text_source": "TEXT_LAYER"
      },
      "words": [
        {
          "text": "TO",
          "x0": 72.0,
          "y0": 100.5,
          "x1": 90.2,
          "y1": 112.5,
          "block_no": 0,
          "line_no": 0,
          "word_no": 0
        }
      ]
    }
  ]
}
```

---

## 3. Database Persistence Contract

When `PDFProcessor.persist_to_database(session, document_id, result)` is called:

1. **`documents` Table Updates**:
   - `page_count` = `result.page_count`
   - `text_source` = `result.overall_text_source` (`'TEXT_LAYER'`, `'SCANNED'`, `'HYBRID'`, `'EMPTY'`)
   - `metadata_fields` = JSON-encoded `result.doc_metadata`
   - `forensic` = JSON-encoded `result.forensic`

2. **`document_pages` Table Insertions**:
   - `document_id`: Foreign key to parent `documents.id`
   - `page_no`: 1-indexed page sequence
   - `text`: Extracted page plain text
   - `words`: JSON structure `{"items": [...], "count": N}` containing bounding boxes
   - `ocr_conf`: 1.0 for clean text layer, 0.0 for scanned pages requiring OCR
   - `png_path`: Absolute path to rendered cached PNG
