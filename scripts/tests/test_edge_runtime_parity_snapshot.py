#!/usr/bin/env python3
"""Guard the dated Supabase Edge Function parity snapshot against stale counts or false completion."""

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = ROOT / "config" / "omega-edge-runtime-parity-evidence.json"
AUTH = ROOT / "config" / "omega-edge-function-auth.json"


class EdgeRuntimeParitySnapshotTests(unittest.TestCase):
    def setUp(self):
        self.snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        self.auth = json.loads(AUTH.read_text(encoding="utf-8"))
        self.registry = self.auth.get("functions", self.auth)

    def test_snapshot_has_exact_live_inventory_and_entrypoint_evidence(self):
        self.assertEqual(self.snapshot["live_active_function_count"], 22)
        active = set(self.snapshot["active_provider_functions"])
        inventory = self.snapshot["function_inventory"]
        self.assertEqual(len(inventory), 22)
        self.assertEqual({item["slug"] for item in inventory}, active)
        for item in inventory:
            with self.subTest(function=item["slug"]):
                self.assertTrue(item["entrypoint_content_exact_match"])
                self.assertTrue(item["verify_jwt_registry_match"])
                self.assertRegex(item["repository_git_blob_sha1"], re.compile(r"^[0-9a-f]{40}$"))
                self.assertEqual(item["repository_entrypoint"], f"supabase/functions/{item['slug']}/index.ts")

    def test_snapshot_keeps_secret_and_behavior_gaps_explicit(self):
        for item in self.snapshot["function_inventory"]:
            with self.subTest(function=item["slug"]):
                self.assertEqual(item["secret_presence_fingerprint"], "NOT_CHECKED")
                self.assertEqual(item["authorized_request_test"], "NOT_RUN")
                self.assertEqual(item["unauthorized_request_test"], "NOT_RUN")
                self.assertEqual(item["malformed_request_test"], "NOT_RUN")
                self.assertEqual(item["replay_idempotency_test"], "NOT_RUN")
                self.assertNotIn("secret_value", item)

    def test_snapshot_does_not_claim_go_live_completion(self):
        self.assertEqual(self.snapshot["status"], "EVIDENCE_SNAPSHOT_NOT_LIVE_AUTHORITY")
        self.assertIn("secret availability", self.snapshot["truth_boundary"])
        self.assertIn("business-flow success", self.snapshot["truth_boundary"])
        self.assertEqual(len(self.snapshot["not_verified_in_this_snapshot"]), 4)


if __name__ == "__main__":
    unittest.main()
