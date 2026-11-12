#!/usr/bin/env python3
"""Validate the checked-in Supabase Edge Function provider/source snapshot."""
from __future__ import annotations

import hashlib
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SNAPSHOT = ROOT / "docs/runtime/supabase-edge-functions-live.json"
FUNCTIONS = ROOT / "supabase/functions"


class EdgeFunctionProviderSnapshotTests(unittest.TestCase):
    def test_all_configured_functions_are_active_and_source_matched(self) -> None:
        snapshot = json.loads(SNAPSHOT.read_text(encoding="utf-8"))
        rows = snapshot.get("functions", {})
        self.assertEqual(len(rows), 22, "expected the canonical 22-function provider inventory")

        for slug, row in sorted(rows.items()):
            with self.subTest(function=slug):
                self.assertEqual(row.get("provider_status"), "ACTIVE")
                self.assertEqual(row.get("state"), "DEPLOYED")
                self.assertEqual(row.get("source_parity"), "EXACT_ENTRYPOINT_MATCH")
                self.assertIsInstance(row.get("verify_jwt"), bool)
                self.assertTrue(row.get("live_sha256"))
                self.assertTrue(row.get("provider_observed_at"))

                entrypoint = FUNCTIONS / slug / "index.ts"
                self.assertTrue(entrypoint.is_file(), f"missing local entrypoint: {entrypoint}")
                content = entrypoint.read_bytes()
                blob = b"blob " + str(len(content)).encode("ascii") + b"\\0" + content
                actual_blob_sha = hashlib.sha1(blob).hexdigest()
                self.assertEqual(
                    row.get("repository_blob_sha"),
                    actual_blob_sha,
                    f"{slug}: provider parity snapshot points at a stale repository blob",
                )


if __name__ == "__main__":
    unittest.main()
