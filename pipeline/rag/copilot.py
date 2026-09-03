"""Regulatory Copilot Q&A interface with strict citation enforcement."""

from dataclasses import dataclass
from typing import Optional
from pipeline.rag.retriever import RetrievedClause


@dataclass
class CopilotResponse:
    answer: str
    citations: list[RetrievedClause]
    used_llm: bool


class RegulatoryCopilot:
    """Answers officer regulatory queries with grounded citations from GFR/CVC guidelines."""

    def answer_query(self, query: str, bidder_context: Optional[dict] = None) -> CopilotResponse:
        raise NotImplementedError("Copilot reasoning will be implemented in future phase")
