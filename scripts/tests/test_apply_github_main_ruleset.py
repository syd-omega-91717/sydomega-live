#!/usr/bin/env python3
"""Tests for the controlled GitHub main-ruleset application helper."""
from __future__ import annotations

import contextlib
import copy
import importlib.util
import io
import json
import os
import pathlib
import unittest
from unittest.mock import MagicMock, patch

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
    def setUp(self):
        self.config = json.loads(CONFIG.read_text(encoding="utf-8"))

    def test_missing_token_fails_without_network(self):
        with patch.dict(os.environ, {}, clear=True), patch.object(MODULE, "request") as request:
            self.assertEqual(MODULE.main(), 2)
        request.assert_not_called()

    def test_verifier_rejects_inactive_ruleset(self):
        state = copy.deepcopy(self.config)
        state["id"] = MODULE.RULESET_ID
        state["enforcement"] = "disabled"
        with self.assertRaisesRegex(RuntimeError, "not active"):
            MODULE.verify(state, self.config)

    def test_verifier_accepts_the_complete_active_ruleset(self):
        state = copy.deepcopy(self.config)
        state["id"] = MODULE.RULESET_ID
        MODULE.verify(state, self.config)

    def test_verifier_rejects_a_missing_required_check(self):
        state = copy.deepcopy(self.config)
        state["id"] = MODULE.RULESET_ID
        state["rules"][-1]["parameters"]["required_status_checks"].pop()
        with self.assertRaisesRegex(RuntimeError, "required status check contexts"):
            MODULE.verify(state, self.config)

    def test_apply_reads_identity_then_puts_and_verifies(self):
        output = io.StringIO()
        before = {"id": MODULE.RULESET_ID, "name": self.config["name"]}
        after = copy.deepcopy(self.config)
        after["id"] = MODULE.RULESET_ID
        with patch.dict("os.environ", {"GH_REPO_ADMIN_TOKEN": "test-token"}), patch.object(
            MODULE, "request", side_effect=[before, {}, after]
        ) as request, contextlib.redirect_stdout(output):
            self.assertEqual(MODULE.main(), 0)
        self.assertEqual(request.call_count, 3)
        self.assertEqual(request.call_args_list[0].args, ("GET", "test-token"))
        self.assertEqual(request.call_args_list[1].args, ("PUT", "test-token", self.config))
        self.assertEqual(request.call_args_list[2].args, ("GET", "test-token"))
        self.assertIn("GITHUB_MAIN_RULESET=ACTIVE", output.getvalue())
        self.assertNotIn("test-token", output.getvalue())

    def test_request_uses_fixed_https_host_and_path(self):
        connection = MagicMock()
        response = MagicMock(status=200)
        response.read.return_value = b'{"ok":true}'
        connection.getresponse.return_value = response
        with patch.object(MODULE.http.client, "HTTPSConnection", return_value=connection) as connect:
            result = MODULE.request("GET", "test-token")
        kwargs = connect.call_args.kwargs
        self.assertEqual(connect.call_args.args, ("api.github.com",))
        self.assertEqual(kwargs["timeout"], 20)
        self.assertIsInstance(kwargs["context"], MODULE.ssl.SSLContext)
        self.assertTrue(kwargs["context"].check_hostname)
        self.assertEqual(kwargs["context"].verify_mode, MODULE.ssl.CERT_REQUIRED)
        connection.request.assert_called_once()
        args, kwargs = connection.request.call_args
        self.assertEqual(args, ("GET", "/repos/syd-omega-91717/sydomega-live/rulesets/20176798"))
        self.assertIsNone(kwargs["body"])
        self.assertEqual(kwargs["headers"]["Authorization"], "Bearer test-token")
        self.assertEqual(result, {"ok": True})
        connection.close.assert_called_once()

    def test_request_rejects_unsupported_method_before_connecting(self):
        with patch.object(MODULE.http.client, "HTTPSConnection") as connect:
            with self.assertRaisesRegex(ValueError, "unsupported GitHub API method"):
                MODULE.request("POST", "test-token")
        connect.assert_not_called()

    def test_request_rejects_non_success_http_status_and_closes_connection(self):
        connection = MagicMock()
        response = MagicMock(status=403)
        response.read.return_value = b'{"message":"forbidden"}'
        connection.getresponse.return_value = response
        with patch.object(MODULE.http.client, "HTTPSConnection", return_value=connection):
            with self.assertRaisesRegex(RuntimeError, "HTTP 403"):
                MODULE.request("GET", "test-token")
        connection.close.assert_called_once()

    def test_manual_workflow_is_main_only_and_environment_protected(self):
        workflow = (ROOT / ".github/workflows/github-main-ruleset-activation.yml").read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:", workflow)
        self.assertIn("if: github.ref == 'refs/heads/main'", workflow)
        self.assertIn("environment: github-repository-admin", workflow)
        self.assertNotRegex(workflow, r"(?m)^\s*(?:push|pull_request|schedule):")
        self.assertIn("python3 scripts/apply-github-main-ruleset.py", workflow)


if ( __name__ == "__main__"):
    unittest.main()
