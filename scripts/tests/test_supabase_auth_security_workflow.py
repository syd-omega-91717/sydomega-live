#!/usr/bin/env python3
"""Static safety contract for the manual Supabase Auth HIBP workflow."""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = ROOT / ".github" / "workflows" / "supabase-auth-security-config.yml"


class SupabaseAuthSecurityWorkflowContract(unittest.TestCase):
    def test_workflow_is_manual_only(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:", text)
        self.assertNotRegex(text, r"(?m)^\s*(?:push|pull_request|schedule):")

    def test_live_mutation_is_main_only_and_environment_protected(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("if: github.ref == 'refs/heads/main'", text)
        self.assertIn("environment: supabase-production", text)
        self.assertIn("cancel-in-progress: false", text)

    def test_only_scoped_management_token_is_passed_to_existing_helper(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertIn("SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}", text)
        self.assertIn("python3 scripts/enable-supabase-hibp.py", text)
        self.assertNotIn("echo ${SUPABASE_ACCESS_TOKEN}", text)
        self.assertNotIn("set -x", text)

    def test_checkout_and_python_actions_are_pinned(self):
        text = WORKFLOW.read_text(encoding="utf-8")
        self.assertRegex(text, r"actions/checkout@[0-9a-f]{40}")
        self.assertRegex(text, r"actions/setup-python@[0-9a-f]{40}")


if __name__ == "__main__":
    unittest.main()
