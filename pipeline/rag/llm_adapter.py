"""LLM Adapter and Abstraction Layer for Procurement Copilot.

Enforces:
1. Deterministic/template explanations as the primary reliable fallback
2. LLM behind an explicit pluggable interface (BaseLLMAdapter)
3. Strict post-generation validation: an LLM can NEVER override deterministic compliance results
   (e.g., if deterministic status is FAIL, LLM cannot output PASS)
"""

from abc import ABC, abstractmethod
import logging
import os
import re
from typing import Any, Optional

logger = logging.getLogger("vigilbid.pipeline.rag.llm")


class BaseLLMAdapter(ABC):
    """Abstract interface for optional language model reasoning."""

    @abstractmethod
    def generate_explanation(
        self,
        prompt: str,
        context: str,
        facts: list[str],
        deterministic_status: Optional[str] = None,
    ) -> Optional[str]:
        """Generate polished explanatory text while adhering strictly to facts and status.

        Returns None to signal fallback to deterministic synthesis.
        """
        pass


class DeterministicFallbackAdapter(BaseLLMAdapter):
    """Default adapter that declines LLM execution, guaranteeing deterministic behavior."""

    def generate_explanation(
        self,
        prompt: str,
        context: str,
        facts: list[str],
        deterministic_status: Optional[str] = None,
    ) -> Optional[str]:
        # Always return None to use deterministic extractive templates
        return None


class MockLLMAdapter(BaseLLMAdapter):
    """Mock adapter for testing LLM integration paths and guardrails."""

    def __init__(self, response_template: Optional[str] = None, should_fail: bool = False):
        self.response_template = response_template
        self.should_fail = should_fail

    def generate_explanation(
        self,
        prompt: str,
        context: str,
        facts: list[str],
        deterministic_status: Optional[str] = None,
    ) -> Optional[str]:
        if self.should_fail:
            return None

        if self.response_template:
            return self.response_template

        joined_facts = " ".join(facts) if facts else "No specific facts extracted."
        status_line = f"Deterministic evaluation status: {deterministic_status}." if deterministic_status else ""
        return (
            f"[LLM-Assisted Synthesis] Based on verified evidence: {joined_facts} "
            f"{status_line} Evaluated strictly under public procurement criteria."
        )


class LLMComplianceGuard:
    """Validates that LLM outputs never contradict or override deterministic compliance results."""

    @staticmethod
    def validate_llm_output(
        llm_text: Optional[str],
        deterministic_status: Optional[str],
    ) -> bool:
        """Return True if LLM text is compliant with deterministic outcome; False if violation detected."""
        if not llm_text:
            return True

        text_lower = llm_text.lower()

        # If deterministic result is FAIL, LLM cannot claim PASS, Compliant, or Approved
        if deterministic_status and deterministic_status.upper() in {"FAIL", "DISQUALIFIED", "REJECTED"}:
            forbidden_phrases = [
                "bidder is compliant",
                "bidder passed",
                "status: pass",
                "evaluation result: pass",
                "fully compliant",
                "recommended for award",
                "override: pass",
            ]
            for phrase in forbidden_phrases:
                if phrase in text_lower:
                    logger.warning(
                        "LLM output violated deterministic compliance! Claimed '%s' when status is %s.",
                        phrase,
                        deterministic_status,
                    )
                    return False

        # If deterministic result is PASS, LLM cannot arbitrarily claim FAIL
        if deterministic_status and deterministic_status.upper() == "PASS":
            forbidden_phrases = [
                "bidder failed",
                "status: fail",
                "must be disqualified",
                "evaluation result: fail",
            ]
            for phrase in forbidden_phrases:
                if phrase in text_lower:
                    logger.warning(
                        "LLM output violated deterministic compliance! Claimed '%s' when status is PASS.",
                        phrase,
                    )
                    return False

        return True


def get_default_llm_adapter() -> BaseLLMAdapter:
    """Factory returning configured LLM adapter based on environment."""
    env_adapter = os.environ.get("VIGILBID_LLM_ADAPTER", "deterministic").lower()
    if env_adapter == "mock":
        return MockLLMAdapter()
    return DeterministicFallbackAdapter()
