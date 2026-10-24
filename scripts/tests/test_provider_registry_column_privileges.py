"""Static security contract for the provider registry's column privilege boundary."""
"""Security contract for the provider registry's column privilege boundary."""
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
CREATION_STUDIO = (ROOT / "omega-creation-studio.js").read_text(encoding="utf-8")
MIGRATION = ROOT / "supabase/migrations/20261024103000_harden_provider_registry_column_access.sql"
MIGRATION = ROOT / "supabase/migrations/20261024101622_harden_provider_registry_column_access.sql"
CREATION_STUDIO = (ROOT / "omega-creation-studio.js").read_text(encoding="utf-8")
MIGRATION = ROOT / "supabase/migrations/20261024102602_harden_provider_registry_column_access.sql"
REMOTE = ROOT / "supabase/remote-migrations.json"
PENDING = ROOT / "supabase/pending-migrations.json"
SOURCE = MIGRATION.read_text(encoding="utf-8")
LOWER = SOURCE.lower()


class ProviderRegistryColumnPrivilegeTests(unittest.TestCase):
    def test_table_level_select_is_revoked_before_column_allowlist(self):
        revoke = LOWER.index("revoke select on table public.omega_provider_registry from authenticated")
        grant = LOWER.index("grant select (")
        self.assertLess(revoke, grant)
        self.assertIn("on table public.omega_provider_registry to authenticated", LOWER[grant:])

    def test_every_non_allowlisted_authenticated_column_is_revoked(self):
        grant = LOWER.index("grant select (")
        end = LOWER.index(") on table public.omega_provider_registry to authenticated", grant)
        columns = set(re.findall(r"\\b[a-z_][a-z0-9_]*\\b", LOWER[grant:end]))
        columns = set(re.findall(r"\b[a-z_][a-z0-9_]*\b", LOWER[grant:end]))
        self.assertEqual(
            columns - {"grant", "select"},
            {"id", "provider_key", "display_name", "adapter_kind", "capabilities", "status"},
        )
        self.assertIn(
            "revoke select (secret_ref, metadata, created_at, updated_at) on table public.omega_provider_registry from authenticated",
            LOWER,
        )
        self.assertIn("revoke select on table public.omega_provider_registry from authenticated", LOWER)

    def test_creation_studio_requests_only_allowlisted_provider_fields(self):
        match = re.search(
            r"from\\('omega_provider_registry'\\)\\.select\\('([^']+)'\\)",
            r"from\('omega_provider_registry'\)\.select\('([^']+)'\)",
            CREATION_STUDIO,
        )
        self.assertIsNotNone(match, "creation studio must use an explicit provider field list")
        fields = {field.strip() for field in match.group(1).split(",")}
        self.assertEqual(
            fields,
            {"id", "provider_key", "display_name", "adapter_kind", "capabilities", "status"},
        )
        self.assertTrue(fields.isdisjoint({"secret_ref", "metadata", "created_at", "updated_at"}))

    def test_migration_is_privilege_only_and_does_not_change_provider_state(self):
        self.assertNotRegex(LOWER, r"\\b(insert|update|delete|truncate)\\s+")
        self.assertIn("secret_ref", LOWER)
        self.assertIn("does not rewrite data", LOWER)
    def test_provider_migration_history_snapshot_is_internally_consistent(self):
        remote = json.loads(REMOTE.read_text(encoding="utf-8"))
        pending = json.loads(PENDING.read_text(encoding="utf-8")).get("pending", [])
        versions = {str(version) for version in remote["versions"]}
        migration_versions = {str(item["version"]) for item in remote["migrations"]}
        pending_versions = {str(item["version"]) for item in pending}

        self.assertIn("20261024091500", versions)
        self.assertIn("20261024102602", versions)
        self.assertEqual(remote["remoteMigrationCount"], len(versions))
        self.assertEqual(versions, migration_versions)
        self.assertEqual(remote["latestRemoteMigration"], "20261024102602")
        self.assertNotIn("20261024091500", pending_versions)
        self.assertNotIn("20261024102602", pending_versions)

    def test_migration_is_privilege_only_and_does_not_change_provider_state(self):
        self.assertNotRegex(LOWER, r"\b(insert|update|delete|truncate)\s+")
        self.assertIn("secret_ref", LOWER)
        self.assertIn("does not rewrite application data", LOWER)


if __name__ == "__main__":
    unittest.main()
