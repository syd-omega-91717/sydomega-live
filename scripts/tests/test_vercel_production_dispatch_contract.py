#!/usr/bin/env python3
"""Regression contract for safe manual Vercel production promotion.

This is a repository-level workflow guard. It does not prove provider access,
deployment success, or that the production aliases serve the expected commit.
"""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github/workflows/vercel-production.yml").read_text(
    encoding="utf-8"
)


class VercelProductionDispatchContract(unittest.TestCase):
    def test_automatic_production_push_is_main_only(self):
        self.assertIn("push:\n    branches: [main]", WORKFLOW)

    def test_manual_dispatch_refuses_non_main_before_mutation(self):
        guard = "Refuse production promotion from non-main manual dispatch"
        self.assertIn(guard, WORKFLOW)
        guard_pos = WORKFLOW.index(guard)
        deployment_pos = WORKFLOW.index("Deploy to Vercel Production")
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
        deployment_pos = WORKFLOW.index("Deploy to Vercel Production")
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
        deploy_pos = WORKFLOW.index("Deploy to Vercel Production")
        smoke_pos = WORKFLOW.index("Verify production domain smoke routes")
        self.assertLess(deploy_pos, smoke_pos)
        self.assertIn("run: bash scripts/vercel-production-smoke.sh", WORKFLOW)
        self.assertIn("OMEGA_PRODUCTION_BASE_URL: https://sydomega.com", WORKFLOW)

    def test_smoke_script_checks_successful_html_routes(self):
        script = (ROOT / "scripts/vercel-production-smoke.sh").read_text(encoding="utf-8")
        self.assertIn("curl --silent --show-error --fail --location", script)
        self.assertIn("/world.html", script)
        self.assertIn("/evidence.html", script)
        self.assertIn("content_type", script)
        self.assertIn("html_document_marker_missing", script)
    def test_deployment_uses_the_validated_workflow_path(self):
        self.assertIn("needs: validate", WORKFLOW)
        self.assertIn("needs: credentials", WORKFLOW)
        self.assertIn("bash scripts/vercel-deployment-auth-check.sh", WORKFLOW)
        self.assertIn(
            'npx --yes vercel@59.6.0 deploy --prod --yes --token "$VERCEL_TOKEN"',
            WORKFLOW,
        )


if __name__ == "__main__":
    unittest.main()
