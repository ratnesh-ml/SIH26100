"""Fixture-backed Mock Government Registry Provider with Artificial Latency Simulation."""

import asyncio
from datetime import datetime, timezone
import json
import logging
import os
from pathlib import Path
import random
import time
from typing import Any, Optional

from pipeline.registry_adapters.base import RegistryProvider, RegistryResult

logger = logging.getLogger(__name__)

DEFAULT_FIXTURES_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "fixtures" / "registry"


class MockRegistryProvider(RegistryProvider):
    """Provides fixture-backed responses simulating government registry portals.
    
    UI and API must clearly identify: 'Source: Simulated registry (demo)'.
    Do NOT claim these are live government integrations.
    """

    def __init__(
        self,
        fixtures_dir: Optional[str] = None,
        simulate_latency: bool = True,
        min_latency_ms: int = 300,
        max_latency_ms: int = 800,
    ):
        self.fixtures_dir = Path(fixtures_dir) if fixtures_dir else DEFAULT_FIXTURES_DIR
        self.simulate_latency = simulate_latency
        self.min_latency_ms = min_latency_ms
        self.max_latency_ms = max_latency_ms

        self._gstin_cache: dict[str, Any] = {}
        self._pan_cache: dict[str, Any] = {}
        self._udyam_cache: dict[str, Any] = {}
        self._cin_cache: dict[str, Any] = {}
        self._debarment_cache: list[dict[str, Any]] = []

        self._load_fixtures()

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

    async def verify_gstin(self, gstin: str) -> RegistryResult:
        """Verify GSTIN against mock GSTN portal database."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        clean_gstin = gstin.strip().upper() if gstin else ""
        rec = self._gstin_cache.get(clean_gstin)

        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "ACTIVE"),
                data=rec,
                source="Simulated registry (demo)",
                latency_ms=elapsed_ms,
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"gstin": clean_gstin, "message": "GSTIN record not found in simulated registry"},
            source="Simulated registry (demo)",
            latency_ms=elapsed_ms,
        )

    async def verify_pan(self, pan: str) -> RegistryResult:
        """Verify PAN against mock NSDL / Income Tax portal database."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        clean_pan = pan.strip().upper() if pan else ""
        rec = self._pan_cache.get(clean_pan)

        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "VALID"),
                data=rec,
                source="Simulated registry (demo)",
                latency_ms=elapsed_ms,
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"pan": clean_pan, "message": "PAN record not found in simulated registry"},
            source="Simulated registry (demo)",
            latency_ms=elapsed_ms,
        )

    async def verify_udyam(self, udyam_no: str) -> RegistryResult:
        """Verify Udyam MSME number against mock Ministry of MSME database."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        clean_udyam = udyam_no.strip().upper() if udyam_no else ""
        rec = self._udyam_cache.get(clean_udyam)

        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "ACTIVE"),
                data=rec,
                source="Simulated registry (demo)",
                latency_ms=elapsed_ms,
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"udyam_no": clean_udyam, "message": "Udyam registration not found in simulated registry"},
            source="Simulated registry (demo)",
            latency_ms=elapsed_ms,
        )

    async def verify_cin(self, cin: str) -> RegistryResult:
        """Verify Corporate Identification Number against mock MCA21 database."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        clean_cin = cin.strip().upper() if cin else ""
        rec = self._cin_cache.get(clean_cin)

        if rec:
            return RegistryResult(
                found=True,
                status=rec.get("status", "ACTIVE"),
                data=rec,
                source="Simulated registry (demo)",
                latency_ms=elapsed_ms,
            )

        return RegistryResult(
            found=False,
            status="NOT_FOUND",
            data={"cin": clean_cin, "message": "CIN not found in simulated MCA registry"},
            source="Simulated registry (demo)",
            latency_ms=elapsed_ms,
        )

    async def check_debarment(
        self,
        name: Optional[str] = None,
        pan: Optional[str] = None,
        gstin: Optional[str] = None,
        cin: Optional[str] = None,
    ) -> RegistryResult:
        """Check national debarment and blacklist registries (CPPP / GeM)."""
        start_time = time.perf_counter()
        sim_latency = await self._simulate_delay()
        elapsed_ms = sim_latency or int((time.perf_counter() - start_time) * 1000)

        hits = []
        clean_pan = pan.strip().upper() if pan else (gstin[2:12].strip().upper() if gstin and len(gstin) >= 12 else None)
        clean_name = name.strip().upper() if name else None

        for item in self._debarment_cache:
            item_pan = item.get("pan", "").strip().upper()
            item_name = item.get("name", "").strip().upper()

            matched = False
            # 1. Exact PAN match (Authoritative)
            if clean_pan and item_pan and clean_pan == item_pan:
                matched = True
            # 2. Substring or exact Name match
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
                source="Simulated registry (demo)",
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
            source="Simulated registry (demo)",
            latency_ms=elapsed_ms,
        )
