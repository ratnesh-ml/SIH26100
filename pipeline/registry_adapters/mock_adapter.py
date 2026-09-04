"""Fixture-backed Mock Government Registry Provider with Scenario Control and Latency Simulation."""

import asyncio
from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
import random
import time
from typing import Any, Optional

from pipeline.registry_adapters.base import (
    RegistryProvider,
    RegistryResult,
    RegistryScenario,
)

logger = logging.getLogger(__name__)

DEFAULT_FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "fixtures" / "registry"


class MockRegistryProvider(RegistryProvider):
    """Provides controlled fixture-backed responses simulating government registry portals.
    
    UI and API must clearly identify: 'Source: [Registry] — DEMO (Simulated Portal)'.
    Do NOT claim these are live government integrations.
    """

    def __init__(
        self,
        fixtures_dir: Optional[str] = None,
        simulate_latency: bool = True,
        min_latency_ms: int = 300,
        max_latency_ms: int = 800,
        default_scenario: RegistryScenario = RegistryScenario.NORMAL,
    ):
        self.fixtures_dir = Path(fixtures_dir) if fixtures_dir else DEFAULT_FIXTURES_DIR
        self.simulate_latency = simulate_latency
        self.min_latency_ms = min_latency_ms
        self.max_latency_ms = max_latency_ms
        self.active_scenario: RegistryScenario = default_scenario

        self._gstin_cache: dict[str, Any] = {}
        self._pan_cache: dict[str, Any] = {}
        self._udyam_cache: dict[str, Any] = {}
        self._cin_cache: dict[str, Any] = {}
        self._debarment_cache: list[dict[str, Any]] = []

        self._load_fixtures()

    def set_scenario(self, scenario: RegistryScenario | str) -> None:
        """Set the global simulation scenario for demo/testing."""
        if isinstance(scenario, str):
            try:
                self.active_scenario = RegistryScenario(scenario.upper())
            except ValueError:
                self.active_scenario = RegistryScenario.NORMAL
        else:
            self.active_scenario = scenario

    def reset_scenario(self) -> None:
        """Reset simulation scenario to NORMAL."""
        self.active_scenario = RegistryScenario.NORMAL

    def _resolve_scenario(
        self,
        explicit_scenario: Optional[RegistryScenario | str],
        input_value: str,
    ) -> RegistryScenario:
        """Resolve effective scenario from explicit param, input token suffix, or global state."""
        if explicit_scenario:
            if isinstance(explicit_scenario, str):
                try:
                    return RegistryScenario(explicit_scenario.upper())
                except ValueError:
                    pass
            elif isinstance(explicit_scenario, RegistryScenario):
                return explicit_scenario

        val_upper = input_value.upper()
        if "UNAVAILABLE" in val_upper or "FAIL_503" in val_upper or "TIMEOUT" in val_upper:
            return RegistryScenario.API_UNAVAILABLE
        if "MISMATCH" in val_upper:
            return RegistryScenario.MISMATCH
        if "EXPIRED" in val_upper or "CANCELLED" in val_upper:
            return RegistryScenario.EXPIRED
        if "NOTFOUND" in val_upper or "MISSING" in val_upper:
            return RegistryScenario.NOT_FOUND
        if "DEBARRED" in val_upper or "BLACKLIST" in val_upper:
            return RegistryScenario.DEBARRED

        return self.active_scenario

    def _load_fixtures(self) -> None:
        """Load JSON fixture databases from disk, with synthetic fallbacks if absent."""
        try:
            gst_path = self.fixtures_dir / "gstin.json"
            if gst_path.exists():
                with open(gst_path, "r", encoding="utf-8") as f:
                    self._gstin_cache = json.load(f)

            pan_path = self.fixtures_dir / "pan.json"
            if pan_path.exists():
                with open(pan_path, "r", encoding="utf-8") as f:
                    self._pan_cache = json.load(f)

            udyam_path = self.fixtures_dir / "udyam.json"
            if udyam_path.exists():
                with open(udyam_path, "r", encoding="utf-8") as f:
                    self._udyam_cache = json.load(f)

            cin_path = self.fixtures_dir / "cin.json"
            if cin_path.exists():
                with open(cin_path, "r", encoding="utf-8") as f:
                    self._cin_cache = json.load(f)

            deb_path = self.fixtures_dir / "debarment.json"
            if deb_path.exists():
                with open(deb_path, "r", encoding="utf-8") as f:
                    self._debarment_cache = json.load(f)
        except Exception as exc:
            logger.warning("Error loading registry fixtures from %s: %s", self.fixtures_dir, exc)

    async def _simulate_delay(self) -> int:
        """Simulate realistic network latency (300-800ms) for UI fan-out animation."""
        if not self.simulate_latency or self.max_latency_ms <= 0:
            return 0
        ms = random.randint(self.min_latency_ms, self.max_latency_ms)
        await asyncio.sleep(ms / 1000.0)
        return ms

    # =========================================================================
    # Async Methods
    # =========================================================================

    async def verify_gstin(
        self,
        gstin: str,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        """Verify GSTIN against mock GSTN portal database with scenario control."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        clean_gstin = gstin.strip().upper() if gstin else ""
        eff_scenario = self._resolve_scenario(scenario, clean_gstin)

        # 1. API Failure Simulation
        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={
                    "gstin": clean_gstin,
                    "error": "Simulated Gateway Timeout: GSTN statutory portal 503 Service Unavailable",
                    "retryable": True,
                },
                source="GST Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        # 2. Not Found Simulation
        if eff_scenario == RegistryScenario.NOT_FOUND:
            return RegistryResult(
                found=False,
                status="NOT_FOUND",
                data={"gstin": clean_gstin, "message": "GSTIN record not found in simulated GSTN registry"},
                source="GST Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        # 3. Expired / Cancelled Simulation
        if eff_scenario == RegistryScenario.EXPIRED:
            return RegistryResult(
                found=True,
                status="CANCELLED",
                data={
                    "gstin": clean_gstin,
                    "legal_name": "SIMULATED EXPIRED TAXPAYER ENTITY",
                    "trade_name": "Expired Entity",
                    "status": "CANCELLED",
                    "registration_date": "2017-07-01",
                    "cancellation_date": "2023-01-10",
                    "cancellation_reason": "Suo-moto cancelled for continuous non-filing of returns",
                },
                source="GST Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        # 4. Mismatch Simulation
        if eff_scenario == RegistryScenario.MISMATCH:
            return RegistryResult(
                found=True,
                status="ACTIVE",
                data={
                    "gstin": clean_gstin,
                    "legal_name": "TOTALLY DIFFERENT CORPORATE ENTITY PRIVATE LIMITED",
                    "trade_name": "Mismatched Trade Entity",
                    "status": "ACTIVE",
                    "pan": "ZZZZZ9999Z",
                    "state": "Delhi",
                },
                source="GST Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        # 5. Normal Fixture Lookup / Synthesis
        rec = self._gstin_cache.get(clean_gstin)
        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "ACTIVE"),
                data=rec,
                source="GST Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        # Synthesize fallback ONLY for explicit synthetic/mock test tokens
        if clean_gstin.startswith(("SYNTHETIC", "MOCK", "SAMPLE", "VALID")):
            pan_part = clean_gstin[2:12] if len(clean_gstin) >= 12 else "AABCC1234F"
            return RegistryResult(
                found=True,
                status="ACTIVE",
                data={
                    "gstin": clean_gstin,
                    "legal_name": f"SIMULATED TAXPAYER ({clean_gstin})",
                    "trade_name": f"Trade Entity {clean_gstin[:6]}",
                    "status": "ACTIVE",
                    "pan": pan_part,
                    "state_code": clean_gstin[:2] if clean_gstin[:2].isdigit() else "33",
                },
                source="GST Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"gstin": clean_gstin, "message": "GSTIN record not found in simulated GSTN registry"},
            source="GST Registry — DEMO (Simulated Portal)",
            latency_ms=elapsed_ms,
        )

    async def verify_pan(
        self,
        pan: str,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        """Verify PAN against mock NSDL / Income Tax portal database with scenario control."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        clean_pan = pan.strip().upper() if pan else ""
        eff_scenario = self._resolve_scenario(scenario, clean_pan)

        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={"pan": clean_pan, "error": "Simulated Gateway Timeout: NSDL portal 503 Service Unavailable"},
                source="PAN NSDL Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if eff_scenario == RegistryScenario.NOT_FOUND:
            return RegistryResult(
                found=False,
                status="NOT_FOUND",
                data={"pan": clean_pan, "message": "PAN record not found in simulated NSDL registry"},
                source="PAN NSDL Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if eff_scenario == RegistryScenario.MISMATCH:
            return RegistryResult(
                found=True,
                status="VALID",
                data={
                    "pan": clean_pan,
                    "name": "DIVERGENT NAME REGISTERED IN INCOME TAX DATABASE",
                    "entity_type": "Company",
                    "status": "VALID",
                },
                source="PAN NSDL Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if eff_scenario == RegistryScenario.EXPIRED:
            return RegistryResult(
                found=True,
                status="INOPERATIVE",
                data={
                    "pan": clean_pan,
                    "name": "INOPERATIVE / DEACTIVATED PAN HOLDER",
                    "status": "INOPERATIVE",
                    "message": "PAN is inoperative due to non-linkage with Aadhaar under Sec 139AA",
                },
                source="PAN NSDL Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        rec = self._pan_cache.get(clean_pan)
        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "VALID"),
                data=rec,
                source="PAN NSDL Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if clean_pan.startswith(("SYNTHETIC", "MOCK", "SAMPLE", "VALID")):
            entity_type_map = {"C": "Company", "P": "Individual", "F": "Partnership Firm", "H": "HUF", "L": "Local Authority"}
            e_char = clean_pan[3] if len(clean_pan) >= 4 else "C"
            return RegistryResult(
                found=True,
                status="VALID",
                data={
                    "pan": clean_pan,
                    "name": f"SIMULATED TAXPAYER ({clean_pan})",
                    "entity_type": entity_type_map.get(e_char, "Company"),
                    "status": "VALID",
                },
                source="PAN NSDL Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"pan": clean_pan, "message": "PAN record not found in simulated NSDL registry"},
            source="PAN NSDL Portal — DEMO (Simulated Portal)",
            latency_ms=elapsed_ms,
        )

    async def verify_udyam(
        self,
        udyam_no: str,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        """Verify Udyam MSME number against mock Ministry of MSME database."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        clean_udyam = udyam_no.strip().upper() if udyam_no else ""
        eff_scenario = self._resolve_scenario(scenario, clean_udyam)

        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={"udyam_no": clean_udyam, "error": "Simulated Gateway Timeout: Udyam MSME portal 503 Unavailable"},
                source="Udyam MSME Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if eff_scenario == RegistryScenario.NOT_FOUND:
            return RegistryResult(
                found=False,
                status="NOT_FOUND",
                data={"udyam_no": clean_udyam, "message": "Udyam registration not found in simulated registry"},
                source="Udyam MSME Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if eff_scenario == RegistryScenario.MISMATCH:
            return RegistryResult(
                found=True,
                status="ACTIVE",
                data={
                    "udyam_no": clean_udyam,
                    "name": "UNRELATED ENTERPRISE RECORDED IN UDYAM DATABASE",
                    "enterprise_type": "MEDIUM",
                    "status": "ACTIVE",
                },
                source="Udyam MSME Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        rec = self._udyam_cache.get(clean_udyam)
        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "ACTIVE"),
                data=rec,
                source="Udyam MSME Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if clean_udyam.startswith(("SYNTHETIC", "MOCK", "SAMPLE", "VALID")):
            return RegistryResult(
                found=True,
                status="ACTIVE",
                data={
                    "udyam_no": clean_udyam,
                    "name": f"SIMULATED MSME ENTERPRISE ({clean_udyam})",
                    "enterprise_type": "SMALL",
                    "status": "ACTIVE",
                    "major_activity": "MANUFACTURING",
                },
                source="Udyam MSME Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"udyam_no": clean_udyam, "message": "Udyam registration not found in simulated registry"},
            source="Udyam MSME Registry — DEMO (Simulated Portal)",
            latency_ms=elapsed_ms,
        )

    async def verify_cin(
        self,
        cin: str,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        """Verify Corporate Identification Number against mock MCA21 database."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        clean_cin = cin.strip().upper() if cin else ""
        eff_scenario = self._resolve_scenario(scenario, clean_cin)

        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={"cin": clean_cin, "error": "Simulated Gateway Timeout: MCA21 portal 503 Unavailable"},
                source="MCA21 Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if eff_scenario == RegistryScenario.NOT_FOUND:
            return RegistryResult(
                found=False,
                status="NOT_FOUND",
                data={"cin": clean_cin, "message": "CIN not found in simulated MCA21 registry"},
                source="MCA21 Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        rec = self._cin_cache.get(clean_cin)
        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "ACTIVE"),
                data=rec,
                source="MCA21 Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if clean_cin.startswith(("SYNTHETIC", "MOCK", "SAMPLE", "VALID")):
            return RegistryResult(
                found=True,
                status="ACTIVE",
                data={
                    "cin": clean_cin,
                    "company_name": f"SIMULATED CORPORATE ENTITY ({clean_cin})",
                    "status": "ACTIVE",
                    "company_class": "Private",
                },
                source="MCA21 Portal — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"cin": clean_cin, "message": "CIN not found in simulated MCA registry"},
            source="MCA21 Portal — DEMO (Simulated Portal)",
            latency_ms=elapsed_ms,
        )

    async def check_debarment(
        self,
        name: Optional[str] = None,
        pan: Optional[str] = None,
        gstin: Optional[str] = None,
        cin: Optional[str] = None,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        """Check national debarment and blacklist registries (CPPP / GeM)."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        token_to_check = pan or name or gstin or cin or ""
        eff_scenario = self._resolve_scenario(scenario, token_to_check)

        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={"error": "Simulated Gateway Timeout: CPPP Debarment portal 503 Unavailable"},
                source="CPPP Debarment Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        if eff_scenario == RegistryScenario.DEBARRED:
            return RegistryResult(
                found=True,
                status="DEBARRED",
                data={
                    "debarred": True,
                    "hit_count": 1,
                    "hits": [
                        {
                            "pan": pan or "SIMULATED_DEBARRED_PAN",
                            "name": name or "SIMULATED DEBARRED VENDOR ENTITY",
                            "authority": "Ministry of Petroleum and Natural Gas / CPPP",
                            "order_number": "CPPP/DEB/2024/991",
                            "period_from": "2024-01-01",
                            "period_to": "2026-01-01",
                            "reason": "Debarred for non-performance and forged document submissions",
                        }
                    ],
                    "notice": "Debarment record identified in simulated CPPP registry",
                },
                source="CPPP Debarment Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        hits = []
        clean_pan = pan.strip().upper() if pan else (gstin[2:12].strip().upper() if gstin and len(gstin) >= 12 else None)
        clean_name = name.strip().upper() if name else None

        for item in self._debarment_cache:
            item_pan = item.get("pan", "").strip().upper()
            item_name = item.get("name", "").strip().upper()

            matched = False
            if clean_pan and item_pan and clean_pan == item_pan:
                matched = True
            elif clean_name and item_name and (clean_name in item_name or item_name in clean_name):
                matched = True

            if matched:
                hits.append(item)

        if hits:
            return RegistryResult(
                found=True,
                status="DEBARRED",
                data={
                    "debarred": True,
                    "hit_count": len(hits),
                    "hits": hits,
                    "notice": "Debarment record identified in simulated CPPP registry",
                },
                source="CPPP Debarment Registry — DEMO (Simulated Portal)",
                latency_ms=elapsed_ms,
            )

        return RegistryResult(
            found=False,
            status="CLEAR",
            data={
                "debarred": False,
                "hit_count": 0,
                "hits": [],
                "notice": "No debarment records found in simulated registry",
            },
            source="CPPP Debarment Registry — DEMO (Simulated Portal)",
            latency_ms=elapsed_ms,
        )

    # =========================================================================
    # Synchronous Execution Helpers
    # =========================================================================

    def verify_gstin_sync(
        self,
        gstin: str,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        clean_gstin = gstin.strip().upper() if gstin else ""
        eff_scenario = self._resolve_scenario(scenario, clean_gstin)

        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={"gstin": clean_gstin, "error": "Simulated Gateway Timeout: GSTN statutory portal 503 Unavailable"},
                source="GST Registry — DEMO (Simulated Portal)",
            )

        if eff_scenario == RegistryScenario.NOT_FOUND:
            return RegistryResult(
                found=False,
                status="NOT_FOUND",
                data={"gstin": clean_gstin, "message": "GSTIN record not found in simulated GSTN registry"},
                source="GST Registry — DEMO (Simulated Portal)",
            )

        if eff_scenario == RegistryScenario.EXPIRED:
            return RegistryResult(
                found=True,
                status="CANCELLED",
                data={"gstin": clean_gstin, "status": "CANCELLED", "cancellation_date": "2023-01-10"},
                source="GST Registry — DEMO (Simulated Portal)",
            )

        if eff_scenario == RegistryScenario.MISMATCH:
            return RegistryResult(
                found=True,
                status="ACTIVE",
                data={"gstin": clean_gstin, "legal_name": "DIVERGENT REGISTERED ENTITY", "status": "ACTIVE"},
                source="GST Registry — DEMO (Simulated Portal)",
            )

        rec = self._gstin_cache.get(clean_gstin)
        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "ACTIVE"),
                data=rec,
                source="GST Registry — DEMO (Simulated Portal)",
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"gstin": clean_gstin, "message": "GSTIN record not found in simulated registry"},
            source="GST Registry — DEMO (Simulated Portal)",
        )

    def verify_pan_sync(
        self,
        pan: str,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        clean_pan = pan.strip().upper() if pan else ""
        eff_scenario = self._resolve_scenario(scenario, clean_pan)

        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={"pan": clean_pan, "error": "Simulated Gateway Timeout: NSDL portal 503 Unavailable"},
                source="PAN NSDL Portal — DEMO (Simulated Portal)",
            )

        if eff_scenario == RegistryScenario.NOT_FOUND:
            return RegistryResult(
                found=False,
                status="NOT_FOUND",
                data={"pan": clean_pan, "message": "PAN record not found in simulated NSDL registry"},
                source="PAN NSDL Portal — DEMO (Simulated Portal)",
            )

        rec = self._pan_cache.get(clean_pan)
        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "VALID"),
                data=rec,
                source="PAN NSDL Portal — DEMO (Simulated Portal)",
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"pan": clean_pan, "message": "PAN record not found in simulated registry"},
            source="PAN NSDL Portal — DEMO (Simulated Portal)",
        )

    def verify_udyam_sync(
        self,
        udyam_no: str,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        clean_udyam = udyam_no.strip().upper() if udyam_no else ""
        eff_scenario = self._resolve_scenario(scenario, clean_udyam)

        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={"udyam_no": clean_udyam, "error": "Simulated Gateway Timeout: Udyam portal 503 Unavailable"},
                source="Udyam MSME Registry — DEMO (Simulated Portal)",
            )

        rec = self._udyam_cache.get(clean_udyam)
        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "ACTIVE"),
                data=rec,
                source="Udyam MSME Registry — DEMO (Simulated Portal)",
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"udyam": clean_udyam, "message": "Udyam registration not found in simulated registry"},
            source="Udyam MSME Registry — DEMO (Simulated Portal)",
        )

    def verify_cin_sync(
        self,
        cin: str,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        clean_cin = cin.strip().upper() if cin else ""
        eff_scenario = self._resolve_scenario(scenario, clean_cin)

        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={"cin": clean_cin, "error": "Simulated Gateway Timeout: MCA21 portal 503 Unavailable"},
                source="MCA21 Portal — DEMO (Simulated Portal)",
            )

        rec = self._cin_cache.get(clean_cin)
        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "ACTIVE"),
                data=rec,
                source="MCA21 Portal — DEMO (Simulated Portal)",
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"cin": clean_cin, "message": "CIN not found in simulated registry"},
            source="MCA21 Portal — DEMO (Simulated Portal)",
        )

    def check_debarment_sync(
        self,
        name: Optional[str] = None,
        pan: Optional[str] = None,
        gstin: Optional[str] = None,
        cin: Optional[str] = None,
        scenario: Optional[RegistryScenario | str] = None,
    ) -> RegistryResult:
        token_to_check = pan or name or gstin or cin or ""
        eff_scenario = self._resolve_scenario(scenario, token_to_check)

        if eff_scenario == RegistryScenario.API_UNAVAILABLE:
            return RegistryResult(
                found=False,
                status="API_UNAVAILABLE",
                data={"error": "Simulated Gateway Timeout: CPPP Debarment portal 503 Unavailable"},
                source="CPPP Debarment Registry — DEMO (Simulated Portal)",
            )

        if eff_scenario == RegistryScenario.DEBARRED:
            return RegistryResult(
                found=True,
                status="DEBARRED",
                data={"debarred": True, "hit_count": 1, "hits": [{"name": name, "pan": pan, "reason": "Simulated debarment"}]},
                source="CPPP Debarment Registry — DEMO (Simulated Portal)",
            )

        hits = []
        clean_pan = pan.strip().upper() if pan else (gstin[2:12].strip().upper() if gstin and len(gstin) >= 12 else None)
        clean_name = name.strip().upper() if name else None

        for item in self._debarment_cache:
            item_pan = item.get("pan", "").strip().upper()
            item_name = item.get("name", "").strip().upper()
            if clean_pan and item_pan and clean_pan == item_pan:
                hits.append(item)
            elif clean_name and item_name and (clean_name in item_name or item_name in clean_name):
                hits.append(item)

        if hits:
            return RegistryResult(
                found=True,
                status="DEBARRED",
                data={"debarred": True, "hit_count": len(hits), "hits": hits},
                source="CPPP Debarment Registry — DEMO (Simulated Portal)",
            )
        return RegistryResult(
            found=False,
            status="CLEAR",
            data={"debarred": False, "hit_count": 0, "hits": []},
            source="CPPP Debarment Registry — DEMO (Simulated Portal)",
        )
