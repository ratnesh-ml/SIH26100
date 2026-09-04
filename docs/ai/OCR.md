# VigilBid (SIH26100) — OCR Architecture & Unlimited-OCR Specification

**Document Version:** 1.0.0  
**Target:** SIH Grand Finale — Problem Statement SIH26100  
**Layer:** `pipeline/ocr/`

---

## 1. Architectural Philosophy

1. **Deterministic Separation & Text-Layer Priority**:
   Text extraction is prioritized in two tiers:
   - **Tier 1 (Text Layer)**: PyMuPDF extracts vector text and coordinates directly whenever a page contains `≥ 50` characters. This incurs near-zero latency (~5ms) with 100% confidence.
   - **Tier 2 (OCR Fallback)**: For scanned certificates (0 or sparse characters), the page is rasterized at 300 DPI and delegated to an `OCRProvider`.
2. **Pluggable OCR Abstraction (`OCRProvider`)**:
   The application never binds directly to a specific OCR library or model. All OCR implementations conform to the stable `OCRProvider` interface and return a normalized `OCRResult`.

---

## 2. Stable Output Contract (`OCRResult`)

Every provider returns a uniform data contract:

```python
@dataclass
class OCRResult:
    document_id: Optional[str]  # Target document UUID if provided
    page: int                   # 1-indexed page number
    text: str                   # Extracted normalized plain text
    confidence: float           # Aggregated confidence score (0.0 - 1.0)
    regions: list[OCRRegion]    # Word / line bounding boxes
    processing_time: float      # Elapsed execution time in seconds
    provider: str               # Provider identifier ('unlimited-ocr', 'fallback-ocr')
    error: Optional[str] = None # Diagnostic error message if failed
```

Each region in `regions` contains:
- `text`: Extracted token string.
- `bbox`: Coordinates `(x0, y0, x1, y1)`.
- `confidence`: Confidence score for the specific token.

---

## 3. Provider Implementations

### 3.1 Unlimited-OCR Adapter (`UnlimitedOCRAdapter`)

- **Model Repository:** [baidu/Unlimited-OCR](https://github.com/baidu/Unlimited-OCR)
- **Model Type:** Vision Language Model (VLM) optimized for long-document parsing with KV-cache memory optimizations.
- **Hardware Requirement:** NVIDIA GPU with CUDA support and ≥ 16 GB VRAM (for native `bfloat16` inference).

#### Installation Commands:
```bash
# 1. Install PyTorch with CUDA 12.1+ support
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121

# 2. Install Hugging Face Transformers & VLM requirements
pip install transformers einops timm pillow accelerate
```

#### Execution & Model Setup:
```python
from pipeline.ocr.unlimited_adapter import UnlimitedOCRAdapter

# Instantiate adapter (will lazy-load baidu/Unlimited-OCR on first inference)
adapter = UnlimitedOCRAdapter()

# Check hardware awareness
device_info = adapter.get_device_info()
print(device_info)
# {'provider': 'unlimited-ocr', 'device': 'cuda', 'cuda_available': True, 'recommended_precision': 'bfloat16'}
```

#### Failure & Fallback Handling:
If Unlimited-OCR is executed in an environment lacking `transformers` or a compatible CUDA GPU, it **never fakes success**. It returns an explicit diagnostic `OCRResult(error="Unlimited-OCR unavailable: Missing 'transformers' package or CUDA hardware.")` and the factory automatically routes requests to `FallbackOCRAdapter`.

---

### 3.2 Architecture-Approved Fallback Adapter (`FallbackOCRAdapter`)

- **Primary Role:** Reliable local development, continuous integration, and CPU execution without multi-gigabyte weight downloads.
- **Engines:** PyMuPDF vector inspection + EasyOCR CPU mode.

#### Installation Commands:
```bash
# PyMuPDF and EasyOCR (CPU mode)
pip install pymupdf easyocr pillow
```

#### Execution Example:
```python
from pipeline.ocr.fallback_adapter import FallbackOCRAdapter

adapter = FallbackOCRAdapter(languages=["en"])
result = adapter.extract_from_pdf_page(pdf_bytes, page=1)
print(f"Provider: {result.provider}, Confidence: {result.confidence}")
```

---

## 4. Environment Configuration

Providers are dynamically resolved via `pipeline/ocr/factory.py` based on the `OCR_PROVIDER` environment setting:

```ini
# .env configuration
OCR_PROVIDER=fallback       # Options: 'fallback' (CPU default) | 'unlimited' (Baidu VLM GPU)
```

---

## 5. Summary Table

| Feature | `UnlimitedOCRAdapter` | `FallbackOCRAdapter` |
|---|---|---|
| **Architecture** | Baidu Vision Language Model | PyMuPDF + EasyOCR |
| **Compute Target** | CUDA GPU (≥16 GB VRAM, `bfloat16`) | Standard CPU / Laptop |
| **Use Case** | Production high-throughput VLM parsing | Local dev, CI test suite, fallback |
| **Dependencies** | `transformers`, `torch`, `einops` | `pymupdf`, `easyocr` |
| **Degradation Mode** | Returns explicit error if unequipped | Guaranteed execution |
