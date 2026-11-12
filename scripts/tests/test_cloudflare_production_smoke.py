#!/usr/bin/env python3
"""Security and crawler regression tests for the production smoke verifier."""

from __future__ import annotations

import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "scripts" / "cloudflare-production-smoke.py"
SPEC = importlib.util.spec_from_file_location("cloudflare_production_smoke", SOURCE)
assert SPEC is not None and SPEC.loader is not None
SMOKE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SMOKE)


class ProductionSmokeUrlSafety(unittest.TestCase):
    def test_non_http_schemes_are_rejected_before_urlopen(self):
        with patch.object(SMOKE, "urlopen") as opener:
            status, content_type, detail = SMOKE.request_url("file:///etc/passwd", "GET", 1)
        self.assertEqual(status, 0)
        self.assertEqual(content_type, "")
        self.assertEqual(detail, "unsupported_url_scheme_or_authority")
        opener.assert_not_called()

    def test_credential_bearing_http_urls_are_rejected(self):
        with patch.object(SMOKE, "urlopen") as opener:
            status, _, detail = SMOKE.request_url("https://user:secret@example.com/", "GET", 1)
        self.assertEqual(status, 0)
        self.assertEqual(detail, "unsupported_url_scheme_or_authority")
        opener.assert_not_called()

    def test_cloudflare_email_decoder_placeholder_is_not_crawled_as_a_page(self):
        parser = SMOKE.RefParser()
        parser.feed(
            '<a class="__cf_email__" href="/cdn-cgi/l/email-protection#abcd">protected</a>'
            '<a href="/profile.html">profile</a>'
        )
        self.assertEqual(parser.cloudflare_email_placeholders_skipped, 1)
        self.assertEqual(parser.refs, {"/profile.html"})

    def test_non_placeholder_cdn_cgi_paths_are_not_silently_ignored(self):
        parser = SMOKE.RefParser()
        parser.feed('<a href="/cdn-cgi/trace">trace</a>')
        self.assertEqual(parser.refs, {"/cdn-cgi/trace"})
        self.assertEqual(parser.cloudflare_email_placeholders_skipped, 0)


if __name__ == "__main__":
    unittest.main()
