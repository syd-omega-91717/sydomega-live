#!/usr/bin/env python3
"""Regression contract for trigger-only personal-context consent audit writes."""
from __future__ import annotations

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20261022130000_harden_personal_context_consent_audit_20261022.sql"
REMOTE = ROOT / "supabase/remote-migrations.json"
PENDING = ROOT / "supabase/pending-migrations.json"
WORKFLOW = ROOT / ".github/workflows/supabase-controlled-migration-push.yml"


class PersonalContextConsentAuditContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.sql = MIGRATION.read_text(encoding="utf-8")
        cls.remote = json.loads(REMOTE.read_text(encoding="utf-8"))
        cls.pending = json.loads(PENDING.read_text(encoding="utf-8"))

    def test_trigger_function_uses_narrow_security_definer_boundary(self):
        lowered = self.sql.lower()
        self.assertIn(
            "create or replace function omega_private.omega_personal_context_log_consent()",
            lowered,
        )
        self.assertIn("security definer\nset search_path = ''", lowered)
        self.assertIn("revoke all on function omega_private.omega_personal_context_log_consent()", lowered)
        self.assertIn("where user_id = new.user_id", lowered)
        self.assertIn("auth.uid() is not null and auth.uid() is distinct from new.user_id", lowered)
        self.assertIn("consent audit actor does not match preference owner", lowered)
        self.assertIn("public.omega_personal_context_items", lowered)
        self.assertIn("public.omega_personal_context_consent_events", lowered)

    def test_clients_cannot_insert_consent_events_directly(self):
        lowered = self.sql.lower()
        self.assertIn(
            "drop policy if exists omega_personal_context_consent_events_insert_own",
            lowered,
        )
        self.assertIn(
            "revoke insert on table public.omega_personal_context_consent_events",
            lowered,
        )
        self.assertIn("from public, anon, authenticated, service_role", lowered)
        self.assertIn(
            "grant select on table public.omega_personal_context_consent_events to authenticated",
            lowered,
        )
        self.assertNotIn(
            "grant insert on table public.omega_personal_context_consent_events",
            lowered,
        )

    def test_migration_is_recorded_as_applied_after_live_provider_verification(self):
        version = "20261022130000"
        entries = [
            item for item in self.pending.get("pending", [])
            if str(item.get("version")) == version
        ]
        self.assertEqual(entries, [])
        versions = self.remote.get("versions", [])
        self.assertIn(version, versions)
        self.assertEqual(self.remote.get("latestRemoteMigration"), versions[-1])
        self.assertEqual(self.remote.get("remoteMigrationCount"), len(versions))

    def test_production_push_workflow_is_manual_and_fails_closed(self):
        workflow = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:", workflow)
        self.assertNotIn("\n  push:", workflow)
        self.assertNotIn("\n  pull_request:", workflow)
        self.assertIn("if: github.ref == 'refs/heads/main'", workflow)
        self.assertIn("CONFIRM_PRODUCTION_APPLY", workflow)
        self.assertIn("supabase db push --dry-run --linked", workflow)
        self.assertIn('version != "20261022130000"', workflow)
        self.assertIn("auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM NEW.user_id", workflow)
        self.assertIn("if mismatches != [(version, None)]", workflow)
        self.assertIn("supabase db push --linked --yes", workflow)
        self.assertIn("supabase migration list --linked", workflow)


if __name__ == "__main__":
    unittest.main()
