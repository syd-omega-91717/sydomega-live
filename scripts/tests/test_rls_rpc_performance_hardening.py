#!/usr/bin/env python3
"""Contract tests for the 2026-10-04 RLS/RPC hardening migration."""

from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20261004000807_rls_rpc_performance_hardening_20261004.sql"


class RlsRpcPerformanceHardeningTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION.read_text(encoding="utf-8")

    def test_migration_exists_and_is_transactional(self):
        self.assertTrue(MIGRATION.is_file())
        self.assertIn("begin;", self.sql.lower())
        self.assertIn("commit;", self.sql.lower())

    def test_application_rpcs_are_invoker(self):
        for signature in (
            "get_points_leaderboard(integer)",
            "set_perk_equipped(text, boolean)",
            "track_quest_progress(uuid, text, text, integer)",
        ):
            self.assertRegex(
                self.sql,
                re.compile(
                    rf"alter\s+function\s+public\.{re.escape(signature)}\s+security\s+invoker",
                    re.IGNORECASE | re.DOTALL,
                ),
                signature,
            )

    def test_application_rpcs_pin_search_path(self):
        self.assertEqual(
            self.sql.lower().count("set search_path = pg_catalog, public"),
            3,
        )

    def test_auth_uid_calls_use_init_plan_safe_select(self):
        self.assertNotRegex(
            self.sql,
            re.compile(r"\(\(auth\.uid\(\)", re.IGNORECASE),
        )
        self.assertGreaterEqual(
            self.sql.lower().count("(select auth.uid())"),
            8,
        )

    def test_seasonal_events_has_explicit_owner_writes(self):
        self.assertNotIn("seasonal_events_owner_all", self.sql)
        for action in ("insert", "update", "delete"):
            self.assertIn(f"seasonal_events_owner_{action}", self.sql)


if __name__ == "__main__":
    unittest.main()
