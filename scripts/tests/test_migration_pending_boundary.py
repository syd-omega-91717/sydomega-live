#!/usr/bin/env python3
"""Regression tests for the distinction between source-pending and live-applied migrations."""

from __future__ import annotations

import json
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / "supabase" / "migrations"
REMOTE = ROOT / "supabase" / "remote-migrations.json"
PENDING = ROOT / "supabase" / "pending-migrations.json"


def run_script(path: str, *args: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, str(ROOT / path), *args],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )


class MigrationPendingBoundaryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.remote = json.loads(REMOTE.read_text(encoding="utf-8"))
        self.pending_doc = json.loads(PENDING.read_text(encoding="utf-8"))
        self.pending = self.pending_doc.get("pending", [])
        self.remote_versions = {str(v) for v in self.remote.get("versions", [])}

    def test_pending_registry_never_claims_live_application(self) -> None:
        pending_versions = set()
        for entry in self.pending:
            version = str(entry["version"])
            filename = str(entry["file"])
            self.assertNotIn(version, pending_versions, "duplicate pending migration")
            self.assertNotIn(version, self.remote_versions, "pending version also claimed live-applied")
            self.assertEqual(entry.get("status"), "PENDING_REVIEW")
            self.assertEqual(entry.get("liveStatus"), "NOT_APPLIED")
            self.assertIs(entry.get("blocksProduction"), True)
            self.assertTrue((MIGRATIONS / filename).is_file(), filename)
            self.assertTrue(filename.startswith(version + "_"), filename)
            pending_versions.add(version)

    def test_source_inventory_replay_contract_includes_pending_without_claiming_live(self) -> None:
        result = run_script("scripts/migration-replay-contract.py")
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assertIn(f"remote_count={len(self.remote_versions)}", result.stdout)
        self.assertIn(f"pending_count={len(self.pending)}", result.stdout)
        self.assertIn("pending versions are not asserted applied", result.stdout)

    def test_source_only_gate_and_strict_release_gate_are_distinct(self) -> None:
        source = run_script("scripts/migration-drift.py", "--source-only")
        self.assertEqual(source.returncode, 0, source.stdout + source.stderr)

        strict = run_script("scripts/migration-drift.py")
        if self.pending:
            self.assertNotEqual(strict.returncode, 0, strict.stdout + strict.stderr)
            self.assertIn("MIGRATION DRIFT: BLOCKED", strict.stdout)
            self.assertIn("production release is blocked", strict.stdout)
        else:
            self.assertEqual(strict.returncode, 0, strict.stdout + strict.stderr)


if __name__ == "__main__":
    unittest.main()
