"""Structured Extractor for Indian Permanent Account Number (PAN) Cards."""

import re
from typing import Any, Optional

from pipeline.extraction.base import BaseExtractor, ExtractedFieldDTO
from pipeline.extraction.validators import (
    PAN_ENTITY_TYPES,
    normalize_date,
    normalize_org_name,
    normalize_pan,
    validate_pan,
)


class PANExtractor(BaseExtractor):
    """Deterministic extractor for Indian PAN Cards (Individual or Corporate)."""

    PAN_REGEX = re.compile(r"\b([A-Z]{5}[0-9]{4}[A-Z])\b")

    def extract(
        self,
        pages: list[dict[str, Any]],
        source_document: Optional[str] = None,
    ) -> list[ExtractedFieldDTO]:
        """Extract PAN number, legal name, date of birth/incorporation, and entity status."""
        fields: list[ExtractedFieldDTO] = []
        if not pages:
            return fields

        p1 = pages[0]
        text = p1.get("text", "") or ""
        page_no = p1.get("page_no", 1)

        # 1. PAN Number Extraction
        pan_match = self.PAN_REGEX.search(text)
        pan_val = pan_match.group(1) if pan_match else None

        if pan_val:
            is_valid, err = validate_pan(pan_val)
            norm_pan = normalize_pan(pan_val)
            fields.append(
                ExtractedFieldDTO(
                    field_name="pan",
                    value=pan_val,
                    normalized_value=norm_pan,
                    confidence=0.99 if is_valid else 0.75,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="regex",
                    raw=pan_match.group(0),
                    is_valid=is_valid,
                    validation_error=err,
                )
            )

            # Extract Entity Type from 4th char
            entity_code = norm_pan[3]
            entity_type = PAN_ENTITY_TYPES.get(entity_code, "Unknown")
            fields.append(
                ExtractedFieldDTO(
                    field_name="entity_type",
                    value=entity_type,
                    normalized_value=entity_type.upper(),
                    confidence=0.95,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="anchor",
                    raw=f"Derived from 4th char '{entity_code}' of PAN {norm_pan}",
                )
            )

        # 2. Legal / Cardholder Name Extraction
        # In PAN cards, name is typically near "Name", "Name / Name of Entity", or lines right after Govt header
        name_match = re.search(
            r"(?:name|name\s+of\s+the\s+entity)\s*[:\-]?\s*([A-Za-z\s\.\&]+)",
            text,
            re.IGNORECASE,
        )
        if name_match:
            raw_name = name_match.group(1).strip()
            # Clean trailing label bleed
            clean_name = re.split(r"\b(?:father|date|dob|permanent)\b", raw_name, flags=re.IGNORECASE)[0].strip()
            if clean_name and len(clean_name) > 2:
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

        # 3. Date of Birth or Date of Incorporation
        date_match = re.search(
            r"(?:date\s+of\s+birth|dob|date\s+of\s+incorporation|incorporation\s+date)\s*[:\-]?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})",
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

        # 4. Status
        fields.append(
            ExtractedFieldDTO(
                field_name="status",
                value="ACTIVE",
                normalized_value="ACTIVE",
                confidence=0.95 if pan_val else 0.70,
                source_document=source_document,
                page=page_no,
                extraction_method="heuristic",
                raw="Valid PAN Card Record",
            )
        )

        return fields
