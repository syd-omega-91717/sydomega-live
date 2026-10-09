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

    def test_page_registry_starts_empty_not_fake(self):
        registry=self.load("omega-page-contracts.json")
        self.assertEqual(registry["contracts"],[])

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
