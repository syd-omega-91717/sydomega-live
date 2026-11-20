"""Regression: a root-level data-omega-emblem blanked every page.

omega-emblems.js fills any [data-omega-emblem] element via innerHTML.
omega-page-world.js published that same attribute on <html>, so the emblem
filler overwrote document.documentElement.innerHTML shortly after load.
Found in a headless render (shell count 1 -> 0 at ~1.4s), not by any gate.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


class EmblemRootCollision(unittest.TestCase):
    def test_world_does_not_publish_filler_attribute_on_root(self):
        src = (ROOT / "omega-page-world.js").read_text(encoding="utf-8")
        self.assertIsNone(
            re.search(r"visualRoot\.setAttribute\(\s*'data-omega-emblem'", src),
            "omega-page-world.js must not set data-omega-emblem on <html>",
        )

    def test_filler_refuses_document_root(self):
        src = (ROOT / "omega-emblems.js").read_text(encoding="utf-8")
        self.assertIn("document.documentElement", src)
        self.assertIn("document.body", src)


if __name__ == "__main__":
    unittest.main()
