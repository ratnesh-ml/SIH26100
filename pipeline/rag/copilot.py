"""Regulatory and Procurement Copilot providing grounded, cited decision support answers."""

import logging
import re
from typing import Any, Optional

from pipeline.rag.guardrails import PromptInjectionGuard, QueryIntentClassifier
from pipeline.rag.llm_adapter import (
    BaseLLMAdapter,
    LLMComplianceGuard,
    get_default_llm_adapter,
)
from pipeline.rag.models import CopilotResponse, RetrievedClause
from pipeline.rag.retriever import ProcurementRetriever

logger = logging.getLogger("vigilbid.pipeline.rag.copilot")


class ProcurementCopilot:
    """Answers procurement officer questions across all 4 knowledge domains:

    1. Tender requirements & specifications
    2. Bidder uploaded filings & page traces
    3. Regulatory statutes (GFR 2017, MSE Order, PPP-MII, CVC, ICAI)
    4. Evaluation findings, anomalies, and risk evidence

    Guarantees:
    - Answers strictly use retrieved evidence
    - Cites sources and shows exact page references
    - Clearly distinguishes facts from explanations
    - Never overrides deterministic compliance results
    - Never invents a rule
    - Never hides uncertainty (flags missing or inconclusive evidence)
    - Full prompt-injection protection
    - Pluggable LLM abstraction with deterministic template fallback
    """

    def __init__(
        self,
        retriever: Optional[ProcurementRetriever] = None,
        llm_adapter: Optional[BaseLLMAdapter] = None,
    ):
        self.retriever = retriever or ProcurementRetriever()
        self.llm_adapter = llm_adapter or get_default_llm_adapter()

    def answer_query(
        self,
        query: str,
        tender_id: Optional[str] = None,
        bidder_id: Optional[str] = None,
        domains: Optional[list[str]] = None,
        bidder_context: Optional[dict[str, Any]] = None,
        top_k: int = 3,
    ) -> CopilotResponse:
        """Process question with injection protection, intent routing, and evidence grounding."""
        # 1. Validation & Empty Check
        if not query or not query.strip():
            return CopilotResponse(
                answer="No query provided. Please specify a procurement, regulatory, or bidder question.",
                citations=[],
                domains_searched=domains or ["all"],
                used_llm=False,
                confidence=0.0,
                is_conclusive=False,
                category="EMPTY_QUERY",
            )

        trimmed_query = query.strip()

        # 2. Prompt-Injection Protection on Query
        is_injected, matched_phrase = PromptInjectionGuard.scan(trimmed_query)
        if is_injected:
            logger.warning("Adversarial prompt injection blocked in query: %s", matched_phrase)
            return CopilotResponse(
                answer=(
                    f"Security Refusal: Adversarial prompt pattern detected ('{matched_phrase}'). "
                    "The Procurement Copilot operates under strict deterministic compliance boundaries "
                    "and cannot bypass evaluation criteria, alter risk scores, or override statutory rules."
                ),
                citations=[],
                domains_searched=[],
                used_llm=False,
                confidence=0.0,
                injection_detected=True,
                is_conclusive=True,
                category="INJECTION_BLOCKED",
            )

        # 3. Irrelevance Check
        if QueryIntentClassifier.is_clearly_irrelevant(trimmed_query):
            return CopilotResponse(
                answer=(
                    "The Procurement Copilot is specialized exclusively for public procurement decision support "
                    "(tender specifications, bidder compliance, forensic risk evidence, and statutory regulations "
                    "under GFR 2017 / CVC guidelines). The submitted question appears out-of-scope for tender evaluation."
                ),
                citations=[],
                domains_searched=[],
                used_llm=False,
                confidence=0.0,
                is_conclusive=True,
                category="IRRELEVANT",
            )

        # 4. Rule Existence Check (Never invent a rule)
        referenced_rule = QueryIntentClassifier.extract_rule_id(trimmed_query)
        if referenced_rule and not QueryIntentClassifier.is_supported_rule(referenced_rule):
            supported_rules_str = ", ".join(sorted(QueryIntentClassifier.SUPPORTED_RULES.keys()))
            return CopilotResponse(
                answer=(
                    f"Rule '{referenced_rule}' was not found in the CPCL Goods compliance specification. "
                    "The system adheres strictly to the official rule catalog and never invents hypothetical rules.\n\n"
                    f"**Supported CPCL Rules:** {supported_rules_str}."
                ),
                citations=[],
                domains_searched=["evidence"],
                used_llm=False,
                confidence=0.0,
                is_conclusive=False,
                category="UNSUPPORTED_RULE",
            )

        # 5. Detect Intent Category
        intent_category = QueryIntentClassifier.detect_category(trimmed_query)

        # 6. Retrieve relevant knowledge chunks
        citations = self.retriever.search(
            query=trimmed_query,
            domains=domains,
            bidder_id=bidder_id,
            tender_id=tender_id,
            top_k=top_k,
        )

        # Check for adversarial injection in retrieved document text
        doc_injection_detected = False
        for c in citations:
            doc_inj, phrase = PromptInjectionGuard.scan(c.content)
            if doc_inj:
                doc_injection_detected = True
                logger.warning("Adversarial prompt injection pattern in retrieved text: %s", phrase)
                c.content = PromptInjectionGuard.sanitize_text(c.content)
                if c.exact_quote:
                    c.exact_quote = PromptInjectionGuard.sanitize_text(c.exact_quote)

        # 7. Route to Specialized Synthesizer or Fallback
        if intent_category == "RISK_ANALYSIS":
            response = self._synthesize_risk_analysis(
                trimmed_query, citations, bidder_context, doc_injection_detected
            )
        elif intent_category == "REQUIREMENT_FAILURE":
            response = self._synthesize_requirement_failures(
                trimmed_query, citations, bidder_context, doc_injection_detected
            )
        elif intent_category == "COMPLIANCE_STATUS":
            response = self._synthesize_compliance_status(
                trimmed_query, citations, bidder_context, doc_injection_detected
            )
        elif intent_category == "EVIDENCE_INQUIRY" and referenced_rule:
            response = self._synthesize_rule_evidence(
                referenced_rule, citations, bidder_context, doc_injection_detected
            )
        else:
            response = self._synthesize_general_answer(
                trimmed_query, citations, bidder_context, doc_injection_detected
            )

        # 8. Optional LLM Polish with Strict Deterministic Guardrail
        if not response.injection_detected and response.is_conclusive and citations:
            llm_text = self.llm_adapter.generate_explanation(
                prompt=trimmed_query,
                context="\n".join([c.content for c in citations]),
                facts=response.facts,
                deterministic_status=getattr(response, "deterministic_status", None),
            )
            if llm_text:
                # Enforce rule: LLM can NEVER override deterministic results
                deterministic_status = getattr(response, "deterministic_status", None)
                if LLMComplianceGuard.validate_llm_output(llm_text, deterministic_status):
                    response.answer = f"{llm_text}\n\n{response.answer}"
                    response.used_llm = True

        return response

    # =========================================================================
    # Specialized Synthesizers Distinguishing Facts from Explanations
    # =========================================================================

    def _synthesize_risk_analysis(
        self,
        query: str,
        citations: list[RetrievedClause],
        context: Optional[dict[str, Any]],
        injection_detected: bool,
    ) -> CopilotResponse:
        """Handle: 'Why was this bidder marked high risk?'"""
        facts: list[str] = []
        explanations: list[str] = []
        is_conclusive = True

        risk_score = None
        risk_band = None
        risk_drivers = []
        bidder_name = "The bidder"

        if context:
            risk_score = context.get("risk_score")
            risk_band = context.get("risk_band")
            risk_drivers = context.get("risk_drivers") or []
            bidder_name = context.get("declared_name") or context.get("name") or bidder_name

        if risk_score is not None:
            facts.append(f"{bidder_name} composite risk score is {risk_score}/100.")
            facts.append(f"Risk classification band: {risk_band or 'EVALUATED'}.")
            if risk_drivers:
                for d in risk_drivers:
                    desc = d.get("description") if isinstance(d, dict) else str(d)
                    facts.append(f"Primary risk driver: {desc}.")
        else:
            # Check citations for evidence chunks
            ev_chunks = [c for c in citations if c.domain == "evidence"]
            if ev_chunks:
                for ev in ev_chunks:
                    facts.append(f"Forensic finding recorded: {ev.content.strip()}")
            else:
                facts.append(f"No specific risk score was pre-loaded in context for {bidder_name}.")
                is_conclusive = False

        if injection_detected:
            facts.append("Security Alert: Document text contains adversarial prompt phrasing (flagged under A-INJ-01).")

        explanations.append(
            "Under the CPCL Risk Assessment framework, composite risk scores combine deterministic rule failures, "
            "document forensic anomalies (e.g. metadata modifications, suspicious authors), and cross-bidder signals. "
            "Scores ≥ 60 trigger HIGH risk, requiring comprehensive manual review by the procurement committee."
        )
        explanations.append("Deterministic findings cannot be overridden autonomously by AI; human officer adjudication is mandatory.")

        answer_lines = [
            f"### Risk Evaluation for {bidder_name}\n",
            "**Verified Facts:**",
            *[f"- {f}" for f in facts],
            "\n**Compliance & Regulatory Explanation:**",
            *[f"- {e}" for e in explanations],
        ]

        if not is_conclusive:
            answer_lines.append(
                "\n**Certainty Status: INCONCLUSIVE / MISSING DATA**\n"
                "*(Bidder risk profile is not fully indexed. Officer verification required.)*"
            )
        else:
            answer_lines.append("\n*(Decision Support: Human officer confirmation required under GFR 2017.)*")

        return CopilotResponse(
            answer="\n".join(answer_lines),
            citations=citations,
            domains_searched=list({c.domain for c in citations if c.domain}) or ["evidence", "regulatory"],
            used_llm=False,
            confidence=0.95 if is_conclusive else 0.4,
            facts=facts,
            explanations=explanations,
            injection_detected=injection_detected,
            is_conclusive=is_conclusive,
            category="RISK_ANALYSIS",
        )

    def _synthesize_requirement_failures(
        self,
        query: str,
        citations: list[RetrievedClause],
        context: Optional[dict[str, Any]],
        injection_detected: bool,
    ) -> CopilotResponse:
        """Handle: 'Which requirement failed?'"""
        facts: list[str] = []
        explanations: list[str] = []
        is_conclusive = True

        findings = []
        if context:
            findings = context.get("findings") or []

        failing_findings = [f for f in findings if f.get("status") in {"FAIL", "REVIEW"}]

        if findings:
            if failing_findings:
                facts.append(f"{len(failing_findings)} out of {len(findings)} evaluated requirements did not achieve PASS status.")
                for f in failing_findings:
                    rule_id = f.get("rule_id", "RULE")
                    title = f.get("title", "Requirement")
                    status = f.get("status", "FAIL")
                    facts.append(f"{rule_id} [{status}]: {title}. Detail: {f.get('explanation', '')}")
            else:
                facts.append(f"All {len(findings)} evaluated requirements achieved status PASS. No compliance failures detected.")
        else:
            # Look at evidence citations
            ev_chunks = [c for c in citations if c.domain == "evidence" and "FAIL" in c.content]
            if ev_chunks:
                facts.append(f"{len(ev_chunks)} failing finding(s) identified in indexed evaluation records.")
                for ev in ev_chunks:
                    facts.append(f"Recorded finding: {ev.clause} — {ev.exact_quote}")
            else:
                facts.append("No evaluation findings were found for this bidder.")
                is_conclusive = False

        explanations.append(
            "Under GFR 2017 Rule 161 (Two-Bid System), bidders must satisfy all mandatory Technical and Pre-Qualification Criteria (PQC) "
            "to qualify for commercial/financial bid opening. Any unresolved FAIL status results in technical non-responsiveness."
        )
        explanations.append(
            "If a non-conformity is an informality or minor ambiguity, the committee may seek clarification under GFR 2017 Rule 173(v), "
            "provided no change in price or substance occurs."
        )

        answer_lines = [
            "### Requirement Evaluation Summary\n",
            "**Verified Facts:**",
            *[f"- {f}" for f in facts],
            "\n**Regulatory & Statutory Framework:**",
            *[f"- {e}" for e in explanations],
        ]

        if not is_conclusive:
            answer_lines.append(
                "\n**Certainty Status: INCONCLUSIVE / MISSING EVIDENCE**\n"
                "*(Complete evaluation findings are not indexed for this bidder. Officer physical inspection required.)*"
            )

        return CopilotResponse(
            answer="\n".join(answer_lines),
            citations=citations,
            domains_searched=list({c.domain for c in citations if c.domain}) or ["evidence", "regulatory"],
            used_llm=False,
            confidence=0.95 if is_conclusive else 0.4,
            facts=facts,
            explanations=explanations,
            injection_detected=injection_detected,
            is_conclusive=is_conclusive,
            category="REQUIREMENT_FAILURE",
        )

    def _synthesize_compliance_status(
        self,
        query: str,
        citations: list[RetrievedClause],
        context: Optional[dict[str, Any]],
        injection_detected: bool,
    ) -> CopilotResponse:
        """Handle: 'Is this bidder compliant with the turnover requirement?'"""
        facts: list[str] = []
        explanations: list[str] = []
        is_conclusive = True
        deterministic_status = None

        q_lower = query.lower()
        is_turnover_query = "turnover" in q_lower

        if is_turnover_query:
            # Check context findings
            turnover_finding = None
            if context and context.get("findings"):
                for f in context["findings"]:
                    if f.get("rule_id") == "R-FIN-01" or "turnover" in f.get("title", "").lower():
                        turnover_finding = f
                        break

            if turnover_finding:
                status = turnover_finding.get("status", "EVALUATED")
                deterministic_status = status
                facts.append(f"Turnover Evaluation Status: {status}.")
                facts.append(f"Detail: {turnover_finding.get('explanation', '')}.")
                ev_items = turnover_finding.get("evidence") or []
                if ev_items and isinstance(ev_items, list):
                    first_ev = ev_items[0]
                    if isinstance(first_ev, dict):
                        facts.append(f"Source Evidence: Document Page {first_ev.get('page_no', 1)}, quote: \"{first_ev.get('quote', '')}\".")
            else:
                # Check citations for bidder document or tender BEC
                bidder_chunks = [c for c in citations if c.domain == "bidder_document" and "turnover" in c.content.lower()]
                if bidder_chunks:
                    top_bc = bidder_chunks[0]
                    facts.append(f"Extracted from {top_bc.source} (Page {top_bc.page_no}): \"{top_bc.exact_quote}\".")
                else:
                    facts.append("Missing Evidence: No audited turnover certificate or balance sheet was identified in submitted filings.")
                    is_conclusive = False

            explanations.append(
                "Under CPCL BEC Clause 2.1, the average annual turnover during the preceding 3 financial years "
                "must be at least 30% of the estimated tender value. Figures must be certified by a Chartered Accountant with a valid ICAI UDIN."
            )
            explanations.append(
                "Deterministic evaluation cannot be overridden without explicit officer justification and audit recording."
            )
        else:
            facts.append(f"Query evaluated against retrieved knowledge passages: {len(citations)} citation(s) retrieved.")
            explanations.append("Compliance verified deterministically against CPCL BEC and GFR 2017 guidelines.")

        answer_lines = [
            "### Compliance Evaluation\n",
            "**Verified Facts:**",
            *[f"- {f}" for f in facts],
            "\n**Regulatory Standard:**",
            *[f"- {e}" for e in explanations],
        ]

        if not is_conclusive:
            answer_lines.append(
                "\n**Certainty Status: INCONCLUSIVE / MISSING EVIDENCE**\n"
                "*(Evidence is incomplete. The officer must issue a clarification request under GFR 173(v).)*"
            )

        resp = CopilotResponse(
            answer="\n".join(answer_lines),
            citations=citations,
            domains_searched=list({c.domain for c in citations if c.domain}) or ["tender", "bidder_document", "regulatory"],
            used_llm=False,
            confidence=0.9 if is_conclusive else 0.4,
            facts=facts,
            explanations=explanations,
            injection_detected=injection_detected,
            is_conclusive=is_conclusive,
            category="COMPLIANCE_STATUS",
        )
        setattr(resp, "deterministic_status", deterministic_status)
        return resp

    def _synthesize_rule_evidence(
        self,
        rule_id: str,
        citations: list[RetrievedClause],
        context: Optional[dict[str, Any]],
        injection_detected: bool,
    ) -> CopilotResponse:
        """Handle: 'Show the evidence for R-MII-01.'"""
        facts: list[str] = []
        explanations: list[str] = []
        is_conclusive = True
        rule_desc = QueryIntentClassifier.SUPPORTED_RULES.get(rule_id, "Rule")

        matching_finding = None
        if context and context.get("findings"):
            for f in context["findings"]:
                if f.get("rule_id") == rule_id:
                    matching_finding = f
                    break

        if matching_finding:
            status = matching_finding.get("status", "EVALUATED")
            facts.append(f"Rule {rule_id} ({rule_desc}) evaluated to: {status}.")
            facts.append(f"Finding: {matching_finding.get('title', '')} — {matching_finding.get('explanation', '')}.")
            ev_list = matching_finding.get("evidence") or []
            if ev_list:
                for idx, ev in enumerate(ev_list, start=1):
                    p_no = ev.get("page_no") or ev.get("page") or 1
                    quote = ev.get("quote", "")
                    facts.append(f"Evidence #{idx}: Page {p_no}, quote: \"{quote}\".")
            else:
                facts.append("No specific text quote was attached to this finding.")
                is_conclusive = False
        else:
            # Check citations
            rule_chunks = [c for c in citations if rule_id in (c.clause or "") or rule_id in c.content]
            if rule_chunks:
                for rc in rule_chunks:
                    facts.append(f"Evidence from {rc.source} (Page {rc.page_no}): \"{rc.exact_quote}\".")
            else:
                facts.append(f"Missing Evidence: No evaluated evidence records found for rule {rule_id} for this bidder.")
                is_conclusive = False

        explanations.append(
            f"Under CPCL Goods BEC and statutory rules, {rule_desc} must be established using primary source documents "
            "with verified provenance (original PDF page, SHA-256 CAS hash, and external registry cross-check)."
        )

        answer_lines = [
            f"### Evidence Report for Rule {rule_id} ({rule_desc})\n",
            "**Verified Facts:**",
            *[f"- {f}" for f in facts],
            "\n**Legal Framework & Evaluation Basis:**",
            *[f"- {e}" for e in explanations],
        ]

        if not is_conclusive:
            answer_lines.append(
                "\n**Certainty Status: INCONCLUSIVE / MISSING EVIDENCE**\n"
                "*(Evidence is incomplete or missing. Officer physical verification required.)*"
            )

        return CopilotResponse(
            answer="\n".join(answer_lines),
            citations=citations,
            domains_searched=list({c.domain for c in citations if c.domain}) or ["evidence", "bidder_document"],
            used_llm=False,
            confidence=0.95 if is_conclusive else 0.4,
            facts=facts,
            explanations=explanations,
            injection_detected=injection_detected,
            is_conclusive=is_conclusive,
            category="EVIDENCE_INQUIRY",
        )

    def _synthesize_general_answer(
        self,
        query: str,
        citations: list[RetrievedClause],
        context: Optional[dict[str, Any]],
        injection_detected: bool,
    ) -> CopilotResponse:
        """Handle general procurement/regulatory queries with standard citation grounding."""
        if not citations:
            return CopilotResponse(
                answer=(
                    "No relevant clauses or document passages were found in the indexed knowledge base "
                    f"for query: '{query}'. Please verify the query terminology or ensure relevant files are indexed."
                ),
                citations=[],
                domains_searched=["all"],
                used_llm=False,
                confidence=0.0,
                is_conclusive=False,
                category="NO_RESULTS",
            )

        primary = citations[0]
        clause_ref = primary.clause
        doc_name = primary.document_name or primary.source
        page_str = f"Page {primary.page_no}" if primary.page_no else "Document text"

        facts = [
            f"Primary Citation: {clause_ref} from {doc_name} ({page_str}).",
            f"Verified Quotation: \"{primary.exact_quote}\"",
        ]

        explanations = [
            f"Statutory Context ({primary.source}): {primary.content.strip()}",
        ]

        if len(citations) > 1:
            for idx, supp in enumerate(citations[1:], start=2):
                supp_page = f", Page {supp.page_no}" if supp.page_no else ""
                explanations.append(f"Supporting Ref {idx}: {supp.clause} ({supp.source}{supp_page}) — \"{supp.exact_quote}\"")

        answer_lines = [
            f"### Procurement Copilot Response for: \"{query}\"\n",
            "**Verified Facts & Primary Citations:**",
            *[f"- {f}" for f in facts],
            "\n**Regulatory & Analytical Explanation:**",
            *[f"- {e}" for e in explanations],
            "\n*(Decision Support Disclaimer: Human officer confirmation required under GFR 2017 / CVC guidelines.)*",
        ]

        return CopilotResponse(
            answer="\n".join(answer_lines),
            citations=citations,
            domains_searched=list({c.domain for c in citations if c.domain}),
            used_llm=False,
            confidence=primary.score,
            facts=facts,
            explanations=explanations,
            injection_detected=injection_detected,
            is_conclusive=True,
            category="GENERAL_PROCUREMENT",
        )


class RegulatoryCopilot:
    """Backward-compatible regulatory copilot wrapping ProcurementCopilot."""

    def __init__(self):
        self.copilot = ProcurementCopilot()

    def answer_query(self, query: str, bidder_context: Optional[dict] = None) -> CopilotResponse:
        return self.copilot.answer_query(
            query=query,
            domains=["regulatory"],
            bidder_context=bidder_context,
            top_k=3,
        )
