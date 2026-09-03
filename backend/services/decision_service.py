"""Decision Service Layer orchestrating human-in-the-loop review, finding decisions,
bid decisions, decision history, and complete-review validation.
"""

from datetime import datetime, timezone
import logging
from typing import Any, Optional
import uuid

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.entities import Bid, Bidder, Decision, Finding, User
from backend.schemas.finding import (
    CompleteReviewResponse,
    DecisionCreate,
    BidDecisionCreate,
    DecisionOut,
    FindingOut,
)
from backend.services.audit_service import AuditService

logger = logging.getLogger("vigilbid.services.decision")


class DecisionService:
    """Orchestrates officer reviews, finding & bid decisions, and complete-review validation."""

    VALID_ACTIONS = {
        "ACCEPT": "ACCEPT",
        "REJECT": "REJECT",
        "REQUEST_CLARIFICATION": "REQUEST_CLARIFICATION",
        "CLARIFY": "REQUEST_CLARIFICATION",
        "OVERRIDE": "OVERRIDE",
        "CONCUR": "CONCUR",
        "DISSENT": "DISSENT",
    }

    @classmethod
    def normalize_action(cls, raw_action: str) -> str:
        """Normalize action string and validate against supported states."""
        cleaned = raw_action.strip().upper().replace(" ", "_")
        if cleaned in cls.VALID_ACTIONS:
            return cls.VALID_ACTIONS[cleaned]
        valid_list = ", ".join(["Accept", "Reject", "Request clarification", "Override", "Concur", "Dissent"])
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Invalid decision action '{raw_action}'. Allowed states: {valid_list}",
        )

    @classmethod
    async def record_finding_decision(
        cls,
        session: AsyncSession,
        finding_id: uuid.UUID,
        payload: DecisionCreate,
        actor: User,
    ) -> DecisionOut:
        """Record an officer decision on a specific finding.

        Preserves the machine recommendation separate from the officer's decision.
        Enforces that 'OVERRIDE' strictly requires an explicit justification reason.
        """
        # 1. Fetch Finding
        stmt = select(Finding).where(Finding.id == finding_id)
        res = await session.execute(stmt)
        finding = res.scalar_one_or_none()
        if not finding:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Finding with ID '{finding_id}' not found.",
            )

        # 2. Normalize and validate action
        action = cls.normalize_action(payload.action)

        # 3. Enforce reason for OVERRIDE
        reason = (payload.reason or "").strip()
        if action == "OVERRIDE" and not reason:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="An explicit justification reason is strictly required when overriding an automated finding.",
            )

        # 4. Separate machine recommendation from officer decision
        machine_rec = finding.status
        old_status = finding.status

        # 5. Determine resulting status
        if payload.resulting_status:
            resulting_status = payload.resulting_status.upper()
        else:
            if action == "OVERRIDE":
                resulting_status = "PASS"
            elif action == "ACCEPT":
                resulting_status = machine_rec
            elif action == "REJECT":
                resulting_status = "FAIL"
            elif action in ("REQUEST_CLARIFICATION", "CLARIFY", "DISSENT"):
                resulting_status = "REVIEW"
            else:
                resulting_status = machine_rec

        # 6. Create Decision record
        decision_id = uuid.uuid4()
        decision = Decision(
            id=decision_id,
            finding_id=finding_id,
            bidder_id=finding.bidder_id,
            bid_id=None,
            actor_id=actor.id,
            action=action,
            reason=reason or f"Officer {action.lower()}ed finding.",
            resulting_status=resulting_status,
            machine_recommendation=machine_rec,
            audit_ref=None,
        )
        session.add(decision)

        # 7. Update finding's effective status
        finding.status = resulting_status
        await session.commit()
        await session.refresh(decision)

        # 8. Record in cryptographic hash-chained audit log
        audit_ref = None
        try:
            audit_entry = await AuditService.record_event(
                session=session,
                action=f"DECISION_{action}",
                target_type="finding",
                target_id=str(finding_id),
                actor_id=actor.id,
                role=getattr(actor, "role", "officer"),
                previous_state={"status": old_status, "machine_recommendation": machine_rec},
                new_state={"status": resulting_status, "action": action},
                reason=reason or f"Officer {action} decision applied",
                evidence_reference=finding.evidence,
                payload={
                    "bidder_id": str(finding.bidder_id),
                    "decision_id": str(decision_id),
                    "machine_recommendation": machine_rec,
                    "officer_action": action,
                },
            )
            audit_ref = audit_entry.curr_hash
            decision.audit_ref = audit_ref
            await session.commit()
            await session.refresh(decision)
        except Exception as exc:
            logger.warning("Audit logging warning on finding decision %s: %s", finding_id, exc)

        logger.info(
            "Officer %s decided %s on finding %s (machine: %s -> resulting: %s)",
            actor.id,
            action,
            finding_id,
            machine_rec,
            resulting_status,
        )

        return DecisionOut(
            id=decision.id,
            finding_id=decision.finding_id,
            bidder_id=decision.bidder_id,
            bid_id=decision.bid_id,
            actor_id=decision.actor_id,
            actor_name=getattr(actor, "full_name", None),
            actor_role=getattr(actor, "role", None),
            action=decision.action,
            reason=decision.reason,
            resulting_status=decision.resulting_status,
            machine_recommendation=machine_rec,
            audit_ref=decision.audit_ref or audit_ref,
            created_at=decision.created_at,
        )

    @classmethod
    async def record_bid_decision(
        cls,
        session: AsyncSession,
        bid_id: uuid.UUID,
        payload: BidDecisionCreate,
        actor: User,
    ) -> DecisionOut:
        """Record an officer evaluation decision at the Bid level (/api/v1/bids/{id}/decision).

        Supports Accept, Reject, Request clarification, Override.
        Strictly requires a justification reason for Override.
        """
        # 1. Fetch Bid
        stmt = select(Bid).options(selectinload(Bid.bidder)).where(Bid.id == bid_id)
        res = await session.execute(stmt)
        bid = res.scalar_one_or_none()
        if not bid:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bid with ID '{bid_id}' not found.",
            )

        # 2. Normalize and validate action
        action = cls.normalize_action(payload.action)

        # 3. Enforce reason for OVERRIDE
        reason = (payload.reason or "").strip()
        if action == "OVERRIDE" and not reason:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="An explicit justification reason is strictly required when overriding a bid evaluation.",
            )

        # 4. Machine recommendation vs officer decision
        old_bid_status = bid.status
        machine_rec = bid.status

        # 5. Determine resulting status
        if payload.resulting_status:
            resulting_status = payload.resulting_status.upper()
        else:
            if action == "ACCEPT":
                resulting_status = "QUALIFIED"
            elif action == "REJECT":
                resulting_status = "NOT_QUALIFIED"
            elif action in ("REQUEST_CLARIFICATION", "CLARIFY"):
                resulting_status = "UNDER_EVALUATION"
            elif action == "OVERRIDE":
                resulting_status = "QUALIFIED"
            else:
                resulting_status = old_bid_status

        # 6. Create Decision record
        decision_id = uuid.uuid4()
        decision = Decision(
            id=decision_id,
            finding_id=None,
            bidder_id=bid.bidder_id,
            bid_id=bid.id,
            actor_id=actor.id,
            action=action,
            reason=reason or f"Officer {action.lower()}ed bid.",
            resulting_status=resulting_status,
            machine_recommendation=machine_rec,
            audit_ref=None,
        )
        session.add(decision)

        # 7. Update bid and bidder status
        bid.status = resulting_status
        b_stmt = select(Bidder).where(Bidder.id == bid.bidder_id)
        b_res = await session.execute(b_stmt)
        bidder = b_res.scalar_one_or_none() or getattr(bid, "bidder", None)
        if bidder:
            if resulting_status == "QUALIFIED":
                bidder.overall_status = "PASS"
            elif resulting_status == "NOT_QUALIFIED":
                bidder.overall_status = "FAIL"

        await session.commit()
        await session.refresh(decision)

        # 8. Record in cryptographic audit log
        audit_ref = None
        try:
            audit_entry = await AuditService.record_event(
                session=session,
                action=f"BID_DECISION_{action}",
                target_type="bid",
                target_id=str(bid_id),
                actor_id=actor.id,
                role=getattr(actor, "role", "officer"),
                previous_state={"status": old_bid_status, "machine_recommendation": machine_rec},
                new_state={"status": resulting_status, "action": action},
                reason=reason or f"Officer bid decision {action}",
                evidence_reference=f"bid_number:{bid.bid_number}",
                payload={
                    "bid_id": str(bid.id),
                    "bidder_id": str(bid.bidder_id),
                    "tender_id": str(bid.tender_id),
                    "decision_id": str(decision_id),
                    "machine_recommendation": machine_rec,
                    "officer_action": action,
                },
            )
            audit_ref = audit_entry.curr_hash
            decision.audit_ref = audit_ref
            await session.commit()
            await session.refresh(decision)
        except Exception as exc:
            logger.warning("Audit logging warning on bid decision %s: %s", bid_id, exc)

        logger.info(
            "Officer %s recorded %s on bid %s (%s -> %s)",
            actor.id,
            action,
            bid_id,
            old_bid_status,
            resulting_status,
        )

        return DecisionOut(
            id=decision.id,
            finding_id=decision.finding_id,
            bidder_id=decision.bidder_id,
            bid_id=decision.bid_id,
            actor_id=decision.actor_id,
            actor_name=getattr(actor, "full_name", None),
            actor_role=getattr(actor, "role", None),
            action=decision.action,
            reason=decision.reason,
            resulting_status=decision.resulting_status,
            machine_recommendation=machine_rec,
            audit_ref=decision.audit_ref or audit_ref,
            created_at=decision.created_at,
        )

    @classmethod
    async def get_decision_history(
        cls,
        session: AsyncSession,
        finding_id: Optional[uuid.UUID] = None,
        bidder_id: Optional[uuid.UUID] = None,
        bid_id: Optional[uuid.UUID] = None,
    ) -> list[DecisionOut]:
        """Retrieve full audit-linked decision history with actor attribution."""
        stmt = select(Decision).options(selectinload(Decision.actor)).order_by(Decision.created_at.desc())
        if finding_id:
            stmt = stmt.where(Decision.finding_id == finding_id)
        if bidder_id:
            stmt = stmt.where(Decision.bidder_id == bidder_id)
        if bid_id:
            stmt = stmt.where(Decision.bid_id == bid_id)

        res = await session.execute(stmt)
        decisions = res.scalars().all()

        return [
            DecisionOut(
                id=d.id,
                finding_id=d.finding_id,
                bidder_id=d.bidder_id,
                bid_id=d.bid_id,
                actor_id=d.actor_id,
                actor_name=d.actor.full_name if d.actor else None,
                actor_role=d.actor.role if d.actor else None,
                action=d.action,
                reason=d.reason,
                resulting_status=d.resulting_status,
                machine_recommendation=d.machine_recommendation,
                audit_ref=d.audit_ref,
                created_at=d.created_at,
            )
            for d in decisions
        ]

    @classmethod
    async def get_pending_findings(
        cls,
        session: AsyncSession,
        bidder_id: uuid.UUID,
    ) -> list[Finding]:
        """Find all findings requiring officer attention before review can be completed.

        A finding is pending if its status is FAIL, WARN, or REVIEW and it has not been
        definitively resolved by an officer decision (ACCEPT, OVERRIDE, or REJECT).
        """
        stmt = select(Finding).options(selectinload(Finding.decisions)).where(Finding.bidder_id == bidder_id)
        res = await session.execute(stmt)
        findings = res.scalars().all()

        pending = []
        for f in findings:
            if f.status in ("FAIL", "WARN", "REVIEW"):
                # Check if resolved by a decision
                if not f.decisions:
                    pending.append(f)
                else:
                    latest = sorted(f.decisions, key=lambda d: d.created_at or datetime.min)[-1]
                    if latest.action in ("REQUEST_CLARIFICATION", "CLARIFY", "DISSENT"):
                        pending.append(f)
        return pending

    @classmethod
    async def complete_review_for_bidder(
        cls,
        session: AsyncSession,
        bidder_id: uuid.UUID,
        actor: User,
    ) -> CompleteReviewResponse:
        """Validate and finalize evaluation review for a bidder.

        Enforces that a bid/bidder CANNOT become 'review complete' while mandatory
        unresolved findings (FAIL/REVIEW) remain, unless explicitly permitted.
        """
        # 1. Fetch Bidder
        stmt = select(Bidder).where(Bidder.id == bidder_id)
        res = await session.execute(stmt)
        bidder = res.scalar_one_or_none()
        if not bidder:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bidder with ID '{bidder_id}' not found.",
            )

        # 2. Check for unresolved mandatory findings
        pending_findings = await cls.get_pending_findings(session, bidder_id)
        unresolved_mandatory = [f for f in pending_findings if f.status in ("FAIL", "REVIEW")]

        if unresolved_mandatory:
            unresolved_info = [
                {"id": str(f.id), "rule_id": f.rule_id, "title": f.title, "status": f.status}
                for f in unresolved_mandatory
            ]
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": (
                        f"Cannot complete review: {len(unresolved_mandatory)} mandatory unresolved "
                        "finding(s) require officer decision (Accept, Override, or Reject) before finalization."
                    ),
                    "unresolved_findings": unresolved_info,
                },
            )

        # 3. Compute overall status from all findings
        all_findings_stmt = select(Finding).where(Finding.bidder_id == bidder_id)
        all_findings = (await session.execute(all_findings_stmt)).scalars().all()

        has_fail = any(f.status == "FAIL" for f in all_findings)
        final_overall_status = "FAIL" if has_fail else "PASS"

        # 4. Update Bidder review_state
        old_review_state = bidder.review_state
        bidder.review_state = "COMPLETED"
        bidder.overall_status = final_overall_status

        # 5. Update associated Bid if one exists
        bid_stmt = select(Bid).where(Bid.bidder_id == bidder_id)
        bid_res = await session.execute(bid_stmt)
        bid = bid_res.scalar_one_or_none()
        bid_status = None
        if bid:
            bid.status = "QUALIFIED" if final_overall_status == "PASS" else "NOT_QUALIFIED"
            bid_status = bid.status

        # 6. Count total decisions recorded
        dec_count_stmt = select(Decision).where(Decision.bidder_id == bidder_id)
        dec_count_res = await session.execute(dec_count_stmt)
        dec_count = len(dec_count_res.scalars().all())

        await session.commit()

        # 7. Record in cryptographic audit log
        try:
            await AuditService.record_event(
                session=session,
                action="REVIEW_COMPLETED",
                target_type="bidder",
                target_id=str(bidder_id),
                actor_id=actor.id,
                role=getattr(actor, "role", "officer"),
                previous_state={"review_state": old_review_state},
                new_state={
                    "review_state": "COMPLETED",
                    "overall_status": final_overall_status,
                    "bid_status": bid_status,
                },
                reason="All mandatory compliance findings resolved and review finalized",
                payload={
                    "bidder_id": str(bidder_id),
                    "bid_id": str(bid.id) if bid else None,
                    "total_findings": len(all_findings),
                    "decisions_count": dec_count,
                    "final_overall_status": final_overall_status,
                },
            )
        except Exception as exc:
            logger.warning("Audit logging warning on complete_review %s: %s", bidder_id, exc)

        logger.info(
            "Officer %s completed review for bidder %s (overall: %s, bid: %s)",
            actor.id,
            bidder_id,
            final_overall_status,
            bid_status,
        )

        return CompleteReviewResponse(
            status="ok",
            message="Evaluation review finalized successfully.",
            bidder_id=bidder_id,
            review_state="COMPLETED",
            overall_status=final_overall_status,
            bid_id=bid.id if bid else None,
            bid_status=bid_status,
            decisions_count=dec_count,
        )

    @classmethod
    async def complete_review_for_bid(
        cls,
        session: AsyncSession,
        bid_id: uuid.UUID,
        actor: User,
    ) -> CompleteReviewResponse:
        """Validate and finalize evaluation review starting from a Bid ID."""
        stmt = select(Bid).where(Bid.id == bid_id)
        res = await session.execute(stmt)
        bid = res.scalar_one_or_none()
        if not bid:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Bid with ID '{bid_id}' not found.",
            )
        return await cls.complete_review_for_bidder(session, bid.bidder_id, actor)
