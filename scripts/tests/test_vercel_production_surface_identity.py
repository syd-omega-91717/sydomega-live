"""Regression tests for production HTML page-identity checks."""
from __future__ import annotations

import importlib.util
import unittest
from unittest.mock import patch
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "vercel-production-surface-smoke.py"
SPEC = importlib.util.spec_from_file_location("omega_surface_smoke", SCRIPT)
if SPEC is None or SPEC.loader is None:
    raise RuntimeError(f"Unable to load production surface smoke script: {SCRIPT}")
SMOKE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SMOKE)


class FakeResponse:
    def __init__(self, status: int, body: bytes = b"", headers: dict[str, str] | None = None):
        self.status = status
        self._body = body
        self._headers = {key.lower(): value for key, value in (headers or {}).items()}

    def getheader(self, name: str, default: str = "") -> str:
        return self._headers.get(name.lower(), default)

    def read(self, _size: int = -1) -> bytes:
        return self._body


class FakeConnection:
    def __init__(self, response: FakeResponse):
        self.response = response
        self.requested_path = ""
        self.closed = False

    def request(self, _method: str, path: str, headers: dict[str, str] | None = None) -> None:
        self.requested_path = path

    def getresponse(self) -> FakeResponse:
        return self.response

    def close(self) -> None:
        self.closed = True


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
        expected = b'<html><body>content without identity markers</body></html>'
        actual = b'<html><body>content without identity markers</body></html>'
        self.assertIn("expected_page_identity_missing", SMOKE.identity_mismatch(expected, actual, "/unknown") or "")

    def test_check_route_rejects_same_host_redirect_to_account_page(self) -> None:
        """A 2xx account page must not count as the requested missions page."""
        expected = b'<html><head><title>Omega Missions</title></head><body data-omega-realm="missions"></body></html>'
        account = b'<html><head><title>Member Access</title></head><body data-omega-realm="account"></body></html>'
        connections = [
            FakeConnection(FakeResponse(302, headers={"Location": "/account"})),
            FakeConnection(FakeResponse(200, account, {"Content-Type": "text/html; charset=utf-8"})),
        ]
        with patch.object(SMOKE.http.client, "HTTPSConnection", side_effect=connections):
            ok, result = SMOKE.check_route("/missions", "sydomega.com", expected)
        self.assertFalse(ok)
        self.assertIn("page_realm_mismatch", result)
        self.assertEqual(connections[1].requested_path, "/account")


if __name__ == "__main__":
    unittest.main()
