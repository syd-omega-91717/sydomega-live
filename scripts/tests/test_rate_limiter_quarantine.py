#!/usr/bin/env python3
"""Ensure the unreleased Cloudflare rate-limiter cannot be deployed by default."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


class RateLimiterQuarantineContract(unittest.TestCase):
    def test_no_default_wrangler_config_can_attach_a_production_route(self):
        self.assertFalse((ROOT / "wrangler.toml").exists())
        example = (ROOT / "wrangler.example.toml").read_text(encoding="utf-8")
        self.assertIn('workers_dev = false', example)
        self.assertNotIn('route =', example)
        self.assertNotIn('zone_id', example)
        self.assertNotIn('RATE_LIMIT_STORE', example)
        self.assertNotIn('RATE_LIMITER', example)

    def test_no_workflow_deploys_the_unreleased_worker(self):
        workflows = ROOT / ".github" / "workflows"
        for path in workflows.glob("*.yml"):
            text = path.read_text(encoding="utf-8", errors="replace")
            with self.subTest(workflow=path.name):
                self.assertNotIn("workers/rate-limiter.js", text)
                self.assertNotIn("wrangler deploy", text.lower())

    def test_operator_docs_do_not_claim_the_worker_is_active(self):
        guide = (ROOT / "QUICK_WINS_DEPLOYMENT.md").read_text(encoding="utf-8")
        self.assertIn("NOT ACTIVE. Do not represent this Worker as deployed", guide)
        self.assertIn("Rate limiting is **not deployed**.", guide)
        self.assertIn("wrangler.example.toml", guide)


if __name__ == "__main__":
    unittest.main()
