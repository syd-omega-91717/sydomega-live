#!/usr/bin/env python3
"""Regression tests for scripts/module-contract.py.

The gate's whole value is the CONJUNCTION it asserts: a contract is intact only
when the value has a publisher AND that publisher is reachable. A test suite that
only checked "publisher exists" would pass against the exact tree that shipped
the eight-day bottom-chrome outage (FIXES_LOG.md 160), because the publisher was
on disk the whole time and correct -- it was simply never loaded.

So the load-bearing test here is `test_unreachable_publisher_is_a_broken_contract`.
The rest guard the false-positive directions: a scanner that fails on its own
explanatory comments, on a module reading its own namespace, or on dead code
reading dead code is a scanner nobody can turn on.

Same fixture technique as test_audit.py: the real script is copied into a
throwaway repo and run as a subprocess, because it resolves its own ROOT from
__file__ and chdir()s there.

Run: python3 -m unittest scripts/tests/test_module_contract.py -v
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "scripts", "module-contract.py")


class Fixture:
    """A throwaway repo the real gate can run against."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="omega-contract-test-")
        os.makedirs(os.path.join(self.dir, "scripts"))
        shutil.copy(SRC, os.path.join(self.dir, "scripts", "module-contract.py"))

    def write(self, name, content):
        with open(os.path.join(self.dir, name), "w", encoding="utf-8") as fh:
            fh.write(content)

    def run(self):
        proc = subprocess.run(
            [sys.executable, os.path.join(self.dir, "scripts", "module-contract.py")],
            capture_output=True, text=True, cwd=self.dir)
        return proc.returncode, proc.stdout + proc.stderr

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class ContractTests(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()
        self.addCleanup(self.fx.cleanup)

    # ---- the conjunction, which is the entire point --------------------

    def test_unreachable_publisher_is_a_broken_contract(self):
        """THE ONE THAT MATTERS. Publisher exists, is correct, and is loaded by
        nothing -- the exact shape of FIXES_LOG.md 160. A publisher-exists check
        passes here; this gate must not."""
        self.fx.write("bg.js", "var a=document.createElement('script');a.src='/omega-reader.js';")
        self.fx.write("omega-reader.js",
                      "el.style.cssText='bottom:var(--omega-chrome-bottom,0px)';")
        self.fx.write("omega-publisher.js",
                      "document.documentElement.style.setProperty('--omega-chrome-bottom','94px');")
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("--omega-chrome-bottom", out)
        self.assertIn("UNREACHABLE omega-publisher.js", out)

    def test_reachable_publisher_is_intact(self):
        """The same tree with the one missing injection restored."""
        self.fx.write("bg.js",
                      "var a=document.createElement('script');a.src='/omega-reader.js';"
                      "var b=document.createElement('script');b.src='/omega-publisher.js';")
        self.fx.write("omega-reader.js",
                      "el.style.cssText='bottom:var(--omega-chrome-bottom,0px)';")
        self.fx.write("omega-publisher.js",
                      "document.documentElement.style.setProperty('--omega-chrome-bottom','94px');")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("PASSED", out)

    def test_accessor_published_by_nothing_is_broken(self):
        self.fx.write("bg.js", "var a=document.createElement('script');a.src='/omega-reader.js';")
        self.fx.write("omega-reader.js",
                      "if(window.OmegaGhost){window.OmegaGhost.go();}")
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("window.OmegaGhost", out)

    # ---- the false-positive directions ---------------------------------

    def test_a_name_only_mentioned_in_a_comment_is_not_a_read(self):
        """Writing the fix for a missing accessor means naming it in the comment
        that explains it. A scanner that reads its own explanation as the bug can
        never be used to prove the bug is gone -- this failed exactly once, on
        the real repo, before comments were stripped."""
        self.fx.write("bg.js", "var a=document.createElement('script');a.src='/omega-reader.js';")
        self.fx.write("omega-reader.js",
                      "/* This used to guard on window.OmegaGhost, which nothing\n"
                      "   ever assigned. Now it uses the real one. */\n"
                      "// see also window.OmegaGhost in the history\n"
                      "if(window.OmegaReal){window.OmegaReal.go();}\n"
                      "window.OmegaReal={go:function(){}};\n")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("OmegaGhost", out)

    def test_a_name_inside_a_string_literal_is_still_a_read(self):
        """Comments go, strings stay. A dispatcher that names its target in a
        string is still depending on it."""
        self.fx.write("bg.js", "var a=document.createElement('script');a.src='/omega-reader.js';")
        self.fx.write("omega-reader.js",
                      "var msg='window.OmegaGhost is required';"
                      "if(window.OmegaGhost){window.OmegaGhost.go();}")
        code, out = self.fx.run()
        self.assertEqual(code, 1)
        self.assertIn("window.OmegaGhost", out)

    def test_a_module_reading_its_own_namespace_is_not_a_contract(self):
        self.fx.write("bg.js", "var a=document.createElement('script');a.src='/omega-solo.js';")
        self.fx.write("omega-solo.js",
                      "window.OmegaSolo={n:1};if(window.OmegaSolo.n){}")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertNotIn("OmegaSolo", out)

    def test_dead_code_reading_dead_code_does_not_gate(self):
        """Two unreachable modules can break each other's contract without
        breaking anything a member can reach. Reported, never blocking."""
        self.fx.write("bg.js", "// loads nothing\n")
        self.fx.write("omega-dead.js", "if(window.OmegaAlsoGhost){window.OmegaAlsoGhost.go();}")
        code, out = self.fx.run()
        self.assertEqual(code, 0)
        self.assertIn("not gating", out)

    def test_a_page_script_tag_is_a_root(self):
        """A module no loader injects but a page includes itself is reachable."""
        self.fx.write("bg.js", "// loads nothing\n")
        self.fx.write("page.html", "<script src=/omega-pub.js></script>"
                                   "<script src=/omega-reader.js></script>")
        self.fx.write("omega-pub.js", "window.OmegaThing={go:function(){}};")
        self.fx.write("omega-reader.js", "if(window.OmegaThing){window.OmegaThing.go();}")
        code, out = self.fx.run()
        self.assertEqual(code, 0)

    def test_an_esm_import_reaches_the_publisher(self):
        self.fx.write("bg.js", "// loads nothing\n")
        self.fx.write("page.html", "<script type=module src=/omega-init.js></script>"
                                   "<script src=/omega-reader.js></script>")
        self.fx.write("omega-init.js", "import './omega-pub.js';")
        self.fx.write("omega-pub.js", "window.OmegaThing={go:function(){}};")
        self.fx.write("omega-reader.js", "if(window.OmegaThing){window.OmegaThing.go();}")
        code, out = self.fx.run()
        self.assertEqual(code, 0)


class ReachabilityAgreesWithAuditTests(unittest.TestCase):
    """module-contract.py re-derives audit.py's closure rather than importing it
    (audit.py chdir()s to its own ROOT and cannot be pointed at a fixture). That
    duplication is only safe while the two agree, so assert it on the real repo.

    This assertion used to be "every module audit.py calls dead is absent from
    this gate's live set", guarded by `assertTrue(dead)` so a changed output
    format could not silently pass as agreement. That guard made the test FAIL
    the moment the repo reached zero dead modules -- the goal state. A check
    that requires the defect it checks against to still exist cannot be part of
    a suite whose purpose is to remove it.

    Set equality is the assertion that means the same thing at three dead
    modules and at zero: the two closures partition the same files identically.
    The output-format concern is handled by anchoring on audit.py's section
    heading instead, so "no dead-module heading" is distinguishable from "the
    heading moved and nothing was parsed".
    """

    AUDIT_SECTION = "1/2 \u00b7 MODULE GRAPH"

    def _audit_dead(self):
        proc = subprocess.run([sys.executable, os.path.join(ROOT, "scripts", "audit.py")],
                              capture_output=True, text=True, cwd=ROOT)
        out = proc.stdout
        self.assertIn(self.AUDIT_SECTION, out,
                      "audit.py's module-graph section heading is gone; the two "
                      "scanners can no longer be compared -- check its output format")
        dead, grab = set(), False
        for line in out.splitlines():
            # audit.py prints TWO such headings -- stylesheets first, then
            # modules. Matching the substring alone grabs the CSS list, whose
            # names end in .css, and the filter below then yields an empty set --
            # which looks exactly like "audit.py found nothing".
            if ("on disk but never loaded" in line
                    and "stylesheet" not in line.lower()):
                grab = True
                continue
            if grab:
                if line.strip() and not line.startswith("="):
                    dead = {x.strip() for x in line.split(",")
                            if x.strip().endswith(".js")}
                break
        return dead

    def test_the_two_closures_partition_the_repo_identically(self):
        import importlib.util
        spec = importlib.util.spec_from_file_location("mc", SRC)
        mc = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mc)
        cwd = os.getcwd()
        try:
            os.chdir(ROOT)
            live = mc.reachable_modules()
            on_disk = {f for f in os.listdir(".") if f.endswith(".js")}
        finally:
            os.chdir(cwd)

        self.assertFalse(live - on_disk,
                         "module-contract.py calls a non-existent file reachable")
        self.assertEqual(on_disk - live, self._audit_dead(),
                         "the two closures have drifted: each scanner calls a "
                         "different set of root modules dead")


if __name__ == "__main__":
    unittest.main()
