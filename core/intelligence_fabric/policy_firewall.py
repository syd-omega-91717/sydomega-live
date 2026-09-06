"""Central policy firewall for irreversible operations."""
from dataclasses import dataclass
from .fabric import Risk


@dataclass(frozen=True)
class PolicyDecision:
    allowed: bool
    reason: str
    requires_human_approval: bool


class PolicyFirewall:
    IRREVERSIBLE = frozenset({"money.write", "identity.delete", "data.delete", "deployment.write", "security.write"})

    def evaluate(self, tool: str, risk: Risk = Risk.LOW, human_approved: bool = False) -> PolicyDecision:
        approval = tool in self.IRREVERSIBLE or risk in {Risk.HIGH, Risk.CRITICAL}
        if approval and not human_approved:
            return PolicyDecision(False, "human approval required", True)
        return PolicyDecision(True, "policy allows operation", approval)
