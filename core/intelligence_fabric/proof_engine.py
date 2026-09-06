"""Evidence-based release proof evaluation."""
from dataclasses import dataclass
from enum import Enum


class ProofState(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIAL = "PARTIAL"
    UNVERIFIED = "UNVERIFIED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"


@dataclass(frozen=True)
class Proof:
    name: str
    state: ProofState
    critical: bool = False
    evidence: str = ""


@dataclass(frozen=True)
class ProofReport:
    complete: bool
    release_ready: bool
    proofs: tuple[Proof, ...]
    unresolved_critical: tuple[str, ...]


def evaluate(proofs: list[Proof]) -> ProofReport:
    items = tuple(proofs)
    complete = bool(items) and all(p.state == ProofState.VERIFIED for p in items)
    critical = tuple(p.name for p in items if p.critical and p.state != ProofState.VERIFIED)
    return ProofReport(complete, complete and not critical, items, critical)
