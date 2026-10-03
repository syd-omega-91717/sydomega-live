from __future__ import annotations

import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20261003085246_omega_graphify_find_contradictions_20261003.sql"
HARDENING = ROOT / "supabase/migrations/20261003085318_omega_graphify_find_contradictions_search_path_20261003.sql"
EDGE = ROOT / "supabase/functions/graphify-ai-query/index.ts"
REFERENCE = ROOT / "supabase/omega_graphify_find_contradictions_fix.sql"


class GraphContradictionsContract(unittest.TestCase):
    def test_migrations_define_invoker_function_and_pin_search_path(self):
        for path in (MIGRATION, HARDENING):
            sql = path.read_text(encoding="utf-8")
            self.assertIn("CREATE OR REPLACE FUNCTION public.find_contradictions(p_user_id uuid)", sql)
            self.assertIn("SECURITY INVOKER", sql)
            self.assertIn("SET search_path = pg_catalog, public", sql)
            self.assertIn("REVOKE ALL ON FUNCTION public.find_contradictions(uuid) FROM PUBLIC", sql)
            self.assertIn("GRANT EXECUTE ON FUNCTION public.find_contradictions(uuid) TO authenticated", sql)

    def test_edge_function_calls_the_rpc_without_silent_success_path(self):
    def test_edge_function_calls_the_rpc_without_silent_missing_function_path(self):
        source = EDGE.read_text(encoding="utf-8")
        self.assertIn('rpc("find_contradictions"', source)
        self.assertNotIn("function may not exist", source)

    def test_reference_sql_matches_security_boundary(self):
        sql = REFERENCE.read_text(encoding="utf-8")
        self.assertIn("SECURITY INVOKER", sql)
        self.assertIn("SET search_path = pg_catalog, public", sql)
        self.assertNotIn("SECURITY DEFINER", sql)


if __name__ == "__main__":
    unittest.main()
