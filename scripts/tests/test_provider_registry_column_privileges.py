"""Static security contract for the provider registry's column privilege boundary."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20261024103000_harden_provider_registry_column_access.sql"
SOURCE = MIGRATION.read_text(encoding="utf-8")
LOWER = SOURCE.lower()


class ProviderRegistryColumnPrivilegeTests(unittest.TestCase):
    def test_table_level_select_is_revoked_before_column_allowlist(self):
        revoke = LOWER.index("revoke select on table public.omega_provider_registry from authenticated")
        grant = LOWER.index("grant select (")
        self.assertLess(revoke, grant)
        self.assertIn("on table public.omega_provider_registry to authenticated", LOWER[grant:])

    def test_secret_reference_is_not_in_authenticated_column_allowlist(self):
        grant = LOWER.index("grant select (")
        end = LOWER.index(") on table public.omega_provider_registry to authenticated", grant)
        columns = set(re.findall(r"\b[a-z_][a-z0-9_]*\b", LOWER[grant:end]))
        self.assertNotIn("secret_ref", columns)
        self.assertNotIn("metadata", columns)
        self.assertIn("provider_key", columns)
        self.assertIn("display_name", columns)
        self.assertIn("capabilities", columns)
        self.assertIn("status", columns)
        self.assertIn("revoke select (secret_ref, metadata)", LOWER)

    def test_migration_is_privilege_only_and_does_not_change_provider_state(self):
        self.assertNotRegex(LOWER, r"\b(insert|update|delete|truncate)\s+")
        self.assertIn("secret_ref", LOWER)
        self.assertIn("does not rewrite data", LOWER)


if __name__ == "__main__":
    unittest.main()
