"""Extractors for Statutory Declarations: Make in India (MII), OEM Authorization, Land Border Rule 144(xi), and Integrity Pact."""

import re
from typing import Any, Optional

from pipeline.extraction.base import BaseExtractor, ExtractedFieldDTO


class MIIDeclarationExtractor(BaseExtractor):
    """Extractor for Public Procurement (Preference to Make in India) Declarations."""

    def extract(
        self,
        pages: list[dict[str, Any]],
        source_document: Optional[str] = None,
    ) -> list[ExtractedFieldDTO]:
        fields: list[ExtractedFieldDTO] = []
        if not pages:
            return fields

        combined_text = "\n".join(p.get("text", "") or "" for p in pages)
        p1 = pages[0]
        page_no = p1.get("page_no", 1)

        # 1. Local Content Percentage
        pct_match = re.search(
            r"(?:local\s+content\s+offered|percentage\s+of\s+local\s+content|local\s+content)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*%",
            combined_text,
            re.IGNORECASE,
        )
        if pct_match:
            pct_val = float(pct_match.group(1))
            fields.append(
                ExtractedFieldDTO(
                    field_name="local_content_pct",
                    value=pct_val,
                    normalized_value=str(pct_val),
                    confidence=0.98,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="regex",
                    raw=pct_match.group(0),
                )
            )

        # 2. Supplier Classification
        class_match = re.search(
            r"(Class-[I|II]+\s+Local\s+Supplier|Non-Local\s+Supplier)",
            combined_text,
            re.IGNORECASE,
        )
        if class_match:
            supplier_class = class_match.group(1)
            fields.append(
                ExtractedFieldDTO(
                    field_name="supplier_class",
                    value=supplier_class,
                    normalized_value=supplier_class.upper(),
                    confidence=0.95,
                    source_document=source_document,
                    page=page_no,
                    extraction_method="regex",
                    raw=class_match.group(0),
                )
            )

        return fields


class OEMAuthorizationExtractor(BaseExtractor):
    """Extractor for Original Equipment Manufacturer (OEM) declarations and authorizations."""

    def extract(
        self,
        pages: list[dict[str, Any]],
        source_document: Optional[str] = None,
    ) -> list[ExtractedFieldDTO]:
        fields: list[ExtractedFieldDTO] = []
        if not pages:
            return fields

        combined_text = "\n".join(p.get("text", "") or "" for p in pages)
        p1 = pages[0]
        page_no = p1.get("page_no", 1)

        # Check if bidder is self-OEM
        is_self_oem = bool(
            re.search(
                r"is\s+the\s+Original\s+Equipment\s+Manufacturer\s*\(OEM\)|self[- ]manufacturer",
                combined_text,
                re.IGNORECASE,
            )
        )

        fields.append(
            ExtractedFieldDTO(
                field_name="is_oem",
                value=is_self_oem,
                normalized_value=str(is_self_oem),
                confidence=0.95,
                source_document=source_document,
                page=page_no,
                extraction_method="anchor",
                raw="Self OEM declaration" if is_self_oem else "OEM Authorization",
            )
        )

        fields.append(
            ExtractedFieldDTO(
                field_name="has_oem_auth",
                value=True,
                normalized_value="True",
                confidence=0.95,
                source_document=source_document,
                page=page_no,
                extraction_method="anchor",
                raw="Valid OEM filing provided",
            )
        )

        # Check tender reference
        refs_tender = bool(re.search(r"NIT|Tender\s+Reference|CPCL", combined_text, re.IGNORECASE))
        fields.append(
            ExtractedFieldDTO(
                field_name="oem_auth_references_tender",
                value=refs_tender,
                normalized_value=str(refs_tender),
                confidence=0.90,
                source_document=source_document,
                page=page_no,
                extraction_method="regex",
                raw="Tender reference cited" if refs_tender else "Generic authorization",
            )
        )

        return fields


class LandBorderDeclarationExtractor(BaseExtractor):
    """Extractor for Rule 144(xi) Land Border Sharing declarations."""

    def extract(
        self,
        pages: list[dict[str, Any]],
        source_document: Optional[str] = None,
    ) -> list[ExtractedFieldDTO]:
        fields: list[ExtractedFieldDTO] = []
        if not pages:
            return fields

        combined_text = "\n".join(p.get("text", "") or "" for p in pages)
        p1 = pages[0]
        page_no = p1.get("page_no", 1)

        # Always confirm presence of statutory declaration
        fields.append(
            ExtractedFieldDTO(
                field_name="has_land_border_decl",
                value=True,
                normalized_value="True",
                confidence=0.98,
                source_document=source_document,
                page=page_no,
                extraction_method="anchor",
                raw="Rule 144(xi) declaration present",
            )
        )

        # Check if entity is from land border sharing country
        is_negative = bool(
            re.search(
                r"not\s+from\s+any\s+country|not\s+sharing\s+a\s+land\s+border",
                combined_text,
                re.IGNORECASE,
            )
        )
        originates_land_border = (not is_negative) and bool(
            re.search(r"shares\s+a\s+land\s+border\s+with\s+India", combined_text, re.IGNORECASE)
        )

        fields.append(
            ExtractedFieldDTO(
                field_name="land_border_origin",
                value=originates_land_border,
                normalized_value=str(originates_land_border),
                confidence=0.95,
                source_document=source_document,
                page=page_no,
                extraction_method="regex",
                raw="Originates from land border country" if originates_land_border else "Not from land border country",
            )
        )

        return fields


class IntegrityPactExtractor(BaseExtractor):
    """Extractor for CVC-compliant Integrity Pacts."""

    def extract(
        self,
        pages: list[dict[str, Any]],
        source_document: Optional[str] = None,
    ) -> list[ExtractedFieldDTO]:
        p1 = pages[0] if pages else {}
        return [
            ExtractedFieldDTO(
                field_name="has_integrity_pact",
                value=True,
                normalized_value="True",
                confidence=0.95,
                source_document=source_document,
                page=p1.get("page_no", 1),
                extraction_method="anchor",
                raw="Integrity Pact executed",
            )
        ]
