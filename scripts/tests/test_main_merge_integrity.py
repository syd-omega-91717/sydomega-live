#!/usr/bin/env python3
"""Regression tests for the 2026-11-12 parallel-merge artifact corruption."""
from __future__ import annotations

import ast
import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class MainMergeIntegrityTests(unittest.TestCase):
    def test_internal_runtime_snapshots_are_valid_json(self) -> None:
        paths = (
            ROOT / "config/omega-live-module-runtime-observations.json",
            ROOT / "supabase/pending-migrations.json",
            ROOT / "docs/runtime/supabase-edge-functions-live.json",
        )
        for path in paths:
            with self.subTest(path=path.relative_to(ROOT).as_posix()):
                json.loads(path.read_text(encoding="utf-8"))

    def test_runtime_dispatch_evidence_separates_branch_coverage_from_behavior(self) -> None:
        snapshot = json.loads((ROOT / "config/omega-live-module-runtime-observations.json").read_text(encoding="utf-8"))
        drift = snapshot["runtime_dispatch_drift"]
        self.assertEqual(drift["live_dispatcher_covered_actions"], 54)
        self.assertEqual(drift["live_dispatcher_missing_actions"], 0)
        self.assertIn("BEHAVIORAL_PROBES_PASS", drift["status"])
        self.assertEqual(snapshot["runtime_probe_status"]["status"], "PASS_DATABASE_AND_BEHAVIORAL_VERIFICATION")

    def test_pending_registry_contains_only_unapplied_source_migrations(self) -> None:
        remote = json.loads((ROOT / "supabase/remote-migrations.json").read_text(encoding="utf-8"))
        pending = json.loads((ROOT / "supabase/pending-migrations.json").read_text(encoding="utf-8"))
        remote_versions = set(remote.get("versions", []))
        entries = pending.get("pending", [])
        self.assertEqual(entries, [], "provider ledger and source migration inventory must be fully reconciled")
        for entry in entries:
            with self.subTest(version=entry.get("version")):
                self.assertNotIn(entry.get("version"), remote_versions)
                self.assertEqual(entry.get("status"), "PENDING_REVIEW")
                self.assertEqual(entry.get("liveStatus"), "NOT_APPLIED")
                self.assertIs(entry.get("blocksProduction"), True)
                self.assertTrue((ROOT / "supabase/migrations" / entry["file"]).is_file())

    def test_production_smoke_uses_one_validated_request_path(self) -> None:
        source = (ROOT / "scripts/cloudflare-production-smoke.py").read_text(encoding="utf-8")
        self.assertEqual(source.count("def request_url("), 1)
        self.assertIn("safe_url = validate_request_url(url)", source)
        self.assertNotIn("urlopen", source)
        self.assertNotIn("from urllib.request", source)

    def test_adapter_contract_combines_all_dispatcher_sql_sources(self) -> None:
        source = (ROOT / "scripts/omega-runtime-adapter-coverage-contract.py").read_text(encoding="utf-8")
        self.assertEqual(source.count("all_sql = "), 1)
        self.assertIn('dispatcher_sql = "\\n".join((search_index_sql, consultancy_compat_sql))', source)
        self.assertIn("expert_bookings_sql,", source)
        self.assertIn("consultancy_schema_sql,", source)
        self.assertNotIn("consultancy_compat_sql,\n            re.IGNORECASE", source)

    def test_ci_workflow_steps_do_not_duplicate_shell_or_run_keys(self) -> None:
        source = (ROOT / ".github/workflows/ci.yml").read_text(encoding="utf-8")
        blocks = source.split("      - name: ")
        for block in blocks[1:]:
            name = block.splitlines()[0].strip()
            shell_keys = [line for line in block.splitlines() if line.startswith("        shell:")]
            run_keys = [line for line in block.splitlines() if line.startswith("        run:")]
            self.assertLessEqual(len(shell_keys), 1, f"{name}: duplicate shell keys")
            self.assertLessEqual(len(run_keys), 1, f"{name}: duplicate run keys")
        credential_step = next(block for block in blocks if block.startswith("Client credential scan"))
        self.assertIn("scripts/client-credential-scan.py", credential_step)
        self.assertIn("no service-role credential marker in client code", credential_step)

    def test_repaired_python_contracts_parse(self) -> None:
        for relative in (
            "scripts/cloudflare-production-smoke.py",
            "scripts/omega-runtime-adapter-coverage-contract.py",
        ):
            with self.subTest(path=relative):
                ast.parse((ROOT / relative).read_text(encoding="utf-8"), filename=relative)


if __name__ == "__main__":
    unittest.main()
