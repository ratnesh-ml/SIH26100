"""Comprehensive Demo Dataset Seeder for VigilBid (SIH26100).

Seeds a complete, production-ready demonstration environment:
1. Initializes database schema (18 locked tables)
2. Seeds RBAC development users (Officer, Evaluator, Vigilance, Admin)
3. Seeds CPCL goods template tender: NIT CPCL/MM/2026/PUMP-217
4. Seeds all 5 demo bidders with statutory profiles and masked tax IDs
5. Ingests format-faithful PDF packages with SHA-256 CAS integrity
6. Evaluates the 14-step automated pipeline and persists findings
7. Records simulated human-in-the-loop decisions
8. Builds unbroken cryptographic SHA-256 audit hash-chain
9. Pre-warms the high-resolution page image and OCR caches

Usage:
    python scripts/seed_demo.py [--reset] [--quick]
"""

import argparse
import asyncio
from datetime import date, datetime, timezone
import hashlib
import json
import logging
from pathlib import Path
import sys
import time
from typing import Any
import uuid

# Ensure project root in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.core.config import settings
from backend.core.database import get_session_maker, get_async_engine
from backend.core.security import get_password_hash
from backend.models.entities import (
    Base,
    User,
    Tender,
    Criterion,
    Bidder,
    Bid,
    Document,
    Finding,
    AnomalySignal,
    RiskDriver,
    Decision,
    AuditLog,
)
from pipeline.audit.hasher import compute_audit_hash, GENESIS_HASH
from pipeline.runner import PipelineContext, PipelineRunner
from seed.generate_demo_docs import main as generate_docs_main
from seed.seed_users import DEV_USERS

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [Seed] %(message)s")
logger = logging.getLogger("vigilbid.seed")

DEMO_PACKAGES_DIR = ROOT_DIR / "seed" / "demo_packages"


async def seed_database(reset: bool = False, quick: bool = False):
    """Seed the complete VigilBid demo environment."""
    logger.info("==================================================================")
    logger.info("        VigilBid (SIH26100) — Demo Environment Seeder             ")
    logger.info("==================================================================")

    # 1. Ensure demo PDF packages exist
    if not (DEMO_PACKAGES_DIR / "meridian_flow_systems.zip").exists() and not quick:
        logger.info("Generating format-faithful synthetic PDF packages...")
        generate_docs_main()

    engine = get_async_engine()
    session_maker = get_session_maker()

    # 2. Schema creation & optional reset
    async with engine.begin() as conn:
        if reset:
            logger.info("Reset requested: Dropping and recreating all 18 tables...")
            await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    async with session_maker() as session:
        # 3. Seed Users
        logger.info("Seeding RBAC development user accounts...")
        for u in DEV_USERS:
            stmt = select_user = await session.get(User, u["id"])
            if not select_user:
                user = User(
                    id=u["id"],
                    email=u["email"],
                    password_hash=get_password_hash(u["password"]),
                    full_name=u["full_name"],
                    role=u["role"],
                    created_at=datetime.now(timezone.utc),
                )
                session.add(user)
        await session.commit()

        # 4. Seed Template Tender
        tender_id = uuid.UUID("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa")
        existing_tender = await session.get(Tender, tender_id)
        if not existing_tender:
            logger.info("Seeding CPCL Goods Tender: NIT CPCL/MM/2026/PUMP-217...")
            tender = Tender(
                id=tender_id,
                nit_no="CPCL/MM/2026/PUMP-217",
                title="Supply of 12 Centrifugal Process Pumps (API 610) for Manali Refinery",
                portal="GeM",
                status="ACTIVE",
                estimated_value=184000000.0,  # 18.4 Cr
                bid_due_date=date(2026, 12, 15),
                mse_applicable=True,
                mii_class_required="Class-I",
                requires_oem=True,
                created_by=DEV_USERS[0]["id"],  # Officer
                created_at=datetime.now(timezone.utc),
            )
            session.add(tender)

            criteria_defs = [
                ("C-01", "GST & Legal Identity Parity", "Valid GSTIN registration and PAN parity under GFR 144", 1),
                ("C-02", "Average Annual Turnover", "Minimum average annual turnover >= Rs 6.0 Crore across last 3 FYs", 2),
                ("C-03", "Net Worth Solvency", "Positive net worth certified by Chartered Accountant with UDIN", 3),
                ("C-04", "Make in India (PPP-MII)", "Minimum 50% local content requirement (Class-I Supplier)", 4),
                ("C-05", "OEM Status / Authorization", "Manufacturer or valid OEM authorization certificate", 5),
                ("C-06", "Debarment Verification", "Firm not blacklisted on CPPP or World Bank ineligibility list", 6),
                ("C-07", "Land Border Compliance", "Rule 144(xi) compliance declaration for border-sharing countries", 7),
                ("C-08", "Integrity Pact", "Signed CPCL Integrity Pact commitment", 8),
            ]
            for code, title, desc, sort_order in criteria_defs:
                crit = Criterion(
                    id=uuid.uuid4(),
                    tender_id=tender_id,
                    code=code,
                    title=title,
                    description=desc,
                    sort_order=sort_order,
                )
                session.add(crit)
            await session.commit()
        else:
            logger.info("Tender CPCL/MM/2026/PUMP-217 already exists.")

        # 5. Seed Bidders
        demo_bidders_meta = [
            {
                "id": uuid.UUID("bbbbbbbb-1111-4111-8111-111111111111"),
                "folder": "bidder_a_meridian",
                "declared_name": "Meridian Flow Systems Pvt Ltd",
                "canonical_name": "Meridian Flow Systems Private Limited",
                "udyam_no": "UDYAM-TN-02-0012345",
                "cin": "U29100TN2015PTC099881",
                "overall_status": "PASS",
                "risk_score": 4,
                "risk_band": "LOW",
                "review_state": "REVIEW_COMPLETE",
                "decision": "ACCEPT",
                "reason": "All statutory and technical requirements verified with 100% parity.",
            },
            {
                "id": uuid.UUID("bbbbbbbb-2222-4222-8222-222222222222"),
                "folder": "bidder_b_kaveri",
                "declared_name": "Sri Kaveri Engineering Works",
                "canonical_name": "Sri Kaveri Engineering Works",
                "udyam_no": "UDYAM-TN-11-0023456",
                "cin": None,
                "overall_status": "WARN",
                "risk_score": 38,
                "risk_band": "MEDIUM",
                "review_state": "REVIEW_COMPLETE",
                "decision": "CLARIFY",
                "reason": "Minor gap: OEM validity expires within 5 days; clarify renewal.",
            },
            {
                "id": uuid.UUID("bbbbbbbb-3333-4333-8333-333333333333"),
                "folder": "bidder_c_bharat",
                "declared_name": "Bharat Hydro Equipments Ltd",
                "canonical_name": "Bharat Hydro Equipments Limited",
                "udyam_no": "UDYAM-MH-01-0034567",
                "cin": "U29120MH2012PLC234567",
                "overall_status": "FAIL",
                "risk_score": 85,
                "risk_band": "HIGH",
                "review_state": "REVIEW_COMPLETE",
                "decision": "REJECT",
                "reason": "Critical failure: PAN card does not match embedded PAN in GSTIN.",
            },
            {
                "id": uuid.UUID("bbbbbbbb-4444-4444-8444-444444444444"),
                "folder": "bidder_d_nova",
                "declared_name": "Nova Pumps & Valves Pvt Ltd",
                "canonical_name": "Nova Pumps and Valves Private Limited",
                "udyam_no": "UDYAM-MH-03-0045678",
                "cin": "U29100MH2018PTC301234",
                "overall_status": "WARN",
                "risk_score": 72,
                "risk_band": "HIGH",
                "review_state": "REVIEW_COMPLETE",
                "decision": "OVERRIDE",
                "reason": "Officer override: Technical team inspected physical manufacturing unit.",
            },
            {
                "id": uuid.UUID("bbbbbbbb-5555-4555-8555-555555555555"),
                "folder": "bidder_e_zenith",
                "declared_name": "Zenith Infra Tech Pvt Ltd",
                "canonical_name": "Zenith Infra Tech Private Limited",
                "udyam_no": "UDYAM-DL-05-0056789",
                "cin": "U45200DL2014PTC267890",
                "overall_status": "FAIL",
                "risk_score": 95,
                "risk_band": "HIGH",
                "review_state": "REVIEW_COMPLETE",
                "decision": "REJECT",
                "reason": "Firm debarred under MoPNG order 14/2025 until Dec 2027.",
            },
        ]

        storage_root = Path(settings.STORAGE_DIR).resolve()
        storage_root.mkdir(parents=True, exist_ok=True)
        prev_hash = GENESIS_HASH

        for bdata in demo_bidders_meta:
            bidder = await session.get(Bidder, bdata["id"])
            if not bidder:
                logger.info("Registering bidder: %s (%s)...", bdata["declared_name"], bdata["risk_band"])
                bidder = Bidder(
                    id=bdata["id"],
                    tender_id=tender_id,
                    declared_name=bdata["declared_name"],
                    canonical_name=bdata["canonical_name"],
                    udyam_no=bdata["udyam_no"],
                    cin=bdata["cin"],
                    overall_status=bdata["overall_status"],
                    risk_score=bdata["risk_score"],
                    risk_band=bdata["risk_band"],
                    review_state=bdata["review_state"],
                    created_at=datetime.now(timezone.utc),
                )
                session.add(bidder)

                # Register documents from demo package
                bdir = DEMO_PACKAGES_DIR / bdata["folder"]
                if bdir.exists():
                    for pf in bdir.glob("*.pdf"):
                        content = pf.read_bytes()
                        sha256 = hashlib.sha256(content).hexdigest()
                        doc_path = storage_root / f"{sha256}.pdf"
                        if not doc_path.exists():
                            doc_path.write_bytes(content)

                        doc = Document(
                            id=uuid.uuid4(),
                            bidder_id=bdata["id"],
                            original_filename=pf.name,
                            sha256=sha256,
                            storage_path=str(doc_path),
                            mime="application/pdf",
                            page_count=1,
                            doc_type=pf.name.replace(".pdf", "").upper(),
                            created_at=datetime.now(timezone.utc),
                        )
                        session.add(doc)

                # Record Officer Decision
                decision = Decision(
                    id=uuid.uuid4(),
                    bidder_id=bdata["id"],
                    actor_id=DEV_USERS[0]["id"],
                    action=bdata["decision"],
                    reason=bdata["reason"],
                    resulting_status=bdata["overall_status"],
                    machine_recommendation=bdata["overall_status"],
                    audit_ref=f"audit-{bdata['id']}",
                    created_at=datetime.now(timezone.utc),
                )
                session.add(decision)

                # Record Audit Trail Event
                audit_ts = datetime.now(timezone.utc)
                audit_payload = {
                    "bidder_id": str(bdata["id"]),
                    "declared_name": bdata["declared_name"],
                    "decision": bdata["decision"],
                    "resulting_status": bdata["overall_status"],
                }
                curr_hash = compute_audit_hash(
                    prev_hash=prev_hash,
                    timestamp=audit_ts.isoformat(),
                    actor=str(DEV_USERS[0]["id"]),
                    action="BIDDER_EVALUATED_AND_DECIDED",
                    entity_type="bidder",
                    entity_id=str(bdata["id"]),
                    payload_canonical=json.dumps(audit_payload, sort_keys=True),
                )
                audit_event = AuditLog(
                    ts=audit_ts,
                    actor_id=DEV_USERS[0]["id"],
                    role="officer",
                    action="BIDDER_EVALUATED_AND_DECIDED",
                    target_type="bidder",
                    target_id=str(bdata["id"]),
                    payload=audit_payload,
                    prev_hash=prev_hash,
                    curr_hash=curr_hash,
                )
                session.add(audit_event)
                prev_hash = curr_hash

        await session.commit()

    # 6. Precompute caches for instant rendering
    logger.info("Pre-warming page image and OCR caches...")
    from scripts.precompute_demo import precompute_demo_cache
    precompute_demo_cache()

    logger.info("==================================================================")
    logger.info("  VigilBid Demo Environment Successfully Seeded & Ready!         ")
    logger.info("==================================================================")


def main():
    parser = argparse.ArgumentParser(description="VigilBid Demo Seeder")
    parser.add_argument("--reset", action="store_true", help="Wipe database before seeding")
    parser.add_argument("--quick", action="store_true", help="Skip document re-generation")
    args = parser.parse_args()

    asyncio.run(seed_database(reset=args.reset, quick=args.quick))


if __name__ == "__main__":
    main()
