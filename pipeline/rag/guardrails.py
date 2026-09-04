"""Guardrails and Security Protection for Procurement Copilot.

Enforces:
1. Prompt-Injection Protection: Detects and blocks adversarial prompt patterns in user questions
   and retrieved document texts.
2. Query Intent Classification: Routes queries to structured analyzers (Risk, Failures, Compliance, Evidence).
3. Rule Existence Validation: Validates rule IDs against known CPCL rules, ensuring the copilot NEVER invents a rule.
4. Irrelevance Detection: Flags out-of-scope questions (weather, poems, generic banter) and politely declines.
"""

import re
from typing import Optional


class PromptInjectionGuard:
    """Detects and neutralizes adversarial prompt injection attempts.
    
    Treats all incoming document texts and external inputs strictly as inert DATA,
    preventing prompt injection attacks from manipulating evaluation conclusions.
    """

    INJECTION_PATTERNS = [
        r"ignore\s+(all\s+)?(previous|earlier)\s+instructions",
        r"disregard\s+(all\s+)?(previous|earlier)\s+instructions",
        r"system\s*prompt\s*:",
        r"you\s+are\s+now\s+(an?\s+)?(unrestricted|in\s+dan\s+mode|jailbroken|freed|developer\s+mode)",
        r"override\s+(all\s+)?(rules|scores|evaluations|findings)",
        r"always\s+(return|answer|say)\s+(pass|compliant|approved)",
        r"mark\s+(this\s+)?bidder\s+(as\s+)?(compliant|pass|approved)",
        r"this\s+bidder\s+is\s+pre-?approved",
        r"bypass\s+(all\s+)?compliance(\s+checks?)?",
        r"forget\s+(your\s+)?(rules|instructions|constraints)",
        r"act\s+as\s+a\s+helpful\s+assistant\s+and\s+approve",
        r"you\s+must\s+certify\s+this\s+bid",
        r"do\s+not\s+follow\s+safety\s+guidelines",
        r"set\s+risk\s+score\s+to\s+0",
        r"grant\s+(full\s+)?compliance",
        r"output\s+pass\s+unconditionally",
    ]

    @classmethod
    def scan(cls, text: str) -> tuple[bool, Optional[str]]:
        """Scan text for adversarial prompt injection phrasing.

        Returns (is_injected, matched_phrase).
        """
        if not text:
            return False, None

        for pattern in cls.INJECTION_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return True, match.group(0)

        return False, None

    @classmethod
    def sanitize_text(cls, text: str) -> str:
        """Mask any detected adversarial prompt patterns from text."""
        if not text:
            return text
        sanitized = text
        for pattern in cls.INJECTION_PATTERNS:
            sanitized = re.sub(pattern, "[REDACTED ADVERSARIAL INJECTION - NEUTRALIZED]", sanitized, flags=re.IGNORECASE)
        return sanitized

    @classmethod
    def wrap_data_context(cls, text: str, source_doc: str = "Uploaded Document") -> str:
        """Enforce DATA-NOT-INSTRUCTIONS isolation boundary around document extracts."""
        sanitized = cls.sanitize_text(text)
        return f"<DOCUMENT_DATA source=\"{source_doc}\" type=\"inert_data\">\n{sanitized}\n</DOCUMENT_DATA>"



class QueryIntentClassifier:
    """Classifies user queries into procurement task categories or flags them as out-of-scope."""

    # CPCL / Public Procurement standard rule set
    SUPPORTED_RULES = {
        "R-ID-01": "GSTIN Structure & Checksum Parity",
        "R-ID-02": "PAN-GSTIN Entity Parity",
        "R-ID-03": "CIN & Incorporation Verification",
        "R-FIN-01": "Annual Financial Turnover 30% Criterion",
        "R-FIN-02": "Positive Net Worth Requirement",
        "R-FIN-03": "Mandatory ICAI UDIN Validation",
        "R-EXP-01": "Technical Prior Experience (40-50-80% Rule)",
        "R-EMD-01": "EMD Compliance & Udyam MSE Exemption",
        "R-MII-01": "Make in India Local Content Preference",
    }

    # Obvious off-topic subjects that fall outside public procurement
    IRRELEVANT_TOPICS = {
        "weather", "forecast", "temperature", "rain", "sunny", "climate",
        "poem", "poetry", "rhyme", "rhyming", "poet",
        "joke", "recipe", "cook", "bake", "pizza", "cake",
        "football", "cricket", "basketball", "movie", "song", "lyrics",
    }

    @classmethod
    def is_clearly_irrelevant(cls, query: str) -> bool:
        """Return True if query relates to obvious off-topic subjects (weather, poems, cooking, sports)."""
        if not query or len(query.strip()) < 3:
            return False
        tokens = set(re.findall(r"\b\w+\b", query.lower()))
        return bool(tokens & cls.IRRELEVANT_TOPICS)

    @classmethod
    def is_relevant(cls, query: str) -> bool:
        """Return False if query relates to clearly irrelevant topics."""
        return not cls.is_clearly_irrelevant(query)

    @classmethod
    def extract_rule_id(cls, query: str) -> Optional[str]:
        """Extract referenced rule ID (e.g. 'R-MII-01', 'R-FIN-01', 'R-XYZ-999') from query."""
        match = re.search(r"\b(R-[A-Z0-9]+-\d+)\b", query, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        return None

    @classmethod
    def is_supported_rule(cls, rule_id: str) -> bool:
        """Verify whether rule exists in the standard rule catalog."""
        return rule_id.upper() in cls.SUPPORTED_RULES

    @classmethod
    def detect_category(cls, query: str) -> str:
        """Determine primary question category."""
        q_lower = query.lower()

        if re.search(r"\b(why\s+(was\s+)?(this\s+)?bidder\s+marked\s+high\s+risk|risk\s+score|risk\s+band|high\s+risk|risk\s+driver)\b", q_lower):
            return "RISK_ANALYSIS"

        if re.search(r"\b(which\s+requirement\s+failed|failed\s+requirement|what\s+failed|any\s+failures|failing\s+rules?)\b", q_lower):
            return "REQUIREMENT_FAILURE"

        if re.search(r"\b(turnover|financial\s+requirement|net\s+worth|experience|gstin\s+valid|is\s+this\s+bidder\s+compliant)\b", q_lower):
            return "COMPLIANCE_STATUS"

        if re.search(r"\b(show\s+the\s+evidence|evidence\s+for|citation\s+for|proof\s+for)\b", q_lower):
            return "EVIDENCE_INQUIRY"

        return "GENERAL_PROCUREMENT"
