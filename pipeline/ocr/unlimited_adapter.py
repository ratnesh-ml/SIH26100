"""Unlimited-OCR (baidu/Unlimited-OCR) Adapter for VigilBid.

Provides long-document Vision Language Model OCR integration with CPU/GPU awareness,
retry behavior, confidence scoring, output normalization, and transparent failure handling.
"""

import io
import logging
import time
from typing import Any, Callable, Optional
from PIL import Image
import fitz  # PyMuPDF

from pipeline.ocr.interface import OCRProvider, OCRRegion, OCRResult

logger = logging.getLogger("vigilbid.pipeline.ocr.unlimited")

DEFAULT_MODEL_NAME = "baidu/Unlimited-OCR"
DEFAULT_MAX_RETRIES = 2
DEFAULT_BACKOFF_FACTOR = 1.5


class UnlimitedOCRAdapter(OCRProvider):
    """Adapter wrapping baidu/Unlimited-OCR Vision Language Model.

    Installation Prerequisites:
        pip install torch torchvision --index-url https://download.pytorch.org/whl/cu121
        pip install transformers einops timm pillow

    Execution Requirements:
        - CUDA GPU with >= 16 GB VRAM recommended for native bfloat16 inference.
        - CPU execution is technically supported by PyTorch float32, but incurs high latency.
    """

    def __init__(
        self,
        model_name: str = DEFAULT_MODEL_NAME,
        max_retries: int = DEFAULT_MAX_RETRIES,
        backoff_factor: float = DEFAULT_BACKOFF_FACTOR,
        device: Optional[str] = None,
        model_loader: Optional[Callable[[], Any]] = None,
    ):
        self.model_name = model_name
        self.max_retries = max_retries
        self.backoff_factor = backoff_factor
        self._custom_device = device
        self._model_loader = model_loader
        self._model = None
        self._tokenizer = None
        self._is_initialized = False

    @property
    def name(self) -> str:
        return "unlimited-ocr"

    def is_available(self) -> bool:
        """Check whether transformers and torch dependencies are present."""
        try:
            import torch  # noqa: F401
            import transformers  # noqa: F401
            return True
        except ImportError:
            return False

    def get_device_info(self) -> dict[str, Any]:
        """Inspect hardware environment: CUDA GPU availability, device type, precision."""
        device_type = "cpu"
        cuda_available = False
        gpu_name = None
        precision = "float32"

        try:
            import torch
            cuda_available = torch.cuda.is_available()
            if self._custom_device:
                device_type = self._custom_device
            elif cuda_available:
                device_type = "cuda"
                gpu_name = torch.cuda.get_device_name(0)
                precision = "bfloat16" if torch.cuda.is_bf16_supported() else "float16"
        except ImportError:
            pass

        return {
            "provider": self.name,
            "device": device_type,
            "cuda_available": cuda_available,
            "gpu_name": gpu_name,
            "recommended_precision": precision,
            "ready": self.is_available(),
        }

    def _ensure_initialized(self):
        """Lazy model and tokenizer loading with transparent failure diagnostics."""
        if self._is_initialized:
            return

        if self._model_loader:
            self._model, self._tokenizer = self._model_loader()
            self._is_initialized = True
            return

        if not self.is_available():
            raise RuntimeError(
                "Unlimited-OCR dependencies are not installed. "
                "Required: 'pip install transformers torch'."
            )

        import torch
        from transformers import AutoModel, AutoTokenizer

        device_info = self.get_device_info()
        device = device_info["device"]
        dtype = torch.bfloat16 if device == "cuda" and torch.cuda.is_bf16_supported() else torch.float32

        logger.info(
            "Loading %s on device: %s (%s)...",
            self.model_name,
            device,
            dtype,
        )
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_name, trust_remote_code=True)
        self._model = AutoModel.from_pretrained(
            self.model_name,
            trust_remote_code=True,
            use_safetensors=True,
            torch_dtype=dtype,
        ).eval()

        if device == "cuda":
            self._model = self._model.cuda()

        self._is_initialized = True

    def extract_from_image(
        self,
        image_bytes: bytes,
        page: int = 1,
        document_id: Optional[str] = None,
    ) -> OCRResult:
        """Extract text and layout from image with retries, normalization, and error handling."""
        start_time = time.perf_counter()

        # Environmental sanity check: do not fake success if unavailable
        if not self.is_available() and not self._model_loader:
            duration = time.perf_counter() - start_time
            return OCRResult(
                document_id=document_id,
                page=page,
                text="",
                confidence=0.0,
                processing_time=duration,
                provider=self.name,
                error="Unlimited-OCR unavailable: Missing 'transformers' package or CUDA hardware.",
            )

        # Retry loop for transient inference failures
        last_error = None
        for attempt in range(1, self.max_retries + 2):
            try:
                self._ensure_initialized()
                pil_image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

                # Run inference via adapter/model hook
                raw_output = self._run_inference(pil_image)
                normalized_text, regions, confidence = self._normalize_output(raw_output)

                duration = time.perf_counter() - start_time
                return OCRResult(
                    document_id=document_id,
                    page=page,
                    text=normalized_text,
                    confidence=confidence,
                    regions=regions,
                    processing_time=duration,
                    provider=self.name,
                )

            except Exception as exc:
                last_error = exc
                logger.warning(
                    "Unlimited-OCR attempt %d/%d failed: %s",
                    attempt,
                    self.max_retries + 1,
                    exc,
                )
                if attempt <= self.max_retries:
                    time.sleep(self.backoff_factor ** attempt)

        duration = time.perf_counter() - start_time
        return OCRResult(
            document_id=document_id,
            page=page,
            text="",
            confidence=0.0,
            processing_time=duration,
            provider=self.name,
            error=f"Unlimited-OCR inference failed after {self.max_retries + 1} attempts: {last_error}",
        )

    def extract_from_pdf_page(
        self,
        pdf_bytes: bytes,
        page: int = 1,
        document_id: Optional[str] = None,
    ) -> OCRResult:
        """Render specified PDF page to 300 DPI raster and process through Unlimited-OCR."""
        start_time = time.perf_counter()
        doc = None
        try:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            if page < 1 or page > len(doc):
                return OCRResult(
                    document_id=document_id,
                    page=page,
                    text="",
                    confidence=0.0,
                    processing_time=time.perf_counter() - start_time,
                    provider=self.name,
                    error=f"Requested page {page} out of bounds (1..{len(doc)})",
                )

            fitz_page = doc[page - 1]
            pix = fitz_page.get_pixmap(dpi=300)
            png_bytes = pix.tobytes("png")
            return self.extract_from_image(png_bytes, page=page, document_id=document_id)

        except Exception as exc:
            return OCRResult(
                document_id=document_id,
                page=page,
                text="",
                confidence=0.0,
                processing_time=time.perf_counter() - start_time,
                provider=self.name,
                error=f"Failed rendering PDF page for Unlimited-OCR: {exc}",
            )
        finally:
            if doc is not None:
                doc.close()

    def _run_inference(self, image: Image.Image) -> Any:
        """Execute model forward pass or mock inference."""
        if hasattr(self._model, "infer"):
            prompt = "<image>Extract all text and bounding boxes."
            return self._model.infer(self._tokenizer, prompt=prompt, image=image)
        elif callable(self._model):
            return self._model(image)
        raise RuntimeError("Loaded Unlimited-OCR model does not have a callable infer method.")

    def _normalize_output(self, raw_output: Any) -> tuple[str, list[OCRRegion], float]:
        """Normalize raw model token predictions into plain text, regions, and confidence."""
        regions: list[OCRRegion] = []
        confidence = 0.90  # Base confidence for successful VLM decoding

        if isinstance(raw_output, dict):
            text = raw_output.get("text", "")
            raw_regions = raw_output.get("regions", [])
            for r in raw_regions:
                regions.append(
                    OCRRegion(
                        text=r.get("text", ""),
                        bbox=tuple(r.get("bbox", (0.0, 0.0, 0.0, 0.0))),
                        confidence=float(r.get("confidence", confidence)),
                    )
                )
            if "confidence" in raw_output:
                confidence = float(raw_output["confidence"])
        elif isinstance(raw_output, str):
            text = raw_output
        else:
            text = str(raw_output)

        # Cleanup markdown formatting artifacts
        cleaned_text = text.replace("<image>", "").strip()
        return cleaned_text, regions, confidence
