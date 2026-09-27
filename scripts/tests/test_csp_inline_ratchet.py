#!/usr/bin/env python3
"""
Unit tests for scripts/csp-inline-ratchet.py.

The gate exists so the inline-code migration toward `script-src 'self'` only
moves one way. These pin what it counts (markup handlers, handlers built in JS
strings, inline <script> bodies) and what it must not count (src= scripts,
JSON data blocks, words like `button` or `json` that merely contain "on").

Run: python3 -m unittest scripts/tests/test_csp_inline_ratchet.py -v
"""

import importlib.util
import os
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
spec = importlib.util.spec_from_file_location(
    "csp_inline_ratchet", os.path.join(ROOT, "scripts", "csp-inline-ratchet.py"))
ratchet = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ratchet)


class CountHtml(unittest.TestCase):
    def test_counts_markup_handlers_and_inline_script(self):
        html = ('<button onclick="go()">x</button><div class=a onmouseover=hi()></div>'
                '<script>var b=1;</script>')
        self.assertEqual(ratchet.count_html(html), (2, 1))

    def test_counts_handlers_built_inside_inline_script_strings(self):
        html = """<script>el.innerHTML='<a onclick="x()">'+'<b onkeydown=\\'y()\\'>';</script>"""
        self.assertEqual(ratchet.count_html(html), (2, 1))

    def test_ignores_src_scripts_json_blocks_and_lookalike_words(self):
        html = ('<script src="/a.js"></script><script type="application/ld+json">{"on":1}</script>'
                '<button data-action="x" class="json-only">button</button><script>  </script>')
        self.assertEqual(ratchet.count_html(html), (0, 0))


class CountJs(unittest.TestCase):
    def test_counts_emitted_handlers_not_listeners(self):
        js = """x.innerHTML='<i onclick="a()">';el.addEventListener('click',f);var onclick=1;"""
        self.assertEqual(ratchet.count_js(js), (1, 0))


class Repository(unittest.TestCase):
    def test_repository_is_at_or_below_its_baseline(self):
        import io
        from unittest import mock
        with mock.patch("sys.argv", ["csp-inline-ratchet.py"]), \
                mock.patch("sys.stdout", new_callable=io.StringIO):
            self.assertEqual(ratchet.main(), 0)


if __name__ == "__main__":
    unittest.main()
