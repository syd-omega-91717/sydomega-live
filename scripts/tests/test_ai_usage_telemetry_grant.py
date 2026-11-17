from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
MIGRATIONS = ROOT / "supabase" / "migrations"
SCHEMA = MIGRATIONS / "20261117002651_omega_ai_requests_service_role_insert_grant.sql"
TIGHTENING = MIGRATIONS / "20261117003721_omega_ai_requests_privilege_tightening.sql"


class AiUsageTelemetryGrantTests(unittest.TestCase):
    def test_fresh_replay_has_schema_before_grants(self):
        sql = SCHEMA.read_text(encoding="utf-8").lower()
        self.assertIn("create table if not exists public.omega_ai_requests", sql)
        for column in (
            "request_id uuid not null",
            "agent_id text not null",
            "prompt_version text not null",
            "task text not null",
            "risk text not null",
            "provider text",
            "model text",
            "input_tokens integer",
            "output_tokens integer",
            "estimated_cost numeric(18,8)",
            "latency_ms integer",
            "citations jsonb",
            "evaluation jsonb",
            "trace_id text",
            "created_at timestamptz",
            "completed_at timestamptz",
        ):
            self.assertIn(column, sql)
        self.assertIn("omega_ai_requests_request_id_key", sql)
        self.assertIn("omega_ai_requests_risk_check", sql)
        self.assertIn("omega_ai_requests_status_check", sql)
        self.assertIn("omega_ai_requests_agent_idx", sql)
        self.assertIn("omega_ai_requests_status_idx", sql)

    def test_rls_and_deny_policy_are_preserved(self):
        sql = SCHEMA.read_text(encoding="utf-8").lower()
        self.assertIn("enable row level security", sql)
        self.assertIn("omega_deny_by_default", sql)
        self.assertIn("using (false)", sql)
        self.assertIn("with check (false)", sql)
        self.assertNotIn("disable row level security", sql)

    def test_service_role_has_insert_only_and_clients_have_no_table_privileges(self):
        sql = TIGHTENING.read_text(encoding="utf-8").lower()
        self.assertIn(
            "revoke all privileges on table public.omega_ai_requests from anon, authenticated, service_role",
            sql,
        )
        self.assertIn(
            "grant insert on table public.omega_ai_requests to service_role",
            sql,
        )
        self.assertIn("omega_ai_requests_service_role_privilege_too_broad", sql)
        self.assertIn("omega_ai_requests_client_privilege_must_remain_denied", sql)
        self.assertIn("omega_ai_requests_rls_must_remain_enabled", sql)
        self.assertIn("omega_ai_requests_client_deny_policy_missing", sql)
        for privilege in ("SELECT", "UPDATE", "DELETE", "TRUNCATE", "REFERENCES", "TRIGGER", "MAINTAIN"):
            self.assertIn(f"'{privilege}'", sql)

    def test_no_client_grant_or_privilege_expansion(self):
        for path in (SCHEMA, TIGHTENING):
            sql = path.read_text(encoding="utf-8").lower()
            self.assertNotIn("grant all", sql)
            self.assertNotIn("grant select", sql)
            self.assertNotIn("grant update", sql)
            self.assertNotIn("grant delete", sql)
            self.assertNotIn("to public", sql)
            self.assertNotIn("disable row level security", sql)


if __name__ == "__main__":
    unittest.main()
