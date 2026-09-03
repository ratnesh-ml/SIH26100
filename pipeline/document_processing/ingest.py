"""Safe document intake, ZIP decompression, and SHA-256 fingerprinting."""

from dataclasses import dataclass
from pathlib import Path


@dataclass
class IngestedDocument:
    original_filename: str
    sha256: str
    storage_path: Path
    mime_type: str
    page_count: int


class DocumentIngester:
    """Safely unpacks ZIP archives, rejects zip bombs, and fingerprints files."""

    def unpack_and_fingerprint(self, archive_path: Path, output_dir: Path) -> list[IngestedDocument]:
        """Unpack archive and validate magic bytes (%PDF-)."""
        raise NotImplementedError("Ingestion logic will be implemented in future phase")
