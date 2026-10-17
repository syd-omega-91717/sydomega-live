#!/usr/bin/env python3
"""Regression contract for safe manual Vercel production promotion.

This is a repository-level workflow guard. It does not prove provider access,
deployment success, or that the production aliases serve the expected commit.
"""

from pathlib import Path
import json
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github/workflows/vercel-production.yml").read_text(
    encoding="utf-8"
)


class VercelProductionDispatchContract(unittest.TestCase):
    def test_automatic_production_push_is_main_only(self):
        self.assertIn("push:\n    branches: [main]", WORKFLOW)

    def test_supabase_migration_evidence_does_not_trigger_static_site_deploy(self):
        push_config = WORKFLOW.split("  pull_request:", 1)[0]
        positive_json = "      - '**/*.json'"
        negative_supabase = "      - '!supabase/**'"
        negative_runtime_evidence = "      - '!docs/runtime/supabase-edge-functions-live.json'"
        self.assertIn(positive_json, push_config)
        self.assertIn(negative_supabase, push_config)
        self.assertIn(negative_runtime_evidence, push_config)
        self.assertLess(
            push_config.index(positive_json),
            push_config.index(negative_supabase),
        )

    def test_manual_dispatch_refuses_non_main_before_mutation(self):
        guard = "Refuse production promotion from non-main manual dispatch"
        self.assertIn(guard, WORKFLOW)
        guard_pos = WORKFLOW.index(guard)
        deployment_pos = WORKFLOW.index("Deploy prebuilt production artifact")
        self.assertLess(guard_pos, deployment_pos)
        self.assertIn(
            "github.event_name == 'workflow_dispatch' && "
            "github.ref != 'refs/heads/main'",
            WORKFLOW,
        )
        self.assertIn("exit 1", WORKFLOW[guard_pos:deployment_pos])

    def test_missing_credentials_fail_when_production_deploy_is_requested(self):
        guard = "Controlled state when token is unavailable"
        guard_pos = WORKFLOW.index(guard)
        deployment_pos = WORKFLOW.index("Deploy prebuilt production artifact")
        block = WORKFLOW[guard_pos:deployment_pos]
        self.assertIn("DEPLOY_REQUESTED:", block)
        self.assertIn(
            "github.event_name == 'push' || "
            "(github.event_name == 'workflow_dispatch' && inputs.deploy == true)",
            block,
        )
        self.assertIn('if [[ "$DEPLOY_REQUESTED" == "true" ]]; then', block)
        self.assertIn("exit 1", block)
        self.assertIn("do not treat artifact validation as a production deployment", block)

    def test_production_smoke_runs_after_a_requested_successful_deploy(self):
        deploy_pos = WORKFLOW.index("Deploy prebuilt production artifact")
        smoke_pos = WORKFLOW.index("Verify production domain smoke routes")
        self.assertLess(deploy_pos, smoke_pos)
        self.assertIn("run: bash scripts/vercel-production-smoke.sh", WORKFLOW)
        self.assertIn("OMEGA_PRODUCTION_BASE_URL: https://sydomega.com", WORKFLOW)
        self.assertIn("EXPECTED_RELEASE_SHA: ${{ github.sha }}", WORKFLOW)
        script = (ROOT / "scripts/vercel-production-smoke.sh").read_text(encoding="utf-8")
        self.assertIn("served_commit_mismatch", script)

    def test_smoke_script_checks_successful_html_routes(self):
        script = (ROOT / "scripts/vercel-production-smoke.sh").read_text(encoding="utf-8")
        self.assertIn("curl --silent --show-error --fail --location", script)
        self.assertIn("/world.html", script)
        self.assertIn("/evidence.html", script)
        self.assertIn("content_type", script)
        self.assertIn("html_document_marker_missing", script)

    def test_smoke_redirects_stay_on_expected_https_host(self):
        script = (ROOT / "scripts/vercel-production-smoke.sh").read_text(encoding="utf-8")
        self.assertIn("--proto '=https'", script)
        self.assertIn("--proto-redir '=https'", script)
        self.assertIn('if [[ "$effective_host" != "$EXPECTED_HOST" ]]; then', script)
        self.assertIn("redirect_left_expected_host", script)
        self.assertIn('EXPECTED_HOST="${EXPECTED_HOST%%/*}"', script)

    def test_git_auto_deploy_is_disabled_in_favor_of_controlled_release(self):
        vercel = json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))
        deployment_enabled = vercel.get("git", {}).get("deploymentEnabled", {})
        for pattern in ("*", "**", "main"):
            self.assertIs(deployment_enabled.get(pattern), False, pattern)
        self.assertIn("Controlled state when token is unavailable", WORKFLOW)
        self.assertIn("DEPLOY_REQUESTED:", WORKFLOW)
        self.assertIn("needs.credentials.outputs.ready == 'true'", WORKFLOW)
        self.assertIn('npx --yes vercel@59.6.0 deploy --prebuilt --prod --yes --token "$VERCEL_TOKEN"', WORKFLOW)

    def test_deployment_uses_the_validated_workflow_path(self):
        self.assertIn("needs: validate", WORKFLOW)
        self.assertIn("needs: credentials", WORKFLOW)
        self.assertIn("bash scripts/vercel-deployment-auth-check.sh", WORKFLOW)
        self.assertIn('npx --yes vercel@59.6.0 pull --yes --environment=production --token "$VERCEL_TOKEN"', WORKFLOW)
        self.assertIn('npx --yes vercel@59.6.0 build --prod --yes --token "$VERCEL_TOKEN"', WORKFLOW)
        self.assertIn('npx --yes vercel@59.6.0 deploy --prebuilt --prod --yes --token "$VERCEL_TOKEN"', WORKFLOW)
        self.assertIn("node scripts/omega-release-manifest.mjs --check .vercel/output/static/.well-known/omega-release.json", WORKFLOW)


if __name__ == "__main__":
    unittest.main()
