#!/usr/bin/env python3
"""Regression contract for the manual Cloudflare production fallback."""

from pathlib import Path
import importlib.util
import subprocess
import textwrap
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github/workflows/cloudflare-pages.yml").read_text(encoding="utf-8")
PRODUCTION_VERIFY = (ROOT / ".github/workflows/cloudflare-production-verify.yml").read_text(encoding="utf-8")
PRODUCTION_SMOKE = (ROOT / "scripts/cloudflare-production-smoke.py").read_text(encoding="utf-8")
SMOKE_REQUIREMENTS = (ROOT / "scripts/requirements.txt").read_text(encoding="utf-8")


class CloudflareManualReleaseContract(unittest.TestCase):
    def test_production_fallback_refuses_non_main_before_mutation(self):
        guard = WORKFLOW.index("Refuse production fallback deploy from non-main")
        deploy = WORKFLOW.index("      - name: Deploy")
        self.assertLess(guard, deploy)
        self.assertIn("github.ref != 'refs/heads/main'", WORKFLOW[guard:deploy])
        self.assertIn("exit 1", WORKFLOW[guard:deploy])

    def test_success_requires_exact_release_manifest_commit(self):
        smoke = WORKFLOW[WORKFLOW.index("      - name: Smoke test the deployment"):]
        self.assertIn("JSON.parse(s).commit_sha", smoke)
        self.assertIn('[ "${served}" = "${GITHUB_SHA}" ] || { echo "::error title=Release manifest mismatch::', smoke)
        self.assertIn("CLOUDFLARE_PAGES=PASS ${url} commit=${served}", smoke)
        self.assertNotIn("release manifest does not name", smoke)


    def test_git_connected_production_release_is_verified_by_exact_sha(self):
        self.assertIn("branches: [main]", PRODUCTION_VERIFY)
        self.assertIn("github.ref != 'refs/heads/main'", PRODUCTION_VERIFY)
        self.assertIn('base="https://sydomega.com"', PRODUCTION_VERIFY)
        self.assertIn("/.well-known/omega-release.json", PRODUCTION_VERIFY)
        self.assertIn("JSON.parse(s).commit_sha", PRODUCTION_VERIFY)
        self.assertIn('"${served}" = "${expected}"', PRODUCTION_VERIFY)
        self.assertIn("content-security-policy:", PRODUCTION_VERIFY)
        self.assertIn("strict-transport-security:", PRODUCTION_VERIFY)
        for route in ("account.html", "profile.html", "world.html", "news.html", "media.html", "privacy.html", "terms.html", "vault.html"):
            self.assertIn(route, PRODUCTION_VERIFY)
        self.assertIn("CLOUDFLARE_PRODUCTION=PASS", PRODUCTION_VERIFY)
        self.assertIn("actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1", PRODUCTION_VERIFY)
        self.assertIn("--location --silent", PRODUCTION_VERIFY)
        self.assertEqual(PRODUCTION_VERIFY.count("for attempt in"), 1)
        self.assertEqual(PRODUCTION_VERIFY.count("for path in"), 1)
        self.assertIn("for attempt in $(seq 1 24)", PRODUCTION_VERIFY)
        self.assertIn("timeout-minutes: 15", PRODUCTION_VERIFY)
        self.assertIn("for path in account.html profile.html world.html news.html media.html privacy.html terms.html vault.html", PRODUCTION_VERIFY)
        self.assertIn("python scripts/cloudflare-production-smoke.py", PRODUCTION_VERIFY)
        self.assertIn('www_code="$(curl --location', PRODUCTION_VERIFY)
        self.assertNotIn("CLOUDFLARE_API_TOKEN", PRODUCTION_VERIFY)
        self.assertIn("config/omega-page-contracts.json", PRODUCTION_SMOKE)
        self.assertIn("class RefParser(HTMLParser)", PRODUCTION_SMOKE)
        self.assertIn("session.request(", PRODUCTION_SMOKE)
        self.assertIn("session.trust_env = False", PRODUCTION_SMOKE)
        self.assertIn("allow_redirects=False", PRODUCTION_SMOKE)
        self.assertIn("verify=True", PRODUCTION_SMOKE)
        self.assertIn("timeout=timeout", PRODUCTION_SMOKE)
        self.assertNotIn("HTTPSConnection(", PRODUCTION_SMOKE)
        self.assertNotIn("urlopen(", PRODUCTION_SMOKE)
        self.assertIn("same_origin_references_checked", PRODUCTION_SMOKE)
        self.assertIn("CLOUDFLARE PRODUCTION SMOKE: PASS", PRODUCTION_SMOKE)

    def test_git_connected_verifier_shell_is_syntactically_valid(self):
        step = PRODUCTION_VERIFY.split(
            "      - name: Verify production manifest, headers and complete page estate", 1
        )[1]
        script = textwrap.dedent(step.split("        run: |", 1)[1])
        result = subprocess.run(
            ["bash", "-n"],
            input=script,
            text=True,
            capture_output=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stderr)

    def test_production_smoke_rejects_unsafe_url_schemes_and_cross_origin_redirects(self):
        source = ROOT / "scripts/cloudflare-production-smoke.py"
        spec = importlib.util.spec_from_file_location("omega_production_smoke", source)
        self.assertIsNotNone(spec)
        self.assertIsNotNone(spec.loader)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        self.assertFalse(module.is_safe_http_url("file:///etc/passwd"))
        self.assertFalse(module.is_safe_http_url("https://user:secret@sydomega.com/"))
        self.assertFalse(module.is_safe_http_url("https://other.example/", "sydomega.com", 443))
        self.assertTrue(module.is_safe_http_url("https://sydomega.com/", "sydomega.com", 443))
        handler = module.SameOriginRedirectHandler("sydomega.com", 443)
        request = module.Request("https://sydomega.com/")
        self.assertIsNone(handler.redirect_request(
            request, None, 302, "Found", {}, "https://other.example/"
        ))
        status, _, detail = module.request_url("file:///etc/passwd", "GET", 1)
        self.assertEqual(status, 0)
        self.assertIn("unsupported URL", detail)
    def test_production_smoke_dependency_is_pinned_and_installed_only_for_verification(self):
        self.assertIn("requests==2.34.2", SMOKE_REQUIREMENTS)
        self.assertIn("scripts/requirements.txt", WORKFLOW)
        self.assertIn("python -m pip install", WORKFLOW)

    def test_production_smoke_rejects_unsafe_url_schemes_and_hosts(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location(
            "cloudflare_production_smoke", ROOT / "scripts/cloudflare-production-smoke.py"
        )
        module = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(module)
        self.assertEqual(module.validate_request_url("https://sydomega.com"), "https://sydomega.com")
        self.assertEqual(
            module.validate_request_url("https://preview.sydomega-live.pages.dev"),
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
                module.validate_request_url(unsafe)

    def test_missing_credentials_never_attempts_deploy(self):
        self.assertIn("ready=false", WORKFLOW)
        self.assertIn("steps.creds.outputs.ready == 'true'", WORKFLOW)
        self.assertIn("npx --yes", WORKFLOW)


if __name__ == "__main__":
    unittest.main()
