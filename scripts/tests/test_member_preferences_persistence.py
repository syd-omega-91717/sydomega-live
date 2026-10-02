from __future__ import annotations

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20261002180500_member_preferences_persistence_20261002.sql"
PROFILE = ROOT / "profile.html"


class MemberPreferencesPersistenceContract(unittest.TestCase):
    def test_migration_is_rls_owned_and_rpc_backed(self):
        sql = MIGRATION.read_text(encoding="utf-8")
        self.assertIn("CREATE TABLE IF NOT EXISTS public.member_preferences", sql)
        self.assertIn("ALTER TABLE public.member_preferences ENABLE ROW LEVEL SECURITY", sql)
        self.assertIn('"member_preferences_select_own"', sql)
        self.assertIn('"member_preferences_insert_own"', sql)
        self.assertIn('"member_preferences_update_own"', sql)
        self.assertIn("CREATE OR REPLACE FUNCTION public.get_member_preferences()", sql)
        self.assertIn("CREATE OR REPLACE FUNCTION public.set_member_preferences(", sql)
        self.assertIn("(select auth.uid())", sql)
        self.assertIn("GRANT EXECUTE ON FUNCTION public.get_member_preferences()", sql)
        self.assertIn("GRANT EXECUTE ON FUNCTION public.set_member_preferences(", sql)
        self.assertIn("REVOKE ALL ON FUNCTION public.get_member_preferences() FROM anon", sql)

    def test_profile_uses_persistent_rpc_instead_of_local_only_settings(self):
        html = PROFILE.read_text(encoding="utf-8")
        self.assertIn("get_member_preferences", html)
        self.assertIn("set_member_preferences", html)
        self.assertIn("preferencePayload", html)
        self.assertIn("loadMemberPreferences", html)
        self.assertIn("saveMemberPreferences", html)
        self.assertNotIn("not yet backed by persistent storage", html)

    def test_all_declared_member_settings_have_persistence_keys(self):
        html = PROFILE.read_text(encoding="utf-8")
        expected = (
            "Dark Mode", "Compact Layout", "Animations", "Cursor Trail",
            "Anonymous Mode", "Matrix Milestone Alerts", "Agent Messages",
            "Daily Oracle", "Economic Events", "Ambient Frequency",
            "Click Sounds", "Oracle Voice",
        )
        for label in expected:
            self.assertRegex(html, rf"'{re.escape(label)}':\s*'[_a-z]+'")


if __name__ == "__main__":
    unittest.main()
