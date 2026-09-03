"""Cross-document entity matching and parity scoring."""

from dataclasses import dataclass


@dataclass
class ResolutionScore:
    declared_name: str
    canonical_name: str
    token_set_ratio: float
    pan_gstin_parity: bool
    is_match: bool


class EntityMatcher:
    """Computes similarity scores across documents within a bidder package."""

    def match_entities(self, declared_name: str, extracted_names: list[str], pan: str, gstin: str) -> ResolutionScore:
        raise NotImplementedError("Entity matching logic will be implemented in future phase")
