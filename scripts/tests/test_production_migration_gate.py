from __future__ import annotations

import json
import os
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GATE = ROOT / "scripts" / "production-migration-gate.py"


class ProductionMigrationGateTests(unittest.TestCase):
    def make_root(self, *, source, remote, pending):
        tmp = tempfile.TemporaryDirectory()
        root = Path(tmp.name)
        migrations = root / "supabase" / "migrations"
        migrations.mkdir(parents=True)
        for filename in source:
            (migrations / filename).write_text("-- fixture\n", encoding="utf-8")
        (root / "supabase" / "remote-migrations.json").write_text(
            json.dumps(remote), encoding="utf-8"
        )
        (root / "supabase" / "pending-migrations.json").write_text(
            json.dumps(pending), encoding="utf-8"
        )
        self.addCleanup(tmp.cleanup)
        return root

    def run_gate(self, root):
        return subprocess.run(
            [sys.executable, str(GATE), "--root", str(root)],
            capture_output=True,
            text=True,
            check=False,
        )

    def remote(self, versions):
        return {
            "_captured": "2026-11-18",
            "remoteMigrationCount": len(versions),
            "latestRemoteMigration": max(versions),
            "versions": versions,
            "migrations": [{"version": v, "name": f"migration_{v}"} for v in versions],
        }

    def pending(self, version, filename):
        return {
            "pending": [{
                "version": version,
                "file": filename,
                "status": "PENDING_REVIEW",
                "liveStatus": "NOT_APPLIED",
                "blocksProduction": True,
            }]
        }

    def test_exact_source_provider_parity_and_empty_pending_pass(self):
        versions = ["0001", "20261118090000"]
        root = self.make_root(
            source=["0001_initial.sql", "20261118090000_reservation.sql"],
            remote=self.remote(versions),
            pending={"pending": []},
        )
        result = self.run_gate(root)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("PRODUCTION_MIGRATION_GATE=PASS source=2 provider=2 pending=0", result.stdout)

    def test_registered_unapplied_migration_blocks_production(self):
        root = self.make_root(
            source=["0001_initial.sql", "20261118090000_reservation.sql"],
            remote=self.remote(["0001"]),
            pending=self.pending("20261118090000", "20261118090000_reservation.sql"),
        )
        result = self.run_gate(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unapplied migrations block production", result.stderr)
        self.assertIn("20261118090000", result.stderr)

    def test_unregistered_source_migration_fails_closed(self):
        root = self.make_root(
            source=["0001_initial.sql", "20261118090000_reservation.sql"],
            remote=self.remote(["0001"]),
            pending={"pending": []},
        )
        result = self.run_gate(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("unregistered source versions=20261118090000", result.stderr)

    def test_provider_only_migration_fails_closed(self):
        root = self.make_root(
            source=["0001_initial.sql"],
            remote=self.remote(["0001", "20261118090000"]),
            pending={"pending": []},
        )
        result = self.run_gate(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("provider-only versions exist", result.stderr)

    def test_duplicate_source_versions_fail_closed(self):
        root = self.make_root(
            source=["0001_initial.sql", "0001_duplicate.sql"],
            remote=self.remote(["0001"]),
            pending={"pending": []},
        )
        result = self.run_gate(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("duplicate source migration version", result.stderr)

    def test_malformed_pending_registry_fails_closed(self):
        root = self.make_root(
            source=["0001_initial.sql"],
            remote=self.remote(["0001"]),
            pending={"entries": []},
        )
        result = self.run_gate(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("pending registry must contain a pending array", result.stderr)

    def test_pending_entry_must_match_source_and_block_production(self):
        root = self.make_root(
            source=["0001_initial.sql", "20261118090000_reservation.sql"],
            remote=self.remote(["0001"]),
            pending={
                "pending": [{
                    "version": "20261118090000",
                    "file": "20261118090000_reservation.sql",
                    "status": "PENDING_REVIEW",
                    "liveStatus": "NOT_APPLIED",
                    "blocksProduction": False,
                }]
            },
        )
        result = self.run_gate(root)
        self.assertEqual(result.returncode, 1)
        self.assertIn("does not fail closed", result.stderr)

    def test_cloudflare_main_build_runs_gate_and_branch_preview_is_not_gated(self):
        build = (ROOT / "scripts" / "vercel-build.sh").read_text(encoding="utf-8")
        self.assertIn('if [[ "${CF_PAGES_BRANCH:-}" == "main" ]]; then', build)
        self.assertIn("python3 scripts/production-migration-gate.py", build)

    def test_manual_cloudflare_fallback_sets_production_branch(self):
        workflow = (ROOT / ".github" / "workflows" / "cloudflare-pages.yml").read_text(encoding="utf-8")
        self.assertIn("CF_PAGES_BRANCH: main", workflow)
        self.assertIn("run: bash scripts/vercel-build.sh", workflow)

    def test_local_contract_suite_runs_the_production_migration_gate(self):
        suite = (ROOT / "scripts" / "contract-suite.py").read_text(encoding="utf-8")
        self.assertIn("production-migration-gate", suite)
        self.assertIn("scripts/production-migration-gate.py", suite)

    def test_vercel_production_promotion_runs_gate_before_pull(self):
        workflow = (ROOT / ".github" / "workflows" / "vercel-production.yml").read_text(encoding="utf-8")
        marker = "      - name: Block Vercel production promotion on migration drift"
        self.assertIn(marker, workflow)
        self.assertLess(workflow.index(marker), workflow.index("      - name: Pull Vercel production settings"))
        self.assertIn("python3 scripts/production-migration-gate.py", workflow)


if __name__ == "__main__":
    unittest.main()
