#!/usr/bin/env python3
"""Regression contract: Vercel is an artifact builder, not the production host."""

from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github/workflows/vercel-production.yml").read_text(encoding="utf-8")
CLOUDFLARE_VERIFY = (ROOT / ".github/workflows/cloudflare-production-verify.yml").read_text(encoding="utf-8")
PRODUCTION_SMOKE = (ROOT / ".github/workflows/production-smoke.yml").read_text(encoding="utf-8")


class VercelBuildArtifactContract(unittest.TestCase):
    def test_vercel_workflow_is_build_only(self):
        self.assertIn("name: Vercel Build Artifact Validation", WORKFLOW)
        self.assertIn("name: Validate static build artifact and release contracts", WORKFLOW)
        self.assertIn("Build static artifact", WORKFLOW)
        self.assertIn("bash scripts/vercel-build.sh", WORKFLOW)
        self.assertIn("STATIC_BUILD_ARTIFACT=PASS", WORKFLOW)
        for forbidden in (
            "VERCEL_TOKEN",
            "VERCEL_ORG_ID",
            "VERCEL_PROJECT_ID",
            "vercel deploy",
            "deploy --prebuilt --prod",
            "Production promotion",
            "credentials:",
            "inputs.deploy",
        ):
            self.assertNotIn(forbidden, WORKFLOW)

    def test_artifact_workflow_is_main_scoped_and_read_only(self):
        self.assertIn("push:\\n    branches: [main]", WORKFLOW)
        self.assertIn("pull_request:\\n    branches: [main]", WORKFLOW)
        self.assertIn("permissions:\\n  contents: read", WORKFLOW)
        self.assertIn("concurrency:", WORKFLOW)
        self.assertIn("cancel-in-progress: false", WORKFLOW)

    def test_vercel_git_deploy_is_disabled_for_every_branch_class(self):
        vercel = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        enabled = vercel.get("git", {}).get("deploymentEnabled", {})
        for pattern in ("*", "**", "main"):
            self.assertIs(enabled.get(pattern), False, pattern)

    def test_cloudflare_is_the_exact_sha_production_release_owner(self):
        self.assertIn("branches: [main]", CLOUDFLARE_VERIFY)
        self.assertIn("https://sydomega.com", CLOUDFLARE_VERIFY)
        self.assertIn("GITHUB_SHA", CLOUDFLARE_VERIFY)
        self.assertIn("CLOUDFLARE_PRODUCTION=PASS", CLOUDFLARE_VERIFY)
        self.assertIn("curl --location", CLOUDFLARE_VERIFY)
        self.assertIn("content-security-policy:", CLOUDFLARE_VERIFY)
        self.assertIn("strict-transport-security:", CLOUDFLARE_VERIFY)

    def test_scheduled_production_smoke_uses_cloudflare_and_full_page_registry(self):
        self.assertIn("Wait for exact Cloudflare Pages production release", PRODUCTION_SMOKE)
        self.assertIn("omega-release.json", PRODUCTION_SMOKE)
        self.assertIn('expected = os.environ["GITHUB_SHA"]', PRODUCTION_SMOKE)
        self.assertIn("cloudflare-production-smoke.py", PRODUCTION_SMOKE)
        self.assertIn("vercel-production-surface-smoke.py", PRODUCTION_SMOKE)
        self.assertNotIn("Vercel", PRODUCTION_SMOKE)

    def test_page_identity_smoke_remains_available(self):
        script = (ROOT / "scripts/vercel-production-surface-smoke.py").read_text(encoding="utf-8")
        self.assertIn('PUBLIC.rglob("*.html")', script)
        self.assertIn("ThreadPoolExecutor", script)
        self.assertIn("PRODUCTION_SURFACE=PASS", script)
        self.assertIn("PRODUCTION_SURFACE=FAIL", script)


if __name__ == "__main__":
    unittest.main()
