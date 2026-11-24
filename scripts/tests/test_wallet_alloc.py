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


class AgentNetworkCanvas(unittest.TestCase):
    """agent-network.html's canvas grew without bound (774, 1164, 1593 ... 3426 px over 12 s on origin/main): it was 100% of a container whose
    height was the status line plus the canvas, and every redraw stored its height as its height.  Taking it out of the flow breaks the loop."""

    def test_the_canvas_does_not_size_its_own_container(self):
        css = re.sub(r"\s+", " ", re.sub(r"/\*.*?\*/", "", (ROOT / "agent-network.html").read_text(encoding="utf-8"), flags=re.S))
        rule = re.search(r"#network-canvas \{([^}]*)\}", css).group(1)
        self.assertIn("position: absolute", rule)
        container = re.search(r"\.network-container \{([^}]*)\}", css).group(1)
        self.assertIn("min-height", container)   # the canvas no longer props the container up


if __name__ == "__main__":
    unittest.main()
