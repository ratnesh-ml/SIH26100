"""Safe document intake, ZIP decompression, path-traversal prevention, and SHA-256 fingerprinting."""

from dataclasses import dataclass, field
import hashlib
import io
import logging
import os
from pathlib import Path
import re
from typing import Optional
import zipfile

logger = logging.getLogger("vigilbid.pipeline.ingest")

# Security and Resource Constraints
MAX_SINGLE_PDF_SIZE = 25 * 1024 * 1024  # 25 MB per PDF
MAX_ZIP_SIZE = 100 * 1024 * 1024        # 100 MB per ZIP archive
MAX_UNCOMPRESSED_TOTAL = 150 * 1024 * 1024  # 150 MB max uncompressed
MAX_ZIP_ENTRIES = 200                   # Max files per archive
MAX_COMPRESSION_RATIO = 100.0           # Zip bomb ratio threshold

PDF_MAGIC = b"%PDF-"
ZIP_MAGICS = (b"PK\x03\x04", b"PK\x05\x06", b"PK\x07\x08")
PAGE_REGEX = re.compile(rb"/Type\s*/Page\b")


@dataclass
class IngestedFile:
    original_filename: str
    sha256: str
    content: bytes
    mime_type: str
    page_count: int
    size_bytes: int


@dataclass
class RejectedFile:
    filename: str
    reason: str


@dataclass
class IngestionResult:
    accepted: list[IngestedFile] = field(default_factory=list)
    rejected: list[RejectedFile] = field(default_factory=list)
    total_files: int = 0


def count_pdf_pages_safely(data: bytes) -> int:
    """Extract page count by inspecting /Type /Page markers without script execution."""
    count = len(PAGE_REGEX.findall(data))
    return max(1, count) if data.startswith(PDF_MAGIC) else 0


def is_path_traversal(entry_name: str) -> bool:
    """Check if a ZIP archive entry attempts path traversal."""
    normalized = entry_name.replace("\\", "/")
    # Reject relative parents, absolute paths, or drive specifiers
    if ".." in normalized or normalized.startswith("/") or ":" in normalized:
        return True
    parts = Path(normalized).parts
    if ".." in parts or any(p.startswith("/") for p in parts):
        return True
    return False


class DocumentIngester:
    """Safely unpacks ZIP archives, defends against zip bombs, and fingerprints files."""

    def __init__(
        self,
        max_pdf_size: int = MAX_SINGLE_PDF_SIZE,
        max_zip_size: int = MAX_ZIP_SIZE,
    ):
        self.max_pdf_size = max_pdf_size
        self.max_zip_size = max_zip_size

    def ingest_bytes(self, filename: str, content: bytes) -> IngestionResult:
        """Inspect and ingest raw file bytes for a PDF or ZIP package."""
        result = IngestionResult()
        sanitized_name = os.path.basename(filename.strip()) or "unnamed_upload"

        # 1. Determine if ZIP Archive
        if content.startswith(ZIP_MAGICS) or sanitized_name.lower().endswith(".zip"):
            return self._process_zip(sanitized_name, content)

        # 2. Determine if PDF
        return self._process_pdf(sanitized_name, content)

    def _process_pdf(self, filename: str, content: bytes) -> IngestionResult:
        """Validate and ingest a standalone PDF."""
        result = IngestionResult(total_files=1)

        # Size check
        if len(content) > self.max_pdf_size:
            result.rejected.append(
                RejectedFile(
                    filename=filename,
                    reason=f"File exceeds maximum allowed size ({len(content)} > {self.max_pdf_size} bytes)",
                )
            )
            return result

        # Magic byte check
        if not content.startswith(PDF_MAGIC):
            result.rejected.append(
                RejectedFile(
                    filename=filename,
                    reason="Invalid PDF header: Missing '%PDF-' magic bytes",
                )
            )
            return result

        sha256 = hashlib.sha256(content).hexdigest()
        page_count = count_pdf_pages_safely(content)

        result.accepted.append(
            IngestedFile(
                original_filename=filename,
                sha256=sha256,
                content=content,
                mime_type="application/pdf",
                page_count=page_count,
                size_bytes=len(content),
            )
        )
        return result

    def _process_zip(self, zip_filename: str, content: bytes) -> IngestionResult:
        """Safely inspect and extract PDFs from a ZIP archive."""
        result = IngestionResult()

        # Size check on the zip file itself
        if len(content) > self.max_zip_size:
            result.rejected.append(
                RejectedFile(
                    filename=zip_filename,
                    reason=f"Archive exceeds maximum size ({len(content)} > {self.max_zip_size} bytes)",
                )
            )
            result.total_files = 1
            return result

        try:
            with zipfile.ZipFile(io.BytesIO(content)) as zf:
                infolist = zf.infolist()
                result.total_files = len(infolist)

                # Check max entry count
                if len(infolist) > MAX_ZIP_ENTRIES:
                    result.rejected.append(
                        RejectedFile(
                            filename=zip_filename,
                            reason=f"Archive contains too many entries ({len(infolist)} > {MAX_ZIP_ENTRIES})",
                        )
                    )
                    return result

                total_uncompressed = 0

                # Pre-scan for zip bomb ratio & path traversal
                for info in infolist:
                    if info.is_dir():
                        continue

                    # 1. Path Traversal Defense
                    if is_path_traversal(info.filename):
                        result.rejected.append(
                            RejectedFile(
                                filename=info.filename,
                                reason=f"Malicious entry detected: Path traversal in '{info.filename}'",
                            )
                        )
                        return result

                    total_uncompressed += info.file_size
                    # Check compression ratio on each entry
                    if info.compress_size > 0:
                        ratio = info.file_size / info.compress_size
                        if ratio > MAX_COMPRESSION_RATIO:
                            result.rejected.append(
                                RejectedFile(
                                    filename=info.filename,
                                    reason=f"Zip bomb detected: compression ratio {ratio:.1f}:1 exceeds limit",
                                )
                            )
                            return result

                # Check total uncompressed size
                if total_uncompressed > MAX_UNCOMPRESSED_TOTAL:
                    result.rejected.append(
                        RejectedFile(
                            filename=zip_filename,
                            reason=f"Archive uncompressed size ({total_uncompressed} bytes) exceeds {MAX_UNCOMPRESSED_TOTAL} bytes",
                        )
                    )
                    return result

                # Extract and process individual files
                for info in infolist:
                    if info.is_dir():
                        continue

                    entry_name = os.path.basename(info.filename)
                    # Ignore macOS metadata
                    if info.filename.startswith("__MACOSX/") or entry_name.startswith("._"):
                        continue

                    if not entry_name.lower().endswith(".pdf"):
                        result.rejected.append(
                            RejectedFile(
                                filename=info.filename,
                                reason="Non-PDF document inside ZIP archive (skipped)",
                            )
                        )
                        continue

                    # Read entry data
                    entry_data = zf.read(info)
                    if len(entry_data) > self.max_pdf_size:
                        result.rejected.append(
                            RejectedFile(
                                filename=entry_name,
                                reason=f"PDF entry exceeds maximum size ({len(entry_data)} bytes)",
                            )
                        )
                        continue

                    if not entry_data.startswith(PDF_MAGIC):
                        result.rejected.append(
                            RejectedFile(
                                filename=entry_name,
                                reason="File has .pdf extension but invalid '%PDF-' magic bytes",
                            )
                        )
                        continue

                    sha256 = hashlib.sha256(entry_data).hexdigest()
                    page_count = count_pdf_pages_safely(entry_data)

                    result.accepted.append(
                        IngestedFile(
                            original_filename=entry_name,
                            sha256=sha256,
                            content=entry_data,
                            mime_type="application/pdf",
                            page_count=page_count,
                            size_bytes=len(entry_data),
                        )
                    )

        except zipfile.BadZipFile as exc:
            result.rejected.append(
                RejectedFile(
                    filename=zip_filename,
                    reason=f"Corrupted or invalid ZIP archive: {exc}",
                )
            )

        return result
