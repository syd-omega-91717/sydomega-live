#!/usr/bin/env python3
"""Tests for the client-shipped service-role credential scanner."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "client_credential_scan", ROOT / "scripts/client-credential-scan.py"
)
assert SPEC is not None and SPEC.loader is not None
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ClientCredentialScanTests(unittest.TestCase):
    def test_permission_boolean_is_not_a_credential(self) -> None:
        self.assertIsNone(MODULE.finding('"service_role": false'))
        self.assertIsNone(MODULE.finding('"service_role": true'))

    def test_service_role_key_marker_is_detected(self) -> None:
        self.assertEqual(
            MODULE.finding("const SUPABASE_SERVICE_ROLE_KEY = getSecret();"),
            "service-role key marker",
        )

    def test_credential_like_service_role_value_is_detected_without_returning_value(self) -> None:
        line = '"service_role": "eyJhbGciOiJIUzI1NiJ9.example.signature"'
        result = MODULE.finding(line)
        self.assertEqual(result, "credential-like service_role value")
        self.assertNotIn("eyJ", result or "")

    def test_scan_reports_path_and_line_but_never_secret_text(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "public.json").write_text(
                '{"service_role": false}\n{"service_role": "eyJhbGciOiJIUzI1NiJ9.example.signature"}\n',
                encoding="utf-8",
            )
            hits = MODULE.scan(root)
        self.assertEqual(len(hits), 1)
        self.assertTrue(hits[0].startswith("public.json:2:"))
        self.assertNotIn("eyJ", hits[0])


if __name__ == "__main__":
    unittest.main()
