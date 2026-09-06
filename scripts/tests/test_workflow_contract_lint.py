#!/usr/bin/env python3
"""
Regression tests for scripts/workflow-contract-lint.py's concurrency rule.

WHY THIS EXISTS

Measured 2026-09-06 (FIXES_LOG.md 112): ci.yml runs 1031-1060 and
supabase-runtime-contract runs 322-348 on main were EVERY ONE `cancelled`.
Each was created, sat `pending` with zero jobs allocated -- one for 4h31m --
and was then cancelled by the next push before a runner was ever assigned. Not
one reached a conclusion, and because the board showed them pending rather than
red, nothing surfaced it. Both had a ref-keyed concurrency group with
`cancel-in-progress: false`; the 13 workflows that set `true` finish in 10-25
seconds on the same commits.

The rule must fire on that shape and must NOT fire on a FIXED group with
`false` -- vercel-production.yml uses `group: vercel-production` deliberately,
because an in-flight production deploy must not be cancelled by a newer push,
and it does reach conclusions.

The first version of this rule silently passed on the very file it was written
for: the explanatory comment sat between `concurrency:` and
`cancel-in-progress:`, and the block regex stopped at the first unindented
line. test_comment_inside_the_block_does_not_hide_the_violation is that bug.

Like audit.py, the script resolves its own ROOT from __file__, so these tests
build throwaway fixtures and run it as a subprocess the way CI does.

Run: python3 -m unittest scripts/tests/test_workflow_contract_lint.py -v
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "workflow-contract-lint.py")

JOB = "jobs:\n  a:\n    runs-on: ubuntu-latest\n    steps:\n      - run: echo hi\n"


class LintFixture:
    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="omega-wcl-")
        os.makedirs(os.path.join(self.dir, "scripts"))
        os.makedirs(os.path.join(self.dir, ".github", "workflows"))
        shutil.copy(SCRIPT, os.path.join(self.dir, "scripts", "workflow-contract-lint.py"))

    def write(self, name, text):
        with open(os.path.join(self.dir, ".github", "workflows", name), "w",
                  encoding="utf-8") as fh:
            fh.write(text)

    def run(self):
        r = subprocess.run(
            [sys.executable, os.path.join("scripts", "workflow-contract-lint.py")],
            cwd=self.dir, capture_output=True, text=True, timeout=60)
        return r.returncode, r.stdout

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class ConcurrencyStarvationTests(unittest.TestCase):
    def setUp(self):
        self.fx = LintFixture()

    def tearDown(self):
        self.fx.cleanup()

    def test_ref_keyed_group_with_cancel_false_is_rejected(self):
        self.fx.write("w.yml",
                      "name: W\non:\n  push:\n    branches: [main]\n"
                      "concurrency:\n  group: w-${{ github.ref }}\n"
                      "  cancel-in-progress: false\n" + JOB)
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("cancel-in-progress: false", out)
        self.assertIn("never concludes", out)

    def test_head_ref_keyed_group_with_cancel_false_is_rejected(self):
        self.fx.write("w.yml",
                      "name: W\non:\n  pull_request:\n    branches: [main]\n"
                      "concurrency:\n  group: w-${{ github.head_ref }}\n"
                      "  cancel-in-progress: false\n" + JOB)
        self.assertEqual(self.fx.run()[0], 1)

    def test_ref_keyed_group_with_cancel_true_passes(self):
        self.fx.write("w.yml",
                      "name: W\non:\n  push:\n    branches: [main]\n"
                      "concurrency:\n  group: w-${{ github.ref }}\n"
                      "  cancel-in-progress: true\n" + JOB)
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("PASS", out)

    def test_fixed_group_with_cancel_false_is_allowed(self):
        """THE FALSE-POSITIVE CONTROL. vercel-production.yml's real shape: a
        deploy in flight must not be cancelled by a newer push, and it does
        reach conclusions. A rule that flagged this would be wrong."""
        self.fx.write("w.yml",
                      "name: W\non:\n  push:\n    branches: [main]\n"
                      "concurrency:\n  group: vercel-production\n"
                      "  cancel-in-progress: false\n" + JOB)
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("PASS", out)

    def test_no_concurrency_block_is_allowed(self):
        self.fx.write("w.yml", "name: W\non:\n  push:\n    branches: [main]\n" + JOB)
        self.assertEqual(self.fx.run()[0], 0)

    def test_comment_inside_the_block_does_not_hide_the_violation(self):
        """The bug this rule shipped with. A full-line comment between
        `concurrency:` and `cancel-in-progress:` truncated the block match, so
        the rule reported PASS on the exact file it was written for."""
        self.fx.write("w.yml",
                      "name: W\non:\n  push:\n    branches: [main]\n"
                      "concurrency:\n  group: w-${{ github.ref }}\n"
                      "# an explanatory note at column 0\n"
                      "\n"
                      "  cancel-in-progress: false\n" + JOB)
        code, out = self.fx.run()
        self.assertEqual(code, 1, f"comment hid the violation: {out}")

    def test_help_exits_zero_without_running_the_scan(self):
        r = subprocess.run([sys.executable, SCRIPT, "--help"],
                           capture_output=True, text=True, timeout=30)
        self.assertEqual(r.returncode, 0)
        self.assertNotIn("PASS", r.stdout)


class RealRepositoryTests(unittest.TestCase):
    def test_the_repository_itself_passes(self):
        r = subprocess.run([sys.executable, SCRIPT], cwd=ROOT,
                           capture_output=True, text=True, timeout=60)
        self.assertEqual(r.returncode, 0, r.stdout)


if __name__ == "__main__":
    unittest.main()
