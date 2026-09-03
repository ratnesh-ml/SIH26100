"""Output contract and data models for PDF processing, metadata extraction, and rendering."""

from dataclasses import asdict, dataclass, field
from typing import Any, Optional


@dataclass
class WordBox:
    """Individual word with normalized bounding box."""
    text: str
    x0: float
    y0: float
    x1: float
    y1: float
    block_no: int
    line_no: int
    word_no: int

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class PageMetadata:
    """Detailed structural and visual page properties."""
    page_no: int  # 1-indexed
    width: float
    height: float
    rotation: int
    char_count: int
    word_count: int
    image_count: int
    has_text_layer: bool
    text_source: str  # 'TEXT_LAYER' | 'SCANNED'

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class DocumentMetadata:
    """PDF trailer and document catalog metadata."""
    title: Optional[str] = None
    author: Optional[str] = None
    subject: Optional[str] = None
    keywords: Optional[str] = None
    creator: Optional[str] = None
    producer: Optional[str] = None
    creation_date: Optional[str] = None
    mod_date: Optional[str] = None
    format: Optional[str] = None
    encryption: Optional[str] = None

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class ForensicSignals:
    """Structural indicators of tampering, scripts, or embedded payloads (A-PDF rules)."""
    has_javascript: bool = False
    has_launch: bool = False
    has_embedded_files: bool = False
    has_open_action: bool = False
    is_incremental_update: bool = False
    suspicious_flags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass
class PageProcessResult:
    """Processed result for a single PDF page."""
    page_no: int  # 1-indexed
    text: str
    words: list[WordBox] = field(default_factory=list)
    metadata: Optional[PageMetadata] = None
    png_path: Optional[str] = None
    confidence: float = 1.0

    def to_dict(self) -> dict[str, Any]:
        return {
            "page_no": self.page_no,
            "text": self.text,
            "words": [w.to_dict() for w in self.words],
            "metadata": self.metadata.to_dict() if self.metadata else None,
            "png_path": self.png_path,
            "confidence": self.confidence,
        }


@dataclass
class PDFProcessResult:
    """Complete structured extraction result for a processed PDF document."""
    is_valid: bool
    error_message: Optional[str] = None
    page_count: int = 0
    doc_metadata: DocumentMetadata = field(default_factory=DocumentMetadata)
    forensic: ForensicSignals = field(default_factory=ForensicSignals)
    pages: list[PageProcessResult] = field(default_factory=list)
    overall_text_source: str = "EMPTY"  # 'TEXT_LAYER' | 'SCANNED' | 'HYBRID' | 'EMPTY'

    def to_dict(self) -> dict[str, Any]:
        return {
            "is_valid": self.is_valid,
            "error_message": self.error_message,
            "page_count": self.page_count,
            "doc_metadata": self.doc_metadata.to_dict(),
            "forensic": self.forensic.to_dict(),
            "pages": [p.to_dict() for p in self.pages],
            "overall_text_source": self.overall_text_source,
        }
