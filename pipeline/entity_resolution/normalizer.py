"""Entity normalizer for company names, legal forms, dates, and amounts."""

import re


class EntityNormalizer:
    """Normalizes company names, addresses, and identifiers."""

    LEGAL_SUFFIXES = [
        r"\bPVT\.?\s*LTD\.?\b",
        r"\bPRIVATE\s+LIMITED\b",
        r"\bLIMITED\b",
        r"\bLTD\.?\b",
        r"\bLLP\b",
    ]

    def normalize_company_name(self, name: str) -> str:
        """Strip legal suffix, remove special characters, and convert to uppercase."""
        cleaned = name.upper().strip()
        for suffix in self.LEGAL_SUFFIXES:
            cleaned = re.sub(suffix, "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"[^\w\s]", " ", cleaned)
        return re.sub(r"\s+", " ", cleaned).strip()
