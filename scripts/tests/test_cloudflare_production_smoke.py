#!/usr/bin/env python3
"""Security and crawler regression tests for the production smoke verifier."""
from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "scripts" / "cloudflare-production-smoke.py"
SPEC = importlib.util.spec_from_file_location("cloudflare_production_smoke", SOURCE)
assert SPEC is not None and SPEC.loader is not None
SMOKE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SMOKE)


class ProductionSmokeUrlSafety(unittest.TestCase):
    def test_non_http_schemes_and_credentials_are_rejected(self):
        self.assertFalse(SMOKE.is_safe_http_url("file:///etc/passwd"))
        self.assertFalse(SMOKE.is_safe_http_url("https://user:secret@sydomega.com/"))
        self.assertEqual(
            SMOKE.request_url("file:///etc/passwd", "GET", 1),
            (0, "", "blocked unsupported URL scheme or authority"),
        )

    def test_only_approved_https_hosts_are_accepted(self):
        self.assertEqual(SMOKE.validate_request_url("https://sydomega.com"), "https://sydomega.com")
        self.assertEqual(
            SMOKE.validate_request_url("https://preview.sydomega-live.pages.dev"),
            "https://preview.sydomega-live.pages.dev",
        )
        for unsafe in (
            "file:///etc/passwd",
            "http://sydomega.com",
            "https://evil.example",
            "https://sydomega.com@evil.example",
            "https://sydomega.com:444",
        ):
            with self.assertRaises(ValueError, msg=unsafe):
                SMOKE.validate_request_url(unsafe)

    def test_cross_origin_redirects_are_rejected(self):
        handler = SMOKE.SameOriginRedirectHandler("sydomega.com", 443)
        self.assertIsNone(
            handler.redirect_request(object(), None, 302, "Found", {}, "https://other.example/")
        )

    def test_cloudflare_email_decoder_placeholder_is_not_crawled(self):
        parser = SMOKE.RefParser()
        parser.feed(
            '<a class="__cf_email__" href="/cdn-cgi/l/email-protection#abcd">protected</a>'
            '<a href="/profile.html">profile</a>'
        )
        self.assertEqual(parser.cloudflare_email_placeholders_skipped, 1)
        self.assertEqual(parser.refs, {"/profile.html"})

    def test_other_cdn_cgi_paths_are_not_silently_ignored(self):
        parser = SMOKE.RefParser()
        parser.feed('<a href="/cdn-cgi/trace">trace</a>')
        self.assertEqual(parser.refs, {"/cdn-cgi/trace"})
        self.assertEqual(parser.cloudflare_email_placeholders_skipped, 0)


if __name__ == "__main__":
    unittest.main()
