"""PDF forensic inspection, metadata discrepancy checks, and injection scanner."""

from dataclasses import dataclass, field
import re
from typing import Any, Optional


@dataclass
class AnomalyResult:
    """Standard forensic or consistency anomaly signal container."""
    code: str
    severity: str  # "INFO", "WARN", "CRITICAL"
    points: int
    title: str
    description: str
    evidence: Optional[dict[str, Any]] = None
    requires_review: bool = True

    def to_dict(self) -> dict[str, Any]:
        return {
            "code": self.code,
            "severity": self.severity,
            "points": self.points,
            "title": self.title,
            "description": self.description,
            "evidence": self.evidence or {},
            "requires_review": self.requires_review,
        }


class AnomalyDetector:
    """Detects forensic anomalies (producer mismatch, incremental updates, font oddities, injection attacks)."""

    INJECTION_PATTERNS = [
        r"ignore\s+(all\s+)?previous\s+instructions",
        r"disregard\s+(all\s+)?earlier\s+instructions",
        r"system\s*prompt\s*:",
        r"mark\s+(this\s+)?bidder\s+(as\s+)?compliant",
        r"always\s+return\s+pass",
        r"override\s+all\s+rules",
        r"this\s+bidder\s+is\s+pre-?approved",
    ]

    IMAGE_EDITORS = [
        "gimp", "photoshop", "canva", "inkscape", "illustrator",
        "coreldraw", "paint.net", "acrobat distiller", "microsoft word", "winword",
    ]

    STATUTORY_DOC_TYPES = [
        "GST_CERT", "PAN_CARD", "UDYAM_CERT", "CA_TURNOVER_CERT",
    ]

    def scan_pdf_metadata(
        self,
        metadata: dict[str, Any],
        doc_type: str = "DOCUMENT",
    ) -> list[AnomalyResult]:
        """Inspect PDF producer, author, and timestamp consistency."""
        anomalies: list[AnomalyResult] = []
        if not metadata:
            return anomalies

        producer = str(metadata.get("producer") or "").lower()
        creator = str(metadata.get("creator") or "").lower()
        creation_date = metadata.get("creation_date") or metadata.get("creationDate")
        mod_date = metadata.get("mod_date") or metadata.get("modDate")

        # 1. Image editor / word processor on official statutory certificate (A-PDF-03)
        if doc_type in self.STATUTORY_DOC_TYPES:
            for ed in self.IMAGE_EDITORS:
                if ed in producer or ed in creator:
                    anomalies.append(
                        AnomalyResult(
                            code="A-PDF-03",
                            severity="WARN",
                            points=6,
                            title="Producer Software Discrepancy",
                            description=(
                                f"Risk signal: Statutory certificate '{doc_type}' indicates generation or modification "
                                f"via software '{producer or creator}' — requires review."
                            ),
                            evidence={
                                "producer": producer,
                                "creator": creator,
                                "doc_type": doc_type,
                            },
                        )
                    )
                    break

        # 2. Inverted or suspicious modification date (A-PDF-01)
        if creation_date and mod_date:
            try:
                # Compare ISO or standard timestamp strings if present
                clean_cd = re.sub(r"[^0-9]", "", str(creation_date))[:14]
                clean_md = re.sub(r"[^0-9]", "", str(mod_date))[:14]
                if clean_cd and clean_md and clean_md < clean_cd:
                    anomalies.append(
                        AnomalyResult(
                            code="A-PDF-01",
                            severity="WARN",
                            points=6,
                            title="Inverted Timestamp Anomaly",
                            description=(
                                "Risk signal: PDF modification timestamp strictly precedes creation timestamp — "
                                "potential anomaly detected; requires review."
                            ),
                            evidence={
                                "creation_date": creation_date,
                                "mod_date": mod_date,
                                "doc_type": doc_type,
                            },
                        )
                    )
            except Exception:
                pass

        return anomalies

    def scan_incremental_updates(
        self,
        xref_count: int,
        doc_type: str = "DOCUMENT",
    ) -> list[AnomalyResult]:
        """Detect multiple incremental updates indicating post-issuance file changes (A-PDF-02)."""
        anomalies: list[AnomalyResult] = []
        if xref_count >= 2:
            anomalies.append(
                AnomalyResult(
                    code="A-PDF-02",
                    severity="WARN",
                    points=8,
                    title="Multiple Incremental Updates",
                    description=(
                        f"Risk signal: Document '{doc_type}' contains {xref_count} incremental PDF revisions — "
                        "potential post-generation alteration; requires review."
                    ),
                    evidence={"xref_count": xref_count, "doc_type": doc_type},
                )
            )
        return anomalies

    def scan_injection_text(
        self,
        text: str,
        page_no: int = 1,
        doc_type: str = "DOCUMENT",
    ) -> list[AnomalyResult]:
        """Scan text layer for adversarial prompt injection strings attempting to influence evaluation (A-INJ-01)."""
        anomalies: list[AnomalyResult] = []
        if not text:
            return anomalies

        for pattern in self.INJECTION_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                anomalies.append(
                    AnomalyResult(
                        code="A-INJ-01",
                        severity="CRITICAL",
                        points=20,
                        title="Adversarial Prompt Pattern Detected",
                        description=(
                            f"Risk signal: Text on page {page_no} contains phrasing attempting to override "
                            f"evaluation criteria ('{match.group(0)}') — potential anomaly detected; requires review."
                        ),
                        evidence={
                            "matched_phrase": match.group(0),
                            "page_no": page_no,
                            "doc_type": doc_type,
                        },
                    )
                )
                break

        return anomalies

    def scan_cross_bidder_links(
        self,
        target_bidder_id: str,
        all_bidders_data: list[dict[str, Any]],
    ) -> list[AnomalyResult]:
        """Detect shared metadata, authors, phones, emails, or directors between distinct bidders."""
        anomalies: list[AnomalyResult] = []
        target = next((b for b in all_bidders_data if b.get("bidder_id") == target_bidder_id), None)
        if not target:
            return anomalies

        target_author_raw = str(target.get("pdf_author") or "").strip()
        target_author = target_author_raw.lower()
        target_phone = str(target.get("phone") or "").strip()
        target_email = str(target.get("email") or "").strip().lower()
        target_bank = str(target.get("bank_account") or "").strip()

        for other in all_bidders_data:
            other_id = other.get("bidder_id")
            if other_id == target_bidder_id:
                continue

            other_name = other.get("company_name", f"Bidder {other_id}")

            # 1. Cross-bidder author / producer collision (A-XB-01)
            other_author = str(other.get("pdf_author") or "").strip().lower()
            if target_author and len(target_author) > 3 and target_author == other_author:
                anomalies.append(
                    AnomalyResult(
                        code="A-XB-01",
                        severity="CRITICAL",
                        points=10,
                        title="Cross-Bidder Metadata Collision",
                        description=(
                            f"Risk signal: Identical PDF author '{target_author_raw}' shared with {other_name} — "
                            "potential common document preparation; requires review."
                        ),
                        evidence={
                            "shared_attribute": "pdf_author",
                            "shared_value": target_author_raw,
                            "colliding_bidder": other_name,
                        },
                    )
                )

            # 2. Shared contact or bank details (A-XB-02)
            other_phone = str(other.get("phone") or "").strip()
            other_bank = str(other.get("bank_account") or "").strip()

            if target_phone and len(target_phone) >= 10 and target_phone == other_phone:
                anomalies.append(
                    AnomalyResult(
                        code="A-XB-02",
                        severity="CRITICAL",
                        points=15,
                        title="Cross-Bidder Shared Phone Number",
                        description=(
                            f"Risk signal: Contact phone '{target_phone}' is shared with {other_name} — "
                            "potential related-party bidding; requires review."
                        ),
                        evidence={
                            "shared_attribute": "phone",
                            "shared_value": target_phone,
                            "colliding_bidder": other_name,
                        },
                    )
                )

            if target_bank and len(target_bank) >= 8 and target_bank == other_bank:
                anomalies.append(
                    AnomalyResult(
                        code="A-XB-02",
                        severity="CRITICAL",
                        points=15,
                        title="Cross-Bidder Shared Bank Account",
                        description=(
                            f"Risk signal: Bank account number is shared with {other_name} — "
                            "potential related-party bidding; requires review."
                        ),
                        evidence={
                            "shared_attribute": "bank_account",
                            "shared_value": target_bank,
                            "colliding_bidder": other_name,
                        },
                    )
                )

        return anomalies
