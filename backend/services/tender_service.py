"""Tender Service Layer orchestrating CRUD operations and template criteria initialization."""

import json
import logging
from pathlib import Path
from typing import Any, Optional
import uuid
from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.entities import Tender, Criterion, Bidder, Finding
from backend.schemas.tender import TenderCreate, TenderUpdate
from backend.services.audit_service import AuditService

logger = logging.getLogger("vigilbid.services.tender")

TEMPLATE_FILE = Path(__file__).resolve().parent.parent.parent / "seed" / "template_tender.json"


def load_template_criteria(template_name: str) -> list[dict[str, Any]]:
    """Load criteria definitions from template JSON file with fallback."""
    if TEMPLATE_FILE.exists():
        try:
            with open(TEMPLATE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data.get("criteria", [])
        except Exception as exc:
            logger.warning("Failed to parse %s: %s. Using default criteria.", TEMPLATE_FILE, exc)

    # Fallback default CPCL Goods criteria
    return [
        {
            "code": "C-01",
            "title": "GST & Legal Identity",
            "description": "Valid GSTIN registration and PAN card parity",
            "required_doc_types": ["GST_CERT", "PAN_CARD"],
            "rule_ids": ["R-ID-01", "R-ID-02"],
            "sort_order": 1,
        },
        {
            "code": "C-02",
            "title": "Average Annual Turnover",
            "description": "Minimum average annual turnover in last 3 FYs",
            "required_doc_types": ["CA_TURNOVER_CERT", "AUDITED_FINANCIALS"],
            "rule_ids": ["R-FIN-01", "R-FIN-03"],
            "sort_order": 2,
        },
        {
            "code": "C-03",
            "title": "Net Worth Solvency",
            "description": "Positive net worth as per audited balance sheet",
            "required_doc_types": ["AUDITED_FINANCIALS"],
            "rule_ids": ["R-FIN-02"],
            "sort_order": 3,
        },
    ]


class TenderService:
    """Orchestrates tender CRUD, template importing, and criteria binding."""

    @staticmethod
    async def create_tender(
        session: AsyncSession,
        payload: TenderCreate,
        creator_id: uuid.UUID,
    ) -> Tender:
        """Create a new tender, checking for NIT uniqueness and binding default criteria."""
        # 1. Enforce unique NIT number
        existing_stmt = select(Tender).where(Tender.nit_no == payload.nit_no)
        existing_res = await session.execute(existing_stmt)
        if existing_res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Tender with NIT number '{payload.nit_no}' already exists.",
            )

        # 2. Instantiate Tender
        tender_id = uuid.uuid4()
        tender = Tender(
            id=tender_id,
            nit_no=payload.nit_no,
            title=payload.title,
            portal=payload.portal,
            status=payload.status,
            estimated_value=payload.estimated_value,
            bid_due_date=payload.bid_due_date,
            mse_applicable=payload.mse_applicable,
            mii_class_required=payload.mii_class_required,
            requires_oem=payload.requires_oem,
            created_by=creator_id,
        )
        session.add(tender)

        # 3. Attach criteria placeholders
        if payload.criteria_overrides:
            for crit_data in payload.criteria_overrides:
                criterion = Criterion(
                    id=uuid.uuid4(),
                    tender_id=tender_id,
                    code=crit_data.code,
                    title=crit_data.title,
                    description=crit_data.description,
                    threshold=crit_data.threshold,
                    required_doc_types=crit_data.required_doc_types,
                    rule_ids=crit_data.rule_ids,
                    sort_order=crit_data.sort_order,
                )
                session.add(criterion)
        elif payload.template:
            template_criteria = load_template_criteria(payload.template)
            for crit_data in template_criteria:
                criterion = Criterion(
                    id=uuid.uuid4(),
                    tender_id=tender_id,
                    code=crit_data["code"],
                    title=crit_data["title"],
                    description=crit_data.get("description"),
                    threshold=crit_data.get("threshold"),
                    required_doc_types=crit_data.get("required_doc_types"),
                    rule_ids=crit_data.get("rule_ids"),
                    sort_order=crit_data.get("sort_order", 0),
                )
                session.add(criterion)

        await session.commit()

        # Audit event for tender creation
        try:
            await AuditService.record_event(
                session=session,
                action="CREATE_TENDER",
                target_type="tender",
                target_id=str(tender_id),
                actor_id=creator_id,
                role="officer",
                previous_state=None,
                new_state={"nit_no": payload.nit_no, "title": payload.title, "status": payload.status},
                reason="Tender created and initialized with criteria",
                payload={"nit_no": payload.nit_no, "title": payload.title},
            )
        except Exception as exc:
            logger.warning("Audit logging warning on create_tender %s: %s", tender_id, exc)

        # 4. Return loaded tender with criteria
        return await TenderService.get_tender(session, tender_id)

    @staticmethod
    async def get_tender(session: AsyncSession, tender_id: uuid.UUID) -> Tender:
        """Fetch a tender by UUID including criteria and bidders."""
        stmt = (
            select(Tender)
            .options(selectinload(Tender.criteria), selectinload(Tender.bidders))
            .where(Tender.id == tender_id)
        )
        result = await session.execute(stmt)
        tender = result.scalar_one_or_none()

        if not tender:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Tender with ID '{tender_id}' not found.",
            )
        return tender

    @staticmethod
    async def list_tenders(
        session: AsyncSession,
        page: int = 1,
        limit: int = 20,
        status_filter: Optional[str] = None,
    ) -> dict[str, Any]:
        """List tenders with pagination and calculated bidder counts."""
        base_query = select(Tender).options(selectinload(Tender.bidders))
        count_query = select(func.count(Tender.id))

        if status_filter:
            upper_status = status_filter.upper()
            base_query = base_query.where(Tender.status == upper_status)
            count_query = count_query.where(Tender.status == upper_status)

        # Total count
        total_res = await session.execute(count_query)
        total = total_res.scalar() or 0

        # Paginated items
        items_query = (
            base_query.order_by(Tender.created_at.desc())
            .offset((page - 1) * limit)
            .limit(limit)
        )
        items_res = await session.execute(items_query)
        tenders = items_res.scalars().all()

        pages = (total + limit - 1) // limit if total > 0 else 0

        return {
            "items": tenders,
            "total": total,
            "page": page,
            "limit": limit,
            "pages": pages,
        }

    @staticmethod
    async def update_tender(
        session: AsyncSession,
        tender_id: uuid.UUID,
        payload: TenderUpdate,
    ) -> Tender:
        """Update tender metadata or lifecycle status."""
        tender = await TenderService.get_tender(session, tender_id)
        old_state = {"title": tender.title, "status": tender.status}

        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(tender, key, value)

        await session.commit()

        try:
            await AuditService.record_event(
                session=session,
                action="UPDATE_TENDER",
                target_type="tender",
                target_id=str(tender_id),
                actor_id=None,
                role="officer",
                previous_state=old_state,
                new_state={"title": tender.title, "status": tender.status},
                reason="Tender metadata or status updated",
                payload={"nit_no": tender.nit_no},
            )
        except Exception as exc:
            logger.warning("Audit logging warning on update_tender %s: %s", tender_id, exc)

        return await TenderService.get_tender(session, tender_id)

    @staticmethod
    async def get_compliance_matrix(
        session: AsyncSession,
        tender_id: uuid.UUID,
    ) -> dict[str, Any]:
        """Build compliance matrix data containing criteria and participating bidders with mapped cells."""
        c_stmt = select(Criterion).where(Criterion.tender_id == tender_id).order_by(Criterion.sort_order.asc())
        c_res = await session.execute(c_stmt)
        criteria = c_res.scalars().all()

        b_stmt = select(Bidder).where(Bidder.tender_id == tender_id).order_by(Bidder.created_at.asc())
        b_res = await session.execute(b_stmt)
        bidders = b_res.scalars().all()

        bidder_ids = [b.id for b in bidders]
        findings_by_bidder: dict[uuid.UUID, list[Finding]] = {b.id: [] for b in bidders}
        if bidder_ids:
            f_stmt = select(Finding).where(Finding.bidder_id.in_(bidder_ids))
            f_res = await session.execute(f_stmt)
            for f in f_res.scalars().all():
                if f.bidder_id in findings_by_bidder:
                    findings_by_bidder[f.bidder_id].append(f)

        crit_out = [
            {
                "id": str(c.id),
                "tender_id": str(c.tender_id),
                "code": c.code,
                "title": c.title,
                "description": c.description,
                "required_doc_types": c.required_doc_types or [],
                "rule_ids": c.rule_ids or [],
                "sort_order": c.sort_order,
            }
            for c in criteria
        ]

        bidders_out = []
        for b in bidders:
            b_findings = findings_by_bidder.get(b.id, [])
            cells = []
            for c in criteria:
                matched_finding = None
                for f in b_findings:
                    if f.criterion_id == c.id:
                        matched_finding = f
                        break
                    if c.rule_ids and f.rule_id in c.rule_ids:
                        matched_finding = f
                        break

                cells.append(
                    {
                        "criterion_id": str(c.id),
                        "status": matched_finding.status if matched_finding else "PENDING",
                        "finding_id": str(matched_finding.id) if matched_finding else None,
                    }
                )

            bidders_out.append(
                {
                    "id": str(b.id),
                    "name": b.canonical_name or b.declared_name,
                    "status": b.overall_status,
                    "risk_score": b.risk_score,
                    "risk_band": b.risk_band,
                    "cells": cells,
                }
            )

        return {
            "tender_id": str(tender_id),
            "criteria": crit_out,
            "bidders": bidders_out,
        }

