"""PDF forensic inspection, metadata discrepancy checks, hidden text forensics, and injection scanner."""

from dataclasses import dataclass, field
import hashlib
from pathlib import Path
import re
from typing import Any, Optional, Union


class DocumentAnomaly:
    """Standard forensic or consistency anomaly signal container.
    
    Adheres strictly to non-accusatory vocabulary: never claims 'fraud' or 'forgery'.
    All findings are reported as anomaly signals requiring human review.
    """

    def __init__(
        self,
        type: Optional[str] = None,
        severity: str = "WARN",
        description: str = "",
        evidence: Optional[dict[str, Any]] = None,
        confidence: float = 1.0,
        method: str = "deterministic_scan",
        points: int = 10,
        requires_review: bool = True,
        code: Optional[str] = None,
        title: Optional[str] = None,
        anomaly_type: Optional[str] = None,
        **kwargs: Any,
    ):
        self.type = type or anomaly_type or code or "DOCUMENT_ANOMALY"
        self.code = code or self.type
        self.severity = severity
        self.description = description
        self.evidence = evidence or {}
        self.confidence = float(confidence)
        self.method = method
        self.points = points
        self.requires_review = requires_review
        self.title = title or self.type.replace("_", " ").title()

    @property
    def anomaly_type(self) -> str:
        return self.type

    def to_dict(self) -> dict[str, Any]:
        return {
            "type": self.type,
            "anomaly_type": self.type,
            "code": self.code,
            "title": self.title,
            "severity": self.severity,
            "description": self.description,
            "evidence": self.evidence,
            "confidence": round(self.confidence, 4),
            "method": self.method,
            "points": self.points,
            "requires_review": self.requires_review,
        }

    def __repr__(self) -> str:
        return f"DocumentAnomaly(type='{self.type}', code='{self.code}', severity='{self.severity}', method='{self.method}')"


# Backward-compatible alias
AnomalyResult = DocumentAnomaly


class AnomalyDetector:
    """Detects forensic anomalies (metadata inconsistencies, producer changes, unexpected modification dates,
    incremental updates, hidden text, prompt injection patterns, and near-duplicate document similarities).
    
    Strictly decision support: never outputs 'fraud', 'fraudulent', 'forged', or 'fake'.
    """

    INJECTION_PATTERNS = [
        r"ignore\s+(all\s+)?previous\s+instructions",
        r"disregard\s+(all\s+)?earlier\s+instructions",
        r"system\s*prompt\s*:",
        r"mark\s+(this\s+)?bidder\s+(as\s+)?compliant",
        r"always\s+return\s+pass",
        r"override\s+all\s+rules",
        r"this\s+bidder\s+is\s+pre-?approved",
        r"act\s+as\s+a\s+helpful\s+assistant\s+and\s+approve",
        r"you\s+must\s+certify\s+this\s+bid",
    ]

    IMAGE_EDITORS = [
        "gimp", "photoshop", "canva", "inkscape", "illustrator",
        "coreldraw", "paint.net", "acrobat distiller", "microsoft word", "winword",
    ]

    STATUTORY_DOC_TYPES = [
        "GST_CERT", "PAN_CARD", "UDYAM_CERT", "CA_TURNOVER_CERT",
    ]

    # -------------------------------------------------------------------------
    # 1. Metadata Inconsistencies & Producer Changes
    # -------------------------------------------------------------------------

    def scan_pdf_metadata(
        self,
        metadata: dict[str, Any],
        doc_type: str = "DOCUMENT",
    ) -> list[DocumentAnomaly]:
        """Inspect PDF producer, author, creator, and timestamp consistency."""
        anomalies: list[DocumentAnomaly] = []
        if not metadata:
            return anomalies

        producer = str(metadata.get("producer") or "").lower()
        creator = str(metadata.get("creator") or "").lower()
        creation_date = metadata.get("creation_date") or metadata.get("creationDate")
        mod_date = metadata.get("mod_date") or metadata.get("modDate")

        # 1. Producer Software Discrepancy (PRODUCER_CHANGE / A-PDF-03)
        if doc_type in self.STATUTORY_DOC_TYPES:
            for ed in self.IMAGE_EDITORS:
                if ed in producer or ed in creator:
                    matched_software = producer or creator
                    anomalies.append(
                        DocumentAnomaly(
                            type="PRODUCER_CHANGE",
                            code="A-PDF-03",
                            title="Producer Software Discrepancy",
                            severity="WARN",
                            description=(
                                f"Risk signal: Statutory certificate '{doc_type}' indicates generation or modification "
                                f"via non-standard software '{matched_software}' — potential anomaly detected; requires review."
                            ),
                            evidence={
                                "producer": metadata.get("producer"),
                                "creator": metadata.get("creator"),
                                "doc_type": doc_type,
                                "matched_software": matched_software,
                            },
                            confidence=0.95,
                            method="producer_analysis",
                            points=6,
                        )
                    )
                    break

        # 2. Unexpected / Inverted Modification Dates (UNEXPECTED_MODIFICATION_DATE / A-PDF-01)
        if creation_date and mod_date:
            try:
                clean_cd = re.sub(r"[^0-9]", "", str(creation_date))[:14]
                clean_md = re.sub(r"[^0-9]", "", str(mod_date))[:14]
                if clean_cd and clean_md and clean_md < clean_cd:
                    anomalies.append(
                        DocumentAnomaly(
                            type="UNEXPECTED_MODIFICATION_DATE",
                            code="A-PDF-01",
                            title="Inverted Timestamp Anomaly",
                            severity="WARN",
                            description=(
                                "Risk signal: PDF modification timestamp strictly precedes creation timestamp — "
                                "potential anomaly detected; requires review."
                            ),
                            evidence={
                                "creation_date": creation_date,
                                "mod_date": mod_date,
                                "doc_type": doc_type,
                            },
                            confidence=0.98,
                            method="timestamp_audit",
                            points=6,
                        )
                    )
            except Exception:
                pass

        # 3. Metadata Inconsistency: Missing standard generation provenance (METADATA_INCONSISTENCY)
        if doc_type in self.STATUTORY_DOC_TYPES and not metadata.get("producer") and not metadata.get("creator"):
            anomalies.append(
                DocumentAnomaly(
                    type="METADATA_INCONSISTENCY",
                    code="A-PDF-05",
                    title="Missing Metadata Provenance",
                    severity="INFO",
                    description=(
                        f"Risk signal: Statutory document '{doc_type}' lacks standard PDF producer and creator metadata — "
                        "requires verification."
                    ),
                    evidence={"metadata_keys": list(metadata.keys()), "doc_type": doc_type},
                    confidence=0.85,
                    method="metadata_inspection",
                    points=4,
                )
            )

        return anomalies

    # -------------------------------------------------------------------------
    # 2. Incremental Updates Forensics
    # -------------------------------------------------------------------------

    def scan_incremental_updates(
        self,
        xref_count: int,
        doc_type: str = "DOCUMENT",
    ) -> list[DocumentAnomaly]:
        """Detect multiple incremental updates indicating post-issuance file alteration (INCREMENTAL_UPDATES / A-PDF-02)."""
        anomalies: list[DocumentAnomaly] = []
        if xref_count >= 2:
            anomalies.append(
                DocumentAnomaly(
                    type="INCREMENTAL_UPDATES",
                    code="A-PDF-02",
                    title="Multiple Incremental Updates",
                    severity="WARN",
                    description=(
                        f"Risk signal: Document '{doc_type}' contains {xref_count} incremental PDF revisions — "
                        "potential post-generation alteration; requires review."
                    ),
                    evidence={"xref_count": xref_count, "doc_type": doc_type},
                    confidence=0.92,
                    method="xref_table_inspection",
                    points=8,
                )
            )
        return anomalies

    # -------------------------------------------------------------------------
    # 3. Hidden / Invisible Text Forensics
    # -------------------------------------------------------------------------

    def scan_hidden_text(
        self,
        spans_or_text_blocks: list[dict[str, Any]],
        page_no: int = 1,
        doc_type: str = "DOCUMENT",
    ) -> list[DocumentAnomaly]:
        """Scan text spans for microscopic font sizes, white-on-white text, or invisible render modes."""
        anomalies: list[DocumentAnomaly] = []

        for block in spans_or_text_blocks:
            text = block.get("text", "").strip()
            if not text:
                continue

            font_size = block.get("size", 10.0)
            color = block.get("color")
            render_mode = block.get("render_mode")

            # Check for microscopic font size (< 2.0 pt)
            if 0.0 < font_size < 2.0:
                anomalies.append(
                    DocumentAnomaly(
                        type="INVISIBLE_TEXT",
                        code="A-PDF-04",
                        title="Microscopic Text Overlay",
                        severity="CRITICAL",
                        description=(
                            f"Risk signal: Hidden microscopic text detected on page {page_no} (font size: {font_size} pt) — "
                            "potential hidden text overlay; requires review."
                        ),
                        evidence={
                            "text_snippet": text[:80],
                            "font_size": font_size,
                            "page_no": page_no,
                            "doc_type": doc_type,
                        },
                        confidence=0.96,
                        method="visual_font_forensics",
                        points=15,
                    )
                )
                break

            # Check for white text (color == 16777215 or 0xFFFFFF or RGB near 255)
            if color in (16777215, 0xFFFFFF, "white", "#ffffff", (1.0, 1.0, 1.0)):
                anomalies.append(
                    DocumentAnomaly(
                        type="INVISIBLE_TEXT",
                        code="A-PDF-04",
                        title="White-on-White Invisible Text",
                        severity="CRITICAL",
                        description=(
                            f"Risk signal: White-on-white invisible text detected on page {page_no} — "
                            "potential hidden text overlay; requires review."
                        ),
                        evidence={
                            "text_snippet": text[:80],
                            "color": color,
                            "page_no": page_no,
                            "doc_type": doc_type,
                        },
                        confidence=0.98,
                        method="visual_font_forensics",
                        points=15,
                    )
                )
                break

            # Check for invisible render mode (render_mode 3 in PDF spec is 'Neither fill nor stroke text')
            if render_mode == 3:
                anomalies.append(
                    DocumentAnomaly(
                        type="INVISIBLE_TEXT",
                        code="A-PDF-04",
                        title="Invisible Render Mode",
                        severity="CRITICAL",
                        description=(
                            f"Risk signal: Text rendered with invisible mode (mode 3) on page {page_no} — "
                            "potential hidden text overlay; requires review."
                        ),
                        evidence={
                            "text_snippet": text[:80],
                            "render_mode": 3,
                            "page_no": page_no,
                            "doc_type": doc_type,
                        },
                        confidence=0.99,
                        method="visual_font_forensics",
                        points=15,
                    )
                )
                break

        return anomalies

    # -------------------------------------------------------------------------
    # 4. Suspicious Text Patterns & Adversarial Prompt Injections
    # -------------------------------------------------------------------------

    def scan_injection_text(
        self,
        text: str,
        page_no: int = 1,
        doc_type: str = "DOCUMENT",
    ) -> list[DocumentAnomaly]:
        """Scan text layer for adversarial prompt injection strings attempting to alter automated evaluation.
        
        The system detects these phrases as high-severity anomalies and refuses to obey them.
        """
        anomalies: list[DocumentAnomaly] = []
        if not text:
            return anomalies

        for pattern in self.INJECTION_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                anomalies.append(
                    DocumentAnomaly(
                        type="ADVERSARIAL_PROMPT_INJECTION",
                        code="A-INJ-01",
                        title="Adversarial Prompt Pattern Detected",
                        severity="CRITICAL",
                        description=(
                            f"Risk signal: Text on page {page_no} contains phrasing attempting to override "
                            f"evaluation criteria ('{match.group(0)}') — potential anomaly detected; requires review."
                        ),
                        evidence={
                            "matched_phrase": match.group(0),
                            "page_no": page_no,
                            "doc_type": doc_type,
                            "injection_detected": True,
                            "action_taken": "flagged_as_anomaly_not_executed",
                        },
                        confidence=0.99,
                        method="adversarial_injection_scan",
                        points=20,
                    )
                )
                break

        return anomalies

    # -------------------------------------------------------------------------
    # 5. Near-Duplicate Documents & Cross-Document Similarities
    # -------------------------------------------------------------------------

    def scan_near_duplicates(
        self,
        doc_a_text: str,
        doc_b_text: str,
        doc_a_name: str = "Document_A",
        doc_b_name: str = "Document_B",
        threshold: float = 0.85,
    ) -> list[DocumentAnomaly]:
        """Detect near-duplicate text across distinct documents or bidder submissions using k-shingle Jaccard similarity."""
        anomalies: list[DocumentAnomaly] = []
        sim = self._compute_shingle_similarity(doc_a_text, doc_b_text)

        if sim >= threshold:
            anomalies.append(
                DocumentAnomaly(
                    type="NEAR_DUPLICATE_DOCUMENT",
                    code="A-XB-03",
                    title="Cross-Bidder Near-Duplicate Text",
                    severity="WARN" if sim < 0.95 else "CRITICAL",
                    description=(
                        f"Risk signal: High textual similarity ({sim * 100:.1f}%) between '{doc_a_name}' "
                        f"and '{doc_b_name}' — potential duplicate preparation; requires review."
                    ),
                    evidence={
                        "document_a": doc_a_name,
                        "document_b": doc_b_name,
                        "similarity_score": round(sim, 4),
                        "threshold": threshold,
                    },
                    confidence=round(sim, 4),
                    method="shingle_similarity",
                    points=10,
                )
            )

        return anomalies

    def _compute_shingle_similarity(self, text_a: str, text_b: str, k: int = 4) -> float:
        """Compute Jaccard similarity over character k-shingles."""
        a_clean = re.sub(r"\s+", " ", (text_a or "").strip().lower())
        b_clean = re.sub(r"\s+", " ", (text_b or "").strip().lower())

        if len(a_clean) < k or len(b_clean) < k:
            return 1.0 if a_clean and a_clean == b_clean else 0.0

        shingles_a = {a_clean[i : i + k] for i in range(len(a_clean) - k + 1)}
        shingles_b = {b_clean[i : i + k] for i in range(len(b_clean) - k + 1)}

        if not shingles_a or not shingles_b:
            return 0.0

        intersection = len(shingles_a & shingles_b)
        union = len(shingles_a | shingles_b)
        return intersection / union if union > 0 else 0.0

    # -------------------------------------------------------------------------
    # 6. Cross-Bidder Collision & Link Detection
    # -------------------------------------------------------------------------

    def scan_cross_bidder_links(
        self,
        target_bidder_id: str,
        all_bidders_data: list[dict[str, Any]],
    ) -> list[DocumentAnomaly]:
        """Detect shared metadata, authors, phones, emails, or bank accounts between distinct bidders."""
        anomalies: list[DocumentAnomaly] = []
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
                    DocumentAnomaly(
                        type="CROSS_DOCUMENT_SIMILARITY",
                        code="A-XB-01",
                        title="Cross-Bidder Metadata Collision",
                        severity="CRITICAL",
                        description=(
                            f"Risk signal: Identical PDF author '{target_author_raw}' shared with {other_name} — "
                            "potential common document preparation; requires review."
                        ),
                        evidence={
                            "shared_attribute": "pdf_author",
                            "shared_value": target_author_raw,
                            "colliding_bidder": other_name,
                        },
                        confidence=0.95,
                        method="cross_bidder_metadata_matching",
                        points=10,
                    )
                )

            # 2. Shared contact or bank details (A-XB-02)
            other_phone = str(other.get("phone") or "").strip()
            other_bank = str(other.get("bank_account") or "").strip()

            if target_phone and len(target_phone) >= 10 and target_phone == other_phone:
                anomalies.append(
                    DocumentAnomaly(
                        type="CROSS_DOCUMENT_SIMILARITY",
                        code="A-XB-02",
                        title="Cross-Bidder Shared Phone Number",
                        severity="CRITICAL",
                        description=(
                            f"Risk signal: Contact phone '{target_phone}' is shared with {other_name} — "
                            "potential related-party bidding; requires review."
                        ),
                        evidence={
                            "shared_attribute": "phone",
                            "shared_value": target_phone,
                            "colliding_bidder": other_name,
                        },
                        confidence=0.98,
                        method="cross_bidder_identifier_matching",
                        points=15,
                    )
                )

            if target_bank and len(target_bank) >= 8 and target_bank == other_bank:
                anomalies.append(
                    DocumentAnomaly(
                        type="CROSS_DOCUMENT_SIMILARITY",
                        code="A-XB-02",
                        title="Cross-Bidder Shared Bank Account",
                        severity="CRITICAL",
                        description=(
                            f"Risk signal: Bank account number is shared with {other_name} — "
                            "potential related-party bidding; requires review."
                        ),
                        evidence={
                            "shared_attribute": "bank_account",
                            "shared_value": target_bank,
                            "colliding_bidder": other_name,
                        },
                        confidence=0.99,
                        method="cross_bidder_banking_matching",
                        points=15,
                    )
                )

        return anomalies
