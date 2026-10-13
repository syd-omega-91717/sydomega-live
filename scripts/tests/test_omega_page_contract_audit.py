#!/usr/bin/env python3
"""Regression tests for canonical page and legacy-alias coverage."""

import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "omega-page-contract-audit.py"
SPEC = importlib.util.spec_from_file_location("omega_page_contract_audit", SCRIPT)
AUDIT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUDIT)


class PageInventoryCoverageTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="omega-page-inventory-")
        self.root = Path(self.temp.name)
        (self.root / "index.html").write_text("<html><title>Index</title></html>", encoding="utf-8")
        (self.root / "dashboard.html").write_text("<html><title>Dashboard</title></html>", encoding="utf-8")
        (self.root / "legacy.html").write_text(
            "<html><script>window.location.href = '/dashboard.html'</script></html>",
            encoding="utf-8",
        )
        self.registry = {"contracts": [{"path": "index.html"}, {"path": "dashboard.html"}]}
        self.aliases = {"aliases": [{"path": "legacy.html", "target": "/dashboard.html"}]}

    def tearDown(self):
        self.temp.cleanup()

    def test_canonical_pages_and_declared_alias_pass(self):
        self.assertEqual(AUDIT.page_inventory_errors(self.root, self.registry, self.aliases), [])

    def test_unregistered_shipped_html_fails_closed(self):
        (self.root / "orphan.html").write_text("<html></html>", encoding="utf-8")
        errors = AUDIT.page_inventory_errors(self.root, self.registry, self.aliases)
        self.assertIn("shipped HTML has no canonical contract or alias declaration: orphan.html", errors)

    def test_alias_with_missing_target_fails(self):
        self.aliases["aliases"][0]["target"] = "/missing.html"
        errors = AUDIT.page_inventory_errors(self.root, self.registry, self.aliases)
        self.assertIn("alias target does not exist: legacy.html -> /missing.html", errors)

    def test_alias_target_must_be_canonical_not_another_alias(self):
        self.aliases["aliases"][0]["target"] = "/legacy.html"
        errors = AUDIT.page_inventory_errors(self.root, self.registry, self.aliases)
        self.assertIn(
            "alias target is not a canonical page contract: legacy.html -> /legacy.html",
            errors,
        )

    def test_alias_redirect_must_match_declared_target(self):
        (self.root / "legacy.html").write_text(
            "<html><script>window.location.href = '/index.html'</script></html>",
            encoding="utf-8",
        )
        errors = AUDIT.page_inventory_errors(self.root, self.registry, self.aliases)
        self.assertIn(
            "alias source does not prove its declared redirect target: legacy.html -> /dashboard.html",
            errors,
        )


if __name__ == "__main__":
    unittest.main()
