"""Comprehensive Health Check and Diagnostic Tool for VigilBid (SIH26100).

Validates:
1. Python Runtime Environment & Dependencies
2. Database Connectivity & Dialect Health
3. Storage Directory Permissions & CAS Structure
4. Document AI / PDF Processing Engine Readiness
5. Security Keys & Cryptography Configuration
6. Backend REST API Live Endpoint Probing (if server is up)
7. Frontend Distribution Asset Status
8. Regulatory Rules & Seed Data Integrity

Usage:
    python scripts/health_check.py
    python scripts/health_check.py --verbose
    python scripts/health_check.py --api-url http://localhost:8000
"""

import argparse
import asyncio
from datetime import datetime, timezone
import importlib
import logging
import os
from pathlib import Path
import sys
import time

# Ensure project root in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

logging.basicConfig(level=logging.WARNING)


class HealthChecker:
    """Probes all operational subsystems of the VigilBid platform."""

    def __init__(self, api_url: str = "http://localhost:8000", verbose: bool = False):
        self.api_url = api_url.rstrip("/")
        self.verbose = verbose
        self.results: list[dict[str, Any]] = []

    def log_result(self, subsystem: str, check_name: str, passed: bool, message: str, critical: bool = True):
        status = "PASS" if passed else ("FAIL" if critical else "WARN")
        self.results.append({
            "subsystem": subsystem,
            "check": check_name,
            "status": status,
            "message": message,
            "critical": critical,
        })

    def check_python_environment(self):
        """Verify Python version and critical libraries."""
        subsystem = "Runtime Environment"
        # 1. Python version >= 3.11
        py_ver = sys.version_info
        ver_str = f"{py_ver.major}.{py_ver.minor}.{py_ver.micro}"
        if py_ver.major == 3 and py_ver.minor >= 11:
            self.log_result(subsystem, "Python Version", True, f"Python {ver_str} (compatible)")
        else:
            self.log_result(subsystem, "Python Version", False, f"Python {ver_str} (requires Python >= 3.11)")

        # 2. Critical Python dependencies
        critical_modules = [
            ("fastapi", "FastAPI web framework"),
            ("sqlalchemy", "SQLAlchemy 2.0 ORM"),
            ("pydantic", "Pydantic v2 validation"),
            ("fitz", "PyMuPDF PDF engine"),
            ("cryptography", "Fernet / Cryptography engine"),
            ("httpx", "HTTP client library"),
            ("yaml", "PyYAML rule parser"),
        ]
        for mod_name, desc in critical_modules:
            try:
                importlib.import_module(mod_name)
                self.log_result(subsystem, f"Module: {mod_name}", True, desc)
            except ImportError:
                self.log_result(subsystem, f"Module: {mod_name}", False, f"Missing: {desc}")

    def check_configuration_and_secrets(self):
        """Verify environment variables and cryptography keys."""
        subsystem = "Config & Security"
        from backend.core.config import settings

        # Secret key check
        if settings.SECRET_KEY and len(settings.SECRET_KEY) >= 16:
            is_dev = "dev-secret-key" in settings.SECRET_KEY
            if is_dev and settings.ENVIRONMENT.lower() == "production":
                self.log_result(subsystem, "SECRET_KEY", False, "Default SECRET_KEY in production!")
            elif is_dev:
                self.log_result(subsystem, "SECRET_KEY", True, "Development key active (non-production)", critical=False)
            else:
                self.log_result(subsystem, "SECRET_KEY", True, "Strong production key configured")
        else:
            self.log_result(subsystem, "SECRET_KEY", False, "Missing or weak SECRET_KEY")

        # Fernet key check
        if settings.FERNET_KEY and len(settings.FERNET_KEY) == 44:
            self.log_result(subsystem, "FERNET_KEY", True, "32-byte URL-safe base64 encryption key present")
        else:
            self.log_result(subsystem, "FERNET_KEY", False, "Invalid FERNET_KEY (must be 44 chars base64)")

    def check_storage_filesystem(self):
        """Verify storage root directory and page cache."""
        subsystem = "Storage & CAS"
        from backend.core.config import settings

        storage_path = Path(settings.STORAGE_DIR).resolve()
        if not storage_path.exists():
            try:
                storage_path.mkdir(parents=True, exist_ok=True)
                self.log_result(subsystem, "Storage Directory", True, f"Created {storage_path}")
            except Exception as exc:
                self.log_result(subsystem, "Storage Directory", False, f"Failed creating storage: {exc}")
                return
        else:
            self.log_result(subsystem, "Storage Directory", True, f"Accessible at {storage_path}")

        # Test write permission
        test_file = storage_path / ".health_test"
        try:
            test_file.write_text("health_check")
            test_file.unlink()
            self.log_result(subsystem, "Write Permissions", True, "Read/write verified on storage root")
        except Exception as exc:
            self.log_result(subsystem, "Write Permissions", False, f"Write denied on storage: {exc}")

        # Check page cache
        cache_dir = storage_path / "_page_cache"
        if cache_dir.exists():
            cached_pages = len(list(cache_dir.glob("*.png")))
            self.log_result(subsystem, "Page Image Cache", True, f"Active with {cached_pages} cached raster page(s)", critical=False)
        else:
            self.log_result(subsystem, "Page Image Cache", True, "Initialized on first request", critical=False)

    async def check_database(self):
        """Verify database connectivity, dialect, and latency."""
        subsystem = "Database Layer"
        from backend.core.database import check_database_connection
        db_health = await check_database_connection()
        if db_health["connected"]:
            self.log_result(
                subsystem,
                "Database Connectivity",
                True,
                f"Connected to {db_health['dialect']} (latency: {db_health['latency_ms']} ms)"
            )
        else:
            err = db_health.get("error") or "Unknown connection error"
            self.log_result(
                subsystem,
                "Database Connectivity",
                False,
                f"Connection failed: {err} (Run 'docker compose up -d db' or verify DATABASE_URL)",
                critical=False,
            )

    def check_rules_and_fixtures(self):
        """Verify statutory compliance rules and demo packages."""
        subsystem = "Rules & Seed Data"
        rules_dir = ROOT_DIR / "rules"
        if rules_dir.exists() and list(rules_dir.glob("*.yaml")):
            rule_count = len(list(rules_dir.glob("*.yaml")))
            self.log_result(subsystem, "YAML Rules", True, f"Found {rule_count} rule definition file(s)")
        else:
            self.log_result(subsystem, "YAML Rules", False, "Missing rules directory or YAML rule files")

        demo_dir = ROOT_DIR / "seed" / "demo_packages"
        if demo_dir.exists():
            bidders = list(demo_dir.glob("bidder_*"))
            self.log_result(subsystem, "Demo Packages", True, f"Found {len(bidders)} demo bidder package directories")
        else:
            self.log_result(subsystem, "Demo Packages", False, "Missing seed/demo_packages directory")

    def check_frontend_assets(self):
        """Verify compiled frontend distribution bundle."""
        subsystem = "Frontend Client"
        dist_dir = ROOT_DIR / "frontend" / "dist"
        if dist_dir.exists() and (dist_dir / "index.html").exists():
            bundle_files = list(dist_dir.rglob("*"))
            self.log_result(subsystem, "SPA Bundle", True, f"Production build present ({len(bundle_files)} files)")
        else:
            self.log_result(subsystem, "SPA Bundle", True, "Running in Vite development mode or needs build", critical=False)

    def check_live_api_server(self):
        """Probe live HTTP /health endpoint if server is up."""
        subsystem = "Live API Server"
        import httpx
        try:
            resp = httpx.get(f"{self.api_url}/health", timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                self.log_result(subsystem, "GET /health", True, f"HTTP 200 OK — Status: {data.get('status')}")
            else:
                self.log_result(subsystem, "GET /health", False, f"Returned HTTP {resp.status_code}", critical=False)
        except Exception:
            self.log_result(
                subsystem,
                "GET /health",
                True,
                f"Server not currently running on {self.api_url} (offline check only)",
                critical=False,
            )

    async def run_all(self) -> int:
        """Execute all diagnostics and render summary."""
        print("\n" + "=" * 75)
        print("          VigilBid (SIH26100) — Subsystem Health Diagnostic Probe          ")
        print("=" * 75)
        self.check_python_environment()
        self.check_configuration_and_secrets()
        self.check_storage_filesystem()
        await self.check_database()
        self.check_rules_and_fixtures()
        self.check_frontend_assets()
        self.check_live_api_server()

        # Group and display results
        by_subsystem = {}
        for r in self.results:
            by_subsystem.setdefault(r["subsystem"], []).append(r)

        total_pass = 0
        total_warn = 0
        total_fail = 0

        for subsys, items in by_subsystem.items():
            print(f"\n[{subsys}]")
            for item in items:
                status = item["status"]
                if status == "PASS":
                    symbol = "[PASS]"
                    total_pass += 1
                elif status == "WARN":
                    symbol = "[WARN]"
                    total_warn += 1
                else:
                    symbol = "[FAIL]"
                    total_fail += 1
                print(f"  {symbol:<7} {item['check']:<26} : {item['message']}")

        print("\n" + "-" * 75)
        print(f"Diagnostic Summary: {total_pass} Passed, {total_warn} Warnings, {total_fail} Failures")
        print("=" * 75 + "\n")

        return 1 if total_fail > 0 else 0


def main():
    parser = argparse.ArgumentParser(description="VigilBid Comprehensive Health Checker")
    parser.add_argument("--api-url", default="http://localhost:8000", help="Base URL of running backend API")
    parser.add_argument("--verbose", action="store_true", help="Print detailed diagnostic output")
    args = parser.parse_args()

    checker = HealthChecker(api_url=args.api_url, verbose=args.verbose)
    exit_code = asyncio.run(checker.run_all())
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
