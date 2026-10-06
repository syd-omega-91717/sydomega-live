#!/usr/bin/env python3
"""Tests for scripts/peek.py -- the large-file outliner.

Each case plants a small file with a known structure and asserts the outline
names exactly the lines a session would want to jump to, with correct line
numbers (they feed Read's offset), and that the size line is always printed.

Run: python3 -m unittest scripts/tests/test_peek.py -v
"""

import os
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PEEK = os.path.join(ROOT, "scripts", "peek.py")


def run(*args):
    p = subprocess.run([sys.executable, PEEK] + list(args), capture_output=True, text=True, timeout=20)
    return p.returncode, p.stdout, p.stderr


class PeekTest(unittest.TestCase):

    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()

    def tearDown(self):
        self.tmp.cleanup()

    def plant(self, name, text):
        path = os.path.join(self.tmp.name, name)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text)
        return path

    def test_markdown_headings_and_entry_headers_with_line_numbers(self):
        path = self.plant("log.md", "# Title\n\nprose\n## Section\n- **[Fixed] thing**\n- plain bullet\n")
        code, out, _ = run(path)
        self.assertEqual(code, 0)
        self.assertIn("     1: # Title", out)
        self.assertIn("     4: ## Section", out)
        self.assertIn("     5: - **[Fixed] thing**", out)
        self.assertNotIn("plain bullet", out)
        self.assertIn("approx tokens", out)

    def test_js_functions_publishers_and_string_section_markers(self):
        js = ("(function(){\n"
              "  var css='a{}/* ── Ω-GVP layer ── */b{}';\n"
              "})();\n"
              "function helper(){}\n"
              "window.OmegaThing = {};\n"
              "if (window.x == 1) {}\n")
        code, out, _ = run(self.plant("m.js", js))
        self.assertEqual(code, 0)
        self.assertIn("     1: (function(){", out)
        self.assertIn("[section @col", out)
        self.assertIn("Ω-GVP", out)
        self.assertIn("     4: function helper(){}", out)
        self.assertIn("     5: window.OmegaThing = {};", out)
        self.assertNotIn("window.x == 1", out)

    def test_html_blocks(self):
        html = "<html>\n<title>T</title>\n<style>\n.a{}\n</style>\n<main class=main>\n<p>x</p>\n<script>\n</script>\n"
        _, out, _ = run(self.plant("p.html", html))
        for n in ("2: <title>", "3: <style>", "5: </style>", "6: <main", "8: <script>", "9: </script>"):
            self.assertIn(n, out)
        self.assertNotIn("<p>x</p>", out)

    def test_sql_statements(self):
        sql = "-- c\ncreate table public.t (id int);\nselect 1;\nCREATE OR REPLACE FUNCTION f() returns int\ngrant select on t to authenticated;\n"
        _, out, _ = run(self.plant("s.sql", sql))
        self.assertIn("2: create table public.t", out)
        self.assertIn("4: CREATE OR REPLACE FUNCTION", out)
        self.assertIn("5: grant select", out)
        self.assertNotIn("select 1", out)

    def test_json_top_level_keys(self):
        _, out, _ = run(self.plant("d.json", '{"agents":[1,2,3],"name":"x","n":4}'))
        self.assertIn("agents: list[3]", out)
        self.assertIn("name: str[1]", out)
        self.assertIn("n: int", out)

    def test_grep_with_context_and_cap(self):
        path = self.plant("g.md", "a\nneedle one\nb\nc\nd\nneedle two\ne\n")
        _, out, _ = run(path, "--grep", "needle", "-C", "1")
        self.assertIn("     2: needle one", out)
        self.assertIn("     1- a", out)
        self.assertIn("    --", out)
        self.assertIn("2 matching line(s)", out)

    def test_max_caps_output(self):
        path = self.plant("big.md", "".join("## h%d\n" % i for i in range(50)))
        _, out, _ = run(path, "--max", "5")
        self.assertIn("45 more", out)

    def test_width_truncates(self):
        path = self.plant("w.md", "# " + "x" * 300 + "\n")
        _, out, _ = run(path, "--width", "40")
        self.assertIn("…", out)
        self.assertLess(max(len(l) for l in out.splitlines() if l.startswith("     1")), 60)

    def test_missing_file_and_bad_regex_exit_2(self):
        code, _, err = run(os.path.join(self.tmp.name, "absent.md"))
        self.assertEqual(code, 2)
        self.assertIn("no such file", err)
        code, _, err = run(self.plant("x.md", "x\n"), "--grep", "(")
        self.assertEqual(code, 2)
        self.assertIn("bad regex", err)


if __name__ == "__main__":
    unittest.main()
