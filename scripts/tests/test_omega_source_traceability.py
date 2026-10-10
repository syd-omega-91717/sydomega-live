import json
import pathlib
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class OmegaSourceTraceabilityContractTests(unittest.TestCase):
    def test_registry_accounting(self):
        registry = json.loads(
            (ROOT / "config" / "omega-source-traceability.json").read_text(encoding="utf-8")
        )
        accounting = registry["auditAccounting"]
        self.assertEqual(len(registry["sourceCorpus"]), 5)
        self.assertEqual(accounting["declaredFrameworkPoints"], 999)
        self.assertEqual(accounting["explicitNumberedPointRecords"], 391)
        self.assertEqual(accounting["declaredButNotDiscreteSourceRecords"], 608)
        self.assertEqual(
            accounting["explicitNumberedPointRecords"]
            + accounting["declaredButNotDiscreteSourceRecords"],
            accounting["declaredFrameworkPoints"],
        )

    def test_node_contract(self):
        test_file = ROOT / "scripts" / "tests" / "test_omega_source_traceability_contract.js"
        result = subprocess.run(
            ["node", str(test_file)],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("OMEGA_SOURCE_TRACEABILITY_CONTRACT=PASS", result.stdout)


if __name__ == "__main__":
    unittest.main()
