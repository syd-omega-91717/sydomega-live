"""Governed registry for the twelve canonical Ω agents."""
from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class AgentProfile:
    name: str
    risk: str
    capabilities: frozenset[str]
    tools: frozenset[str]


CANONICAL_AGENTS = (
    ("Sentinel", "low", ("observe", "audit"), ("audit.read",)),
    ("Analyst", "medium", ("analyze", "compare"), ("data.read", "audit.read")),
    ("Historian", "low", ("retrieve", "summarize"), ("knowledge.read",)),
    ("Tutor", "low", ("teach", "explain"), ("knowledge.read",)),
    ("Merchant", "high", ("commerce", "pricing"), ("market.read", "money.write")),
    ("Proxy", "medium", ("delegate", "route"), ("agent.delegate",)),
    ("Oracle", "medium", ("forecast", "reason"), ("model.route", "knowledge.read")),
    ("Scout", "low", ("discover", "search"), ("web.read",)),
    ("Warden", "critical", ("protect", "enforce"), ("security.read", "security.write")),
    ("Auditor", "high", ("verify", "prove"), ("audit.read", "audit.write")),
    ("Beacon", "low", ("notify", "signal"), ("notification.write",)),
    ("Sovereign", "critical", ("govern", "approve"), ("deployment.write", "policy.write")),
)


class AgentRegistry:
    def __init__(self) -> None:
        self._agents = {
            name: AgentProfile(name, risk, frozenset(capabilities), frozenset(tools))
            for name, risk, capabilities, tools in CANONICAL_AGENTS
        }

    def get(self, name: str) -> AgentProfile:
        try:
            return self._agents[name]
        except KeyError as exc:
            raise KeyError(f"unknown agent: {name}") from exc

    def authorize_tool(self, agent: str, tool: str) -> bool:
        return tool in self.get(agent).tools

    def inventory(self) -> tuple[AgentProfile, ...]:
        return tuple(self._agents[name] for name, *_ in CANONICAL_AGENTS)

    def health(self) -> dict[str, object]:
        agents = self.inventory()
        return {
            "healthy": len(agents) == 12 and all(a.name and a.tools for a in agents),
            "agent_count": len(agents),
            "names": [a.name for a in agents],
        }
