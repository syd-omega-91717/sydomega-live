import unittest
from core.intelligence_fabric import (
    EvidenceStatus, FabricRequest, IntelligenceFabric, ModelCandidate,
    ModelRouter, PolicyFirewall, Proof, ProofState, Risk, Skill, SkillRegistry,
    TaskClass, evaluate,
)


class FabricTests(unittest.TestCase):
    def test_authorization_and_execution_evidence(self):
        fabric = IntelligenceFabric({"Sentinel": {"audit.read"}}, {"audit.read": lambda p: {"ok": True}})
        decision = fabric.execute(FabricRequest("Sentinel", "inspect", "audit.read"))
        self.assertTrue(decision.allowed)
        self.assertEqual(decision.status, EvidenceStatus.VERIFIED)

    def test_high_risk_is_blocked_without_approval(self):
        fabric = IntelligenceFabric({"Sentinel": {"security.write"}})
        decision = fabric.authorize(FabricRequest("Sentinel", "change", "security.write", Risk.HIGH))
        self.assertFalse(decision.allowed)
        self.assertEqual(decision.status, EvidenceStatus.BLOCKED)

    def test_router_is_deterministic(self):
        candidates = [
            ModelCandidate("b", "slow", frozenset({TaskClass.CODE}), 0.8),
            ModelCandidate("a", "fast", frozenset({TaskClass.CODE}), 0.4),
        ]
        self.assertEqual(ModelRouter(candidates).route(TaskClass.CODE).provider, "a")

    def test_firewall_requires_approval(self):
        firewall = PolicyFirewall()
        self.assertFalse(firewall.evaluate("money.write").allowed)
        self.assertTrue(firewall.evaluate("money.write", human_approved=True).allowed)

    def test_proof_report(self):
        report = evaluate([Proof("health", ProofState.VERIFIED, True), Proof("ui", ProofState.VERIFIED)])
        self.assertTrue(report.complete)
        self.assertTrue(report.release_ready)

    def test_skill_registry(self):
        registry = SkillRegistry()
        registry.register(Skill("audit", "repository audit", "audit.read"))
        self.assertEqual(registry.get("audit").tool, "audit.read")
        with self.assertRaises(ValueError):
            registry.register(Skill("", "bad", "audit.read"))


if __name__ == "__main__":
    unittest.main()
