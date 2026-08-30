#!/usr/bin/env python3
"""
Regression tests for scripts/workflow-contract.py's runs-on assertion (#157).

WHY THIS EXISTS

The check used to require `runs-on: self-hosted` literally. That made the repo
enforce the opposite of what issue #157 asks for: with GitHub-hosted runners
unprovisioned the gates were routed to the registered Windows runner, and the
contract then froze that choice — flipping a gate back to `ubuntu-latest` once
billing/policy is fixed would fail this very check. The contract would have
blocked its own fix, and it would have done so at the least convenient moment,
mid-migration.

#157's acceptance criterion is a non-zero runner id, at least one executed
step, and a real job log. That is a statement about execution, not about which
fleet provided the machine — and the RUNNER_NAME / "Execution marker"
assertions are what actually prove it. So the runner assertion now accepts
either kind, while still rejecting a label the job could never be assigned to.

`ubuntu-slim` is deliberately not accepted. Three days of runs on it produced
the runner_id 0 / steps [] / BlobNotFound signature, and the hosted probe
reproduced that on plain `ubuntu-latest` too — so the label was never the
cause, but there is no reason to bless one this repo has no evidence ever
worked here.

Run: python3 -m unittest scripts/tests/test_workflow_contract.py -v
"""

import os
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "workflow-contract.py")
WORKFLOWS = os.path.join(ROOT, ".github", "workflows")
GATES = ("ci.yml", "production-contract.yml", "capability-evidence.yml")


class RunsOnAssertion(unittest.TestCase):
    """The gate must run somewhere real — not specifically on self-hosted."""

    def _run_with_label(self, label, gate="ci.yml"):
        """Copy the repo's scripts + workflows into a fixture, rewrite one
        gate's runs-on, and run the real contract against it.

        workflow-contract.py resolves WORKFLOWS from its own __file__, so
        copying it into <fixture>/scripts/ points it at the fixture.
        """
        d = tempfile.mkdtemp(prefix="omega-wc-")
        self.addCleanup(shutil.rmtree, d, True)
        os.makedirs(os.path.join(d, "scripts"))
        shutil.copytree(WORKFLOWS, os.path.join(d, ".github", "workflows"))
        shutil.copy(SCRIPT, os.path.join(d, "scripts", "workflow-contract.py"))

        target = os.path.join(d, ".github", "workflows", gate)
        with open(target, encoding="utf-8") as fh:
            text = fh.read()
        text = re.sub(r"^(\s*)runs-on: .*$", r"\g<1>runs-on: " + label, text,
                      count=1, flags=re.M)
        with open(target, "w", encoding="utf-8") as fh:
            fh.write(text)

        proc = subprocess.run([sys.executable, os.path.join(d, "scripts", "workflow-contract.py")],
                              capture_output=True, text=True, timeout=60)
        return proc

    def test_self_hosted_accepted(self):
        """The current arrangement, while hosted runners are unprovisioned."""
        self.assertEqual(self._run_with_label("self-hosted").returncode, 0)

    def test_hosted_labels_accepted_so_the_contract_cannot_block_its_own_fix(self):
        """The regression this file exists for: when #157's account-level fix
        lands, switching a gate back must not be blocked by our own check."""
        for label in ("ubuntu-latest", "ubuntu-24.04", "windows-latest", "macos-latest"):
            with self.subTest(label=label):
                proc = self._run_with_label(label)
                self.assertEqual(proc.returncode, 0,
                                 f"{label} rejected: {proc.stdout}{proc.stderr}")

    def test_matrix_style_label_list_accepted(self):
        """`runs-on: [self-hosted, Windows, X64]` is the form the probe uses."""
        self.assertEqual(self._run_with_label("[self-hosted, Windows, X64]").returncode, 0)

    def test_unassignable_labels_still_rejected(self):
        """A typo or an unproven image is how a job sits unassigned forever —
        the runner_id 0 / steps [] signature #157 documents. Still a failure."""
        for label in ("ubuntu-slim", "ubunut-latest", "not-a-runner"):
            with self.subTest(label=label):
                proc = self._run_with_label(label)
                self.assertEqual(proc.returncode, 1, f"{label} accepted: {proc.stdout}")
                self.assertIn("runs-on", proc.stdout)

    def test_missing_runs_on_is_rejected(self):
        d = tempfile.mkdtemp(prefix="omega-wc-")
        self.addCleanup(shutil.rmtree, d, True)
        os.makedirs(os.path.join(d, "scripts"))
        shutil.copytree(WORKFLOWS, os.path.join(d, ".github", "workflows"))
        shutil.copy(SCRIPT, os.path.join(d, "scripts", "workflow-contract.py"))
        target = os.path.join(d, ".github", "workflows", "ci.yml")
        with open(target, encoding="utf-8") as fh:
            text = fh.read()
        with open(target, "w", encoding="utf-8") as fh:
            fh.write(re.sub(r"^\s*runs-on: .*$", "", text, count=1, flags=re.M))
        proc = subprocess.run([sys.executable, os.path.join(d, "scripts", "workflow-contract.py")],
                              capture_output=True, text=True, timeout=60)
        self.assertEqual(proc.returncode, 1)
        self.assertIn("runs-on", proc.stdout)

    def test_every_gate_is_checked_not_just_the_first(self):
        """All three gates carry the assertion independently."""
        for gate in GATES:
            with self.subTest(gate=gate):
                self.assertEqual(self._run_with_label("not-a-runner", gate=gate).returncode, 1)


if __name__ == "__main__":
    unittest.main()
