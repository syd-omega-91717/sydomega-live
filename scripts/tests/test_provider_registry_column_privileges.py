"""Security contract for the provider registry's column privilege boundary."""
import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
CREATION_STUDIO = (ROOT / "omega-creation-studio.js").read_text(encoding="utf-8")
# Live history records the same privilege-only migration under three versions
# (supabase_migrations.schema_migrations, 2026-10-24). Each applied version keeps
# its source file, so every copy must hold the same boundary.
VERSIONS = ("20261024101622", "20261024102602", "20261024103000")
MIGRATIONS = {
    v: ROOT / f"supabase/migrations/{v}_harden_provider_registry_column_access.sql" for v in VERSIONS
}
REMOTE = ROOT / "supabase/remote-migrations.json"
PENDING = ROOT / "supabase/pending-migrations.json"
ALLOWLIST = {"id", "provider_key", "display_name", "adapter_kind", "capabilities", "status"}
SERVER_ONLY = {"secret_ref", "metadata", "created_at", "updated_at"}


def allowlisted_columns(lower):
    grant = lower.index("grant select (")
    end = lower.index(") on table public.omega_provider_registry to authenticated", grant)
    return set(re.findall(r"\b[a-z_][a-z0-9_]*\b", lower[grant:end])) - {"grant", "select"}


class ProviderRegistryColumnPrivilegeTests(unittest.TestCase):
    def sources(self):
        for version, path in MIGRATIONS.items():
            yield version, path.read_text(encoding="utf-8").lower()

    def test_table_level_select_is_revoked_before_column_allowlist(self):
        for version, lower in self.sources():
            with self.subTest(version=version):
                revoke = lower.index("revoke select on table public.omega_provider_registry from authenticated")
                grant = lower.index("grant select (")
                self.assertLess(revoke, grant)

    def test_secret_reference_is_not_in_authenticated_column_allowlist(self):
        for version, lower in self.sources():
            with self.subTest(version=version):
                columns = allowlisted_columns(lower)
                self.assertEqual(columns, ALLOWLIST)
                self.assertTrue(columns.isdisjoint(SERVER_ONLY))

    def test_every_non_allowlisted_authenticated_column_is_revoked(self):
        for version, lower in self.sources():
            with self.subTest(version=version):
                self.assertIn(
                    "revoke select (secret_ref, metadata, created_at, updated_at) "
                    "on table public.omega_provider_registry from authenticated",
                    lower,
                )

    def test_migration_is_privilege_only_and_does_not_change_provider_state(self):
        for version, lower in self.sources():
            with self.subTest(version=version):
                self.assertNotRegex(lower, r"\b(insert|update|delete|truncate)\s+")
                self.assertRegex(lower, r"does not rewrite (application )?data")

    def test_creation_studio_requests_only_allowlisted_provider_fields(self):
        match = re.search(r"from\('omega_provider_registry'\)\.select\('([^']+)'\)", CREATION_STUDIO)
        self.assertIsNotNone(match, "creation studio must use an explicit provider field list")
        fields = {field.strip() for field in match.group(1).split(",")}
        self.assertEqual(fields, ALLOWLIST)

    def test_provider_migration_history_snapshot_is_internally_consistent(self):
        remote = json.loads(REMOTE.read_text(encoding="utf-8"))
        pending = json.loads(PENDING.read_text(encoding="utf-8")).get("pending", [])
        versions = [str(v) for v in remote["versions"]]
        migration_versions = {str(item["version"]) for item in remote["migrations"]}
        pending_versions = {str(item["version"]) for item in pending}

        self.assertEqual(len(versions), len(set(versions)), "remote versions must be unique")
        self.assertEqual(remote["remoteMigrationCount"], len(versions))
        self.assertEqual(set(versions), migration_versions)
        self.assertEqual(remote["latestRemoteMigration"], max(versions))
        for version in ("20261024091500",) + VERSIONS:
            self.assertIn(version, versions)
            self.assertNotIn(version, pending_versions)
        self.assertTrue(set(versions).isdisjoint(pending_versions), "a version is either applied or pending")


if __name__ == "__main__":
    unittest.main()
