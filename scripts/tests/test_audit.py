#!/usr/bin/env python3
"""
Unit/regression tests for scripts/audit.py — the CI-gating repository
integrity check (module graph, RLS coverage, schema-reference sanity).

audit.py is a top-level script (not a library of functions) that always
resolves its own ROOT from `__file__` and `os.chdir()`s there, so it can't
be `import`ed and pointed at a fixture directory directly. These tests
instead build small throwaway repo fixtures on disk, copy the real script
into <fixture>/scripts/audit.py (so its own ROOT resolution lands on the
fixture), and run it as a subprocess exactly the way CI does — asserting on
exit code and the printed report. This is black-box, but it is testing the
actual gate CI runs, not a refactored stand-in for it.

Run: python3 -m unittest scripts/tests/test_audit.py -v
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
AUDIT_SRC = os.path.join(ROOT, "scripts", "audit.py")


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class AuditFixture:
    """A minimal throwaway repo the real audit.py can run against."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="omega-audit-test-")
        shutil.copy(AUDIT_SRC, os.path.join(self.dir, "_audit_copy.py"))
        os.makedirs(os.path.join(self.dir, "scripts"))
        shutil.move(
            os.path.join(self.dir, "_audit_copy.py"),
            os.path.join(self.dir, "scripts", "audit.py"),
        )
        # Baseline: a bg.js/nav.js pair and a .vercelignore so checks 1/2/5
        # have something sane to look at even in tests that only care about
        # a different section.
        write(os.path.join(self.dir, "bg.js"), "// bg\n")
        write(os.path.join(self.dir, "nav.js"), "// nav\n")
        write(os.path.join(self.dir, ".vercelignore"), "*.docx\n")

    def write(self, relpath, content):
        write(os.path.join(self.dir, relpath), content)

    def run(self):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "audit.py")],
            cwd=self.dir,
            capture_output=True,
            text=True,
        )
        return r.returncode, r.stdout

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class ModuleGraphTests(unittest.TestCase):
    def setUp(self):
        self.fx = AuditFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_all_referenced_modules_present_passes(self):
        self.fx.write("bg.js", "var s=document.createElement('script');s.src='/omega-real.js';document.head.appendChild(s);")
        self.fx.write("omega-real.js", "// exists\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK — every requested module exists.", out)

    def test_missing_injected_module_is_critical(self):
        self.fx.write("bg.js", "var s=document.createElement('script');s.src='/omega-ghost.js';document.head.appendChild(s);")
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("CRITICAL", out)
        self.assertIn("omega-ghost.js", out)

    def test_orphaned_module_is_a_warning_not_critical(self):
        # On disk, but nothing injects it or references it in a <script> tag.
        self.fx.write("omega-orphan.js", "// never loaded\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)  # warnings don't fail the build
        self.assertIn("WARNING — on disk but never loaded", out)
        self.assertIn("omega-orphan.js", out)


class RLSCoverageTests(unittest.TestCase):
    def setUp(self):
        self.fx = AuditFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_table_without_rls_is_critical(self):
        self.fx.write(
            "supabase/no_rls.sql",
            "CREATE TABLE IF NOT EXISTS public.exposed_table(id uuid PRIMARY KEY);\n",
        )
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("CRITICAL — no ENABLE ROW LEVEL SECURITY", out)
        self.assertIn("exposed_table", out)

    def test_table_with_rls_passes(self):
        self.fx.write(
            "supabase/safe.sql",
            "CREATE TABLE IF NOT EXISTS public.safe_table(id uuid PRIMARY KEY);\n"
            "ALTER TABLE public.safe_table ENABLE ROW LEVEL SECURITY;\n"
            "CREATE POLICY \"owner only\" ON public.safe_table FOR SELECT USING (true);\n",
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("no ENABLE ROW LEVEL SECURITY", out)


class DuplicateTableTests(unittest.TestCase):
    def setUp(self):
        self.fx = AuditFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_identical_duplicate_definitions_are_low_risk_bucket(self):
        body = "CREATE TABLE IF NOT EXISTS public.dupe(id uuid PRIMARY KEY, note text);\nALTER TABLE public.dupe ENABLE ROW LEVEL SECURITY;\n"
        self.fx.write("supabase/a.sql", body)
        self.fx.write("supabase/b.sql", body)
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("byte-identical copy-paste, zero live-behavior risk", out)
        self.assertNotIn("CONFLICTING (1)", out)

    def test_conflicting_duplicate_definitions_are_flagged(self):
        self.fx.write(
            "supabase/a.sql",
            "CREATE TABLE IF NOT EXISTS public.dupe(id uuid PRIMARY KEY, note text);\n"
            "ALTER TABLE public.dupe ENABLE ROW LEVEL SECURITY;\n",
        )
        self.fx.write(
            "supabase/b.sql",
            "CREATE TABLE IF NOT EXISTS public.dupe(id uuid PRIMARY KEY, note text, extra_column text);\n"
            "ALTER TABLE public.dupe ENABLE ROW LEVEL SECURITY;\n",
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)  # still just a warning
        self.assertIn("CONFLICTING (1)", out)
        self.assertIn("dupe:", out)


class ClientSchemaReferenceTests(unittest.TestCase):
    def setUp(self):
        self.fx = AuditFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_from_call_on_real_table_is_clean(self):
        self.fx.write(
            "supabase/t.sql",
            "CREATE TABLE IF NOT EXISTS public.real_table(id uuid PRIMARY KEY);\n"
            "ALTER TABLE public.real_table ENABLE ROW LEVEL SECURITY;\n",
        )
        self.fx.write("page.html", "<script>sb.from('real_table').select('*');</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("never CREATE TABLE'd", out)

    def test_from_call_on_nonexistent_table_is_warned(self):
        self.fx.write("page.html", "<script>sb.from('ghost_table').select('*');</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 0)  # this class of finding is a warning, not critical
        self.assertIn("never CREATE TABLE'd/VIEW'd", out)
        self.assertIn("ghost_table", out)
        self.assertIn("page.html", out)


class DivergingRPCTests(unittest.TestCase):
    def setUp(self):
        self.fx = AuditFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_single_definition_rpc_is_clean(self):
        self.fx.write(
            "supabase/fn.sql",
            "CREATE OR REPLACE FUNCTION public.do_thing(p_x int) RETURNS void AS $$\n"
            "BEGIN\n  NULL;\nEND;\n$$ LANGUAGE plpgsql;\n",
        )
        self.fx.write("page.html", "<script>sb.rpc('do_thing',{p_x:1});</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK — every client-called RPC has one consistent definition.", out)

    def test_diverging_bodies_for_client_called_rpc_is_warned(self):
        self.fx.write(
            "supabase/fn_old.sql",
            "CREATE OR REPLACE FUNCTION public.do_thing(p_x int) RETURNS void AS $$\n"
            "BEGIN\n  NULL;\nEND;\n$$ LANGUAGE plpgsql;\n",
        )
        self.fx.write(
            "supabase/fn_new_fix.sql",
            "CREATE OR REPLACE FUNCTION public.do_thing(p_x int) RETURNS void AS $$\n"
            "BEGIN\n  PERFORM 1;\nEND;\n$$ LANGUAGE plpgsql;\n",
        )
        self.fx.write("page.html", "<script>sb.rpc('do_thing',{p_x:1});</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 0)  # still just a warning
        self.assertIn("client-called RPCs with non-identical definitions", out)
        self.assertIn("do_thing", out)
        # fn_new_fix.sql should be flagged as the likely-canonical file per
        # this repo's own _fix.sql naming convention.
        self.assertIn("likely-canonical", out)
        self.assertIn("fn_new_fix.sql", out)

    def test_rpc_not_called_by_any_client_is_not_flagged_even_if_diverging(self):
        # audit.py's check 8 only cares about client-*called* RPCs; a
        # diverging function nobody calls yet is out of scope for this check.
        self.fx.write(
            "supabase/fn_old.sql",
            "CREATE OR REPLACE FUNCTION public.unused_fn(p_x int) RETURNS void AS $$\n"
            "BEGIN\n  NULL;\nEND;\n$$ LANGUAGE plpgsql;\n",
        )
        self.fx.write(
            "supabase/fn_new.sql",
            "CREATE OR REPLACE FUNCTION public.unused_fn(p_x int) RETURNS void AS $$\n"
            "BEGIN\n  PERFORM 1;\nEND;\n$$ LANGUAGE plpgsql;\n",
        )
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK — every client-called RPC has one consistent definition.", out)


if __name__ == "__main__":
    unittest.main()
