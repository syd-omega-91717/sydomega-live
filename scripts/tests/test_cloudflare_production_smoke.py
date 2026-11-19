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
            (0, "", "unsupported_url_scheme_or_authority"),
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

    def test_smoke_requests_use_browser_compatible_headers(self):
        headers = SMOKE.REQUEST_HEADERS
        self.assertTrue(headers["User-Agent"].startswith("Mozilla/5.0"))
        self.assertIn("Chrome/", headers["User-Agent"])
        self.assertEqual(headers["Cache-Control"], "no-cache")
        self.assertEqual(headers["Accept-Language"], "en-US,en;q=0.9")
        self.assertEqual(headers["Accept-Encoding"], "gzip, deflate")

    def test_global_omega_experience_assets_are_part_of_release_smoke(self):
        assets = SMOKE.REQUIRED_GLOBAL_ASSETS
        self.assertEqual(len(assets), 6)
        self.assertEqual(assets[0][0], "/bg.js")
        self.assertEqual(assets[0][2], "omega-platform-experience-v5.css")
        self.assertEqual(assets[1][0], "/omega-platform-experience-v4.css")
        self.assertIn("PLATFORM EXPERIENCE V4", assets[1][2])
        self.assertEqual(assets[2][0], "/omega-platform-experience-v5.css")
        self.assertIn("PLATFORM EXPERIENCE V5", assets[2][2])
        self.assertEqual(assets[3][0], "/bg.js")
        self.assertEqual(assets[3][2], "omega-domain-hub.css")
        self.assertEqual(assets[4][0], "/omega-domain-hubs.js")
        self.assertEqual(assets[5][0], "/omega-domain-hub.css")

    def test_bootstrap_asset_markers_follow_the_live_release_fingerprint(self):
        version = "0123456789ab"
        self.assertEqual(
            SMOKE.expected_global_asset_url("/bg.js", version),
            "/bg.js?v=0123456789ab",
        )
        self.assertEqual(
            SMOKE.expected_global_asset_url("/omega-platform-experience-v5.css", version),
            "/omega-platform-experience-v5.css",
        )
        self.assertEqual(
            SMOKE.expected_global_asset_marker(
                "/bg.js", "omega-platform-experience-v5.css", version
            ),
            "omega-platform-experience-v5.css?v=0123456789ab",
        )
        self.assertEqual(
            SMOKE.expected_global_asset_marker(
                "/omega-platform-experience-v5.css", "PLATFORM EXPERIENCE V5", version
            ),
            "PLATFORM EXPERIENCE V5",
        )

    def test_release_manifest_must_supply_a_full_commit_sha(self):
        self.assertEqual(
            SMOKE.release_asset_version_from_manifest('{"commit_sha":"' + "a" * 40 + '"}'),
            "aaaaaaaaaaaa",
        )
        with self.assertRaises(ValueError):
            SMOKE.release_asset_version_from_manifest('{"commit_sha":"short"}')

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
