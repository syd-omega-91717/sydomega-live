"""Execution boundary for governed agent actions.

This module is provider-neutral: adapters are explicit and evidence is never
inferred merely because authorization succeeded.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Callable


class EvidenceStatus(str, Enum):
    VERIFIED = "VERIFIED"
    PARTIALLY_VERIFIED = "PARTIALLY_VERIFIED"
    UNVERIFIED = "UNVERIFIED"
    FAILED = "FAILED"
    BLOCKED = "BLOCKED"


class Risk(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass(frozen=True)
class FabricRequest:
    agent: str
    intent: str
    tool: str
    risk: Risk = Risk.LOW
    payload: dict[str, Any] = field(default_factory=dict)
    requires_human_approval: bool = False


@dataclass(frozen=True)
class FabricDecision:
    allowed: bool
    status: EvidenceStatus
    reason: str
    agent: str
    tool: str
    audit_event: dict[str, Any]


class IntelligenceFabric:
    """Small deterministic policy/execution boundary.

    Adapters are registered by tool name. The fabric itself performs no
    network calls and therefore cannot manufacture provider evidence.
    """

    def __init__(self, agents: dict[str, set[str]] | None = None,
                 adapters: dict[str, Callable[[dict[str, Any]], Any]] | None = None):
        self.agents = agents or {}
        self.adapters = adapters or {}

    def inventory(self) -> dict[str, Any]:
        return {
            "agents": sorted(self.agents),
            "agent_count": len(self.agents),
            "adapter_count": len(self.adapters),
            "approval_boundary": True,
            "provider_neutral": True,
        }

    def authorize(self, request: FabricRequest) -> FabricDecision:
        base = {"agent": request.agent, "intent": request.intent,
                "tool": request.tool, "risk": request.risk.value}
        if request.agent not in self.agents:
            return FabricDecision(False, EvidenceStatus.BLOCKED, "unknown agent", request.agent, request.tool, base)
        if not request.intent.strip():
            return FabricDecision(False, EvidenceStatus.BLOCKED, "empty intent", request.agent, request.tool, base)
        if request.tool not in self.agents[request.agent]:
            return FabricDecision(False, EvidenceStatus.BLOCKED, "tool not bound to agent", request.agent, request.tool, base)
        if request.risk in {Risk.HIGH, Risk.CRITICAL} and not request.requires_human_approval:
            return FabricDecision(False, EvidenceStatus.BLOCKED, "human approval required", request.agent, request.tool, base)
        base["status"] = EvidenceStatus.UNVERIFIED.value
        return FabricDecision(True, EvidenceStatus.UNVERIFIED, "authorized; execution evidence pending", request.agent, request.tool, base)

    def execute(self, request: FabricRequest) -> FabricDecision:
        decision = self.authorize(request)
        if not decision.allowed:
            return decision
        adapter = self.adapters.get(request.tool)
        event = dict(decision.audit_event)
        if adapter is None:
            event["status"] = EvidenceStatus.UNVERIFIED.value
            return FabricDecision(False, EvidenceStatus.UNVERIFIED, "no execution adapter registered", request.agent, request.tool, event)
        try:
            result = adapter(request.payload)
        except Exception as exc:  # adapter boundary must never leak provider errors
            event.update({"status": EvidenceStatus.FAILED.value, "error_type": type(exc).__name__})
            return FabricDecision(False, EvidenceStatus.FAILED, "adapter execution failed", request.agent, request.tool, event)
        status = EvidenceStatus.VERIFIED if result is not None else EvidenceStatus.PARTIALLY_VERIFIED
        event["status"] = status.value
        return FabricDecision(True, status, "execution completed" if result is not None else "execution returned no evidence", request.agent, request.tool, event)
