"""PDF forensic inspection, metadata discrepancy checks, and injection scanner."""

from dataclasses import dataclass
from typing import Any, Optional


@dataclass
class AnomalyResult:
    code: str
    severity: str  # 'INFO' | 'WARN' | 'CRITICAL'
    points: int
    description: str
    evidence: Optional[dict[str, Any]] = None


class AnomalyDetector:
    """Detects forensic anomalies (producer mismatch, incremental updates, font oddities)."""

    def scan_document(self, pdf_path: str) -> list[AnomalyResult]:
        raise NotImplementedError("Forensic anomaly scanning will be implemented in future phase")
