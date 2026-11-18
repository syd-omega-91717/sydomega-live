#!/usr/bin/env python3
"""Regression tests for the evidence-bound page-to-hub ownership matrix."""
import json
import os
import subprocess
import sys
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "omega-page-hub-ownership.py")
MATRIX = os.path.join(ROOT, "config", "omega-page-hub-ownership.json")
CONTRACTS = os.path.join(ROOT, "config", "omega-page-contracts.json")


class PageHubOwnershipContract(unittest.TestCase):
    def test_generator_reproduces_complete_unique_matrix(self):
        result = subprocess.run(
            [sys.executable, SCRIPT],
            cwd=ROOT,
            check=False,
            capture_output=True,
            text=True,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        with open(MATRIX, encoding="utf-8") as handle:
            matrix = json.load(handle)
        with open(CONTRACTS, encoding="utf-8") as handle:
            contracts = json.load(handle)
        pages = matrix["pages"]
        self.assertEqual(matrix["page_count"], contracts["page_count"])
        self.assertEqual(len(pages), contracts["page_count"])
        self.assertEqual(len({row["page_id"] for row in pages}), len(pages))
        self.assertEqual(len({row["path"] for row in pages}), len(pages))
        self.assertEqual(
            set(row["path"] for row in pages),
            set(row["path"] for row in contracts["contracts"]),
        )

    def test_unknown_and_ambiguous_routes_are_not_silently_assigned(self):
        with open(MATRIX, encoding="utf-8") as handle:
            matrix = json.load(handle)
        for row in matrix["pages"]:
            if row["classification"] in {"UNMAPPED", "UNMAPPED_SECTION", "AMBIGUOUS", "KEEP_SEPARATE"}:
                self.assertIsNone(row["candidate_hub"], row["path"])
            if row["classification"] == "CANDIDATE_MERGE_PANEL":
                self.assertTrue(row["candidate_hub"], row["path"])
                self.assertEqual(row["authorization_state"], "UNVERIFIED") if row["authorization_state"] == "UNVERIFIED" else None

    def test_every_candidate_hub_is_a_real_root_page(self):
        with open(MATRIX, encoding="utf-8") as handle:
            matrix = json.load(handle)
        for hub in matrix["hubs"]:
            self.assertTrue(os.path.isfile(os.path.join(ROOT, hub["path"])), hub["path"])


if __name__ == "__main__":
    unittest.main()
