#!/usr/bin/env python3
"""Regression tests for the evidence-only page contract bootstrap."""

import json
import os
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

class BootstrapContractTest(unittest.TestCase):
    def test_help_is_fast_and_descriptive(self):
        path = ROOT / "scripts" / "omega-page-contract-bootstrap.py"
        p = subprocess.run(
            [sys.executable, str(path), "--help"],
            cwd=ROOT, capture_output=True, text=True, timeout=5
        )
        self.assertEqual(p.returncode, 0)
        self.assertIn("evidence-only bootstrap inventory", p.stdout)

    def test_output_is_not_the_authoritative_registry(self):
        path = ROOT / "config" / "omega-page-contract-bootstrap.json"
        if not path.exists():
            subprocess.run(
                [sys.executable, str(ROOT / "scripts" / "omega-page-contract-bootstrap.py")],
                cwd=ROOT, check=True
            )
        report = json.loads(path.read_text(encoding="utf-8"))
        self.assertEqual(
            report["authority"],
            "evidence-only; does not populate config/omega-page-contracts.json",
        )
        self.assertGreater(report["page_count"], 0)
        for row in report["pages"]:
            self.assertFalse(row["authoritative_contract_present"])
            self.assertEqual(row["contract_state"], "BOOTSTRAP_OPEN")
            self.assertEqual(
                len(row["remediation_tasks"]),
                len(set(row["remediation_tasks"])),
            )
            self.assertEqual(row["truth_rule"], "SOURCE_EVIDENCE_ONLY")

if __name__ == "__main__":
    unittest.main()
