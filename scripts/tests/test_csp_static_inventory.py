#!/usr/bin/env python3
"""Regression tests for scripts/csp-static-inventory.py."""

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "csp-static-inventory.py"
SPEC = importlib.util.spec_from_file_location("csp_static_inventory", SCRIPT)
INVENTORY = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(INVENTORY)


class StaticCspInventoryTests(unittest.TestCase):
    def test_inventory_counts_html_risks_and_normalizes_origins(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "vercel.json").write_text(json.dumps({
                "headers": [{
                    "source": "/(.*)",
                    "headers": [{
                        "key": "Content-Security-Policy",
                        "value": "default-src 'self'; connect-src 'self' https: wss:"
                    }]
                }]
            }), encoding="utf-8")
            (root / "index.html").write_text(
                '<script>fetch("https://API.example.com/v1/data")</script>\n'
                '<script src="/app.js"></script>\n'
                '<button onclick="go()" onerror="fail()"></button>\n'
                '<a href="javascript:alert(1)">x</a>\n'
                '<img src="https://cdn.example.com/logo.svg">\n',
                encoding="utf-8",
            )
            (root / "app.js").write_text(
                'const socket = "wss://stream.example.com/socket";\n'
                'const api = "https://api.example.com/v2";\n',
                encoding="utf-8",
            )

            report = INVENTORY.build_inventory(root)
            origins = {item["origin"]: item for item in report["external_literal_origins"]}
            self.assertEqual(report["files"], {"html": 1, "javascript": 1, "scanned": 2})
            self.assertEqual(report["html_risk_indicators"]["inline_script_blocks"], 1)
            self.assertEqual(report["html_risk_indicators"]["inline_event_handler_attributes"], 2)
            self.assertEqual(report["html_risk_indicators"]["javascript_scheme_attributes"], 1)
            self.assertEqual(origins["https://api.example.com"]["occurrences"], 2)
            self.assertEqual(origins["https://cdn.example.com"]["occurrences"], 1)
            self.assertEqual(origins["wss://stream.example.com"]["occurrences"], 1)
            self.assertEqual(report["csp_policies"][0]["directives"]["connect-src"],
                             ["'self'", "https:", "wss:"])

    def test_missing_config_and_empty_sources_are_safe(self):
        with tempfile.TemporaryDirectory() as tmp:
            report = INVENTORY.build_inventory(Path(tmp))
            self.assertEqual(report["csp_policies"], [])
            self.assertEqual(report["external_literal_origins"], [])
            self.assertEqual(report["files"]["scanned"], 0)

    def test_markdown_report_discloses_scope_and_limitations(self):
        report = {
            "scope": "fixture",
            "files": {"html": 1, "javascript": 1, "scanned": 2},
            "html_risk_indicators": {
                "inline_script_blocks": 1,
                "inline_event_handler_attributes": 2,
                "javascript_scheme_attributes": 0,
            },
            "csp_policies": [{"source": "/(.*)", "directives": {"default-src": ["'self'"]}}],
            "external_literal_origins": [
                {"origin": "https://example.com", "occurrences": 1, "files": ["index.html"]}
            ],
            "limitations": ["Static only."],
        }
        rendered = INVENTORY.render_markdown(report)
        self.assertIn("Static CSP and External-Origin Inventory", rendered)
        self.assertIn("default-src: 'self'", rendered)
        self.assertIn("Static only.", rendered)


if __name__ == "__main__":
    unittest.main()
