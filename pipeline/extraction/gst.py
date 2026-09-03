"""Structured Extractor for Form GST REG-06 Registration Certificates."""

import re
from typing import Any, Optional

from pipeline.extraction.base import BaseExtractor, ExtractedFieldDTO
from pipeline.extraction.validators import (
    normalize_date,
    normalize_gstin,
    normalize_org_name,
    normalize_pan,
    validate_gstin,
    validate_pan,
)


class GSTExtractor(BaseExtractor):
    """Deterministic extractor for Indian Form GST REG-06 statutory certificates."""

    GSTIN_PATTERN = re.compile(r"\b([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z])\b")
    PAN_PATTERN = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b")

    def extract(
        self,
        pages: list[dict[str, Any]],
        source_document: Optional[str] = None,
    ) -> list[ExtractedFieldDTO]:
        """Extract GSTIN, legal name, trade name, constitution, address, date, status, and PAN."""
        fields: list[ExtractedFieldDTO] = []
        if not pages:
            return fields

        # Inspect page 1 where statutory headers reside
        p1 = pages[0]
        text = p1.get("text", "") or ""
        page_no = p1.get("page_no", 1)

        # 1. GSTIN Extraction
        gstin_match = self.GSTIN_PATTERN.search(text)
        gstin_val = gstin_match.group(1) if gstin_match else None
        if gstin_val:
            is_valid, err = validate_gstin(gstin_val)
            norm_gstin = normalize_gstin(gstin_val)
            fields.append(
                ExtractedFieldDTO(
                    field_name="gstin",
                    value=gstin_val,
                    normalized_value=norm_gstin,
                    confidence=0.99 if is_valid else 0.80,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="regex",
                    raw=gstin_match.group(0),
                    is_valid=is_valid,
                    validation_error=err,
                )
            )

            # 2. Embedded PAN Extraction
            embedded_pan = norm_gstin[2:12]
            pan_valid, pan_err = validate_pan(embedded_pan)
            fields.append(
                ExtractedFieldDTO(
                    field_name="pan",
                    value=embedded_pan,
                    normalized_value=normalize_pan(embedded_pan),
                    confidence=0.99 if pan_valid else 0.80,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="anchor",
                    raw=f"Derived from GSTIN {norm_gstin}",
                    is_valid=pan_valid,
                    validation_error=pan_err,
                )
            )

        # 3. Legal Name Extraction
        # Anchors: "Legal Name", "Name of Business"
        legal_name_match = re.search(
            r"(?:legal\s+name|name\s+of\s+business)\s*[:\-]?\s*([^\n\r]+)",
            text,
            re.IGNORECASE,
        )
        if legal_name_match:
            raw_name = legal_name_match.group(1).strip()
            # Clean up trailing label bleed
            clean_name = re.split(r"\b(?:trade\s+name|constitution|address)\b", raw_name, flags=re.IGNORECASE)[0].strip()
            if clean_name:
                fields.append(
                    ExtractedFieldDTO(
                        field_name="legal_name",
                        value=clean_name,
                        normalized_value=normalize_org_name(clean_name),
                        confidence=0.95,
                        source_document=source_document,
                        page=page_no,
                        extraction_method="anchor",
                        raw=legal_name_match.group(0),
                    )
                )

        # 4. Trade Name Extraction
        trade_name_match = re.search(
            r"trade\s+name\s*[:\-]?\s*([^\n\r]+)",
            text,
            re.IGNORECASE,
        )
        if trade_name_match:
            raw_trade = trade_name_match.group(1).strip()
            clean_trade = re.split(r"\b(?:constitution|address|date)\b", raw_trade, flags=re.IGNORECASE)[0].strip()
            if clean_trade:
                fields.append(
                    ExtractedFieldDTO(
                        field_name="trade_name",
                        value=clean_trade,
                        normalized_value=normalize_org_name(clean_trade),
                        confidence=0.92,
                        source_document=source_document,
                        page=page_no,
                        extraction_method="anchor",
                        raw=trade_name_match.group(0),
                    )
                )

        # 5. Constitution of Business
        constitution_match = re.search(
            r"constitution\s+of\s+business\s*[:\-]?\s*([^\n\r]+)",
            text,
            re.IGNORECASE,
        )
        if constitution_match:
            raw_const = constitution_match.group(1).strip()
            clean_const = re.split(r"\b(?:address|date|period)\b", raw_const, flags=re.IGNORECASE)[0].strip()
            if clean_const:
                fields.append(
                    ExtractedFieldDTO(
                        field_name="constitution",
                        value=clean_const,
                        normalized_value=clean_const.upper(),
                        confidence=0.95,
                        source_document=source_document,
                        page=page_no,
                        extraction_method="anchor",
                        raw=constitution_match.group(0),
                    )
                )

        # 6. Address Extraction
        addr_match = re.search(
            r"(?:address\s+of\s+principal\s+place\s+of\s+business|principal\s+place\s+of\s+business)\s*[:\-]?\s*([\s\S]+?)(?=\b(?:date\s+of|jurisdiction|particulars|period)\b|\n\s*\n|$)",
            text,
            re.IGNORECASE,
        )
        if addr_match:
            raw_addr = " ".join(addr_match.group(1).split())
            if raw_addr:
                fields.append(
                    ExtractedFieldDTO(
                        field_name="address",
                        value=raw_addr,
                        normalized_value=" ".join(raw_addr.upper().split()),
                        confidence=0.90,
                        source_document=source_document,
                        page=page_no,
                        extraction_method="anchor",
                        raw=addr_match.group(0)[:100],
                    )
                )

        # 7. Registration Date
        date_match = re.search(
            r"(?:date\s+of\s+liability|date\s+of\s+validity|registration\s+date|date\s+of\s+issue)\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4}|[0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})",
            text,
            re.IGNORECASE,
        )
        if date_match:
            raw_date = date_match.group(1).strip()
            norm_date = normalize_date(raw_date)
            fields.append(
                ExtractedFieldDTO(
                    field_name="registration_date",
                    value=raw_date,
                    normalized_value=norm_date,
                    confidence=0.95,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="anchor",
                    raw=date_match.group(0),
                )
            )

        # 8. Status
        status_match = re.search(r"\b(active|registered|cancelled|suspended)\b", text, re.IGNORECASE)
        status_val = status_match.group(1).upper() if status_match else "ACTIVE"
        fields.append(
            ExtractedFieldDTO(
                field_name="status",
                value=status_val,
                normalized_value=status_val,
                confidence=0.90,
                source_document=source_document,
                page=page_no,
                extraction_method="heuristic",
                raw=status_match.group(0) if status_match else "Inferred from valid registration certificate",
            )
        )

        return fields
