"""Regression tests for production HTML page-identity checks."""
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "vercel-production-surface-smoke.py"
SPEC = importlib.util.spec_from_file_location("omega_surface_smoke", SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load production surface smoke script: {SCRIPT}")
SMOKE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SMOKE)


class PageIdentityTests(unittest.TestCase):
    def test_extracts_title_and_realm(self) -> None:
        body = b'<html><head><title> Omega Missions </title></head><body data-omega-realm="missions"></body></html>'
        self.assertEqual(SMOKE.page_identity(body), ("omega missions", "missions"))

    def test_accepts_matching_page_identity(self) -> None:
        expected = b'<html><head><title>Omega Missions</title></head><body data-omega-realm="missions"></body></html>'
        actual = b'<html><head><title>Omega Missions</title></head><body data-omega-realm="missions"></body></html>'
        self.assertIsNone(SMOKE.identity_mismatch(expected, actual, "/missions"))

    def test_rejects_different_realm_even_when_http_is_successful(self) -> None:
        expected = b'<html><head><title>Omega Missions</title></head><body data-omega-realm="missions"></body></html>'
        actual = b'<html><head><title>Member Access</title></head><body data-omega-realm="account"></body></html>'
        self.assertIn("page_realm_mismatch", SMOKE.identity_mismatch(expected, actual, "/missions") or "")

    def test_rejects_different_title_when_realm_is_not_available(self) -> None:
        expected = b'<html><head><title>Omega Evidence</title></head><body></body></html>'
        actual = b'<html><head><title>Member Access</title></head><body></body></html>'
        self.assertIn("page_title_mismatch", SMOKE.identity_mismatch(expected, actual, "/evidence") or "")

    def test_rejects_fixture_without_identity_markers(self) -> None:
        expected = b'<html><body>content without title or realm</body></html>'
        actual = b'<html><body>content without title or realm</body></html>'
        self.assertIn("expected_page_identity_missing", SMOKE.identity_mismatch(expected, actual, "/unknown") or "")


if __name__ == "__main__":
    unittest.main()
