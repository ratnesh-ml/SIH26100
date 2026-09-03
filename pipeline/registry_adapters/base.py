"""Abstract base definition for government portal registry providers."""

from abc import ABC, abstractmethod
from typing import Any


class BaseRegistryProvider(ABC):
    """Abstract interface for GSTN, MCA21, PAN, Udyam, and Debarment verifications."""

    @abstractmethod
    def verify_gstin(self, gstin: str) -> dict[str, Any]:
        """Verify GSTIN format and status."""
        pass

    @abstractmethod
    def verify_pan(self, pan: str) -> dict[str, Any]:
        """Verify PAN format and status."""
        pass

    @abstractmethod
    def verify_udyam(self, udyam_no: str) -> dict[str, Any]:
        """Verify Udyam registration status and enterprise category."""
        pass

    @abstractmethod
    def verify_cin(self, cin: str) -> dict[str, Any]:
        """Verify MCA21 Corporate Identification Number."""
        pass

    @abstractmethod
    def check_debarment(self, name: str, pan: str) -> dict[str, Any]:
        """Check CPPP / GeM debarment and blacklist records."""
        pass
