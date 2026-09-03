"""VigilBid Structural and Import Verification Script."""

import sys
import importlib
from pathlib import Path
import yaml

ROOT = Path(__file__).resolve().parent.parent

REQUIRED_DIRECTORIES = [
    "backend/core",
    "backend/auth",
    "backend/api",
    "backend/models",
    "backend/schemas",
    "backend/services",
    "backend/workers",
    "pipeline/ocr",
    "pipeline/document_processing",
    "pipeline/extraction",
    "pipeline/entity_resolution",
    "pipeline/registry_adapters",
    "pipeline/compliance",
    "pipeline/risk",
    "pipeline/audit",
    "pipeline/evidence",
    "pipeline/rag",
    "pipeline/reports",
    "rules",
    "seed",
    "frontend/src",
    "tests",
    "docs",
    "scripts",
    "data/storage",
    "data/fixtures",
]

REQUIRED_MODULES = [
    "backend.main",
    "backend.core.config",
    "backend.core.security",
    "backend.auth.jwt",
    "backend.auth.rbac",
    "backend.models",
    "backend.schemas",
    "backend.api",
    "backend.services",
    "backend.workers",
    "pipeline.runner",
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
]


if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass


def verify():
    print("=" * 60)
    print("VigilBid (SIH26100) - Repository Structure Verification")
    print("=" * 60)

    # 1. Check directories
    print("\n[1/4] Checking Required Directories...")
    missing_dirs = []
    for d in REQUIRED_DIRECTORIES:
        path = ROOT / d
        if not path.is_dir():
            missing_dirs.append(d)
            print(f"  [MISSING] Directory: {d}")
        else:
            print(f"  [OK] Directory present: {d}")

    # 2. Check Module Imports
    print("\n[2/4] Testing Python Module Imports...")
    sys.path.insert(0, str(ROOT))
    import_errors = []
    for mod in REQUIRED_MODULES:
        try:
            importlib.import_module(mod)
            print(f"  [OK] Imported: {mod}")
        except Exception as e:
            import_errors.append((mod, str(e)))
            print(f"  [FAIL] Failed to import {mod}: {e}")

    # 3. Check Rules YAML syntax
    print("\n[3/4] Validating Rules YAML syntax...")
    yaml_errors = []
    rules_files = [ROOT / "rules" / "cpcl_goods_v1.yaml", ROOT / "rules" / "risk_weights.yaml"]
    for yf in rules_files:
        if not yf.exists():
            yaml_errors.append((str(yf), "File missing"))
            print(f"  [MISSING] Missing YAML file: {yf.name}")
        else:
            try:
                with open(yf, "r", encoding="utf-8") as f:
                    content = yaml.safe_load(f)
                    assert isinstance(content, dict)
                print(f"  [OK] Valid YAML: {yf.name}")
            except Exception as e:
                yaml_errors.append((str(yf), str(e)))
                print(f"  [FAIL] Invalid YAML in {yf.name}: {e}")

    # 4. Check Documentation
    print("\n[4/4] Checking Key Architectural Documents...")
    doc_errors = []
    docs = [
        "docs/BUILD-STATUS.md",
        "docs/ARCHITECTURE-LOCK.md",
        "docs/INTERFACE-CONTRACTS.md",
        "docs/REPOSITORY-STRUCTURE.md",
    ]
    for doc in docs:
        if (ROOT / doc).exists():
            print(f"  [OK] Document present: {doc}")
        else:
            doc_errors.append(doc)
            print(f"  [PENDING] Document pending: {doc}")

    print("\n" + "=" * 60)
    if missing_dirs or import_errors or yaml_errors:
        print("VERIFICATION FAILED:")
        print(f"  Missing Dirs: {len(missing_dirs)}")
        print(f"  Import Errors: {len(import_errors)}")
        print(f"  YAML Errors: {len(yaml_errors)}")
        sys.exit(1)
    else:
        print("ALL ARCHITECTURAL STARTUP CHECKS PASSED [OK]")
        print("=" * 60)
        sys.exit(0)


if __name__ == "__main__":
    verify()
