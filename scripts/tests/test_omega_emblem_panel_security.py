#!/usr/bin/env python3
"""Regression guard for the Omega emblem panel dynamic-content boundary."""
from pathlib import Path
import unittest


class OmegaEmblemPanelSecurityTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = Path("omega-emblem-panel.js").read_text(encoding="utf-8")

    def test_dynamic_panel_content_does_not_use_inner_html(self):
        self.assertNotIn(".innerHTML", self.source)
        self.assertNotIn("innerHTML =", self.source)

    def test_dynamic_text_uses_text_content(self):
        self.assertIn("textContent", self.source)

    def test_action_urls_use_safe_href(self):
        self.assertIn("function safeHref", self.source)
        self.assertIn("safeHref(a.href)", self.source)
        self.assertIn("u.protocol !== 'http:'", self.source)
        self.assertIn("u.protocol !== 'https:'", self.source)

    def test_cross_origin_links_use_opener_protection(self):
        self.assertIn("noopener noreferrer", self.source)


if __name__ == "__main__":
    unittest.main()
