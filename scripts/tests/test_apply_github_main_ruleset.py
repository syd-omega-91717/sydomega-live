#!/usr/bin/env python3
"""Tests for the controlled GitHub main-ruleset application helper."""
from __future__ import annotations

import contextlib
import copy
import importlib.util
import io
import json
import os
import re
import subprocess
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

    def test_request_uses_curl_with_fixed_https_url_and_verified_tls(self):
        completed = subprocess.CompletedProcess(
            args=["curl"], returncode=0,
            stdout=b'{"ok":true}\n__OMEGA_HTTP_STATUS__200', stderr=b"",
        )
        with patch.object(MODULE.subprocess, "run", return_value=completed) as run:
            result = MODULE.request("GET", "test-token")
        args = run.call_args.args[0]
        self.assertEqual(args[0], "curl")
        self.assertIn("--disable", args)
        self.assertIn("--noproxy", args)
        self.assertIn("*", args)
        self.assertIn("--config", args)
        self.assertIn("-", args)
        self.assertIn("--proto", args)
        self.assertIn("=https", args)
        self.assertIn("--tlsv1.2", args)
        self.assertIn("--fail-with-body", args)
        self.assertNotIn("--insecure", args)
        self.assertNotIn("-k", args)
        self.assertNotIn("test-token", args)
        config = run.call_args.kwargs["input"].decode("utf-8")
        self.assertIn('url = "https://api.github.com/repos/syd-omega-91717/sydomega-live/rulesets/20176798"', config)
        self.assertIn('request = "GET"', config)
        self.assertIn("Authorization: Bearer test-token", config)
        self.assertEqual(run.call_args.kwargs["timeout"], 25)
        self.assertTrue(run.call_args.kwargs["capture_output"])
        self.assertFalse(run.call_args.kwargs["check"])
        self.assertEqual(result, {"ok": True})

    def test_put_payload_is_passed_as_a_private_temporary_file(self):
        payload = {"enforcement": "active", "name": "sydomega_merged"}
        completed = subprocess.CompletedProcess(
            args=["curl"], returncode=0,
            stdout=b'{"ok":true}\n__OMEGA_HTTP_STATUS__200', stderr=b"",
        )

        def inspect_call(args, **kwargs):
            config = kwargs["input"].decode("utf-8")
            match = re.search(r'data-binary = "(@[^"]+)"', config)
            self.assertIsNotNone(match)
            payload_path = pathlib.Path(match.group(1)[1:])
            self.assertTrue(payload_path.is_file())
            self.assertEqual(json.loads(payload_path.read_text(encoding="utf-8")), payload)
            self.assertIn('request = "PUT"', config)
            return completed

        with patch.object(MODULE.subprocess, "run", side_effect=inspect_call):
            self.assertEqual(MODULE.request("PUT", "test-token", payload), {"ok": True})

    def test_request_rejects_token_line_breaks_before_process(self):
        with patch.object(MODULE.subprocess, "run") as run:
            with self.assertRaisesRegex(ValueError, "invalid line break"):
                MODULE.request("GET", "test-token\nInjected: header")
        run.assert_not_called()

    def test_request_rejects_unsupported_method_before_process(self):
        with patch.object(MODULE.subprocess, "run") as run:
            with self.assertRaisesRegex(ValueError, "unsupported GitHub API method"):
                MODULE.request("POST", "test-token")
        run.assert_not_called()

    def test_request_rejects_non_success_http_status(self):
        completed = subprocess.CompletedProcess(
            args=["curl"], returncode=22,
            stdout=b'{"message":"forbidden"}\n__OMEGA_HTTP_STATUS__403',
            stderr=b"HTTP 403",
        )
        with patch.object(MODULE.subprocess, "run", return_value=completed):
            with self.assertRaisesRegex(RuntimeError, "HTTP 403"):
                MODULE.request("GET", "test-token")

    def test_manual_workflow_is_main_only_and_environment_protected(self):
        workflow = (ROOT / ".github/workflows/github-main-ruleset-activation.yml").read_text(encoding="utf-8")
        self.assertIn("workflow_dispatch:", workflow)
        self.assertIn("if: github.ref == 'refs/heads/main'", workflow)
        self.assertIn("environment: github-repository-admin", workflow)
        self.assertNotRegex(workflow, r"(?m)^\s*(?:push|pull_request|schedule):")
        self.assertIn("python3 scripts/apply-github-main-ruleset.py", workflow)


if ( __name__ == "__main__"):
    unittest.main()
