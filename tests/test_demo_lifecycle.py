"""Tests for VigilBid Demo Mode Initialization, Reset, and Scenario Verification."""

import asyncio
from pathlib import Path
import pytest
from sqlalchemy import select

from backend.core.database import get_session_maker
from backend.models.entities import Tender, Bidder, Document, Criterion, Finding, AuditLog
from scripts.demo_setup import (
    orchestrate_demo_setup,
    TENDER_ID,
    BIDDER_IDS,
    CRITERIA_IDS,
    DEMO_PACKAGES_DIR,
)


@pytest.mark.asyncio
async def test_demo_setup_initialization():
    """Verify demo_setup executes cleanly and seeds core tender and criteria."""
    await orchestrate_demo_setup(reset=True, quick=True, seed_only=True)

    session_maker = get_session_maker()
    async with session_maker() as session:
        # Check Tender exists
        tender = await session.get(Tender, TENDER_ID)
        assert tender is not None
        assert "PUMP-217" in tender.nit_no
        assert float(tender.estimated_value) > 10_000_000

        # Check all 8 criteria exist
        criteria_res = await session.execute(
            select(Criterion).where(Criterion.tender_id == TENDER_ID)
        )
        criteria = criteria_res.scalars().all()
        assert len(criteria) == 8
        crit_codes = {c.code for c in criteria}
        assert "C-01" in crit_codes
        assert "C-08" in crit_codes


@pytest.mark.asyncio
async def test_expected_demo_bidders_and_scenarios():
    """Verify the 3 core presentation scenarios are represented among the 5 bidders."""
    session_maker = get_session_maker()
    async with session_maker() as session:
        # Check all 5 bidders exist
        for key, bidder_id in BIDDER_IDS.items():
            bidder = await session.get(Bidder, bidder_id)
            assert bidder is not None, f"Bidder {key} ({bidder_id}) must exist"

        # Scenario A: Meridian Flow Systems (Compliant Tier-1, PASS, Low Risk)
        meridian = await session.get(Bidder, BIDDER_IDS["meridian"])
        name = meridian.declared_name or meridian.canonical_name or ""
        assert "Meridian" in name
        assert meridian.overall_status in ("PASS", "APPROVED", "PENDING", "QUALIFIED")

        # Scenario B: Sri Kaveri Engineering (MSE Warning / Review)
        kaveri = await session.get(Bidder, BIDDER_IDS["kaveri"])
        kname = kaveri.declared_name or kaveri.canonical_name or ""
        assert "Kaveri" in kname

        # Scenario C: Bharat Hydrotech (Identity & Local Content Deficit)
        bharat = await session.get(Bidder, BIDDER_IDS["bharat"])
        bname = bharat.declared_name or bharat.canonical_name or ""
        assert "Bharat" in bname

        # Verify findings are precomputed
        findings_res = await session.execute(
            select(Finding).where(Finding.bidder_id == BIDDER_IDS["bharat"])
        )
        findings = findings_res.scalars().all()
        assert len(findings) >= 5, "Findings should be precomputed for demo bidders"


@pytest.mark.asyncio
async def test_expected_demo_documents_exist():
    """Verify demo documents are cataloged and raw packages exist on disk."""
    assert DEMO_PACKAGES_DIR.exists()

    session_maker = get_session_maker()
    async with session_maker() as session:
        docs_res = await session.execute(select(Document))
        docs = docs_res.scalars().all()
        assert len(docs) >= 15, "At least 15 demo documents should be registered"

        # Ensure sha256 hashes are populated
        for doc in docs:
            assert doc.sha256 is not None
            assert len(doc.sha256) == 64


@pytest.mark.asyncio
async def test_demo_repeatable_reset():
    """Verify demo can be reset and re-seeded consecutively without collisions."""
    # Reset and seed 1st time
    await orchestrate_demo_setup(reset=True, quick=True, seed_only=True)

    # Reset and seed 2nd time immediately
    await orchestrate_demo_setup(reset=True, quick=True, seed_only=True)

    session_maker = get_session_maker()
    async with session_maker() as session:
        # Ensure exactly 5 bidders remain (no duplication)
        bidders_res = await session.execute(
            select(Bidder).where(Bidder.tender_id == TENDER_ID)
        )
        bidders = bidders_res.scalars().all()
        assert len(bidders) == 5

        # Ensure audit chain is intact and starts with sequence 1
        audit_res = await session.execute(
            select(AuditLog).order_by(AuditLog.seq.asc())
        )
        events = audit_res.scalars().all()
        assert len(events) > 0
        assert events[0].seq == 1
        assert events[0].prev_hash is not None
