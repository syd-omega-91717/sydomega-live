#!/usr/bin/env python3
"""Tests for .claude/hooks/omega_guard.py -- the Claude Code edit guard.

Each case feeds the hook the JSON payload Claude Code sends and asserts the
exit code: 2 blocks (the agent sees stderr), 0 lets the edit through. The post
cases plant a broken file in a temporary project dir via CLAUDE_PROJECT_DIR, so
nothing in the real tree is touched.

Run: python3 -m unittest scripts/tests/test_omega_guard_hook.py -v
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HOOK = os.path.join(ROOT, ".claude", "hooks", "omega_guard.py")


def run(mode, path, project=ROOT):
    env = dict(os.environ, CLAUDE_PROJECT_DIR=project)
    payload = json.dumps({"tool_name": "Edit", "tool_input": {"file_path": path}})
    p = subprocess.run([sys.executable, HOOK, mode], input=payload, capture_output=True,
                       text=True, env=env, timeout=40)
    return p.returncode, p.stderr


def first_main_migration():
    names = sorted(n for n in os.listdir(os.path.join(ROOT, "supabase", "migrations")) if n.endswith(".sql"))
    for n in names:
        rel = "supabase/migrations/" + n
        if subprocess.run(["git", "cat-file", "-e", "origin/main:" + rel], cwd=ROOT,
                          capture_output=True).returncode == 0:
            return rel
    return None


class PreGuard(unittest.TestCase):

    def test_blocks_public_build_output(self):
        code, err = run("pre", os.path.join(ROOT, "public", "bg.js"))
        self.assertEqual(code, 2)
        self.assertIn("build output", err)

    def test_blocks_env_but_allows_env_example(self):
        self.assertEqual(run("pre", os.path.join(ROOT, ".env.local"))[0], 2)
        self.assertEqual(run("pre", os.path.join(ROOT, ".env.example"))[0], 0)

    def test_blocks_rewrite_of_migration_on_main(self):
        rel = first_main_migration()
        if not rel:
            self.skipTest("origin/main not fetched in this clone")
        code, err = run("pre", os.path.join(ROOT, rel))
        self.assertEqual(code, 2)
        self.assertIn("NEW timestamped migration", err)

    def test_allows_new_migration_and_ordinary_files(self):
        self.assertEqual(run("pre", os.path.join(ROOT, "supabase/migrations/99999999999999_new.sql"))[0], 0)
        self.assertEqual(run("pre", os.path.join(ROOT, "dashboard.html"))[0], 0)

    def test_garbage_payload_never_blocks(self):
        p = subprocess.run([sys.executable, HOOK, "pre"], input="not json", capture_output=True, text=True)
        self.assertEqual(p.returncode, 0)


@unittest.skipUnless(shutil.which("node"), "node not installed")
class PostGuard(unittest.TestCase):

    def setUp(self):
        self.tmp = tempfile.mkdtemp()

    def tearDown(self):
        shutil.rmtree(self.tmp)

    def plant(self, rel, text):
        path = os.path.join(self.tmp, rel)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as fh:
            fh.write(text)
        return path

    def test_broken_root_js_is_caught_and_bg_js_named(self):
        code, err = run("post", self.plant("bg.js", "function (){"), self.tmp)
        self.assertEqual(code, 2)
        self.assertIn("whole platform down", err)

    def test_valid_root_js_passes(self):
        self.assertEqual(run("post", self.plant("omega-x.js", "var a = 1;\n"), self.tmp)[0], 0)

    def test_nested_js_is_not_checked(self):
        # CI's node --check covers repo-root .js only; vendored ESM would false-positive.
        self.assertEqual(run("post", self.plant("vendor/x.js", "import x from 'y';"), self.tmp)[0], 0)

    def test_broken_json_is_caught_outside_vendor(self):
        self.assertEqual(run("post", self.plant("i18n/fr.json", "{bad"), self.tmp)[0], 2)
        self.assertEqual(run("post", self.plant("vendor/p.json", "{bad"), self.tmp)[0], 0)


if __name__ == "__main__":
    unittest.main()
