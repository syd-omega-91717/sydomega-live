"""Machine-readable release evidence matrix.

The matrix deliberately records verification state rather than declaring
specification claims to be implemented. It is safe to extend to 999 points.
"""
from dataclasses import dataclass
from enum import Enum


class EvidenceState(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIAL = "PARTIAL"
    UNVERIFIED = "UNVERIFIED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"


@dataclass(frozen=True)
class EvidencePoint:
    point_id: str
    domain: str
    requirement: str
    state: EvidenceState = EvidenceState.UNVERIFIED
    evidence: str = ""
    critical: bool = False


class EvidenceMatrix:
    def __init__(self, points: list[EvidencePoint] | None = None):
        self._points = {p.point_id: p for p in (points or [])}

    def add(self, point: EvidencePoint) -> None:
        if not point.point_id.strip() or not point.requirement.strip():
            raise ValueError("point_id and requirement are required")
        self._points[point.point_id] = point

    def get(self, point_id: str) -> EvidencePoint | None:
        return self._points.get(point_id)

    def summary(self) -> dict[str, int]:
        counts = {state.value: 0 for state in EvidenceState}
        for point in self._points.values():
            counts[point.state.value] += 1
        return counts

    def release_blockers(self) -> list[EvidencePoint]:
        return sorted(
            (p for p in self._points.values() if p.critical and p.state != EvidenceState.VERIFIED),
            key=lambda p: p.point_id,
        )

    def export(self) -> list[dict[str, object]]:
        return [
            {
                "point_id": p.point_id,
                "domain": p.domain,
                "requirement": p.requirement,
                "state": p.state.value,
                "evidence": p.evidence,
                "critical": p.critical,
            }
            for p in sorted(self._points.values(), key=lambda x: x.point_id)
        ]
