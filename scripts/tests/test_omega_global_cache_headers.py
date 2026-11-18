#!/usr/bin/env python3
"""Cloudflare Pages cache policy contract for global bootstrap and versioned assets."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
HEADERS = ROOT / "_headers"


class OmegaGlobalCacheHeaders(unittest.TestCase):
    def test_bootstrap_files_are_revalidated(self):
        source = HEADERS.read_text(encoding="utf-8")
        for path in ("/bg.js", "/nav.js"):
            start = source.index(path)
            block = source[start:source.find("\n\n", start)]
            self.assertIn("Cache-Control: public, max-age=0, must-revalidate", block)

    def test_versioned_visual_and_hub_assets_are_immutable(self):
        source = HEADERS.read_text(encoding="utf-8")
        for path in (
            "/omega-platform-experience-v4.css",
            "/omega-domain-hubs.js",
            "/omega-domain-hub.css",
        ):
            start = source.index(path)
            block = source[start:source.find("\n\n", start)]
            self.assertIn("Cache-Control: public, max-age=31536000, immutable", block)


if __name__ == "__main__":
    unittest.main()
