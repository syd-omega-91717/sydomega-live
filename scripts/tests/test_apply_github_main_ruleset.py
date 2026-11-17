#!/usr/bin/env python3
"""Tests for the controlled GitHub main-ruleset application helper."""
from __future__ import annotations

import importlib.util
import io
import json
import os
import pathlib
import unittest
from unittest.mock import patch

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "apply-github-main-ruleset.py"
CONFIG = ROOT / "config" / "github-main-ruleset.json"
SPEC = importlib.util.spec_from_file_location("apply_github_main_ruleset", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)


class RulesetConfigTests(unittest.TestCase):
    def setUp(self):
        self.config = json.loads(CONFIG.read_text(encoding="utf-8"))

    def test_exact_main_only_scope_and_no_bypass(self):
        self.assertEqual(self.config["enforcement"], "active")
        self.assertEqual(self.config["target"], "branch")
        self.assertEqual(self.config["conditions"]["ref_name"]["include"], ["refs/heads/main"])
        self.assertEqual(self.config["conditions"]["ref_name"]["exclude"], [])
        self.assertEqual(self.config["bypass_actors"], [])

    def test_pr_and_required_check_rules_are_present(self):
        rules = {r["type"]: r.get("parameters", {}) for r in self.config["rules"]}
        self.assertTrue({"deletion", "non_fast_forward", "pull_request", "required_status_checks"}.issubset(rules))
        self.assertEqual(rules["pull_request"]["required_approving_review_count"], 0)
        self.assertTrue(rules["pull_request"]["required_review_thread_resolution"])
        self.assertTrue(rules["required_status_checks"]["strict_required_status_checks_policy"])
        contexts = [x["context"] for x in rules["required_status_checks"]["required_status_checks"]]
        self.assertEqual(len(contexts), len(set(contexts)))
        self.assertGreaterEqual(len(contexts), 15)


class RulesetApplyTests(unittest.TestCase):
    def test_missing_token_fails_without_network(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(MODULE, "request") as request:
            self.assertEqual(MODULE.main(), 2)
        request.assert_not_called()

    def test_verifier_rejects_inactive_ruleset(self):
        import copy
        state = copy.deepcopy(self.config)
        state["id"] = MODULE.RULESET_ID
        with self.assertRaisesRegex(RuntimeError, "not active"):
            MODULE.verify(state, self.config)

    def test_verifier_accepts_the_complete_active_ruleset(self):
        state = dict(self.config)
        state["id"] = MODULE.RULESET_ID
        MODULE.verify(state, self.config)

    def test_verifier_rejects_a_missing_required_check(self):
        import copy
        state = copy.deepcopy(self.config)
        state["id"] = MODULE.RULESET_ID
        state["rules"][-1]["parameters"]["required_status_checks"].pop()
        with self.assertRaisesRegex(RuntimeError, "required checks missing"):
            MODULE.verify(state, self.config)

    def test_manual_workflow_is_main_only_and_environment_protected(self):
        workflow = (ROOT / ".github/workflows/github-main-ruleset-activation.yml").read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:", workflow)
        self.assertIn("if: github.ref == 'refs/heads/main'", workflow)
        self.assertIn("environment: github-repository-admin", workflow)
        self.assertNotRegex(workflow, r"(?m)^\\s*(?:push|pull_request|schedule):")
        self.assertIn("python3 scripts/apply-github-main-ruleset.py", workflow)



if __name__ == "__main__":
    unittest.main()
