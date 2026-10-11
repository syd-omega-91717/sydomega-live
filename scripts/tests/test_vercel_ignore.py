#!/usr/bin/env python3
"""Tests for scripts/vercel-ignore.sh -- Vercel's Ignored Build Step.

Vercel semantics: exit 0 SKIPS the build, exit 1 BUILDS. A wrong skip leaves
production stale, so every uncertain case must build; a wrong build only costs
quota. The classifier must agree with what scripts/vercel-build.sh copies.

Run: python3 -m unittest scripts/tests/test_vercel_ignore.py -v
"""

import os
import shutil
import subprocess
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SCRIPT = os.path.join(ROOT, "scripts", "vercel-ignore.sh")


def classify(paths):
    p = subprocess.run(["bash", SCRIPT, "--classify"], input="\n".join(paths) + "\n",
                       capture_output=True, text=True, timeout=20)
    return p.returncode, dict(l.split(" ", 1)[::-1] for l in p.stdout.splitlines() if l)


class Classify(unittest.TestCase):

    def test_web_files_ship(self):
        for path in ("bg.js", "dashboard.html", "css/omega-system.css", "manifest.json",
                     "assets/movies/franchise-01.mp4", "icons/icon-192.png", "sw.js"):
            self.assertEqual(classify([path])[1][path], "SHIP", path)

    def test_build_inputs_and_whole_copied_trees_ship(self):
        for path in ("vercel.json", ".vercelignore", "scripts/vercel-build.sh",
                     "scripts/vercel-build-enhance.mjs", "scripts/vercel-ignore.sh",
                     "vendor/three.module.js", "i18n/fr.json", "vendor/LICENSE"):
            self.assertEqual(classify([path])[1][path], "SHIP", path)

    def test_backend_docs_and_tooling_do_not_ship(self):
        for path in ("FIXES_LOG.md", "CLAUDE.md", "supabase/migrations/0001_x.sql",
                     "supabase/functions/concierge/index.ts", "scripts/audit.py",
                     "scripts/csp-inline-baseline.json", "docs/x.html", "tests/release/a.cjs",
                     "core/intelligence_fabric/fabric.py", ".claude/settings.json",
                     ".github/workflows/ci.yml", "config/omega-implementation-ledger.json",
                     "public/bg.js"):
            self.assertEqual(classify([path])[1][path], "SKIP", path)

    def test_exit_code_builds_if_any_path_ships(self):
        self.assertEqual(classify(["FIXES_LOG.md", "supabase/x.sql"])[0], 0)
        self.assertEqual(classify(["FIXES_LOG.md", "bg.js"])[0], 1)

    def test_help_exits_zero(self):
        p = subprocess.run(["bash", SCRIPT, "--help"], capture_output=True, text=True)
        self.assertEqual(p.returncode, 0)
        self.assertIn("Ignored Build Step", p.stdout)


class RealGit(unittest.TestCase):
    """Run the script the way Vercel does: env SHAs inside a git checkout."""

    def setUp(self):
        self.repo = tempfile.mkdtemp()
        self.git("init", "-q")
        self.git("config", "user.email", "t@t")
        self.git("config", "user.name", "t")
        self.commit({"index.html": "a"})
        self.base = self.head()

    def tearDown(self):
        shutil.rmtree(self.repo)

    def git(self, *args):
        return subprocess.run(["git", *args], cwd=self.repo, capture_output=True, text=True, check=True).stdout.strip()

    def head(self):
        return self.git("rev-parse", "HEAD")

    def commit(self, files):
        for name, body in files.items():
            path = os.path.join(self.repo, name)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w") as fh:
                fh.write(body)
        self.git("add", "-A")
        self.git("commit", "-q", "-m", "c")

    def run_ignore(self, prev):
        env = {k: v for k, v in os.environ.items() if not k.startswith("VERCEL_GIT")}
        if prev is not None:
            env["VERCEL_GIT_PREVIOUS_SHA"] = prev
        env["VERCEL_GIT_COMMIT_SHA"] = self.head()
        return subprocess.run(["bash", SCRIPT], cwd=self.repo, env=env, capture_output=True, text=True, timeout=30)

    def test_docs_only_commit_skips(self):
        self.commit({"NOTES.md": "x", "supabase/m.sql": "x"})
        p = self.run_ignore(self.base)
        self.assertEqual(p.returncode, 0, p.stdout)
        self.assertIn("-> skip", p.stdout)

    def test_page_change_builds(self):
        self.commit({"NOTES.md": "x", "index.html": "b"})
        self.assertEqual(self.run_ignore(self.base).returncode, 1)

    def test_no_previous_sha_builds(self):
        self.assertEqual(self.run_ignore(None).returncode, 1)

    def test_unknown_previous_sha_builds(self):
        self.commit({"NOTES.md": "x"})
        p = self.run_ignore("0" * 40)
        self.assertEqual(p.returncode, 1)
        self.assertIn("unavailable", p.stdout)


if __name__ == "__main__":
    unittest.main()
