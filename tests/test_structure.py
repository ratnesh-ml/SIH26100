"""Verify repository structure and package imports."""

import importlib
import pytest


REQUIRED_MODULES = [
    # Backend core and models
    "backend.core.config",
    "backend.core.security",
    "backend.auth.jwt",
    "backend.auth.rbac",
    "backend.models.base",
    "backend.models.entities",
    "backend.schemas",
    "backend.api.router",
    "backend.services.tender_service",
    "backend.services.bidder_service",
    "backend.services.audit_service",
    "backend.services.report_service",
    "backend.workers.job_worker",
    "backend.main",
    # Pipeline subsystems
    "pipeline.ocr.textifier",
    "pipeline.document_processing.ingest",
    "pipeline.document_processing.classifier",
    "pipeline.extraction.base",
    "pipeline.extraction.registry",
    "pipeline.entity_resolution.normalizer",
    "pipeline.entity_resolution.matcher",
    "pipeline.registry_adapters.base",
    "pipeline.registry_adapters.mock_adapter",
    "pipeline.compliance.engine",
    "pipeline.risk.scorer",
    "pipeline.risk.anomaly",
    "pipeline.audit.hasher",
    "pipeline.evidence.highlighter",
    "pipeline.rag.retriever",
    "pipeline.rag.copilot",
    "pipeline.reports.dossier",
    "pipeline.runner",
]


@pytest.mark.parametrize("module_name", REQUIRED_MODULES)
def test_module_import(module_name: str):
    """Verify that every architectural module imports without error."""
    mod = importlib.import_module(module_name)
    assert mod is not None
