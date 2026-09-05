"""Deterministic, provider-neutral model routing."""
from dataclasses import dataclass
from enum import Enum


class TaskClass(str, Enum):
    GENERAL = "general"
    CODE = "code"
    RESEARCH = "research"
    FAST = "fast"
    PRIVATE = "private"


@dataclass(frozen=True)
class ModelCandidate:
    provider: str
    model: str
    tasks: frozenset[TaskClass]
    max_cost: float = 1.0
    supports_streaming: bool = True


class ModelRouter:
    def __init__(self, candidates: list[ModelCandidate]):
        self.candidates = tuple(candidates)

    def route(self, task: TaskClass, budget: float = 1.0, streaming: bool = False) -> ModelCandidate | None:
        eligible = [c for c in self.candidates if task in c.tasks and c.max_cost <= budget and (not streaming or c.supports_streaming)]
        return sorted(eligible, key=lambda c: (c.max_cost, c.provider, c.model))[0] if eligible else None
