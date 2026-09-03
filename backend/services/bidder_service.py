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
from backend.models.entities import Bidder, Bid, Tender
from backend.schemas.bidder import BidderCreate, BidderUpdate, BidderProfile
from backend.schemas.bid import BidCreate, AttachBidderRequest, BidStatusUpdate, BidOut

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

        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            if key == "declared_name" and value:
                bidder.declared_name = value
                bidder.canonical_name = normalize_canonical_name(value)
            else:
                setattr(bidder, key, value)

        await session.commit()
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

        bid.status = payload.status.upper()
        await session.commit()
        return await BidderService.get_bid(session, bid_id)
