"""Structured Extractor for Udyam MSME Registration Certificates."""

import re
from typing import Any, Optional

from pipeline.extraction.base import BaseExtractor, ExtractedFieldDTO
from pipeline.extraction.validators import (
    normalize_date,
    normalize_org_name,
    normalize_pan,
    normalize_udyam,
    validate_pan,
    validate_udyam,
)


class UdyamExtractor(BaseExtractor):
    """Deterministic extractor for Indian Udyam Registration Certificates."""

    UDYAM_REGEX = re.compile(r"\b(UDYAM-[A-Z]{2}-[0-9]{2}-[0-9]{7})\b")
    PAN_REGEX = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b")

    def extract(
        self,
        pages: list[dict[str, Any]],
        source_document: Optional[str] = None,
    ) -> list[ExtractedFieldDTO]:
        """Extract Udyam number, enterprise name, MSME type, major activity, date, and address."""
        fields: list[ExtractedFieldDTO] = []
        if not pages:
            return fields

        p1 = pages[0]
        text = p1.get("text", "") or ""
        page_no = p1.get("page_no", 1)

        # 1. Udyam Registration Number
        udyam_match = self.UDYAM_REGEX.search(text)
        udyam_val = udyam_match.group(1) if udyam_match else None

        if udyam_val:
            is_valid, err = validate_udyam(udyam_val)
            norm_udyam = normalize_udyam(udyam_val)
            fields.append(
                ExtractedFieldDTO(
                    field_name="udyam_number",
                    value=udyam_val,
                    normalized_value=norm_udyam,
                    confidence=0.99 if is_valid else 0.75,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="regex",
                    raw=udyam_match.group(0),
                    is_valid=is_valid,
                    validation_error=err,
                )
            )

        # 2. Enterprise Name / Legal Name
        name_match = re.search(
            r"(?:name\s+of\s+enterprise|enterprise\s+name|name\s+of\s+the\s+enterprise)\s*[:\-]?\s*([^\n\r]+)",
            text,
            re.IGNORECASE,
        )
        if name_match:
            raw_name = name_match.group(1).strip()
            clean_name = re.split(r"\b(?:type\s+of|major\s+activity|social\s+category)\b", raw_name, flags=re.IGNORECASE)[0].strip()
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
                        raw=name_match.group(0),
                    )
                )

        # 3. Enterprise Type (Micro / Small / Medium)
        type_match = re.search(
            r"(?:type\s+of\s+enterprise|enterprise\s+type)\s*[:\-]?\s*\b(micro|small|medium)\b",
            text,
            re.IGNORECASE,
        )
        if type_match:
            raw_type = type_match.group(1).strip().upper()
            fields.append(
                ExtractedFieldDTO(
                    field_name="enterprise_type",
                    value=raw_type,
                    normalized_value=raw_type,
                    confidence=0.98,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="anchor",
                    raw=type_match.group(0),
                )
            )

        # 4. Major Activity (Manufacturing / Services)
        act_match = re.search(
            r"(?:major\s+activity)\s*[:\-]?\s*\b(manufacturing|services|trading)\b",
            text,
            re.IGNORECASE,
        )
        if act_match:
            raw_act = act_match.group(1).strip().upper()
            fields.append(
                ExtractedFieldDTO(
                    field_name="major_activity",
                    value=raw_act,
                    normalized_value=raw_act,
                    confidence=0.95,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="anchor",
                    raw=act_match.group(0),
                )
            )

        # 5. Registration Date
        date_match = re.search(
            r"(?:date\s+of\s+udyam\s+registration|date\s+of\s+registration|registration\s+date)\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})",
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

        # 6. Address / Location of Plant / Official Address
        addr_match = re.search(
            r"(?:official\s+address\s+of\s+enterprise|address)\s*[:\-]?\s*([\s\S]+?)(?=\b(?:date\s+of|national\s+industry|acknowledgement|bank)\b|\n\s*\n|$)",
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

        # 7. Optional PAN if printed on certificate
        pan_match = self.PAN_REGEX.search(text)
        if pan_match:
            pan_val = pan_match.group(1)
            is_pan_valid, _ = validate_pan(pan_val)
            if is_pan_valid:
                fields.append(
                    ExtractedFieldDTO(
                        field_name="pan",
                        value=pan_val,
                        normalized_value=normalize_pan(pan_val),
                        confidence=0.92,
                        source_document=source_document,
                        page=page_no,
                        extraction_method="regex",
                        raw=pan_match.group(0),
                    )
                )

        # 8. Status
        fields.append(
            ExtractedFieldDTO(
                field_name="status",
                value="ACTIVE",
                normalized_value="ACTIVE",
                confidence=0.95 if udyam_val else 0.70,
                source_document=source_document,
                page=page_no,
                extraction_method="heuristic",
                raw="Valid Udyam Registration",
            )
        )

        return fields
