import subprocess
import unittest
from pathlib import Path


class OmegaDataIngestionContractTests(unittest.TestCase):
    def test_javascript_contract(self):
        root = Path(__file__).resolve().parents[2]
        result = subprocess.run(
            ["node", "scripts/tests/test_omega_data_ingestion_contract.js"],
            cwd=root,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn("OMEGA DATA INGESTION CONTRACT: PASS", result.stdout)


if __name__ == "__main__":
    unittest.main()
