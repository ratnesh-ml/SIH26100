"""Statutory Government Registry Provider Interface and Standard Result Container."""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, Optional


class RegistryScenario(str, Enum):
    """Deterministic simulation scenarios for synthetic registry evaluation."""
    NORMAL = "NORMAL"
    MISMATCH = "MISMATCH"
    EXPIRED = "EXPIRED"
    NOT_FOUND = "NOT_FOUND"
    API_UNAVAILABLE = "API_UNAVAILABLE"
    DEBARRED = "DEBARRED"


@dataclass
class RegistryResult:
    """Standardized response contract for statutory portal verifications.
    
    UI and API must clearly identify: 'Source: Simulated registry (demo)'.
    Do NOT claim these are live government integrations.
    """
    found: bool
    status: str
    data: dict[str, Any] = field(default_factory=dict)
    source: str = "Simulated registry (demo)"
    fetched_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    latency_ms: int = 0

    def to_dict(self) -> dict[str, Any]:
        return {
            "found": self.found,
            "status": self.status,
            "data": self.data,
            "source": self.source,
            "fetched_at": self.fetched_at,
            "latency_ms": self.latency_ms,
        }


class RegistryProvider(ABC):
    """Abstract interface for GSTN, MCA21, PAN, Udyam, and Debarment verifications.
    
    Supports mock provider for MVP and real production adapters behind the same interface.
    """

    @abstractmethod
    async def verify_gstin(
        self, gstin: str, scenario: Optional[RegistryScenario | str] = None
    ) -> RegistryResult:
        """Verify GSTIN structure, active/cancelled status, and taxpayer details."""
        pass

    @abstractmethod
    async def verify_pan(
        self, pan: str, scenario: Optional[RegistryScenario | str] = None
    ) -> RegistryResult:
        """Verify PAN format, validity, taxpayer entity, and registered name."""
        pass

    @abstractmethod
    async def verify_udyam(
        self, udyam_no: str, scenario: Optional[RegistryScenario | str] = None
    ) -> RegistryResult:
        """Verify Udyam MSME registration status and enterprise category."""
        pass

    @abstractmethod
    async def verify_cin(
        self, cin: str, scenario: Optional[RegistryScenario | str] = None
    ) -> RegistryResult:
        """Verify MCA21 Corporate Identification Number and filing status."""
        pass

    @abstractmethod
    async def check_debarment(
        self,
        name: Optional[str] = None,
        pan: Optional[str] = None,
        gstin: Optional[str] = None,
        cin: Optional[str] = None,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        """Check national debarment and blacklist registries (CPPP / GeM)."""
        pass

    # Aliases per architectural contract in docs/04
    async def gstin(self, gstin_no: str, scenario: Optional[RegistryScenario | str] = None) -> RegistryResult:
        return await self.verify_gstin(gstin_no, scenario=scenario)

    async def pan(self, pan_no: str, scenario: Optional[RegistryScenario | str] = None) -> RegistryResult:
        return await self.verify_pan(pan_no, scenario=scenario)

    async def udyam(self, udyam_no: str, scenario: Optional[RegistryScenario | str] = None) -> RegistryResult:
        return await self.verify_udyam(udyam_no, scenario=scenario)

    async def cin(self, cin_no: str, scenario: Optional[RegistryScenario | str] = None) -> RegistryResult:
        return await self.verify_cin(cin_no, scenario=scenario)

    async def debarment(
        self,
        *,
        name: Optional[str] = None,
        pan: Optional[str] = None,
        gstin: Optional[str] = None,
        cin: Optional[str] = None,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        return await self.check_debarment(name=name, pan=pan, gstin=gstin, cin=cin, scenario=scenario)


# Backward-compatible alias
BaseRegistryProvider = RegistryProvider

