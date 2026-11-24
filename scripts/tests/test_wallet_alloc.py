"""wallet.html must define every function renderOverview calls.

eb32eeb85 ("show no wallet balance before an account is recorded") deleted renderAllocBars and drawAllocCanvas while renderOverview kept
calling them, so the page threw ReferenceError on load, the allocation chart and bars never drew, and nothing noticed (a write that
silently does nothing: CLAUDE.md 8.1).  Browser-checked 2026-11-24: before, both an empty and a seeded wallet logged the error and drew
nothing; after, neither does, the empty one shows no balance, the seeded one shows its chart and bars.
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = (ROOT / "wallet.html").read_text(encoding="utf-8")
CODE = re.sub(r"/\*.*?\*/", "", SRC, flags=re.S)


class WalletAllocation(unittest.TestCase):
    def test_every_function_renderoverview_calls_is_defined(self):
        body = re.search(r"function renderOverview\(\)\{(.*?)\n\}\n", CODE, re.S).group(1)
        called = set(re.findall(r"\b([A-Za-z_]\w*)\(\)\s*;", body))
        for name in sorted(called):
            self.assertRegex(CODE, r"function\s+" + name + r"\s*\(", name + " is called by renderOverview but never defined")

    def test_the_allocation_bars_are_built_without_innerhtml(self):
        """Account types come from locally stored data; textContent keeps a hostile type name inert."""
        fn = re.search(r"function renderAllocBars\(\)\{(.*?)\n\}\n", CODE, re.S).group(1)
        self.assertNotIn("innerHTML", fn)
        self.assertIn("textContent", fn)

    def test_the_chart_draws_through_the_pixel_ratio_helper(self):
        fn = re.search(r"function drawAllocCanvas\(\)\{(.*?)\n\}\n", CODE, re.S).group(1)
        self.assertIn("OmegaCanvas.fit(", fn)
        self.assertLess(SRC.index("omega-canvas-hidpi.js"), SRC.index("function drawAllocCanvas"))


if __name__ == "__main__":
    unittest.main()
