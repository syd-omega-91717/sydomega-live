#!/usr/bin/env python3
"""Security and truth contract for aggregate-only dashboard metrics."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase" / "migrations" / "20261126195000_omega_dashboard_public_metrics.sql"


class DashboardPublicMetricsRpcContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION.read_text(encoding="utf-8")

    def test_private_implementation_is_stable_security_definer_with_fixed_search_path(self):
        self.assertRegex(
            self.sql,
            r"(?s)create or replace function private\.omega_dashboard_public_metrics\(\).*?"
            r"returns jsonb\s+language plpgsql\s+stable\s+security definer\s+set search_path = ''",
        )

    def test_authentication_is_required(self):
        self.assertIn("uid uuid := (select auth.uid())", self.sql)
        self.assertIn("'not_authenticated'", self.sql)
        self.assertLess(self.sql.index("if uid is null"), self.sql.index("'approved_members'"))

    def test_only_aggregate_counts_are_returned(self):
        for key in ("approved_members", "online_members", "tasks_today", "tasks_7d", "events_today"):
            self.assertIn("'%s'" % key, self.sql)
        self.assertIn("count(distinct mp.user_id)", self.sql)
        self.assertNotRegex(self.sql, r"jsonb_build_object\([^;]*(?:'email'|'display_name'|'user_id'|'event_data'|'metadata')")

    def test_all_sources_are_explicitly_qualified(self):
        for table in ("public.profiles", "public.member_presence", "public.task_completions", "public.platform_events"):
            self.assertIn(table, self.sql)

    def test_public_wrapper_is_security_invoker(self):
        self.assertRegex(
            self.sql,
            r"(?s)create or replace function public\.omega_dashboard_public_metrics\(\).*?"
            r"returns jsonb\s+language sql\s+stable\s+security invoker\s+set search_path = ''",
        )
        self.assertIn("select private.omega_dashboard_public_metrics()", self.sql)

    def test_execute_is_authenticated_only(self):
        for signature in ("private.omega_dashboard_public_metrics()", "public.omega_dashboard_public_metrics()"):
            self.assertIn("revoke all on function %s from public, anon" % signature, self.sql)
        self.assertIn("grant execute on function private.omega_dashboard_public_metrics() to authenticated", self.sql)
        self.assertIn("grant execute on function public.omega_dashboard_public_metrics() to authenticated", self.sql)


if __name__ == "__main__":
    unittest.main()
