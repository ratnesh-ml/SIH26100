"""Mock Registry Provider utilizing local synthetic JSON fixtures."""

from typing import Any
from pipeline.registry_adapters.base import BaseRegistryProvider


class MockRegistryProvider(BaseRegistryProvider):
    """Provides local, deterministic fixture responses for demo and testing without network calls."""

    def __init__(self, fixtures_dir: str = "seed/mock_fixtures"):
        self.fixtures_dir = fixtures_dir

    def verify_gstin(self, gstin: str) -> dict[str, Any]:
        return {"status": "ACTIVE", "gstin": gstin, "legal_name": "MOCK ENTITY", "source": "mock_fixture"}

    def verify_pan(self, pan: str) -> dict[str, Any]:
        return {"status": "VALID", "pan": pan, "name": "MOCK ENTITY", "source": "mock_fixture"}

    def verify_udyam(self, udyam_no: str) -> dict[str, Any]:
        return {"status": "VERIFIED", "udyam_no": udyam_no, "category": "MICRO", "source": "mock_fixture"}

    def verify_cin(self, cin: str) -> dict[str, Any]:
        return {"status": "ACTIVE", "cin": cin, "company_status": "ACTIVE", "source": "mock_fixture"}

    def check_debarment(self, name: str, pan: str) -> dict[str, Any]:
        return {"debarred": False, "source": "mock_fixture"}
