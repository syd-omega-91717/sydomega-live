import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[2]

class UnifiedPlatformFabricTests(unittest.TestCase):
    def load(self,name):
        return json.loads((ROOT/"config"/name).read_text())

    def test_fabric_has_required_contracts(self):
        fabric=self.load("omega-unified-platform-fabric.json")
        self.assertTrue(fabric["page_contract_required"])
        self.assertTrue(fabric["content_contract_required"])
        self.assertTrue(fabric["task_types"])

    def test_page_registry_covers_current_html_estate(self):
        registry=self.load("omega-page-contracts.json")
        self.assertEqual(registry["status"],"EVIDENCE_CONTRACT_BOOTSTRAP")
        self.assertEqual(registry["page_count"],len(registry["contracts"]))
        self.assertGreater(registry["page_count"],0)
        self.assertTrue(all(c["page_id"] and c["path"].endswith(".html") for c in registry["contracts"]))
        self.assertTrue(all(c["authority"]=="REPOSITORY_IDENTITY_AND_CAPABILITY_REGISTRY_ONLY" for c in registry["contracts"]))

    def test_page_review_queue_covers_every_page(self):
        registry=self.load("omega-page-contracts.json")
        queue=self.load("omega-page-review-tasks.json")
        self.assertEqual(queue["task_count"],registry["page_count"])
        self.assertEqual(len(queue["tasks"]),registry["page_count"])
        self.assertEqual({t["page"] for t in queue["tasks"]},{c["page_id"] for c in registry["contracts"]})
        self.assertTrue(all(t["state"]=="OPEN" and t["evidence_required"] for t in queue["tasks"]))

    def test_page_contracts_do_not_fake_unknowns(self):
        registry=self.load("omega-page-contracts.json")
        for contract in registry["contracts"]:
            self.assertEqual(contract["source_of_truth"] if "source_of_truth" in contract else "UNSPECIFIED","UNSPECIFIED")
            self.assertIn("UNVERIFIED",contract["truth_states"])
            self.assertFalse(contract["evidence"]["source_content_audited"])

    def test_content_non_inference_rules(self):
        data=self.load("omega-content-contract.json")
        rules=set(data["non_inference_rules"])
        self.assertIn("bytes_do_not_prove_ownership",rules)
        self.assertIn("catalog_presence_does_not_prove_entitlement",rules)

    def test_task_contract_requires_evidence(self):
        data=self.load("omega-task-contract.json")
        self.assertIn("evidence_required",data["required"])

if __name__=="__main__":
    unittest.main()
