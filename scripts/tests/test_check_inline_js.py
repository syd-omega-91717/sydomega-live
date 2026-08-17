#!/usr/bin/env python3
"""
Unit tests for scripts/check-inline-js.py.

This is the CI step that catches syntax errors inside the ~250 pages' inline
<script> blocks (bg.js/nav.js's own JS is covered by a separate `node --check`
pass — this one exists specifically because that pass never looks inside HTML).
It had zero test coverage; a regression here would silently let CI stop
catching broken inline scripts.

Run: python3 -m unittest scripts/tests/test_check_inline_js.py -v
(or: python3 scripts/tests/test_check_inline_js.py)
"""

import importlib.util
import os
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
MODULE_PATH = os.path.join(ROOT, "scripts", "check-inline-js.py")

spec = importlib.util.spec_from_file_location("check_inline_js", MODULE_PATH)
check_inline_js = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check_inline_js)


class IsModuleTests(unittest.TestCase):
    def test_type_module_double_quotes(self):
        self.assertTrue(check_inline_js.is_module(' type="module"', "const x = 1;"))

    def test_type_module_single_quotes(self):
        self.assertTrue(check_inline_js.is_module(" type='module'", "const x = 1;"))

    def test_import_statement_implies_module(self):
        self.assertTrue(check_inline_js.is_module("", "import { x } from '/x.js';\nx();"))

    def test_export_statement_implies_module(self):
        self.assertTrue(check_inline_js.is_module("", "export function f(){}\n"))

    def test_plain_script_is_not_module(self):
        self.assertFalse(check_inline_js.is_module("", "function f(){ return 1; }"))

    def test_import_inside_a_string_does_not_count(self):
        # MODULE_HINT requires 'import'/'export' at the start of a line
        # (^\s*), so a substring mid-statement must not false-positive.
        self.assertFalse(check_inline_js.is_module("", "var msg = 'please import your data';"))


class CheckBlockTests(unittest.TestCase):
    def test_valid_classic_script_has_no_error(self):
        err = check_inline_js.check_block("function f(){ return 1 + 1; }", module=False)
        self.assertIsNone(err)

    def test_broken_classic_script_reports_syntax_error(self):
        err = check_inline_js.check_block("function f( { return 1; }", module=False)
        self.assertIsNotNone(err)
        self.assertIn("Error", err)

    def test_valid_module_script_has_no_error(self):
        err = check_inline_js.check_block("export const x = 1;", module=True)
        self.assertIsNone(err)

    def test_broken_module_script_reports_syntax_error(self):
        err = check_inline_js.check_block("export const x = ;", module=True)
        self.assertIsNotNone(err)


class MainIntegrationTests(unittest.TestCase):
    """Exercises main() end-to-end against a temp fixture directory, the
    same way audit.py's tests do, so a regression in the glob/regex/report
    wiring (not just the two helpers above) would also be caught."""

    def _run_main_in(self, html_files):
        tmpdir = tempfile.mkdtemp()
        for name, content in html_files.items():
            with open(os.path.join(tmpdir, name), "w", encoding="utf-8") as f:
                f.write(content)
        cwd = os.getcwd()
        os.chdir(tmpdir)
        try:
            return check_inline_js.main()
        finally:
            os.chdir(cwd)

    def test_clean_page_exits_zero(self):
        rc = self._run_main_in({
            "index.html": "<html><body><script>var x=1;</script></body></html>",
        })
        self.assertEqual(rc, 0)

    def test_broken_inline_script_exits_nonzero(self):
        rc = self._run_main_in({
            "broken.html": "<html><body><script>function(){</script></body></html>",
        })
        self.assertEqual(rc, 1)

    def test_script_with_src_attribute_is_skipped(self):
        # A <script src="..."> tag has no inline body to check; the regex
        # explicitly excludes tags carrying a src= attribute (they're
        # covered by the separate `node --check` pass on the .js files
        # themselves) — a broken remote reference must not be flagged here.
        rc = self._run_main_in({
            "index.html": '<html><body><script src="/does-not-exist.js"></script></body></html>',
        })
        self.assertEqual(rc, 0)


if __name__ == "__main__":
    unittest.main()
