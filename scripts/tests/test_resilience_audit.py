#!/usr/bin/env python3
"""
Regression tests for scripts/resilience-audit.py — the gate for failures that
arrive on someone else's schedule (floating dependency pins, unpinned payment
API versions, a rotting live-schema snapshot, single-runner CI, a CSP that
reports nowhere).

Like the other gates here, resilience-audit.py is a top-level script that
resolves its own ROOT from __file__, so it cannot be imported and pointed at a
fixture. These tests build throwaway repo fixtures on disk, copy the real
script into <fixture>/scripts/, and run it as a subprocess exactly the way CI
does — black-box, but testing the actual gate rather than a stand-in.

The important cases are the negative ones: a gate that cannot fail is not a
gate. Each detector is therefore tested against a fixture that SHOULD trip it,
not only against a clean repo.

Run: python3 -m unittest scripts/tests/test_resilience_audit.py -v
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "scripts", "resilience-audit.py")


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class Fixture:
    """A throwaway repo that is clean unless a test deliberately breaks it."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="resilience-fixture-")
        os.makedirs(os.path.join(self.dir, "scripts"), exist_ok=True)
        shutil.copy(SRC, os.path.join(self.dir, "scripts", "resilience-audit.py"))
        # A clean baseline: fully-pinned import, Stripe-Version present,
        # a fresh schema snapshot, two runner label sets, no CSP header.
        write(os.path.join(self.dir, "supabase", "functions", "ok", "index.ts"),
              'import { createClient } from "https://esm.sh/@supabase/supabase-js@2.112.4";\n'
              'const r = await fetch("https://api.stripe.com/v1/x", '
              '{ headers: { "Stripe-Version": "2024-06-20" } });\n')
        write(os.path.join(self.dir, "supabase", "live-schema.json"),
              json.dumps({"_captured": date.today().isoformat(), "tables": {}}))
        write(os.path.join(self.dir, ".github", "workflows", "a.yml"),
              "jobs:\n  a:\n    runs-on: ubuntu-latest\n")
        write(os.path.join(self.dir, ".github", "workflows", "b.yml"),
              "jobs:\n  b:\n    runs-on: [self-hosted, Windows, X64]\n")
        write(os.path.join(self.dir, "vercel.json"), json.dumps({"headers": []}))

    def path(self, *parts):
        return os.path.join(self.dir, *parts)

    def run(self, *args):
        return subprocess.run(
            [sys.executable, os.path.join(self.dir, "scripts", "resilience-audit.py")] + list(args),
            capture_output=True, text=True)

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class ResilienceAuditTest(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()
        self.addCleanup(self.fx.cleanup)

    # -- baseline ----------------------------------------------------------

    def test_clean_repo_passes(self):
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

    def test_help_prints_docstring_and_exits_zero(self):
        """CLAUDE.md 8.4: every agent-facing script answers --help without
        running its job."""
        r = self.fx.run("--help")
        self.assertEqual(r.returncode, 0)
        self.assertIn("WHY THIS EXISTS", r.stdout)
        self.assertNotIn("RESILIENCE AUDIT  --", r.stdout)

    # -- detectors that must block ----------------------------------------

    def test_floating_dependency_pin_blocks(self):
        write(self.fx.path("supabase", "functions", "bad", "index.ts"),
              'import { createClient } from "https://esm.sh/@supabase/supabase-js@2";\n')
        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("floating dependency pin", r.stdout)

    def test_deno_land_std_import_blocks(self):
        write(self.fx.path("supabase", "functions", "bad", "index.ts"),
              'import { serve } from "https://deno.land/std@0.168.0/http/server.ts";\n')
        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("deno.land/std", r.stdout)

    def test_stale_schema_snapshot_blocks(self):
        old = (date.today() - timedelta(days=200)).isoformat()
        write(self.fx.path("supabase", "live-schema.json"),
              json.dumps({"_captured": old, "tables": {}}))
        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("200 days old", r.stdout)

    def test_schema_snapshot_without_capture_date_blocks(self):
        write(self.fx.path("supabase", "live-schema.json"), json.dumps({"tables": {}}))
        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("no _captured date", r.stdout)

    def test_unparseable_schema_snapshot_blocks(self):
        write(self.fx.path("supabase", "live-schema.json"), "{not json")
        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("does not parse", r.stdout)

    # -- detectors that must warn, not block -------------------------------

    def test_missing_stripe_version_warns_but_does_not_block(self):
        """Deliberate: the correct value is the account's current default API
        version, readable only from the Stripe dashboard. Guessing it breaks
        checkout immediately instead of eventually, so this gate reports and
        leaves the call to a human."""
        write(self.fx.path("supabase", "functions", "pay", "index.ts"),
              'await fetch("https://api.stripe.com/v1/checkout/sessions", {method:"POST"});\n')
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("no Stripe-Version header", r.stdout)
        self.assertIn("HIGHEST SEVERITY", r.stdout)

    def test_single_runner_label_set_warns(self):
        os.remove(self.fx.path(".github", "workflows", "a.yml"))
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("single label set", r.stdout)

    def test_report_only_csp_without_endpoint_warns(self):
        write(self.fx.path("vercel.json"), json.dumps({"headers": [
            {"headers": [{"key": "Content-Security-Policy-Report-Only",
                          "value": "default-src 'self'"}]}]}))
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("no report-uri/report-to", r.stdout)

    def test_report_only_csp_with_endpoint_is_silent(self):
        write(self.fx.path("vercel.json"), json.dumps({"headers": [
            {"headers": [{"key": "Content-Security-Policy-Report-Only",
                          "value": "default-src 'self'; report-uri /csp"}]}]}))
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertNotIn("Content-Security-Policy-Report-Only is set", r.stdout)

    def test_strict_promotes_warnings_to_failures(self):
        os.remove(self.fx.path(".github", "workflows", "a.yml"))
        self.assertEqual(self.fx.run().returncode, 0)
        self.assertEqual(self.fx.run("--strict").returncode, 1)


class RealRepoTest(unittest.TestCase):
    """The gate must pass against this repository as it actually stands —
    otherwise it cannot be a blocking CI step."""

    def test_real_repo_has_no_blocking_findings(self):
        r = subprocess.run([sys.executable, SRC], capture_output=True, text=True, cwd=ROOT)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main()
