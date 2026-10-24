#!/usr/bin/env python3
"""Regression contract for the manual Cloudflare production fallback."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github/workflows/cloudflare-pages.yml").read_text(encoding="utf-8")


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

    def test_missing_credentials_never_attempts_deploy(self):
        self.assertIn("ready=false", WORKFLOW)
        self.assertIn("steps.creds.outputs.ready == 'true'", WORKFLOW)
        self.assertIn("npx --yes", WORKFLOW)


if __name__ == "__main__":
    unittest.main()
