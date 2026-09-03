"""Cryptographic SHA-256 hash chaining and chain integrity verification."""

from datetime import date, datetime
import hashlib
import json
from typing import Any, Optional
import uuid

GENESIS_HASH = "0" * 64


def _json_serial(obj: Any) -> str:
    """JSON serializer for UUIDs, datetimes, and other objects."""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    if isinstance(obj, uuid.UUID):
        return str(obj)
    return str(obj)


def compute_audit_hash(prev_hash: str, event_payload: dict[str, Any]) -> str:
    """Compute deterministic SHA-256 hash chaining prev_hash with sorted JSON event payload."""
    serialized = json.dumps(event_payload, sort_keys=True, separators=(",", ":"), default=_json_serial)
    content = f"{prev_hash}{serialized}".encode("utf-8")
    return hashlib.sha256(content).hexdigest()


def get_chain_head(events: list[dict[str, Any]]) -> str:
    """Return latest hash in chain, or GENESIS_HASH if empty."""
    if not events:
        return GENESIS_HASH
    return events[-1].get("curr_hash", GENESIS_HASH)


def verify_chain(events: list[dict[str, Any]]) -> tuple[bool, int, Optional[int]]:
    """Verify hash chain integrity.
    
    Returns:
        (ok, length, first_broken_seq)
    """
    if not events:
        return True, 0, None

    expected_prev = GENESIS_HASH
    for event in events:
        claimed_curr = event.get("curr_hash")
        claimed_prev = event.get("prev_hash")
        seq = event.get("seq", 0)

        if claimed_prev != expected_prev:
            return False, len(events), seq

        # Determine payload dictionary to hash
        if "payload" in event and isinstance(event["payload"], dict):
            payload = event["payload"]
        else:
            payload = {k: v for k, v in event.items() if k not in ("curr_hash", "prev_hash")}

        calculated = compute_audit_hash(expected_prev, payload)
        if calculated != claimed_curr:
            return False, len(events), seq

        expected_prev = claimed_curr

    return True, len(events), None


def verify_chain_full(events: list[dict[str, Any]]) -> dict[str, Any]:
    """Verify hash chain integrity and return structured report with head hash.
    
    Returns:
        {"ok": bool, "length": int, "first_broken_seq": Optional[int], "head_hash": Optional[str]}
    """
    if not events:
        return {
            "ok": True,
            "length": 0,
            "first_broken_seq": None,
            "head_hash": GENESIS_HASH,
        }

    ok, length, first_broken_seq = verify_chain(events)
    head_hash = events[-1].get("curr_hash", GENESIS_HASH) if ok else (events[-1].get("curr_hash") if events else None)

    return {
        "ok": ok,
        "length": length,
        "first_broken_seq": first_broken_seq,
        "head_hash": head_hash,
    }
