#!/usr/bin/env python3
"""
Regression tests for scripts/verify-runtime.js's capability page set (#175).

WHY THIS EXISTS

`DEFAULT_PAGES` used to be a hand-written array whose comment claimed it was
"Capability entrypoints (docs/capabilities/registry.json)". It was in sync on
the day it was written, and nothing kept it there — the drift pattern
CLAUDE.md 8.4 describes. That mattered more than a stale comment usually does,
because eleven capabilities cite this script in `contract.live_verification`
as their evidence of runtime verification. A capability added with a new .html
entrypoint would have gone unrendered while still claiming to be covered, which
is exactly what issue #175 says must not happen ("No capability may be marked
verified without evidence").

The set is now derived from the registry. These tests assert the derivation is
real rather than coincidental: the fixture registry below is deliberately NOT
this repo's, so a re-hardcoded list would keep returning this repo's pages and
fail. Asserting against the live registry alone could not tell the two apart.

`--list` exists for these tests: a normal run needs a browser and reports
SKIPPED on a machine without one, which would prove nothing.

Run: python3 -m unittest scripts/tests/test_verify_runtime.py -v
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "verify-runtime.js")
REGISTRY = os.path.join(ROOT, "docs", "capabilities", "registry.json")


def node_missing():
    return shutil.which("node") is None


class VerifyRuntimePageSet(unittest.TestCase):
    """The rendered set must follow the registry, wherever the registry points."""

    def _fixture(self, capabilities, pages):
        """A throwaway repo: the real script, a synthetic registry, empty pages.

        verify-runtime.js resolves its own ROOT as `path.resolve(__dirname,
        '..')`, so copying it into <fixture>/scripts/ makes it read the
        fixture's registry rather than this repo's.
        """
        d = tempfile.mkdtemp(prefix="omega-vr-")
        self.addCleanup(shutil.rmtree, d, True)
        os.makedirs(os.path.join(d, "scripts"))
        os.makedirs(os.path.join(d, "docs", "capabilities"))
        shutil.copy(SCRIPT, os.path.join(d, "scripts", "verify-runtime.js"))
        with open(os.path.join(d, "docs", "capabilities", "registry.json"), "w",
                  encoding="utf-8") as fh:
            json.dump({"capabilities": capabilities}, fh)
        for page in pages:
            open(os.path.join(d, page), "w", encoding="utf-8").close()
        return d

    def _list(self, cwd, expect_exit=0):
        proc = subprocess.run(
            [shutil.which("node"), os.path.join(cwd, "scripts", "verify-runtime.js"), "--list"],
            capture_output=True, text=True, timeout=60,
        )
        self.assertEqual(proc.returncode, expect_exit,
                         f"stdout={proc.stdout!r} stderr={proc.stderr!r}")
        return [ln.strip() for ln in proc.stdout.splitlines() if ln.strip()], proc

    @unittest.skipIf(node_missing(), "node not available")
    def test_follows_a_registry_that_is_not_this_repos(self):
        """A capability's .html entrypoint is rendered because it is in the
        registry — not because someone remembered to add it to an array."""
        d = self._fixture(
            capabilities=[
                {"id": "alpha", "entrypoints": ["alpha.html"]},
                {"id": "beta", "entrypoints": ["beta.html", "bg.js"]},
            ],
            pages=["alpha.html", "beta.html", "dashboard.html"],
        )
        pages, _ = self._list(d)
        self.assertIn("alpha.html", pages)
        self.assertIn("beta.html", pages)
        # A hardcoded list would still be returning this repo's own pages.
        for leaked in ("feed.html", "vault.html", "approvals.html"):
            self.assertNotIn(leaked, pages,
                             "page set is not derived — it leaked this repo's hardcoded entries")

    @unittest.skipIf(node_missing(), "node not available")
    def test_non_html_entrypoints_are_not_treated_as_pages(self):
        """bg.js / omega-a11y.js are platform-wide modules every rendered page
        already exercises; requesting them as pages would 404 the harness."""
        d = self._fixture(
            capabilities=[{"id": "runtime", "entrypoints": ["bg.js", "omega-a11y.js"]}],
            pages=["dashboard.html"],
        )
        pages, _ = self._list(d)
        self.assertNotIn("bg.js", pages)
        self.assertNotIn("omega-a11y.js", pages)

    @unittest.skipIf(node_missing(), "node not available")
    def test_entrypoint_that_does_not_exist_is_dropped_not_rendered(self):
        """A registry naming a page the repo lacks must not make the harness
        assert against a 404 — audit.py is the gate for that class."""
        d = self._fixture(
            capabilities=[{"id": "ghost", "entrypoints": ["ghost.html"]}],
            pages=["dashboard.html"],
        )
        pages, _ = self._list(d)
        self.assertNotIn("ghost.html", pages)

    @unittest.skipIf(node_missing(), "node not available")
    def test_unreadable_registry_exits_2_rather_than_verifying_a_partial_set(self):
        """Silently falling back to 'no pages' would report success while
        verifying nothing — the false-green this whole gate exists to prevent."""
        d = self._fixture(capabilities=[], pages=["dashboard.html"])
        with open(os.path.join(d, "docs", "capabilities", "registry.json"), "w",
                  encoding="utf-8") as fh:
            fh.write("{ not json")
        _, proc = self._list(d, expect_exit=2)
        self.assertIn("registry", (proc.stderr or "").lower())

    @unittest.skipIf(node_missing(), "node not available")
    def test_live_registry_covers_every_capability_that_cites_this_script(self):
        """The invariant #175 actually asks for, asserted against the real repo:
        a capability may not cite verify-runtime.js as its live evidence while
        naming an .html entrypoint the script does not render."""
        proc = subprocess.run(
            [shutil.which("node"), SCRIPT, "--list"],
            capture_output=True, text=True, timeout=60, cwd=ROOT,
        )
        self.assertEqual(proc.returncode, 0, proc.stderr)
        rendered = {ln.strip() for ln in proc.stdout.splitlines() if ln.strip()}
        with open(REGISTRY, encoding="utf-8") as fh:
            registry = json.load(fh)
        for cap in registry["capabilities"]:
            if "verify-runtime" not in cap["contract"].get("live_verification", ""):
                continue
            for entry in cap.get("entrypoints", []):
                if entry.endswith(".html"):
                    self.assertIn(entry, rendered,
                                  f"{cap['id']} cites verify-runtime.js but {entry} is never rendered")


if __name__ == "__main__":
    unittest.main()
