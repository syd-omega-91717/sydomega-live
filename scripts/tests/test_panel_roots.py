"""Regression: pages the panel engine could not host in place (stage 1 of docs/OMEGA_ONE_SHELL_PLAN.md).

omega-panels.js takes a page's content from [data-omega-panel-root], #app, .page-shell or <main>. honors, matrix and media
had none of those, so the engine threw "no content". sovereign-ai kept `_profile` in a classic script that a later module
script reads as a bare global; the engine wraps classic scripts in a function, so inside a panel the module saw nothing.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MARKED = ("honors", "matrix", "media")


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


class PanelRootTests(unittest.TestCase):
    def test_engine_prefers_the_explicit_root_first(self):
        src = read("omega-panels.js")
        marked = src.index("[data-omega-panel-root]")
        for fallback in ("'#app'", "'.page-shell'", "'main'"):
            self.assertLess(marked, src.index(fallback, marked), fallback + " must come after the explicit root")

    def test_marked_pages_mark_exactly_one_wrapper_that_holds_their_content(self):
        for page in MARKED:
            html = read(page + ".html")
            self.assertEqual(len(re.findall(r"data-omega-panel-root", html)), 1, page)
            # the marker sits on the wrapper that holds BOTH .page and the sibling tab panels
            wrapper = re.search(r'<div style="flex:1;min-width:0" data-omega-panel-root>(.*?)<div class="page"', html, re.S)
            self.assertIsNotNone(wrapper, page + ": marker must be on the flex wrapper that precedes .page")

    def test_sovereign_ai_shares_state_through_window_not_a_classic_script_var(self):
        html = read("sovereign-ai.html")
        self.assertIn("window._profile=null", html)
        self.assertIsNone(re.search(r"(?<![.\w])var _profile=null", html), "a classic-script var is private inside a panel")


if __name__ == "__main__":
    unittest.main()
