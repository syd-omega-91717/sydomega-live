#!/usr/bin/env python3
"""Regression contract for authenticated progression RPC abuse guardrails.

These checks ensure client-supplied task completions cannot submit unbounded
points or invalid axes and that per-member awards are serialized and rate
limited. They do not replace source-specific verification of claimed actions.
"""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION_PATH = ROOT / "supabase/migrations/20261016193000_progression_rpc_guardrails_20261016.sql"
PENDING_PATH = ROOT / "supabase/pending-migrations.json"


class ProgressionRpcGuardrailContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION_PATH.read_text(encoding="utf-8")
        cls.pending = json.loads(PENDING_PATH.read_text(encoding="utf-8"))

    def test_client_award_inputs_are_bounded(self):
        self.assertIn("MAX_POINTS_PER_CALL constant numeric := 0.12;", self.sql)
        self.assertIn("p_points is null or p_points < 0 or p_points > MAX_POINTS_PER_CALL", self.sql)
        self.assertIn("p_axis_type is null or p_axis_type not in ('a', 'b', 'c')", self.sql)
        self.assertIn("length(p_task_name) not between 1 and 160", self.sql)
        self.assertIn("length(p_task_type) not between 1 and 48", self.sql)
        self.assertIn("length(p_description) > 500", self.sql)

    def test_matrix_never_paints_optimistic_progress_after_rpc_failure(self):
        matrix = (ROOT / "omega-matrix.js").read_text(encoding="utf-8")
        self.assertIn("Progression is server-authoritative", matrix)
        self.assertIn("if(d.ok!==true)", matrix)
        self.assertIn("points:Number(d.points||0)", matrix)
        self.assertNotIn("Graceful offline fallback: update display optimistically", matrix)

    def test_progress_toast_uses_server_confirmed_delta(self):
        progress = (ROOT / "omega-progress.js").read_text(encoding="utf-8")
        self.assertIn("Number(d.points) > 0", progress)
        self.assertIn("toast(axis, opts.title, Number(d.points))", progress)

    def test_first_publication_award_respects_the_rpc_cap(self):
        publishing = (ROOT / "publishing.html").read_text(encoding="utf-8")
        self.assertIn("p_points:0.12", publishing)
        self.assertIn("Contribution axis advanced +0.12.", publishing)
        self.assertNotIn("p_points:0.25", publishing)

    def test_rolling_award_cap_is_serialized_and_indexed(self):
        self.assertIn("MAX_POINTS_PER_24H constant numeric := 0.30;", self.sql)
        self.assertIn("pg_advisory_xact_lock", self.sql)
        self.assertIn("completed_at >= now() - interval '24 hours'", self.sql)
        self.assertIn("progression_daily_cap_exceeded", self.sql)
        self.assertIn("task_completions_user_completed_at_points_idx", self.sql)
        self.assertIn("applied_points := greatest(0, new_v - old_v)", self.sql)
        self.assertIn("description, applied_points,", self.sql)
        self.assertIn("'points', applied_points", self.sql)

    def test_security_definer_search_path_stays_empty(self):
        self.assertIn("security definer\nset search_path = ''", self.sql)
        self.assertIn("source-specific verifiers remain required", self.sql)

    def test_migration_is_registered_as_not_applied_and_release_blocking(self):
        entries = [
            entry for entry in self.pending.get("pending", [])
            if entry.get("version") == "20261016193000"
        ]
        self.assertEqual(len(entries), 1)
        self.assertEqual(
            entries[0].get("file"),
            "20261016193000_progression_rpc_guardrails_20261016.sql",
        )
        self.assertEqual(entries[0].get("status"), "PENDING_REVIEW")
        self.assertEqual(entries[0].get("liveStatus"), "NOT_APPLIED")
        self.assertIs(entries[0].get("blocksProduction"), True)


if __name__ == "__main__":
    unittest.main()
