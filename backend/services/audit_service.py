"""Service layer for Cryptographic Audit Logging and Hash-Chain Verification."""

from datetime import datetime, timezone
import logging
from typing import Any, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.entities import AuditLog
from pipeline.audit.hasher import (
    GENESIS_HASH,
    compute_audit_hash,
    get_chain_head,
    verify_chain,
    verify_chain_full,
)

logger = logging.getLogger("vigilbid.services.audit")


class AuditService:
    """Records tamper-evident hash-chained audit events and verifies chain continuity."""

    @classmethod
    async def record_event(
        cls,
        session: AsyncSession,
        action: str,
        target_type: str,
        target_id: str,
        actor_id: Optional[uuid.UUID] = None,
        role: str = "system",
        previous_state: Optional[Any] = None,
        new_state: Optional[Any] = None,
        reason: Optional[str] = None,
        evidence_reference: Optional[Any] = None,
        payload: Optional[dict[str, Any]] = None,
        commit: bool = True,
    ) -> AuditLog:
        """Record an immutable, hash-chained audit event for an important action.

        Records:
            - actor (actor_id and role)
            - timestamp (ISO UTC)
            - action (e.g. CREATE_TENDER, DECISION_OVERRIDE, UPLOAD_DOCUMENT)
            - entity (target_type and target_id)
            - previous state (state before mutation)
            - new state (state after mutation)
            - reason (justification for change)
            - evidence reference (supporting evidence citation/hash)
        """
        now = datetime.now(timezone.utc)

        # 1. Fetch latest record in chain to obtain preceding hash
        stmt = select(AuditLog).order_by(AuditLog.seq.desc()).limit(1)
        latest_res = await session.execute(stmt)
        latest = latest_res.scalar_one_or_none()

        prev_hash = latest.curr_hash if latest else GENESIS_HASH
        next_seq = (latest.seq + 1) if latest else 1

        # 2. Build structured event payload
        event_payload: dict[str, Any] = {
            "seq": next_seq,
            "actor": str(actor_id) if actor_id else "system",
            "actor_id": str(actor_id) if actor_id else None,
            "role": role,
            "timestamp": now.isoformat(),
            "action": action,
            "entity": f"{target_type}:{target_id}",
            "target_type": target_type,
            "target_id": str(target_id),
            "previous_state": previous_state,
            "new_state": new_state,
            "reason": reason,
            "evidence_reference": evidence_reference,
        }
        if payload:
            event_payload.update(payload)

        # 3. Deterministically compute current SHA-256 hash
        curr_hash = compute_audit_hash(prev_hash, event_payload)

        # 4. Instantiate and persist audit log row
        audit_entry = AuditLog(
            ts=now,
            actor_id=actor_id,
            role=role,
            action=action,
            target_type=target_type,
            target_id=str(target_id),
            payload=event_payload,
            prev_hash=prev_hash,
            curr_hash=curr_hash,
        )
        session.add(audit_entry)
        if commit:
            await session.commit()
            if hasattr(session, "refresh"):
                await session.refresh(audit_entry)

        logger.info(
            "Audit event #%s recorded: action=%s, target=%s:%s, prev=%s..., curr=%s...",
            audit_entry.seq if hasattr(audit_entry, "seq") else next_seq,
            action,
            target_type,
            target_id,
            prev_hash[:8],
            curr_hash[:8],
        )
        return audit_entry

    # Backward compatibility alias
    @classmethod
    async def log_event(
        cls,
        session: AsyncSession,
        actor_id: Optional[uuid.UUID],
        role: str,
        action: str,
        target_type: str,
        target_id: str,
        payload: Optional[dict[str, Any]] = None,
        previous_state: Optional[Any] = None,
        new_state: Optional[Any] = None,
        reason: Optional[str] = None,
        evidence_reference: Optional[Any] = None,
    ) -> AuditLog:
        """Alias matching prior scaffold interface."""
        return await cls.record_event(
            session=session,
            action=action,
            target_type=target_type,
            target_id=target_id,
            actor_id=actor_id,
            role=role,
            previous_state=previous_state,
            new_state=new_state,
            reason=reason,
            evidence_reference=evidence_reference,
            payload=payload,
        )

    @classmethod
    async def get_chain_head(cls, session: AsyncSession) -> str:
        """Retrieve the latest hash in the database audit chain."""
        stmt = select(AuditLog).order_by(AuditLog.seq.desc()).limit(1)
        res = await session.execute(stmt)
        latest = res.scalar_one_or_none()
        return latest.curr_hash if latest else GENESIS_HASH

    @classmethod
    async def get_audit_trail(
        cls,
        session: AsyncSession,
        tender_id: Optional[uuid.UUID] = None,
        target_type: Optional[str] = None,
        target_id: Optional[str] = None,
        action: Optional[str] = None,
        page: int = 1,
        limit: int = 50,
    ) -> list[AuditLog]:
        """Query immutable audit events with pagination and filters."""
        stmt = select(AuditLog).order_by(AuditLog.seq.asc())
        if target_type:
            stmt = stmt.where(AuditLog.target_type == target_type)
        if target_id:
            stmt = stmt.where(AuditLog.target_id == str(target_id))
        if action:
            stmt = stmt.where(AuditLog.action == action)

        res = await session.execute(stmt)
        all_entries = list(res.scalars().all())

        if tender_id:
            t_id_str = str(tender_id)
            filtered = []
            for e in all_entries:
                if e.target_id == t_id_str or (e.target_type == "tender" and e.target_id == t_id_str):
                    filtered.append(e)
                elif e.payload and isinstance(e.payload, dict):
                    if (
                        e.payload.get("tender_id") == t_id_str
                        or e.payload.get("target_id") == t_id_str
                    ):
                        filtered.append(e)
            all_entries = filtered

        start = (page - 1) * limit
        return all_entries[start : start + limit]

    @classmethod
    async def verify_chain(cls, session: AsyncSession) -> dict[str, Any]:
        """Verify cryptographic continuity and integrity of the database audit log table."""
        stmt = select(AuditLog).order_by(AuditLog.seq.asc())
        res = await session.execute(stmt)
        entries = list(res.scalars().all())

        if not entries:
            return {
                "ok": True,
                "length": 0,
                "first_broken_seq": None,
                "head_hash": GENESIS_HASH,
            }

        events_data = [
            {
                "seq": e.seq,
                "prev_hash": e.prev_hash,
                "curr_hash": e.curr_hash,
                "payload": e.payload or {},
            }
            for e in entries
        ]

        return verify_chain_full(events_data)
