#!/usr/bin/env python3
"""Static safety contract for the Ω Personal Context Graph foundation."""
from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[2]


class PersonalContextGraphContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.migration = (ROOT / "supabase/migrations/20261022120000_omega_personal_context_graph_20261022.sql").read_text()
        cls.client = (ROOT / "omega-personal-context.js").read_text()
        cls.life = (ROOT / "life.html").read_text()
        cls.intelligence = (ROOT / "intelligence.html").read_text()
        cls.navigation = (ROOT / "nav.js").read_text()
        cls.pending = json.loads((ROOT / "supabase/pending-migrations.json").read_text())
        cls.remote = json.loads((ROOT / "supabase/remote-migrations.json").read_text())

    def test_all_personal_tables_are_rls_protected(self):
        for table in (
            "omega_personal_context_preferences",
            "omega_personal_context_consent_events",
            "omega_personal_context_items",
            "omega_personal_context_links",
        ):
            self.assertIn(f"ALTER TABLE public.{table} ENABLE ROW LEVEL SECURITY", self.migration)
            self.assertIn(f"ON public.{table} FOR SELECT TO authenticated", self.migration)

    def test_item_consent_is_opt_in_and_revocation_is_durable(self):
        self.assertIn("ai_processing_allowed boolean NOT NULL DEFAULT false", self.migration)
        self.assertIn("sensitive_data_processing_enabled boolean NOT NULL DEFAULT false", self.migration)
        self.assertIn("personal_context_ai_opt_in_required", self.migration)
        self.assertIn("personal_context_sensitive_opt_in_required", self.migration)
        self.assertIn("clears every item-level", self.migration)
        self.assertGreaterEqual(self.migration.count("SET ai_processing_allowed = false, ai_consent_at = NULL"), 2)
        self.assertIn("OLD.sensitive_data_processing_enabled", self.migration)
        self.assertNotIn("omega_personal_context_preferences FOR DELETE", self.migration)

    def test_member_links_cannot_cross_user_boundaries(self):
        self.assertIn("FOREIGN KEY (from_item_id, user_id)", self.migration)
        self.assertIn("FOREIGN KEY (to_item_id, user_id)", self.migration)
        self.assertIn("REFERENCES public.omega_personal_context_items(id, user_id)", self.migration)

    def test_no_public_ai_provider_or_untrusted_html_rendering(self):
        self.assertNotIn("SECURITY DEFINER", self.migration.upper())
        self.assertNotIn("innerHTML", self.client)
        self.assertNotIn("localStorage", self.client)
        self.assertNotIn("fetch(", self.client)
        self.assertNotIn("getAiEligibleContext:getAiEligibleContext", self.client)
        self.assertIn("listMetadata:function()", self.client)
        self.assertIn("var summaryOnly=!root&&!!summary", self.client)
        self.assertIn("itemColumns=summaryOnly?", self.client)
        self.assertIn("ai analysis", self.life.lower())

    def test_import_limits_and_explicit_save_are_present(self):
        self.assertIn("MAX_FILE_BYTES=1000000", self.client)
        self.assertIn("MAX_CONTENT_CHARS=200000", self.client)
        self.assertIn("Nothing is saved until you press SAVE PERSONAL CONTEXT", self.client)
        self.assertIn("JSON.parse(content)", self.client)
        self.assertIn("consentEvents:results[2]", self.client)
        self.assertIn("fetchAllForExport", self.client)
        self.assertIn("export_size_limit", self.client)
        self.assertIn("exportComplete:true", self.client)
        self.assertIn("preferencesExists", self.client)
        self.assertNotIn(".upsert(", self.client)

    def test_cross_surface_links_and_change_event_exist(self):
        self.assertIn('id="personal-context"', self.life)
        for task in ("personal-context.export", "personal-context.import", "personal-context.save", "personal-context.cancel-edit", "personal-context.link"):
            self.assertIn(f'data-omega-task-id="{task}"', self.life)
        self.assertIn('id="omega-personal-context-summary"', self.intelligence)
        self.assertIn("omega:personal-context:changed", self.client)
        self.assertIn("PERSONAL CONTEXT", self.navigation)

    def test_migration_matches_provider_verified_live_history(self):
        version = "20261022120000"
        versions = self.remote.get("versions", [])
        self.assertIn(version, versions)
        self.assertEqual(self.remote.get("latestRemoteMigration"), versions[-1])
        self.assertEqual(self.remote.get("remoteMigrationCount"), len(versions))
        match = [x for x in self.remote.get("migrations", []) if str(x.get("version")) == version]
        self.assertEqual(len(match), 1)
        self.assertEqual(match[0].get("name"), "omega_personal_context_graph_20261022")
        self.assertFalse(any(str(x.get("version")) == version for x in self.pending.get("pending", [])))


if __name__ == "__main__":
    unittest.main()
