import json
import unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
class UnifiedPlatformFabricTests(unittest.TestCase):
    def load(self,name): return json.loads((ROOT/"config"/name).read_text())
    def test_fabric_has_required_contracts(self):
        fabric=self.load("omega-unified-platform-fabric.json")
        self.assertTrue(fabric["page_contract_required"]); self.assertTrue(fabric["content_contract_required"]); self.assertTrue(fabric["task_types"])
    def test_page_registry_covers_current_html_estate(self):
        registry=self.load("omega-page-contracts.json")
        self.assertIn(registry["status"],{"EVIDENCE_CONTRACT","EVIDENCE_CONTRACT_PARTIAL_AUDIT"})
        self.assertEqual(registry["page_count"],len(registry["contracts"])); self.assertGreater(registry["page_count"],0)
        self.assertTrue(all(c["page_id"] and c["path"].endswith(".html") for c in registry["contracts"]))
        self.assertTrue(all(c["authority"]=="REPOSITORY_SOURCE_EVIDENCE_ONLY" for c in registry["contracts"]))
    def test_page_review_queue_covers_every_page(self):
        registry=self.load("omega-page-contracts.json"); queue=self.load("omega-page-review-tasks.json")
        self.assertEqual(queue["task_count"],registry["page_count"]); self.assertEqual(len(queue["tasks"]),registry["page_count"])
        self.assertEqual({t["page"] for t in queue["tasks"]},{c["page_id"] for c in registry["contracts"]})
        self.assertTrue(all(t["state"]=="OPEN" and t["evidence_required"] for t in queue["tasks"]))
    def test_page_contracts_do_not_fake_unknowns(self):
        registry=self.load("omega-page-contracts.json")
        for contract in registry["contracts"]:
            self.assertEqual(contract["source_of_truth"] if "source_of_truth" in contract else "UNSPECIFIED","UNSPECIFIED"); self.assertIn("UNVERIFIED",contract["truth_states"])
            audited=bool(contract["evidence"].get("source_content_audited",False)); trace=contract.get("traceability",{})
            self.assertEqual(audited,bool(trace.get("source_content_audited",False)))
            if audited: self.assertEqual(contract["evidence"].get("method"),"direct HTML source inspection")
    def test_content_non_inference_rules(self):
        rules=set(self.load("omega-content-contract.json")["non_inference_rules"])
        self.assertIn("bytes_do_not_prove_ownership",rules); self.assertIn("catalog_presence_does_not_prove_entitlement",rules)
    def test_task_contract_requires_evidence(self):
        self.assertIn("evidence_required",self.load("omega-task-contract.json")["required"])
if __name__=="__main__": unittest.main()
