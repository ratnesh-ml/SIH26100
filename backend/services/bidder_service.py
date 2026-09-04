"""Bidder and Bid Service Layer orchestrating profile management, tender attachment, and bid status lifecycles."""

from datetime import datetime, timezone
import logging
from typing import Any, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.core.security import encrypt_identifier, decrypt_identifier
from backend.models.entities import (
    Bidder,
    Bid,
    Tender,
    Criterion,
    Finding,
    Document,
    VerificationEvent,
    Decision,
    AuditLog,
    RiskDriver,
    AnomalySignal,
)
from backend.schemas.bidder import BidderCreate, BidderUpdate, BidderProfile
from backend.schemas.bid import BidCreate, AttachBidderRequest, BidStatusUpdate, BidOut
from backend.services.audit_service import AuditService

logger = logging.getLogger("vigilbid.services.bidder")


def mask_identifier(val: Optional[str], unmasked_prefix: int = 5, unmasked_suffix: int = 1) -> Optional[str]:
    """Mask sensitive identifier leaving prefix and suffix visible."""
    if not val:
        return None
    val = val.strip()
    if len(val) <= (unmasked_prefix + unmasked_suffix):
        return val[:2] + "****" + val[-1:] if len(val) > 2 else "****"
    masked_part = "*" * (len(val) - unmasked_prefix - unmasked_suffix)
    return f"{val[:unmasked_prefix]}{masked_part}{val[-unmasked_suffix:]}"


def normalize_canonical_name(name: str) -> str:
    """Standardize legal name for fuzzy matching."""
    cleaned = " ".join(name.upper().strip().split())
    # Strip common suffixes for standard canonical representation
    for suffix in [" PRIVATE LIMITED", " PVT LTD", " LIMITED", " LTD", " CORP", " CORPORATION"]:
        if cleaned.endswith(suffix):
            cleaned = cleaned[: -len(suffix)].strip()
            break
    return cleaned


class BidderService:
    """Manages bidder master profiles, tender registration, bids, and status transitions."""

    @staticmethod
    async def create_bidder(session: AsyncSession, payload: BidderCreate) -> BidderProfile:
        """Create a new vendor profile with encrypted PAN/GSTIN."""
        pan_enc = encrypt_identifier(payload.pan) if payload.pan else None
        gstin_enc = encrypt_identifier(payload.gstin) if payload.gstin else None
        canonical = normalize_canonical_name(payload.declared_name)

        bidder_id = uuid.uuid4()
        bidder = Bidder(
            id=bidder_id,
            tender_id=payload.tender_id,
            declared_name=payload.declared_name,
            canonical_name=canonical,
            pan_enc=pan_enc,
            gstin_enc=gstin_enc,
            cin=payload.cin,
            udyam_no=payload.udyam_no,
            address=payload.address,
            contact=payload.contact,
            overall_status="PENDING",
            risk_score=0,
            risk_band="LOW",
            review_state="PENDING",
        )
        session.add(bidder)
        await session.commit()

        try:
            await AuditService.record_event(
                session=session,
                action="CREATE_BIDDER",
                target_type="bidder",
                target_id=str(bidder_id),
                actor_id=None,
                role="officer",
                previous_state=None,
                new_state={"declared_name": bidder.declared_name, "canonical_name": canonical},
                reason="Bidder master profile registered",
                payload={"declared_name": bidder.declared_name, "tender_id": str(payload.tender_id) if payload.tender_id else None},
            )
        except Exception as exc:
            logger.warning("Audit logging warning on create_bidder %s: %s", bidder_id, exc)

        return await BidderService.get_bidder(session, bidder_id)

    @staticmethod
    async def get_bidder(session: AsyncSession, bidder_id: uuid.UUID) -> BidderProfile:
        """Retrieve bidder profile with masked PAN/GSTIN and document counts."""
        stmt = select(Bidder).options(selectinload(Bidder.documents)).where(Bidder.id == bidder_id)
        result = await session.execute(stmt)
        bidder = result.scalar_one_or_none()

        if not bidder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bidder with ID '{bidder_id}' not found.",
            )

        decrypted_pan = None
        if bidder.pan_enc:
            try:
                decrypted_pan = decrypt_identifier(bidder.pan_enc)
            except Exception as exc:
                logger.warning("Could not decrypt PAN for bidder %s: %s", bidder_id, exc)

        decrypted_gstin = None
        if bidder.gstin_enc:
            try:
                decrypted_gstin = decrypt_identifier(bidder.gstin_enc)
            except Exception as exc:
                logger.warning("Could not decrypt GSTIN for bidder %s: %s", bidder_id, exc)

        return BidderProfile(
            id=bidder.id,
            tender_id=bidder.tender_id,
            declared_name=bidder.declared_name,
            canonical_name=bidder.canonical_name,
            masked_pan=mask_identifier(decrypted_pan, 5, 1) if decrypted_pan else None,
            masked_gstin=mask_identifier(decrypted_gstin, 5, 3) if decrypted_gstin else None,
            cin=bidder.cin,
            udyam_no=bidder.udyam_no,
            address=bidder.address,
            contact=bidder.contact,
            overall_status=bidder.overall_status,
            risk_score=bidder.risk_score,
            risk_band=bidder.risk_band,
            review_state=bidder.review_state,
            document_count=len(bidder.documents) if hasattr(bidder, "documents") and bidder.documents else 0,
            created_at=bidder.created_at,
        )

    @staticmethod
    async def list_bidders(
        session: AsyncSession,
        page: int = 1,
        limit: int = 20,
        search: Optional[str] = None,
    ) -> dict[str, Any]:
        """List bidder master profiles with pagination and legal name search."""
        base_query = select(Bidder).options(selectinload(Bidder.documents))
        count_query = select(func.count(Bidder.id))

        if search:
            search_pattern = f"%{search.strip().upper()}%"
            base_query = base_query.where(
                Bidder.declared_name.ilike(search_pattern) | Bidder.canonical_name.ilike(search_pattern)
            )
            count_query = count_query.where(
                Bidder.declared_name.ilike(search_pattern) | Bidder.canonical_name.ilike(search_pattern)
            )

        total_res = await session.execute(count_query)
        total = total_res.scalar() or 0

        items_query = (
            base_query.order_by(Bidder.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        items_res = await session.execute(items_query)
        bidders = items_res.scalars().all()

        profiles = []
        for b in bidders:
            decrypted_pan = None
            if b.pan_enc:
                try:
                    decrypted_pan = decrypt_identifier(b.pan_enc)
                except Exception:
                    pass
            decrypted_gstin = None
            if b.gstin_enc:
                try:
                    decrypted_gstin = decrypt_identifier(b.gstin_enc)
                except Exception:
                    pass

            profiles.append(
                BidderProfile(
                    id=b.id,
                    tender_id=b.tender_id,
                    declared_name=b.declared_name,
                    canonical_name=b.canonical_name,
                    masked_pan=mask_identifier(decrypted_pan, 5, 1) if decrypted_pan else None,
                    masked_gstin=mask_identifier(decrypted_gstin, 5, 3) if decrypted_gstin else None,
                    cin=b.cin,
                    udyam_no=b.udyam_no,
                    address=b.address,
                    contact=b.contact,
                    overall_status=b.overall_status,
                    risk_score=b.risk_score,
                    risk_band=b.risk_band,
                    review_state=b.review_state,
                    document_count=len(b.documents) if hasattr(b, "documents") and b.documents else 0,
                    created_at=b.created_at,
                )
            )

        pages = (total + limit - 1) // limit if total > 0 else 0
        return {"items": profiles, "total": total, "page": page, "limit": limit, "pages": pages}

    @staticmethod
    async def update_bidder(
        session: AsyncSession,
        bidder_id: uuid.UUID,
        payload: BidderUpdate,
    ) -> BidderProfile:
        """Update bidder metadata, company IDs, address, or contact."""
        stmt = select(Bidder).where(Bidder.id == bidder_id)
        result = await session.execute(stmt)
        bidder = result.scalar_one_or_none()

        if not bidder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bidder with ID '{bidder_id}' not found.",
            )

        old_state = {"declared_name": bidder.declared_name, "canonical_name": bidder.canonical_name}

        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "declared_name" and value:
                bidder.declared_name = value
                bidder.canonical_name = normalize_canonical_name(value)
            else:
                setattr(bidder, key, value)

        await session.commit()

        try:
            await AuditService.record_event(
                session=session,
                action="UPDATE_BIDDER",
                target_type="bidder",
                target_id=str(bidder_id),
                actor_id=None,
                role="officer",
                previous_state=old_state,
                new_state={"declared_name": bidder.declared_name, "canonical_name": bidder.canonical_name},
                reason="Bidder profile updated",
                payload={"declared_name": bidder.declared_name},
            )
        except Exception as exc:
            logger.warning("Audit logging warning on update_bidder %s: %s", bidder_id, exc)

        return await BidderService.get_bidder(session, bidder_id)

    @staticmethod
    async def attach_bidder_to_tender(
        session: AsyncSession,
        tender_id: uuid.UUID,
        payload: AttachBidderRequest,
    ) -> BidOut:
        """Attach a bidder to a tender by creating a formal Bid record."""
        # 1. Verify tender exists
        tender_stmt = select(Tender).where(Tender.id == tender_id)
        tender_res = await session.execute(tender_stmt)
        tender = tender_res.scalar_one_or_none()
        if not tender:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tender with ID '{tender_id}' not found.",
            )

        # 2. Resolve or create bidder
        if payload.bidder_id:
            bidder_stmt = select(Bidder).where(Bidder.id == payload.bidder_id)
            bidder_res = await session.execute(bidder_stmt)
            bidder = bidder_res.scalar_one_or_none()
            if not bidder:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Bidder with ID '{payload.bidder_id}' not found.",
                )
        elif payload.declared_name:
            bidder_profile = await BidderService.create_bidder(
                session,
                BidderCreate(
                    declared_name=payload.declared_name,
                    pan=payload.pan,
                    gstin=payload.gstin,
                    tender_id=tender_id,
                ),
            )
            bidder_stmt = select(Bidder).where(Bidder.id == bidder_profile.id)
            bidder_res = await session.execute(bidder_stmt)
            bidder = bidder_res.scalar_one()
        else:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Either 'bidder_id' or 'declared_name' must be provided.",
            )

        # 3. Check for existing bid
        existing_bid_stmt = select(Bid).where(Bid.tender_id == tender_id, Bid.bidder_id == bidder.id)
        existing_res = await session.execute(existing_bid_stmt)
        if existing_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Bidder '{bidder.declared_name}' has already submitted a bid for tender '{tender.nit_no}'.",
            )

        # 4. Generate bid_number if missing
        bid_number = payload.bid_number
        if not bid_number:
            safe_nit = tender.nit_no.replace("/", "-").replace(" ", "")
            short_id = uuid.uuid4().hex[:6].upper()
            bid_number = f"BID-{safe_nit}-{short_id}"

        # 5. Create Bid
        bid_id = uuid.uuid4()
        bid = Bid(
            id=bid_id,
            tender_id=tender_id,
            bidder_id=bidder.id,
            bid_number=bid_number,
            status="SUBMITTED",
            submission_date=datetime.now(timezone.utc),
            financial_quote=payload.financial_quote,
        )
        session.add(bid)

        # Set primary tender_id on bidder if currently unassigned
        if bidder.tender_id is None:
            bidder.tender_id = tender_id

        await session.commit()

        try:
            await AuditService.record_event(
                session=session,
                action="ATTACH_BIDDER",
                target_type="bid",
                target_id=str(bid_id),
                actor_id=None,
                role="officer",
                previous_state=None,
                new_state={"bid_number": bid_number, "status": "SUBMITTED", "tender_id": str(tender_id)},
                reason="Bidder formally attached to tender",
                payload={"tender_id": str(tender_id), "bidder_id": str(bidder.id), "bid_number": bid_number},
            )
        except Exception as exc:
            logger.warning("Audit logging warning on attach_bidder %s: %s", bid_id, exc)

        return await BidderService.get_bid(session, bid_id)

    @staticmethod
    async def list_tender_bidders(
        session: AsyncSession,
        tender_id: uuid.UUID,
    ) -> list[BidOut]:
        """List all bids/bidders registered for a specific tender."""
        # Verify tender exists
        tender_stmt = select(Tender).where(Tender.id == tender_id)
        tender_res = await session.execute(tender_stmt)
        if not tender_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tender with ID '{tender_id}' not found.",
            )

        stmt = (
            select(Bid)
            .options(selectinload(Bid.bidder), selectinload(Bid.tender))
            .where(Bid.tender_id == tender_id)
            .order_by(Bid.created_at.desc())
        )
        res = await session.execute(stmt)
        bids = res.scalars().all()

        return [
            BidOut(
                id=b.id,
                tender_id=b.tender_id,
                bidder_id=b.bidder_id,
                bid_number=b.bid_number,
                status=b.status,
                submission_date=b.submission_date,
                technical_score=b.technical_score,
                financial_quote=b.financial_quote,
                created_at=b.created_at,
                bidder_name=b.bidder.declared_name if b.bidder else None,
                tender_title=b.tender.title if b.tender else None,
            )
            for b in bids
        ]

    @staticmethod
    async def create_bid(session: AsyncSession, payload: BidCreate) -> BidOut:
        """Create a direct bid record binding tender and bidder."""
        # Verify tender and bidder exist
        t_stmt = select(Tender).where(Tender.id == payload.tender_id)
        t_res = await session.execute(t_stmt)
        tender = t_res.scalar_one_or_none()
        if not tender:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Tender '{payload.tender_id}' not found.")

        b_stmt = select(Bidder).where(Bidder.id == payload.bidder_id)
        b_res = await session.execute(b_stmt)
        bidder = b_res.scalar_one_or_none()
        if not bidder:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bidder '{payload.bidder_id}' not found.")

        # Check existing bid for tender and bidder
        existing_stmt = select(Bid).where(Bid.tender_id == payload.tender_id, Bid.bidder_id == payload.bidder_id)
        existing_res = await session.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Bidder already has an active bid for this tender.",
            )

        bid_number = payload.bid_number
        if not bid_number:
            safe_nit = tender.nit_no.replace("/", "-").replace(" ", "")
            bid_number = f"BID-{safe_nit}-{uuid.uuid4().hex[:6].upper()}"

        # Check unique bid number
        num_stmt = select(Bid).where(Bid.bid_number == bid_number)
        num_res = await session.execute(num_stmt)
        if num_res.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=f"Bid number '{bid_number}' already exists.")

        bid_id = uuid.uuid4()
        bid = Bid(
            id=bid_id,
            tender_id=payload.tender_id,
            bidder_id=payload.bidder_id,
            bid_number=bid_number,
            status=payload.status,
            submission_date=payload.submission_date or datetime.now(timezone.utc),
            technical_score=payload.technical_score,
            financial_quote=payload.financial_quote,
        )
        session.add(bid)
        await session.commit()

        return await BidderService.get_bid(session, bid_id)

    @staticmethod
    async def get_bid(session: AsyncSession, bid_id: uuid.UUID) -> BidOut:
        """Retrieve bid record with joined tender and bidder labels."""
        stmt = (
            select(Bid)
            .options(selectinload(Bid.bidder), selectinload(Bid.tender))
            .where(Bid.id == bid_id)
        )
        res = await session.execute(stmt)
        bid = res.scalar_one_or_none()
        if not bid:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bid with ID '{bid_id}' not found.")

        return BidOut(
            id=bid.id,
            tender_id=bid.tender_id,
            bidder_id=bid.bidder_id,
            bid_number=bid.bid_number,
            status=bid.status,
            submission_date=bid.submission_date,
            technical_score=bid.technical_score,
            financial_quote=bid.financial_quote,
            created_at=bid.created_at,
            bidder_name=bid.bidder.declared_name if bid.bidder else None,
            tender_title=bid.tender.title if bid.tender else None,
        )

    @staticmethod
    async def list_bids(
        session: AsyncSession,
        tender_id: Optional[uuid.UUID] = None,
        bidder_id: Optional[uuid.UUID] = None,
        status_filter: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
    ) -> dict[str, Any]:
        """List bids filterable by tender, bidder, and status with pagination."""
        base_query = select(Bid).options(selectinload(Bid.bidder), selectinload(Bid.tender))
        count_query = select(func.count(Bid.id))

        if tender_id:
            base_query = base_query.where(Bid.tender_id == tender_id)
            count_query = count_query.where(Bid.tender_id == tender_id)
        if bidder_id:
            base_query = base_query.where(Bid.bidder_id == bidder_id)
            count_query = count_query.where(Bid.bidder_id == bidder_id)
        if status_filter:
            base_query = base_query.where(Bid.status == status_filter.upper())
            count_query = count_query.where(Bid.status == status_filter.upper())

        total_res = await session.execute(count_query)
        total = total_res.scalar() or 0

        items_query = base_query.order_by(Bid.created_at.desc()).offset((page - 1) * limit).limit(limit)
        items_res = await session.execute(items_query)
        bids = items_res.scalars().all()

        items = [
            BidOut(
                id=b.id,
                tender_id=b.tender_id,
                bidder_id=b.bidder_id,
                bid_number=b.bid_number,
                status=b.status,
                submission_date=b.submission_date,
                technical_score=b.technical_score,
                financial_quote=b.financial_quote,
                created_at=b.created_at,
                bidder_name=b.bidder.declared_name if b.bidder else None,
                tender_title=b.tender.title if b.tender else None,
            )
            for b in bids
        ]

        pages = (total + limit - 1) // limit if total > 0 else 0
        return {"items": items, "total": total, "page": page, "limit": limit, "pages": pages}

    @staticmethod
    async def update_bid_status(
        session: AsyncSession,
        bid_id: uuid.UUID,
        payload: BidStatusUpdate,
    ) -> BidOut:
        """Update bid lifecycle evaluation status."""
        stmt = select(Bid).where(Bid.id == bid_id)
        res = await session.execute(stmt)
        bid = res.scalar_one_or_none()
        if not bid:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Bid with ID '{bid_id}' not found.")

        old_status = bid.status
        bid.status = payload.status.upper()
        await session.commit()

        try:
            await AuditService.record_event(
                session=session,
                action="UPDATE_BID_STATUS",
                target_type="bid",
                target_id=str(bid_id),
                actor_id=None,
                role="officer",
                previous_state={"status": old_status},
                new_state={"status": bid.status},
                reason=payload.reason or "Bid evaluation lifecycle status updated",
                payload={"tender_id": str(bid.tender_id), "bidder_id": str(bid.bidder_id), "bid_number": bid.bid_number},
            )
        except Exception as exc:
            logger.warning("Audit logging warning on update_bid_status %s: %s", bid_id, exc)

        return await BidderService.get_bid(session, bid_id)

    @staticmethod
    async def get_risk_profile(session: AsyncSession, bidder_id: uuid.UUID) -> dict[str, Any]:
        """Fetch transparent risk score, band, risk drivers, and anomaly signals for a bidder."""
        stmt = (
            select(Bidder)
            .options(
                selectinload(Bidder.risk_drivers),
                selectinload(Bidder.anomaly_signals),
            )
            .where(Bidder.id == bidder_id)
        )
        res = await session.execute(stmt)
        bidder = res.scalar_one_or_none()
        if not bidder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bidder with ID '{bidder_id}' not found.",
            )

        drivers = [
            {
                "driver": d.driver,
                "points": d.points,
                "source_ref": d.source_ref,
            }
            for d in (bidder.risk_drivers or [])
        ]

        anomalies = [
            {
                "code": a.code,
                "severity": a.severity,
                "points": a.points,
                "description": a.description,
                "evidence": a.evidence,
            }
            for a in (bidder.anomaly_signals or [])
        ]

        return {
            "bidder_id": bidder.id,
            "score": bidder.risk_score,
            "band": bidder.risk_band,
            "entity_confidence": float(bidder.entity_confidence) if bidder.entity_confidence is not None else None,
            "drivers": drivers,
            "anomalies": anomalies,
        }

    @staticmethod
    async def get_requirement_matrix(session: AsyncSession, bidder_id: uuid.UUID) -> dict[str, Any]:
        """Fetch requirement-to-evidence matrix mapping tender criteria to findings and bounding boxes."""
        bidder_stmt = (
            select(Bidder)
            .options(
                selectinload(Bidder.tender).selectinload(Tender.criteria),
                selectinload(Bidder.findings),
            )
            .where(Bidder.id == bidder_id)
        )
        bidder_res = await session.execute(bidder_stmt)
        bidder = bidder_res.scalar_one_or_none()
        if not bidder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bidder with ID '{bidder_id}' not found.",
            )

        tender = bidder.tender
        criteria = sorted(getattr(tender, "criteria", []) or [], key=lambda c: getattr(c, "sort_order", 0) or 0)
        findings = getattr(bidder, "findings", []) or []

        findings_by_crit: dict[str, Any] = {}
        for f in findings:
            if f.criterion_id:
                findings_by_crit[str(f.criterion_id)] = f
            if f.rule_id:
                findings_by_crit[f.rule_id] = f

        rows = []
        satisfied_count = 0
        unsatisfied_count = 0

        for crit in criteria:
            finding = findings_by_crit.get(str(crit.id)) or findings_by_crit.get(crit.code)
            if not finding and crit.rule_ids:
                for r_id in crit.rule_ids:
                    if r_id in findings_by_crit:
                        finding = findings_by_crit[r_id]
                        break

            if finding:
                status_val = finding.status
                is_sat = (status_val == "PASS")
                if is_sat:
                    satisfied_count += 1
                else:
                    unsatisfied_count += 1

                extracted_str = None
                if finding.extracted:
                    extracted_str = ", ".join(f"{k}: {v}" for k, v in finding.extracted.items() if v is not None)
                elif finding.explanation:
                    extracted_str = finding.explanation

                req_str = None
                if finding.expected:
                    req_str = ", ".join(f"{k}: {v}" for k, v in finding.expected.items() if v is not None)
                elif crit.threshold:
                    req_str = ", ".join(f"{k}: {v}" for k, v in crit.threshold.items() if v is not None)
                else:
                    req_str = crit.description

                rule_clause = None
                if finding.citation and isinstance(finding.citation, dict):
                    rule_clause = finding.citation.get("clause") or finding.citation.get("rule")

                evidence_items = finding.evidence or []
                ver_source = "Document Text & Bounding Box"
                if evidence_items and isinstance(evidence_items, list) and len(evidence_items) > 0:
                    first_ev = evidence_items[0]
                    if isinstance(first_ev, dict):
                        ver_source = first_ev.get("source") or "PyMuPDF Text Layer"

                rows.append({
                    "requirement_code": crit.code,
                    "requirement_title": crit.title,
                    "requirement_description": crit.description,
                    "status": status_val,
                    "is_satisfied": is_sat,
                    "observed_value": extracted_str or "Observed via statutory filing",
                    "required_value": req_str or "Compliant declaration required",
                    "rule_id": finding.rule_id,
                    "rule_clause": rule_clause,
                    "verification_source": ver_source,
                    "reason": finding.explanation,
                    "finding_id": finding.id,
                    "evidence": evidence_items,
                })
            else:
                unsatisfied_count += 1
                rows.append({
                    "requirement_code": crit.code,
                    "requirement_title": crit.title,
                    "requirement_description": crit.description,
                    "status": "PENDING",
                    "is_satisfied": False,
                    "observed_value": "Pending evaluation",
                    "required_value": str(crit.threshold) if crit.threshold else "Compliant filing required",
                    "rule_id": crit.code,
                    "rule_clause": None,
                    "verification_source": "Pending pipeline execution",
                    "reason": "Evaluation pending document processing",
                    "finding_id": None,
                    "evidence": [],
                })

        return {
            "bidder_id": bidder.id,
            "bidder_name": bidder.declared_name or bidder.canonical_name or "Unknown Vendor",
            "tender_id": tender.id if tender else uuid.UUID(int=0),
            "tender_nit": tender.nit_no if tender else "N/A",
            "overall_status": bidder.overall_status,
            "requirements": rows,
            "total_requirements": len(rows),
            "satisfied_count": satisfied_count,
            "unsatisfied_count": unsatisfied_count,
        }

    @staticmethod
    async def explain_risk(session: AsyncSession, bidder_id: uuid.UUID) -> dict[str, Any]:
        """Generate human-readable, explainable risk breakdown answering WHY for every contributor."""
        bidder_stmt = (
            select(Bidder)
            .options(
                selectinload(Bidder.findings),
                selectinload(Bidder.risk_drivers),
                selectinload(Bidder.anomaly_signals),
            )
            .where(Bidder.id == bidder_id)
        )
        res = await session.execute(bidder_stmt)
        bidder = res.scalar_one_or_none()
        if not bidder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bidder with ID '{bidder_id}' not found.",
            )

        factors = []
        total_pts = 0

        # 1. Findings-based risk factors (FAIL, WARN, REVIEW)
        for f in (bidder.findings or []):
            if f.status in ("FAIL", "WARN", "REVIEW"):
                pts = 35 if f.status == "FAIL" else (15 if f.status == "WARN" else 10)
                if "002" in f.rule_id:
                    pts = 35
                    cat = "Identity"
                elif "001" in f.rule_id:
                    pts = 30
                    cat = "Financial"
                elif "003" in f.rule_id:
                    pts = 25
                    cat = "Compliance"
                else:
                    cat = "Compliance"

                has_ev = bool(f.evidence and len(f.evidence) > 0)
                reason_text = f.explanation
                if not has_ev:
                    explanation_st = "INSUFFICIENT_EVIDENCE"
                    reason_text += " (Insufficient visual evidence to fully corroborate this finding)"
                else:
                    explanation_st = "EXPLAINED"

                rule_clause = None
                if f.citation and isinstance(f.citation, dict):
                    rule_clause = f.citation.get("clause")

                factors.append({
                    "factor_name": f.title,
                    "category": cat,
                    "severity": "HIGH" if f.status == "FAIL" else "MEDIUM",
                    "contribution": pts,
                    "reason": reason_text,
                    "rule_id": f.rule_id,
                    "rule_clause": rule_clause,
                    "source": "Deterministic Rule Engine",
                    "has_evidence": has_ev,
                    "evidence": f.evidence if has_ev else [],
                    "explanation_status": explanation_st,
                })
                total_pts += pts

        # 2. Forensic anomaly factors
        for a in (bidder.anomaly_signals or []):
            pts = a.points or 20
            has_ev = bool(a.evidence)
            ev_list = [a.evidence] if has_ev and isinstance(a.evidence, dict) else (a.evidence or [])
            factors.append({
                "factor_name": a.description or f"Forensic Signal {a.code}",
                "category": "Anomaly",
                "severity": a.severity or "HIGH",
                "contribution": pts,
                "reason": a.description or "PDF metadata or content integrity anomaly detected",
                "rule_id": a.code,
                "rule_clause": "Vigilance Forensic Standard",
                "source": "PDF Forensic Engine",
                "has_evidence": has_ev,
                "evidence": ev_list,
                "explanation_status": "EXPLAINED" if has_ev else "INSUFFICIENT_EVIDENCE",
            })
            total_pts += pts

        if not factors and bidder.risk_score == 0:
            summary = "Low Risk (0/100): All statutory eligibility criteria, identity checks, and documents verified without discrepancies."
        elif bidder.risk_band == "HIGH":
            summary = f"High Risk ({bidder.risk_score}/100): Critical non-compliances and identity discrepancies require statutory officer review."
        elif bidder.risk_band == "MEDIUM":
            summary = f"Medium Risk ({bidder.risk_score}/100): Documentation warnings require officer scrutiny and possible clarification."
        else:
            summary = f"Low Risk ({bidder.risk_score}/100): Routine submission with minimal or exempted compliance variances."

        return {
            "bidder_id": bidder.id,
            "bidder_name": bidder.declared_name or bidder.canonical_name or "Unknown Vendor",
            "score": bidder.risk_score,
            "band": bidder.risk_band,
            "summary": summary,
            "factors": factors,
            "total_contribution": total_pts,
        }

    @staticmethod
    async def get_verification_history(session: AsyncSession, bidder_id: uuid.UUID) -> dict[str, Any]:
        """Retrieve historical verification record containing snapshot of documents, rules, findings, and decisions."""
        bidder_stmt = (
            select(Bidder)
            .options(
                selectinload(Bidder.tender),
                selectinload(Bidder.documents),
                selectinload(Bidder.findings),
                selectinload(Bidder.verification_events),
                selectinload(Bidder.decisions).selectinload(Decision.actor),
            )
            .where(Bidder.id == bidder_id)
        )
        res = await session.execute(bidder_stmt)
        bidder = res.scalar_one_or_none()
        if not bidder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bidder with ID '{bidder_id}' not found.",
            )

        tender = bidder.tender
        docs = [
            {
                "id": str(d.id),
                "filename": d.original_filename,
                "sha256": d.sha256,
                "doc_type": d.doc_type,
                "uploaded_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in (bidder.documents or [])
        ]

        registry_ev = [
            {
                "verifier": v.verifier,
                "provider": v.provider,
                "status": v.status,
                "checked_at": v.checked_at.isoformat() if v.checked_at else None,
            }
            for v in (bidder.verification_events or [])
        ]

        decs = []
        for dec in (bidder.decisions or []):
            decs.append({
                "id": dec.id,
                "finding_id": dec.finding_id,
                "bidder_id": dec.bidder_id,
                "bid_id": dec.bid_id,
                "actor_id": dec.actor_id,
                "actor_name": dec.actor.full_name if getattr(dec, "actor", None) else "Officer",
                "actor_role": dec.actor.role if getattr(dec, "actor", None) else "officer",
                "action": dec.action,
                "reason": dec.reason,
                "resulting_status": dec.resulting_status,
                "machine_recommendation": dec.machine_recommendation,
                "audit_ref": dec.audit_ref,
                "created_at": dec.created_at or datetime.now(timezone.utc),
            })

        audit_stmt = select(AuditLog).order_by(AuditLog.seq.desc()).limit(1)
        audit_res = await session.execute(audit_stmt)
        latest_audit = audit_res.scalar_one_or_none()
        chain_head = latest_audit.curr_hash if latest_audit else None

        return {
            "bidder_id": bidder.id,
            "bidder_name": bidder.declared_name or bidder.canonical_name or "Unknown Vendor",
            "tender_id": tender.id if tender else uuid.UUID(int=0),
            "tender_nit": tender.nit_no if tender else "N/A",
            "verified_at": getattr(bidder, "updated_at", None) or bidder.created_at or datetime.now(timezone.utc),
            "ruleset_version": "1.0",
            "documents_evaluated": docs,
            "registry_responses": registry_ev,
            "findings_count": len(bidder.findings or []),
            "risk_score": bidder.risk_score,
            "risk_band": bidder.risk_band,
            "officer_decisions": decs,
            "audit_chain_head": chain_head,
        }
