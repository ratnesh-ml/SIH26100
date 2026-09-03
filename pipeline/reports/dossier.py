"""CVC and RTI ready PDF Compliance Dossier generator interface."""

from dataclasses import dataclass
from pathlib import Path


@dataclass
class DossierMetadata:
    tender_id: str
    bidder_id: str
    chain_head: str
    output_path: Path


class DossierGenerator:
    """Renders HTML templates to tamper-evident PDF dossiers via WeasyPrint or ReportLab fallback."""

    def generate(self, tender: dict, bidder: dict, findings: list[dict], audit_events: list[dict]) -> Path:
        raise NotImplementedError("Dossier rendering will be implemented in future phase")
