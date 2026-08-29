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

import json
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

    def _git(self, *args):
        return subprocess.run(["git", *args], cwd=self.fx.dir,
                              capture_output=True, text=True, timeout=60)

    def test_refuses_dates_the_shallow_clone_cannot_know(self):
        """A shallow clone reports the GRAFT BOUNDARY, it does not fail.

        `git log -1 -- <path>` in a shallow clone silently returns the boundary
        commit when the real one is beyond it, so at depth 1 every file dates
        to the clone itself. `actions/checkout@v4` is shallow by default, which
        would make CI regenerate every date as the CI run's own and fail
        --check on drift that does not exist. Writing a wrong date into a
        generated artifact is worse than refusing: it is indistinguishable from
        real drift.
        """
        for cmd in (["init", "-q", "-b", "main"],
                    ["config", "user.email", "t@example.com"],
                    ["config", "user.name", "t"]):
            self._git(*cmd)
        self._git("add", "-A")
        self._git("commit", "-q", "-m", "first")
        write(self.fx.path("later.txt"), "x")
        self._git("add", "-A")
        self._git("commit", "-q", "-m", "second")

        # Deep enough: dates are knowable, so it must NOT refuse.
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)

        # Now graft the history so the skills' commit is the boundary.
        head = self._git("rev-parse", "HEAD~1").stdout.strip()
        gitdir = self._git("rev-parse", "--git-dir").stdout.strip()
        shallow = os.path.join(self.fx.dir, gitdir, "shallow")
        with open(shallow, "w", encoding="utf-8") as f:
            f.write(head + "\n")

        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout + r.stderr)
        self.assertIn("graft boundary", r.stdout + r.stderr)
        self.assertIn("fetch-depth: 0", r.stdout + r.stderr)

    def _seed_i18n(self, en_keys, pack_keys):
        body = ",\n".join('"k%d":"v%d"' % (i, i) for i in range(en_keys))
        write(self.fx.path("i18n.js"), "var T_EN={\n%s\n};\n" % body)
        write(self.fx.path("i18n", "fr.json"),
              json.dumps({"k%d" % i: "f%d" % i for i in range(pack_keys)}))

    def test_pack_key_count_is_committed_so_a_loss_fails_check(self):
        """The exact bug that shipped: a pack silently loses keys, CI stays green.

        Three packs sat 14 keys short of T_EN for weeks because nothing counted
        them. Recording the counts in the generated census turns that loss into
        drift, which --check already fails on.
        """
        self._seed_i18n(20, 20)
        self.assertEqual(self.fx.run().returncode, 0)
        self.assertIn("| `i18n/fr.json` | 20 |", self.fx.registry())
        self.assertEqual(self.fx.run("--check").returncode, 0)

        self._seed_i18n(20, 6)          # 14 translations disappear
        r = self.fx.run("--check")
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("out of date", r.stdout)
        self.fx.run()
        self.assertIn("14 short of `T_EN`", self.fx.registry())

    def test_unparseable_pack_is_recorded_not_skipped(self):
        self._seed_i18n(5, 5)
        write(self.fx.path("i18n", "fr.json"), '{"k0":"a" "k1":"b"}')
        self.assertEqual(self.fx.run().returncode, 0)
        self.assertIn("UNPARSEABLE", self.fx.registry())

    def _seed_migrations(self, numbered, timestamped=3):
        for i in range(1, numbered + 1):
            write(self.fx.path("supabase", "migrations", f"{i:04d}_m{i}.sql"), "-- x\n")
        for i in range(timestamped):
            write(self.fx.path("supabase", "migrations", f"2026080{i}120000_t{i}.sql"), "-- x\n")

    def test_validated_migration_scope_does_not_follow_the_file_count(self):
        """Adding migrations must never widen the claim about what was verified.

        The generated text used to read `0001`-`00{numbered}`, derived from the
        live count, so every newly added numbered migration silently asserted it
        had been part of the one recorded scratch-database run. The validated
        scope is a fact about a run that happened; it is pinned, not counted.
        """
        self._seed_migrations(120)
        self.fx.run()
        text = self.fx.registry()
        self.assertIn("`0001`–`0094`", text)
        self.assertNotIn("`0001`–`0120`", text)
        self.assertIn("| `supabase/migrations/*.sql` | 123 ", text)
        self.assertIn("no run has covered", text)

    def test_files_added_after_the_validated_scope_are_counted_as_unvalidated(self):
        """The unvalidated remainder counts numbered files too, not just timestamped ones."""
        self._seed_migrations(100, timestamped=2)
        self.fx.run()
        text = self.fx.registry()
        # 102 total - 94 validated = 8 unvalidated (6 numbered + 2 timestamped),
        # so counting only the timestamped ones would understate it as 2.
        self.assertIn("The 8 files added since", text)


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
