#!/usr/bin/env python3
"""Provider-backed Supabase Edge Function inventory contracts."""
from __future__ import annotations

import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = json.loads((ROOT / "docs/runtime/supabase-edge-functions-live.json").read_text())
AUTH = json.loads((ROOT / "config/omega-edge-function-auth.json").read_text())["functions"]
CONFIG = (ROOT / "supabase/config.toml").read_text()
INDEX = (ROOT / "index.html").read_text()
GO_LIVE = (ROOT / "docs/legal/FUNCTION_GO_LIVE.md").read_text()
GAP = (ROOT / "GAP_ANALYSIS.md").read_text()
AUDIT = (ROOT / "docs/fixes/2026-11-10-edge-function-live-inventory.md").read_text()

DEPLOYED = {name: item for name, item in SNAPSHOT["functions"].items() if item["state"] == "DEPLOYED"}
LOCAL_ONLY = {name for name, item in SNAPSHOT["functions"].items() if item["state"] == "LOCAL_ONLY"}
CONFIGURED = set(re.findall(r"^\\[functions\\.([a-z0-9-]+)\\]\\s*$", CONFIG, re.MULTILINE))
EXPECTED_LOCAL_ONLY = {
    "checkout",
    "event-ingest",
    "graphify-ai-ingest",
    "graphify-ai-query",
    "weekly-digest",
}


class SupabaseEdgeRuntimeSnapshotTests(unittest.TestCase):
    def test_provider_inventory_matches_config_and_auth_registry(self):
        self.assertEqual(len(DEPLOYED), 22)
        self.assertEqual(set(DEPLOYED), set(AUTH))
        self.assertEqual(set(DEPLOYED), CONFIGURED)
        self.assertEqual(SNAPSHOT["inventory_summary"]["provider_active_count"], 22)
        self.assertEqual(SNAPSHOT["inventory_summary"]["configured_count"], 22)
        self.assertEqual(SNAPSHOT["inventory_summary"]["auth_registry_count"], 22)

    def test_all_deployed_entrypoints_have_provider_and_repository_evidence(self):
        for name, item in DEPLOYED.items():
            with self.subTest(function=name):
                self.assertEqual(item["provider_status"], "ACTIVE")
                self.assertIsInstance(item["version"], int)
                self.assertGreater(item["version"], 0)
                self.assertIsInstance(item["verify_jwt"], bool)
                self.assertEqual(item["verify_jwt"], AUTH[name]["verify_jwt"])
                self.assertRegex(item["live_sha256"], r"^[0-9a-f]{64}$")
                self.assertRegex(item["repository_blob_sha"], r"^[0-9a-f]{40}$")
                self.assertEqual(item["source_parity"], "EXACT_ENTRYPOINT_MATCH")
                self.assertEqual(item["provider_observed_at"], SNAPSHOT["captured_at"])

    def test_local_only_inventory_is_explicit_and_not_claimed_deployed(self):
        self.assertEqual(LOCAL_ONLY, EXPECTED_LOCAL_ONLY)
        for name in LOCAL_ONLY:
            with self.subTest(function=name):
                item = SNAPSHOT["functions"][name]
                self.assertEqual(item["provider_status"], "NOT_LISTED")
                self.assertEqual(item["source_parity"], "NOT_DEPLOYED")
                self.assertNotIn("live_sha256", item)
        self.assertEqual(SNAPSHOT["inventory_summary"]["local_only_count"], 5)

    def test_auth_mode_summary_matches_registry(self):
        counts = {}
        for item in AUTH.values():
            counts[item["auth_mode"]] = counts.get(item["auth_mode"], 0) + 1
        self.assertEqual(SNAPSHOT["inventory_summary"]["auth_modes"], counts)
        self.assertEqual(counts, {
            "SUPABASE_JWT": 13,
            "SHARED_SECRET": 5,
            "PUBLIC_READONLY": 2,
            "USER_SESSION": 1,
            "STRIPE_SIGNATURE": 1,
        })

    def test_public_claim_and_owner_go_live_document_match_snapshot(self):
        self.assertRegex(INDEX, r"22\\s+edge services\\s+—\\s+DEPLOYED")
        table_rows = [
            line for line in GO_LIVE.splitlines()
            if line.startswith("| `") and "| Exact entrypoint match |" in line
        ]
        self.assertEqual(len(table_rows), 22)
        self.assertIn("22 ACTIVE", GO_LIVE)
        self.assertIn("22 ACTIVE Edge Functions", AUDIT)
        self.assertIn("notify-access` v2 is ACTIVE", GAP)
        self.assertNotIn("9 of 25 functions are", GAP)

    def test_snapshot_does_not_claim_runtime_health_or_publish_project_ref(self):
        self.assertNotIn("project_ref", SNAPSHOT)
        note = SNAPSHOT["verification_note"].lower()
        self.assertIn("does not prove runtime request behavior", note)
        self.assertIn("secret availability", note)
        self.assertIn("byte-for-byte", note)


if __name__ == "__main__":
    unittest.main()
