#!/usr/bin/env python3
"""Regression tests for the Supabase Auth HIBP configuration helper.

These tests never call Supabase. They prove the helper reads the current value,
changes only password_hibp_enabled when required, and fails closed when the
provider does not confirm the requested setting.
"""
from __future__ import annotations

import contextlib
import importlib.util
import io
import pathlib
import unittest
from unittest.mock import call, patch

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "enable-supabase-hibp.py"
SPEC = importlib.util.spec_from_file_location("enable_supabase_hibp", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class SupabaseHibpHelperTests(unittest.TestCase):
    def test_missing_management_token_fails_without_network(self):
        output = io.StringIO()
        error = io.StringIO()
        with patch.dict("os.environ", {}, clear=True), patch.object(MODULE, "request") as request, contextlib.redirect_stdout(output), contextlib.redirect_stderr(error):
            result = MODULE.main([])
        self.assertEqual(result, 2)
        self.assertIn("SUPABASE_ACCESS_TOKEN is not set", error.getvalue())
        request.assert_not_called()

    def test_already_enabled_is_read_only(self):
        output = io.StringIO()
        with patch.dict("os.environ", {"SUPABASE_ACCESS_TOKEN": "test-token"}), patch.object(
            MODULE, "request", return_value=(200, {"password_hibp_enabled": True})
        ) as request, contextlib.redirect_stdout(output):
            result = MODULE.main([])
        self.assertEqual(result, 0)
        request.assert_called_once_with("GET", MODULE.BASE, "test-token")
        self.assertIn("password_hibp_enabled before: true", output.getvalue())
        self.assertIn("OK:", output.getvalue())

    def test_disabled_setting_patches_only_hibp_flag_then_verifies(self):
        output = io.StringIO()
        with patch.dict("os.environ", {"SUPABASE_ACCESS_TOKEN": "test-token"}), patch.object(
            MODULE,
            "request",
            side_effect=[
                (200, {"password_hibp_enabled": False}),
                (200, {"password_hibp_enabled": True}),
            ],
        ) as request, contextlib.redirect_stdout(output):
            result = MODULE.main([])
        self.assertEqual(result, 0)
        self.assertEqual(request.call_args_list, [
            call("GET", MODULE.BASE, "test-token"),
            call("PATCH", MODULE.BASE, "test-token", {"password_hibp_enabled": True}),
        ])
        self.assertIn("password_hibp_enabled after: true", output.getvalue())

    def test_provider_not_confirming_enabled_state_fails_closed(self):
        error = io.StringIO()
        with patch.dict("os.environ", {"SUPABASE_ACCESS_TOKEN": "test-token"}), patch.object(
            MODULE,
            "request",
            side_effect=[
                (200, {"password_hibp_enabled": False}),
                (200, {"password_hibp_enabled": False}),
            ],
        ), contextlib.redirect_stderr(error):
            result = MODULE.main([])
        self.assertEqual(result, 1)
        self.assertIn("did not confirm", error.getvalue())

    def test_request_rejects_non_https_before_network(self):
        with patch.object(MODULE.urllib.request, "urlopen") as urlopen:
            with self.assertRaisesRegex(ValueError, "non-https"):
                MODULE.request("GET", "http://example.invalid", "test-token")
        urlopen.assert_not_called()


if __name__ == "__main__":
    unittest.main()
