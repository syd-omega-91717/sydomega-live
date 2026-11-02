"""PRs stop colliding on shared lines (docs/fixes/README.md): new entries are files, FIXES_LOG.md is frozen, CLAUDE.md
holds no per-PR counts, and merge-main.py resolves the remaining collisions the safe way."""
import importlib.util
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
PY = sys.executable


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, ROOT / "scripts" / filename)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def sh(cwd, *cmd):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=True)


class NewEntry(unittest.TestCase):
    def mod(self):
        m = load("nfe", "new-fix-entry.py")
        d = pathlib.Path(tempfile.mkdtemp())
        m.ROOT, m.DIR = d, d / "docs" / "fixes"
        return m

    def test_creates_a_dated_file_and_refuses_to_overwrite(self):
        m = self.mod()
        self.assertEqual(m.main(["xss-fix", "A title", "--date", "2026-11-02"]), 0)
        f = m.DIR / "2026-11-02-xss-fix.md"
        self.assertIn("### A title (2026-11-02)", f.read_text())
        self.assertEqual(m.main(["xss-fix", "--date", "2026-11-02"]), 1)

    def test_two_entries_never_share_a_file(self):
        m = self.mod()
        m.main(["one-fix", "--date", "2026-11-02"])
        m.main(["two-fix", "--date", "2026-11-02"])
        self.assertEqual(len(list(m.DIR.iterdir())), 2)

    def test_bad_slug_or_date_is_refused(self):
        m = self.mod()
        for args in (["Bad Slug"], ["ab"], ["ok-slug", "--date", "11/02/2026"], []):
            self.assertEqual(m.main(args), 2, args)
        self.assertFalse(m.DIR.exists())


class Frozen(unittest.TestCase):
    def mod(self, log="# log\nentry 1\n", claude="no counts here\n", fixes=()):
        m = load("flf", "fixes-log-frozen.py")
        d = pathlib.Path(tempfile.mkdtemp())
        (d / "config").mkdir()
        (d / "docs" / "fixes").mkdir(parents=True)
        (d / "FIXES_LOG.md").write_text(log)
        (d / "CLAUDE.md").write_text(claude)
        for name in fixes:
            (d / "docs" / "fixes" / name).write_text("x")
        m.ROOT, m.LOG, m.FROZEN = d, d / "FIXES_LOG.md", d / "config" / "fixes-log-frozen.json"
        m.FIXES, m.CLAUDE = d / "docs" / "fixes", d / "CLAUDE.md"
        return m

    def test_unchanged_log_passes_and_an_append_fails(self):
        m = self.mod()
        m.main(["--update"])
        self.assertEqual(m.main([]), 0)
        m.LOG.write_text(m.LOG.read_text() + "### 212 - a new entry appended at the end\n")
        self.assertEqual(m.main([]), 1)

    def test_editing_history_fails_until_updated_on_purpose(self):
        m = self.mod()
        m.main(["--update"])
        m.LOG.write_text("# log\nentry 1 (corrected)\n")
        self.assertEqual(m.main([]), 1)
        m.main(["--update"])
        self.assertEqual(m.main([]), 0)

    def test_missing_hash_file_fails(self):
        self.assertEqual(self.mod().main([]), 1)

    def test_entry_files_need_a_dated_name(self):
        m = self.mod(fixes=("2026-11-02-good-one.md", "README.md"))
        m.main(["--update"])
        self.assertEqual(m.main([]), 0)
        (m.FIXES / "notes.md").write_text("x")
        self.assertEqual(m.main([]), 1)

    def test_a_per_pr_count_in_claude_md_fails(self):
        for line in ("| tests | **1025** tests, 0 failing |", "**35** blocking checks, all passing",
                     "(`contract-suite.py` holds **61** gates)"):
            m = self.mod(claude=line + "\n")
            m.main(["--update"])
            self.assertEqual(m.main([]), 1, line)

    def test_other_numbers_in_claude_md_are_fine(self):
        m = self.mod(claude="12 agents, **164** contracts, 60 governed skills, Q4 2026\n")
        m.main(["--update"])
        self.assertEqual(m.main([]), 0)

    def test_the_real_tree_passes(self):
        self.assertEqual(subprocess.run([PY, str(ROOT / "scripts" / "fixes-log-frozen.py")], capture_output=True).returncode, 0)


class MergeMain(unittest.TestCase):
    def repo(self, files):
        base = pathlib.Path(tempfile.mkdtemp())
        origin, work = base / "origin.git", base / "work"
        sh(base, "git", "init", "-q", "--bare", "-b", "main", str(origin))
        sh(base, "git", "clone", "-q", str(origin), str(work))
        for k, v in (("user.email", "t@t"), ("user.name", "t")):
            sh(work, "git", "config", k, v)
        sh(work, "git", "checkout", "-q", "-b", "main")
        for name, body in files.items():
            p = work / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(body)
        sh(work, "git", "add", "-A")
        sh(work, "git", "commit", "-qm", "base")
        sh(work, "git", "push", "-q", "origin", "main")
        return work

    def edit(self, work, branch, changes, start="main"):
        sh(work, "git", "checkout", "-q", "-B", branch, start)
        for name, body in changes.items():
            p = work / name
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(body)
        sh(work, "git", "add", "-A")
        sh(work, "git", "commit", "-qm", "change " + branch)

    def collide(self, files, main_change, branch_change):
        work = self.repo(files)
        self.edit(work, "feature", branch_change)
        self.edit(work, "main", main_change)
        sh(work, "git", "push", "-q", "origin", "main")
        sh(work, "git", "checkout", "-q", "feature")
        run = subprocess.run([PY, str(ROOT / "scripts" / "merge-main.py")], cwd=work, capture_output=True, text=True)
        return work, run

    def test_two_appends_to_fixes_log_are_both_kept(self):
        work, run = self.collide({"FIXES_LOG.md": "# log\nold\n"},
                                 {"FIXES_LOG.md": "# log\nold\nMAIN ENTRY\n"},
                                 {"FIXES_LOG.md": "# log\nold\nBRANCH ENTRY\n"})
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        text = (work / "FIXES_LOG.md").read_text()
        self.assertTrue(text.index("MAIN ENTRY") < text.index("BRANCH ENTRY"))
        self.assertNotIn("<<<<<<<", text)
        self.assertEqual(sh(work, "git", "status", "--porcelain").stdout, "")
        self.assertEqual(len(sh(work, "git", "log", "--merges", "--format=%h").stdout.split()), 1)

    def test_ratchet_baselines_take_the_lower_value_per_key(self):
        base = {"scripts/xss-sink-baseline.json": json.dumps({"_doc": "d", "a.html": 10, "b.html": 10, "c.html": 5}, indent=1) + "\n"}
        work, run = self.collide(base,
                                 {"scripts/xss-sink-baseline.json": json.dumps({"_doc": "d", "a.html": 6, "b.html": 10, "c.html": 5}, indent=1) + "\n"},
                                 {"scripts/xss-sink-baseline.json": json.dumps({"_doc": "d", "a.html": 8, "b.html": 9, "c.html": 5}, indent=1) + "\n"})
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        merged = json.loads((work / "scripts/xss-sink-baseline.json").read_text())
        self.assertEqual((merged["a.html"], merged["b.html"], merged["c.html"]), (6, 9, 5))

    def test_a_file_migrated_to_zero_on_either_side_drops_out(self):
        base = {"scripts/esc-copy-baseline.json": json.dumps({"_doc": "d", "a.html": 1, "b.html": 1}, indent=1) + "\n"}
        work, run = self.collide(base,
                                 {"scripts/esc-copy-baseline.json": json.dumps({"_doc": "d", "b.html": 1}, indent=1) + "\n"},
                                 {"scripts/esc-copy-baseline.json": json.dumps({"_doc": "d", "a.html": 1}, indent=1) + "\n"})
        self.assertEqual(run.returncode, 0, run.stdout + run.stderr)
        self.assertEqual(json.loads((work / "scripts/esc-copy-baseline.json").read_text()), {"_doc": "d"})

    def test_a_real_logic_conflict_is_left_for_a_human(self):
        work, run = self.collide({"app.js": "x=1\n"}, {"app.js": "x=2\n"}, {"app.js": "x=3\n"})
        self.assertEqual(run.returncode, 1)
        self.assertIn("CONFLICT  app.js", run.stdout)
        self.assertIn("<<<<<<<", (work / "app.js").read_text())

    def test_a_clean_merge_needs_no_resolution(self):
        work = self.repo({"a.txt": "a\n", "b.txt": "b\n"})
        self.edit(work, "feature", {"a.txt": "a2\n"})
        self.edit(work, "main", {"b.txt": "b2\n"})
        sh(work, "git", "push", "-q", "origin", "main")
        sh(work, "git", "checkout", "-q", "feature")
        run = subprocess.run([PY, str(ROOT / "scripts" / "merge-main.py")], cwd=work, capture_output=True, text=True)
        self.assertEqual(run.returncode, 0)
        self.assertIn("cleanly", run.stdout)

    def test_a_dirty_tree_is_refused_and_nothing_is_touched(self):
        work = self.repo({"a.txt": "a\n"})
        (work / "a.txt").write_text("dirty\n")
        run = subprocess.run([PY, str(ROOT / "scripts" / "merge-main.py")], cwd=work, capture_output=True, text=True)
        self.assertEqual(run.returncode, 2)
        self.assertEqual((work / "a.txt").read_text(), "dirty\n")

    def test_help_exits_zero(self):
        for s in ("merge-main.py", "new-fix-entry.py", "fixes-log-frozen.py"):
            self.assertEqual(subprocess.run([PY, str(ROOT / "scripts" / s), "--help"], capture_output=True).returncode, 0, s)


if __name__ == "__main__":
    unittest.main()
