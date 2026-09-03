"""Cryptographic SHA-256 hash chaining and chain integrity verification."""

import hashlib
import json
from typing import Any, Optional

GENESIS_HASH = "0" * 64


def compute_audit_hash(prev_hash: str, event_payload: dict[str, Any]) -> str:
    """Compute deterministic SHA-256 hash chaining prev_hash with sorted JSON event payload."""
    serialized = json.dumps(event_payload, sort_keys=True, separators=(",", ":"))
    content = f"{prev_hash}{serialized}".encode("utf-8")
    return hashlib.sha256(content).hexdigest()


def verify_chain(events: list[dict[str, Any]]) -> tuple[bool, int, Optional[int]]:
    """Verify hash chain integrity.
    
    Returns:
        (ok, length, first_broken_seq)
    """
    if not events:
        return True, 0, None

    expected_prev = GENESIS_HASH
    for event in events:
        payload = event.get("payload", {})
        claimed_curr = event.get("curr_hash")
        claimed_prev = event.get("prev_hash")
        seq = event.get("seq", 0)

        if claimed_prev != expected_prev:
            return False, len(events), seq

        calculated = compute_audit_hash(expected_prev, payload)
        if calculated != claimed_curr:
            return False, len(events), seq

        expected_prev = claimed_curr

    return True, len(events), None
