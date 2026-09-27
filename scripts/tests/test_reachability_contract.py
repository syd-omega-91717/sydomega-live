#!/usr/bin/env python3
"""
Regression tests for scripts/reachability-contract.py -- the gate that refuses
to deploy a page no member can reach.

The defect it exists for is in its own docstring: CLAUDE.md section 9 has always
required a new page to be registered in nav.js, and with no enforcement the rule
held only as long as someone remembered it. On 2026-09-02 seven pages were
linked from nowhere and fifteen had no active-state entry, gateway.html among
them. Two more unreachable pages arrived in a merge within hours of that being
driven to zero.

Same harness shape as the other gate tests: the script resolves its own ROOT
from __file__, so these build throwaway repos on disk, copy the real script into
<fixture>/scripts/, and run it as a subprocess.

The cases that matter:

  MUST CATCH   a page with no link anywhere (blocking).
  MUST NOT     a page reachable only via a deep link with a #fragment -- the
               distinction the first version of this check got wrong.
  SEPARATE     unreachable (blocking) and no-active-state (advisory) are two
               different findings, because conflating them produced a wrong
               count of 15 when the real numbers were 7 and 15.

Run: python3 -m unittest scripts/tests/test_reachability_contract.py -v
"""

import os
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "scripts", "reachability-contract.py")

NAV_TEMPLATE = """/* nav fixture */
(function(){
  var PS={
%(ps)s
  };
  var SECTIONS=[
    {key:'command', icon:'x', label:'COMMAND', href:'/dashboard.html', col:'#fff',
     sub:[%(sub)s]}
  ];
})();
"""


def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)


class Fixture:
    """A throwaway repo whose nav.js and page set each test composes."""

    def __init__(self):
        self.dir = tempfile.mkdtemp(prefix="reach-fixture-")
        os.makedirs(os.path.join(self.dir, "scripts"), exist_ok=True)
        shutil.copy(SRC, os.path.join(self.dir, "scripts", "reachability-contract.py"))

    def nav(self, sub_entries, ps_keys):
        write(self.path("nav.js"), NAV_TEMPLATE % {
            "sub": ",".join("['%s','%s','%s']" % e for e in sub_entries),
            "ps": "    " + ",".join("%s:'command'" % k for k in ps_keys) + ",",
        })

    def page(self, slug, with_container=True):
        body = '<aside id="omega-side"></aside>' if with_container else '<div></div>'
        write(self.path(slug + ".html"), "<!DOCTYPE html><html><body>%s</body></html>" % body)

    def path(self, *parts):
        return os.path.join(self.dir, *parts)

    def run(self, *args):
        return subprocess.run(
            [sys.executable, os.path.join(self.dir, "scripts", "reachability-contract.py")]
            + list(args),
            capture_output=True, text=True)

    def cleanup(self):
        shutil.rmtree(self.dir, ignore_errors=True)


class ReachabilityContractTest(unittest.TestCase):
    def setUp(self):
        self.fx = Fixture()

    def tearDown(self):
        self.fx.cleanup()

    # ---------------------------------------------------------------- clean

    def test_fully_registered_page_passes(self):
        self.fx.page("dashboard")
        self.fx.nav([("dashboard", "DASHBOARD", "/dashboard.html")], ["dashboard"])
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)
        self.assertIn("every destination page is linked", r.stdout)

    def test_help_prints_docstring_and_exits_zero(self):
        r = self.fx.run("--help")
        self.assertEqual(r.returncode, 0)
        self.assertIn("no member can reach", r.stdout)
        self.assertNotIn("destinations,", r.stdout)   # did not run the job

    # ----------------------------------------------------------- must catch

    def test_unlinked_page_is_blocking(self):
        self.fx.page("dashboard")
        self.fx.page("orphan")
        self.fx.nav([("dashboard", "DASHBOARD", "/dashboard.html")],
                    ["dashboard", "orphan"])
        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("UNREACHABLE", r.stdout)
        self.assertIn("orphan.html", r.stdout)

    def test_missing_ps_entry_is_reported_but_not_blocking(self):
        """A page with a link but no PS entry renders nav with nothing active."""
        self.fx.page("dashboard")
        self.fx.page("gateway")
        self.fx.nav([("dashboard", "DASHBOARD", "/dashboard.html"),
                     ("gateway", "GATEWAY", "/gateway.html")],
                    ["dashboard"])          # gateway deliberately absent
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)   # advisory only
        self.assertIn("NO ACTIVE STATE", r.stdout)
        self.assertIn("gateway.html", r.stdout)

    def test_the_two_findings_are_distinct(self):
        """Conflating them is what produced a wrong count of 15 for 7 and 15."""
        self.fx.page("dashboard")
        self.fx.page("orphan")     # neither linked nor in PS
        self.fx.page("gateway")    # linked, not in PS
        self.fx.nav([("dashboard", "DASHBOARD", "/dashboard.html"),
                     ("gateway", "GATEWAY", "/gateway.html")],
                    ["dashboard"])
        r = self.fx.run()
        self.assertEqual(r.returncode, 1)
        unreach = r.stdout.split("NO ACTIVE STATE")[0]
        self.assertIn("orphan.html", unreach)
        self.assertNotIn("gateway.html", unreach)     # linked, so not unreachable
        self.assertIn("1 unreachable page(s)", r.stdout)

    def test_missing_nav_container_is_reported(self):
        """architecture.html was registered yet rendered no sidebar at all."""
        self.fx.page("dashboard")
        self.fx.page("stub", with_container=False)
        self.fx.nav([("dashboard", "DASHBOARD", "/dashboard.html"),
                     ("stub", "STUB", "/stub.html")],
                    ["dashboard", "stub"])
        r = self.fx.run()
        self.assertEqual(r.returncode, 0)
        self.assertIn("NO NAV CONTAINER", r.stdout)
        self.assertIn("stub.html", r.stdout)

    # -------------------------------------------------------- must NOT trip

    def test_deep_link_with_fragment_still_counts_as_reachable(self):
        """['gates','12 GATES','/elements.html#gates'] makes ELEMENTS reachable."""
        self.fx.page("dashboard")
        self.fx.page("elements")
        self.fx.nav([("dashboard", "DASHBOARD", "/dashboard.html"),
                     ("gates", "12 GATES", "/elements.html#gates")],
                    ["dashboard", "elements"])
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_flagged_entry_still_counts_as_reachable(self):
        """['control-plane','OWNER DECK','/control-plane.html','owner'] is a nav
        destination; the 4th field only flags it owner-only. Before the pattern
        allowed it, the gate called control-plane.html unreachable."""
        self.fx.page("dashboard")
        self.fx.page("control-plane")
        write(self.fx.path("nav.js"), NAV_TEMPLATE % {
            "sub": "['dashboard','DASHBOARD','/dashboard.html'],"
                   "['control-plane','OWNER DECK','/control-plane.html','owner']",
            "ps": "    dashboard:'command','control-plane':'command',",
        })
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_fragment_slug_does_not_make_a_page_reachable(self):
        """The href is what counts, not the entry's slug.

        Keying on the slug would call gates.html linked because an entry named
        'gates' exists -- while nothing actually points at gates.html.
        """
        self.fx.page("dashboard")
        self.fx.page("elements")
        self.fx.page("gates")          # a real page nothing links to
        self.fx.nav([("dashboard", "DASHBOARD", "/dashboard.html"),
                     ("gates", "12 GATES", "/elements.html#gates")],
                    ["dashboard", "elements", "gates"])
        r = self.fx.run()
        self.assertEqual(r.returncode, 1, r.stdout)
        self.assertIn("gates.html", r.stdout)

    def test_system_pages_are_exempt(self):
        self.fx.page("dashboard")
        for slug in ("404", "enter", "terms", "offline", "pending", "reset", "account"):
            self.fx.page(slug)
        self.fx.nav([("dashboard", "DASHBOARD", "/dashboard.html")], ["dashboard"])
        r = self.fx.run()
        self.assertEqual(r.returncode, 0, r.stdout)

    def test_stale_exemption_is_reported(self):
        """A SYSTEM_PAGES entry whose page no longer exists is dead bookkeeping."""
        self.fx.page("dashboard")
        self.fx.nav([("dashboard", "DASHBOARD", "/dashboard.html")], ["dashboard"])
        r = self.fx.run()
        self.assertEqual(r.returncode, 0)
        self.assertIn("STALE EXEMPTION", r.stdout)
        self.assertIn("404", r.stdout)


if __name__ == "__main__":
    unittest.main(verbosity=2)
