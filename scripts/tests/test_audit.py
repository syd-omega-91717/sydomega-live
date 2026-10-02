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

    # ---- transitive closure (FIXES_LOG.md 111) --------------------------
    # The module graph used to read `.src =` out of bg.js/nav.js only, so a
    # module injected by an already-reachable module was reported as an
    # orphan. Live example: bg.js injects omega-components.js, which injects
    # /omega-page-character.js. These four tests pin the closure in BOTH
    # directions -- a scan that only ever finds fewer orphans would pass the
    # first two and fail the last two.

    def test_module_injected_by_an_injected_module_is_reachable(self):
        self.fx.write("bg.js", "var a=document.createElement('script');a.src='/omega-mid.js';")
        self.fx.write("omega-mid.js", "var b=document.createElement('script');b.src='/omega-leaf.js';")
        self.fx.write("omega-leaf.js", "// reached through omega-mid.js\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("omega-leaf.js", out)
        self.assertNotIn("omega-mid.js", out)

    def test_closure_follows_a_module_a_page_script_tag_includes(self):
        self.fx.write("page.html", "<script src=/omega-mid.js></script>")
        self.fx.write("omega-mid.js", "var b=document.createElement('script');b.src='/omega-leaf.js';")
        self.fx.write("omega-leaf.js", "// reached through the page's own tag\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("omega-leaf.js", out)

    def test_a_dead_module_cannot_vouch_for_what_it_injects(self):
        # THE CONTROL. Nothing loads omega-dead.js, so the module it injects
        # is not reachable either. A closure seeded from every .js on disk
        # rather than from the real roots would call both of these live and
        # quietly stop reporting any orphan at all.
        self.fx.write("bg.js", "// loads nothing\n")
        self.fx.write("omega-dead.js", "var b=document.createElement('script');b.src='/omega-alsodead.js';")
        self.fx.write("omega-alsodead.js", "// only a dead module asks for this\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("WARNING — on disk but never loaded", out)
        self.assertIn("omega-dead.js", out)
        self.assertIn("omega-alsodead.js", out)

    def test_a_third_party_cdn_src_is_not_a_local_module_edge(self):
        # omega-oss.js pulls dayjs's relativeTime.min.js from jsdelivr. Taking
        # its basename as a same-origin edge reported a CRITICAL for a file
        # that was never meant to exist in this repo.
        self.fx.write(
            "bg.js",
            "var s=document.createElement('script');"
            "s.src='https://cdn.jsdelivr.net/npm/dayjs@1.11.23/plugin/relativeTime.min.js';")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK — every requested module exists.", out)
        self.assertNotIn("relativeTime.min.js", out)

    # ---- ESM imports are edges too (FIXES_LOG.md 161) --------------------

    def test_module_reached_only_by_an_esm_import_is_not_reported_dead(self):
        # omega-analytics.js and omega-speed-insights.js are each reached ONLY
        # by an `import` in a -init.js shim that ~180 pages load with a
        # <script type=module> tag. Counting only `.src =` reported both as
        # orphans -- 2 of 5 entries false, and a list that is 40% false reads
        # as noise, which is how a genuine entry in it sat inert for 8 days.
        self.fx.write("page.html", "<script type=module src=/omega-init.js></script>")
        self.fx.write("omega-init.js", "import { inject } from './omega-lib.js';\ninject();\n")
        self.fx.write("omega-lib.js", "export function inject(){}\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("omega-lib.js", out)

    def test_module_reached_through_a_loader_helper_call_is_reachable(self):
        # omega-sovereign-os.js loads omega-content-progressive.js with
        # loadScript('/x.js', guard); the helper's own `s.src = url` is a
        # variable, so the edge was invisible and a live module read as dead.
        self.fx.write("page.html", "<script src=/omega-os.js></script>")
        self.fx.write("omega-os.js",
                      "function loadScript(u,a){var s=document.createElement('script');s.src=u;}\n"
                      "loadScript('/omega-progressive.js','data-x');\n")
        self.fx.write("omega-progressive.js", "// loaded by helper\n")
        self.fx.write("omega-dead.js", "loadScript('/omega-vouched.js','data-y');\n")
        self.fx.write("omega-vouched.js", "// only a dead module names it\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("omega-progressive.js", out)
        self.assertIn("omega-vouched.js", out)

    def test_bare_and_dynamic_esm_imports_are_edges(self):
        self.fx.write("page.html", "<script type=module src=/omega-init.js></script>")
        self.fx.write("omega-init.js",
                      "import './omega-side.js';\n"
                      "const p = import('./omega-lazy.js');\n")
        self.fx.write("omega-side.js", "// side-effect import\n")
        self.fx.write("omega-lazy.js", "// dynamic import\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("omega-side.js", out)
        self.assertNotIn("omega-lazy.js", out)

    def test_esm_import_does_not_let_a_dead_module_vouch(self):
        # THE CONTROL for the edge above, and the reason this file's earlier
        # control exists: teaching the graph a new kind of edge must not turn
        # the orphan set into the empty set. Nothing loads omega-dead.js, so
        # what it imports is dead too.
        self.fx.write("bg.js", "// loads nothing\n")
        self.fx.write("omega-dead.js", "import './omega-alsodead.js';\n")
        self.fx.write("omega-alsodead.js", "// only a dead module imports this\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("omega-dead.js", out)
        self.assertIn("omega-alsodead.js", out)

    def test_a_remote_esm_import_is_not_a_local_module_edge(self):
        self.fx.write("bg.js", "import { x } from 'https://esm.sh/tone@14.8.49/build/esm/index.js';")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK — every requested module exists.", out)
        self.assertNotIn("index.js", out)

    # ---- stylesheet graph, same closure (FIXES_LOG.md 111) ---------------

    def test_stylesheet_reached_only_by_a_dead_module_is_reported_dead(self):
        # omega-interface-v2.js is itself an orphan and names 8 stylesheets.
        # Scanning every .js on disk counted those references and called all
        # 8 live.
        self.fx.write("bg.js", "// loads nothing\n")
        self.fx.write("omega-dead.js", "var l=document.createElement('link');l.href='/skin.css';")
        self.fx.write("skin.css", "body{color:red}")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("stylesheets on disk but never loaded", out)
        self.assertIn("skin.css", out)

    def test_stylesheet_reached_through_a_live_module_stays_live(self):
        # THE CONTROL for the test above: the same shape, one edge different.
        # Without this, a scan that simply called every stylesheet dead would
        # pass.
        self.fx.write("bg.js", "var a=document.createElement('script');a.src='/omega-live.js';")
        self.fx.write("omega-live.js", "var l=document.createElement('link');l.href='/skin.css';")
        self.fx.write("skin.css", "body{color:red}")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("skin.css", out)


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

    # --- supabase/migrations/ is the AUTHORITATIVE schema (CLAUDE.md §5) ------
    # audit.py loaded the flat bag with a non-recursive os.listdir(), so every
    # relation declared only in migrations/ read as "never CREATE TABLE'd" --
    # five phantom warnings on live, present relations, plus the live Stripe
    # webhook RPC. These lock the widened scope in both directions.

    def test_table_declared_only_in_migrations_is_not_reported_missing(self):
        self.fx.write(
            "supabase/migrations/20260101000000_add.sql",
            "CREATE TABLE IF NOT EXISTS public.mig_only_table(id uuid PRIMARY KEY);\n"
            "ALTER TABLE public.mig_only_table ENABLE ROW LEVEL SECURITY;\n",
        )
        self.fx.write("page.html", "<script>sb.from('mig_only_table').select('*');</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("mig_only_table", out)

    def test_function_declared_only_in_migrations_is_not_reported_missing(self):
        self.fx.write(
            "supabase/migrations/20260101000001_fn.sql",
            "CREATE OR REPLACE FUNCTION public.mig_only_fn(p uuid)\n"
            "RETURNS void LANGUAGE sql AS $$ SELECT 1 $$;\n",
        )
        self.fx.write("page.html", "<script>sb.rpc('mig_only_fn',{p:1});</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("mig_only_fn", out)

    def test_absent_table_is_still_warned_after_the_widening(self):
        """The widening must not become a blanket excuse."""
        self.fx.write(
            "supabase/migrations/20260101000000_add.sql",
            "CREATE TABLE IF NOT EXISTS public.mig_only_table(id uuid PRIMARY KEY);\n"
            "ALTER TABLE public.mig_only_table ENABLE ROW LEVEL SECURITY;\n",
        )
        self.fx.write("page.html", "<script>sb.from('ghost_table').select('*');</script>")
        code, out = self.fx.run()
        self.assertIn("never CREATE TABLE'd/VIEW'd", out)
        self.assertIn("ghost_table", out)

    def test_a_name_inside_a_migration_string_literal_does_not_count(self):
        """CLAUDE.md §8.4: a relation named `as` was once harvested out of the
        literal "CREATE TABLE AS". Excusing a missing relation that way is the
        expensive direction of that error."""
        self.fx.write(
            "supabase/migrations/20260101000002_log.sql",
            "CREATE TABLE IF NOT EXISTS public.ddl_log(tag text);\n"
            "ALTER TABLE public.ddl_log ENABLE ROW LEVEL SECURITY;\n"
            "-- CREATE TABLE public.commented_out_table(id int);\n"
            "/* CREATE TABLE public.block_commented_table(id int); */\n"
            "INSERT INTO public.ddl_log(tag) VALUES ('CREATE TABLE literal_table');\n",
        )
        self.fx.write(
            "page.html",
            "<script>sb.from('literal_table').select('*');"
            "sb.from('commented_out_table').select('*');"
            "sb.from('block_commented_table').select('*');</script>",
        )
        code, out = self.fx.run()
        self.assertIn("never CREATE TABLE'd/VIEW'd", out)
        for ghost in ("literal_table", "commented_out_table", "block_commented_table"):
            self.assertIn(ghost, out, f"{ghost} must not be excused by a non-DDL match")


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


class JSONFallbackLiteralTests(unittest.TestCase):
    """Check 9 — a JSON.parse fallback that is not valid JSON.

    This is the bug class that took contributions.html, notifications.html and
    treasury.html entirely dead on a member's first visit: the literal only
    parses when localStorage already has the key, and at module top level the
    throw kills every function declared below it. Nothing else in CI could see
    it — the JavaScript is syntactically valid.
    """

    def setUp(self):
        self.fx = AuditFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_unquoted_keys_in_fallback_is_critical(self):
        self.fx.write("page.html",
                      "<script type=module>\n"
                      "var t=JSON.parse(localStorage.getItem('k')||'{pct:10,income:0}');\n"
                      "</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("CRITICAL — JSON.parse fallback literal is not valid JSON", out)
        self.assertIn("{pct:10,income:0}", out)

    def test_quoted_keys_in_fallback_passes(self):
        self.fx.write("page.html",
                      "<script type=module>\n"
                      "var t=JSON.parse(localStorage.getItem('k')||'{\"pct\":10,\"income\":0}');\n"
                      "</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK — every JSON.parse fallback literal parses as JSON.", out)

    def test_array_and_scalar_fallbacks_pass(self):
        # The overwhelmingly common forms in this repo: '[]', '{}', '0', 'null'.
        self.fx.write("a.js", "var a=JSON.parse(localStorage.getItem('a')||'[]');")
        self.fx.write("b.js", "var b=JSON.parse(localStorage.getItem('b')||'{}');")
        self.fx.write("c.js", "var c=JSON.parse(localStorage.getItem('c')||'null');")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK — every JSON.parse fallback literal parses as JSON.", out)

    def test_nested_parens_in_the_argument_do_not_break_extraction(self):
        # The naive [^)]* pattern stops at getItem(...)'s own ")" and misses the
        # fallback entirely; the balanced-paren walk must see through it.
        self.fx.write("page.html",
                      "<script>var t=JSON.parse(window.localStorage.getItem(KEY)||'{bad:1}');</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("{bad:1}", out)

    def test_json_parse_without_a_string_fallback_is_ignored(self):
        # No literal to validate — must not be flagged, and must not crash.
        self.fx.write("a.js", "var a=JSON.parse(someVar);")
        self.fx.write("b.js", "var b=JSON.parse(localStorage.getItem('k')||fallbackVar);")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("OK — every JSON.parse fallback literal parses as JSON.", out)

    def test_reports_file_and_line(self):
        self.fx.write("page.html",
                      "<script>\n\n\nvar t=JSON.parse(localStorage.getItem('k')||'{oops:1}');\n</script>")
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("page.html:4", out)


if __name__ == "__main__":
    unittest.main()
