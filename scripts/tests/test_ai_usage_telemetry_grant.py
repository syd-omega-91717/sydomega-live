from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20261117002651_omega_ai_requests_service_role_insert_grant.sql"


class AiUsageTelemetryGrantTests(unittest.TestCase):
    def test_grants_only_insert_to_service_role(self):
        sql = MIGRATION.read_text(encoding="utf-8").lower()
        self.assertIn("grant insert on table public.omega_ai_requests to service_role", sql)
        self.assertIn("has_table_privilege('service_role', 'public.omega_ai_requests', 'insert')", sql)
        self.assertIn("omega_ai_requests_service_role_privilege_too_broad", sql)
        self.assertIn("omega_ai_requests_client_insert_must_remain_denied", sql)
        self.assertNotIn("grant select", sql)
        self.assertNotIn("grant update", sql)
        self.assertNotIn("grant delete", sql)
        self.assertNotIn("grant all", sql)

    def test_migration_does_not_disable_rls_or_add_client_policy(self):
        sql = MIGRATION.read_text(encoding="utf-8").lower()
        self.assertNotIn("disable row level security", sql)
        self.assertNotIn("create policy", sql)
        self.assertNotIn("to anon", sql)
        self.assertNotIn("to authenticated", sql)


if __name__ == "__main__":
    unittest.main()
