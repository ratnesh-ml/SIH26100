"""Chaos and Demo Failure Simulation Engine for VigilBid.

Provides reproducible synthetic failure modes for demonstrator and evaluator stress-testing:
- OCR_FAILURE: Simulates low OCR confidence / illegible scan fallback.
- REGISTRY_TIMEOUT: Simulates 503 gateway timeout from statutory portals.
- MISSING_DOCUMENT: Simulates omission of mandatory tender compliance certificates.
- MALFORMED_PDF: Simulates corrupted binary stream quarantine without crashing.
- MISMATCHED_IDENTITY: Simulates divergent PAN/GST/Entity name cross-document disparity.

LABELED CLEARLY: DEMO / MOCK / SYNTHETIC (Simulated Failure Engine).
"""

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
import logging
from typing import Any, Optional
import uuid

logger = logging.getLogger(__name__)


class FailureMode(str, Enum):
    """Supported deterministic chaos failure simulation modes."""
    OCR_FAILURE = "OCR_FAILURE"
    REGISTRY_TIMEOUT = "REGISTRY_TIMEOUT"
    MISSING_DOCUMENT = "MISSING_DOCUMENT"
    MALFORMED_PDF = "MALFORMED_PDF"
    MISMATCHED_IDENTITY = "MISMATCHED_IDENTITY"


@dataclass
class ChaosSimulationResult:
    """Standard container for synthetic failure demonstration responses."""
    simulation_id: str
    failure_mode: str
    label: str
    description: str
    injected_fault: dict[str, Any]
    graceful_handling: dict[str, Any]
    system_status: str
    compliance_granted: bool
    officer_action_required: str
    audit_trail: dict[str, Any]
    disclaimer: str = "DEMO / MOCK / SYNTHETIC — Controlled Failure Simulation (Not Live Production Failure)"
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict[str, Any]:
        return {
            "simulation_id": self.simulation_id,
            "failure_mode": self.failure_mode,
            "label": self.label,
            "description": self.description,
            "injected_fault": self.injected_fault,
            "graceful_handling": self.graceful_handling,
            "system_status": self.system_status,
            "compliance_granted": self.compliance_granted,
            "officer_action_required": self.officer_action_required,
            "audit_trail": self.audit_trail,
            "disclaimer": self.disclaimer,
            "timestamp": self.timestamp,
        }


class ChaosSimulator:
    """Presenter & evaluator tool to demonstrate graceful degradation under adverse conditions."""

    @staticmethod
    def list_failure_modes() -> list[dict[str, Any]]:
        """Return catalog of available demo failure simulation scenarios."""
        return [
            {
                "mode": FailureMode.OCR_FAILURE.value,
                "title": "OCR Processing Degradation",
                "description": "Simulates low OCR engine confidence (<0.40) or unreadable document stream.",
                "expected_system_behavior": "Gracefully flags extraction as unverified and routes to officer for manual transcription.",
            },
            {
                "mode": FailureMode.REGISTRY_TIMEOUT.value,
                "title": "Statutory Portal Gateway Timeout (503)",
                "description": "Simulates simulated GSTN / NSDL / Udyam registry portal unresponsiveness.",
                "expected_system_behavior": "Sets status to REVIEW / PENDING_VERIFICATION; NEVER grants unverified compliance.",
            },
            {
                "mode": FailureMode.MISSING_DOCUMENT.value,
                "title": "Missing Mandatory Compliance Certificate",
                "description": "Simulates bidder omission of mandatory statutory instruments (e.g., EMD receipt or GST REG-06).",
                "expected_system_behavior": "Generates explicit NON_COMPLIANT finding with requirement traceability and GFR 173(v) clarification prompt.",
            },
            {
                "mode": FailureMode.MALFORMED_PDF.value,
                "title": "Corrupted / Malformed PDF Upload",
                "description": "Simulates invalid EOF markers, partial byte stream, or corrupt headers.",
                "expected_system_behavior": "Catches parser exceptions safely, quarantines file, and surfaces clear ingestion alert without crash.",
            },
            {
                "mode": FailureMode.MISMATCHED_IDENTITY.value,
                "title": "Mismatched Entity Identity Disparity",
                "description": "Simulates conflicting PAN/GSTIN/Company names across submitted certificates.",
                "expected_system_behavior": "Highlights cross-document anomaly with exact character-level diff and evidence citations.",
            },
        ]

    @classmethod
    def simulate_failure(
        cls,
        failure_mode: FailureMode | str,
        context: Optional[dict[str, Any]] = None,
    ) -> ChaosSimulationResult:
        """Execute a deterministic synthetic chaos failure simulation."""
        ctx = context or {}
        mode_str = failure_mode.value if isinstance(failure_mode, FailureMode) else str(failure_mode).upper()
        sim_id = f"SIM-CHAOS-{uuid.uuid4().hex[:8].upper()}"

        if mode_str == FailureMode.OCR_FAILURE.value:
            return ChaosSimulationResult(
                simulation_id=sim_id,
                failure_mode=mode_str,
                label="DEMO / MOCK / SYNTHETIC — Low OCR Confidence Simulation",
                description="Simulated scanned document with degraded DPI (72 DPI) and heavy noise artifacts.",
                injected_fault={
                    "document_name": ctx.get("document_name", "Turnover_Certificate_Scan.pdf"),
                    "mean_ocr_confidence": 0.28,
                    "character_recognition_rate": "42%",
                    "fault_type": "DEGRADED_SCAN_QUALITY",
                },
                graceful_handling={
                    "pipeline_action": "OCR Engine caught low confidence threshold (<0.60)",
                    "fallback_mode": "MANUAL_VERIFICATION_REQUIRED",
                    "degradation_contained": True,
                    "service_interruption": False,
                },
                system_status="REVIEW",
                compliance_granted=False,
                officer_action_required="Procurement Officer manual transcription or request high-resolution re-upload under GFR 173(v).",
                audit_trail={
                    "event": "OCR_LOW_CONFIDENCE_FLAGGED",
                    "severity": "MEDIUM",
                    "rule": "OCR_QUALITY_ASSURANCE_01",
                },
            )

        elif mode_str == FailureMode.REGISTRY_TIMEOUT.value:
            registry_name = ctx.get("registry", "GST Registry — DEMO (Simulated Portal)")
            return ChaosSimulationResult(
                simulation_id=sim_id,
                failure_mode=mode_str,
                label="DEMO / MOCK / SYNTHETIC — Statutory Portal 503 Timeout Simulation",
                description=f"Simulated HTTP 503 Gateway Timeout during statutory verification lookup against {registry_name}.",
                injected_fault={
                    "target_registry": registry_name,
                    "http_status_code": 503,
                    "simulated_latency_ms": 5000,
                    "fault_type": "GATEWAY_TIMEOUT_UNAVAILABLE",
                },
                graceful_handling={
                    "pipeline_action": "CrossDocumentVerifier intercepted API_UNAVAILABLE response",
                    "finding_status": "REVIEW / PENDING_VERIFICATION",
                    "auto_compliance_withheld": True,
                    "compliance_granted": False,
                    "fallback_mode": "RETRY_QUEUED_OFFICER_REVIEW",
                },
                system_status="PENDING_VERIFICATION",
                compliance_granted=False,
                officer_action_required="Hold evaluation pending registry recovery or conduct statutory verification via alternate authenticated portal.",
                audit_trail={
                    "event": "REGISTRY_API_UNAVAILABLE_PENDING",
                    "severity": "HIGH",
                    "rule": "STATUTORY_VERIFICATION_CONTINGENCY",
                },
            )

        elif mode_str == FailureMode.MISSING_DOCUMENT.value:
            doc_type = ctx.get("missing_doc_type", "EMD_RECEIPT / BANK_GUARANTEE")
            return ChaosSimulationResult(
                simulation_id=sim_id,
                failure_mode=mode_str,
                label="DEMO / MOCK / SYNTHETIC — Missing Mandatory Document Simulation",
                description=f"Simulated tender submission missing mandatory compliance instrument '{doc_type}'.",
                injected_fault={
                    "missing_instrument": doc_type,
                    "mandatory_clause": "CPCL Tender Condition 4.1 / GFR Rule 170",
                    "fault_type": "OMITTED_MANDATORY_DOCUMENT",
                },
                graceful_handling={
                    "pipeline_action": "Document Intelligence Suite identified missing required envelope artifact",
                    "finding_status": "FAIL",
                    "risk_penalty_applied": 40.0,
                    "fallback_mode": "REQUIREMENT_UNMET_EVIDENCE_ATTACHED",
                },
                system_status="NON_COMPLIANT",
                compliance_granted=False,
                officer_action_required="Issue formal clarification notice or disqualify submission under CPCL Clause 4.1.",
                audit_trail={
                    "event": "MANDATORY_DOC_OMISSION_DETECTED",
                    "severity": "CRITICAL",
                    "rule": "TENDER_MANDATORY_DOCUMENT_PARITY",
                },
            )

        elif mode_str == FailureMode.MALFORMED_PDF.value:
            return ChaosSimulationResult(
                simulation_id=sim_id,
                failure_mode=mode_str,
                label="DEMO / MOCK / SYNTHETIC — Malformed PDF Stream Simulation",
                description="Simulated corrupt binary payload containing invalid trailer dictionary and missing EOF.",
                injected_fault={
                    "file_name": ctx.get("file_name", "corrupted_submission.pdf"),
                    "byte_length": 1024,
                    "fault_type": "INVALID_PDF_HEADER_EOF",
                },
                graceful_handling={
                    "pipeline_action": "SafePDFParser trapped PdfReadError exception without worker termination",
                    "quarantine_status": "QUARANTINED_SAFE",
                    "crash_prevented": True,
                    "fallback_mode": "CORRUPT_PAYLOAD_ALERT_SURFACED",
                },
                system_status="QUARANTINED",
                compliance_granted=False,
                officer_action_required="Notify bidder of unparseable file stream and request certified submission re-upload.",
                audit_trail={
                    "event": "INGESTION_CORRUPT_FILE_QUARANTINED",
                    "severity": "HIGH",
                    "rule": "FILE_INTEGRITY_SECURITY_CHECK",
                },
            )

        elif mode_str == FailureMode.MISMATCHED_IDENTITY.value:
            pan_val = ctx.get("pan", "AABCC1234F")
            gst_val = ctx.get("gstin", "33ZZZZZ9999Z1Z5")
            return ChaosSimulationResult(
                simulation_id=sim_id,
                failure_mode=mode_str,
                label="DEMO / MOCK / SYNTHETIC — Cross-Document Identity Mismatch Simulation",
                description=f"Simulated disparity where PAN '{pan_val}' differs from embedded GSTIN substring '{gst_val[2:12]}'.",
                injected_fault={
                    "pan_card_value": pan_val,
                    "gstin_value": gst_val,
                    "embedded_gstin_pan": gst_val[2:12],
                    "fault_type": "STATUTORY_IDENTIFIER_DISPARITY",
                },
                graceful_handling={
                    "pipeline_action": "Entity Resolution Engine flagged mismatch finding XDOC-PAN-GST-01",
                    "finding_status": "FAIL",
                    "risk_penalty_applied": 25.0,
                    "potential_anomaly_flagged": True,
                },
                system_status="ANOMALY_DETECTED",
                compliance_granted=False,
                officer_action_required="Review side-by-side evidence matrix and seek formal PAN/GST reconciliation from bidder.",
                audit_trail={
                    "event": "CROSS_DOCUMENT_IDENTITY_ANOMALY",
                    "severity": "CRITICAL",
                    "rule": "XDOC-PAN-GST-01",
                },
            )

        else:
            return ChaosSimulationResult(
                simulation_id=sim_id,
                failure_mode=mode_str,
                label="DEMO / MOCK / SYNTHETIC — Generic Failure Simulation",
                description=f"Unknown or custom failure simulation mode '{mode_str}'.",
                injected_fault={"raw_mode": mode_str, "context": ctx},
                graceful_handling={"status": "HANDLED_SAFELY", "compliance_granted": False},
                system_status="REVIEW",
                compliance_granted=False,
                officer_action_required="Evaluate failure context manually.",
                audit_trail={"event": "CUSTOM_CHAOS_SIMULATION", "severity": "MEDIUM"},
            )
