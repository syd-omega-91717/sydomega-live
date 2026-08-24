#!/usr/bin/env python3
"""
Unit/regression tests for scripts/omega-registry.py — the generated skill/
agent registry and its CI drift gate.

Like the other scripts in this repo, omega-registry.py is a top-level script
that resolves its own ROOT from __file__ and chdir()s there, so it cannot be
imported and pointed at a fixture. These tests build throwaway repo fixtures,
copy the real script in at scripts/omega-registry.py so its ROOT resolution
lands on the fixture, and run it as a subprocess exactly as CI does.

The point of the gate is that it fails on real drift. A generator that always
prints OK would pass a naive test, so every positive assertion here is paired
with a negative one that perturbs the fixture and asserts a non-zero exit.

Run: python3 -m unittest scripts/tests/test_omega_registry.py -v
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "scripts", "omega-registry.py")

SKILL = """---
name: {name}
description: {desc}
---

# {name}

Body text.
"""


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class Fixture:
    """A throwaway repo with the minimum shape omega-registry.py reads."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="omega-registry-test-")

    def path(self, *parts):
        return os.path.join(self.dir, *parts)

    def setup(self, skills=("alpha", "beta"), agents=("gamma",), pages=2, missing_fm=()):
        os.makedirs(self.path("scripts"), exist_ok=True)
        shutil.copy(SRC, self.path("scripts", "omega-registry.py"))
        for s in skills:
            if s in missing_fm:
                write(self.path(".claude", "skills", s, "SKILL.md"), f"# {s}\n\nNo frontmatter.\n")
            else:
                write(self.path(".claude", "skills", s, "SKILL.md"),
                      SKILL.format(name=s, desc=f"Does {s} things. Use when {s} is needed."))
        for a in agents:
            write(self.path(".claude", "agents", f"{a}.md"),
                  f"# {a}\n\n**Role:** Handles {a}. More detail.\n")
        for i in range(pages):
            write(self.path(f"page{i}.html"), '<script src="/bg.js"></script>\n')
        write(self.path("bg.js"), "// bg\n")
        write(self.path("CLAUDE.md"), "# CLAUDE\n" + "\n".join(skills) + "\n")
        write(self.path(".claude", "skills", "README.md"), "# skills\n")
        os.makedirs(self.path("supabase", "migrations"), exist_ok=True)
        os.makedirs(self.path("supabase", "functions"), exist_ok=True)
        return self

    def run(self, *args):
        return subprocess.run(
            [sys.executable, self.path("scripts", "omega-registry.py"), *args],
            capture_output=True, text=True, cwd=self.dir, timeout=90,
        )

    def registry(self):
        with open(self.path("OMEGA_SKILL_REGISTRY.md"), encoding="utf-8") as f:
            return f.read()

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class TestGeneration(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture().setup()
        self.addCleanup(self.fx.cleanup)

    def test_generates_registry_and_exits_zero(self):
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertTrue(os.path.exists(self.fx.path("OMEGA_SKILL_REGISTRY.md")))

    def test_registry_lists_every_skill_and_agent(self):
        self.fx.run()
        text = self.fx.registry()
        for name in ("alpha", "beta", "gamma"):
            self.assertIn(name, text, f"{name} missing from registry")

    def test_census_counts_pages_and_bg_coverage(self):
        self.fx.run()
        text = self.fx.registry()
        self.assertIn("| `.html` pages | 2 |", text)
        self.assertIn("pages loading `bg.js` | 2 of 2", text)

    def test_reports_page_not_loading_bg(self):
        write(self.fx.path("orphan.html"), "<h1>no bg</h1>\n")
        self.fx.run()
        text = self.fx.registry()
        self.assertIn("| `.html` pages | 3 |", text)
        self.assertIn("2 of 3", text)
        self.assertIn("do not load `bg.js`", text)

    def test_flags_skill_named_in_no_reference_doc(self):
        write(self.fx.path("CLAUDE.md"), "# CLAUDE\nalpha\n")  # beta now unreferenced
        self.fx.run()
        self.assertIn("named in no reference doc", self.fx.registry())


class TestDriftGate(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture().setup()
        self.addCleanup(self.fx.cleanup)
        self.assertEqual(self.fx.run().returncode, 0)

    def test_check_passes_on_freshly_generated_registry(self):
        r = self.fx.run("--check")
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("matches the repo", r.stdout)

    def test_check_fails_when_registry_edited_by_hand(self):
        text = self.fx.registry().replace("| `.html` pages | 2 |", "| `.html` pages | 42 |")
        write(self.fx.path("OMEGA_SKILL_REGISTRY.md"), text)
        r = self.fx.run("--check")
        self.assertEqual(r.returncode, 1, "hand-edited registry must fail the gate")
        self.assertIn("out of date", r.stdout)

    def test_check_fails_when_a_new_skill_is_added(self):
        write(self.fx.path(".claude", "skills", "delta", "SKILL.md"),
              SKILL.format(name="delta", desc="Does delta things."))
        r = self.fx.run("--check")
        self.assertEqual(r.returncode, 1, "a new skill must invalidate the registry")

    def test_check_fails_when_registry_missing(self):
        os.remove(self.fx.path("OMEGA_SKILL_REGISTRY.md"))
        r = self.fx.run("--check")
        self.assertEqual(r.returncode, 1)
        self.assertIn("does not exist", r.stdout)


class TestDiscoveryErrors(unittest.TestCase):
    """A skill with no name/description cannot be matched by an agent. That is
    a hard error in both modes -- it is what had actually happened to
    grill-me-codex, this repo's safety gate for auth/schema/payments work."""

    def test_missing_frontmatter_fails_generation(self):
        fx = Fixture().setup(missing_fm=("beta",))
        self.addCleanup(fx.cleanup)
        r = fx.run()
        self.assertEqual(r.returncode, 1)
        self.assertIn("no YAML frontmatter", r.stdout)

    def test_missing_description_fails(self):
        fx = Fixture().setup()
        self.addCleanup(fx.cleanup)
        write(fx.path(".claude", "skills", "beta", "SKILL.md"), "---\nname: beta\n---\n\n# beta\n")
        r = fx.run()
        self.assertEqual(r.returncode, 1)
        self.assertIn("`description:`", r.stdout)

    def test_unclosed_frontmatter_fails(self):
        fx = Fixture().setup()
        self.addCleanup(fx.cleanup)
        write(fx.path(".claude", "skills", "beta", "SKILL.md"), "---\nname: beta\ndescription: x\n")
        r = fx.run()
        self.assertEqual(r.returncode, 1)
        self.assertIn("never closed", r.stdout)

    def test_multiline_description_is_parsed(self):
        fx = Fixture().setup()
        self.addCleanup(fx.cleanup)
        write(fx.path(".claude", "skills", "beta", "SKILL.md"),
              "---\nname: beta\ndescription: First part\n  continued on the next line.\n---\n\n# beta\n")
        r = fx.run()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)
        self.assertIn("continued on the next line", fx.registry())


if __name__ == "__main__":
    unittest.main()
