"""grid.html and gates.html were merged into levels.html (tabs GRID, GATES, LOG ATTEMPT, HISTORY); omega-ladder.js owns all three views.

The three pages were three views of one ladder (OmegaCanon.authority). grid carried its own thresholds and the 12 signs (abbreviated), gates carried
thresholds written to two decimals and shifted a rung, levels carried the canon's table (CLAUDE.md 8.1 class 8). The merged page reads the canon.
"""
import glob, json, os, re, subprocess, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def read(n):
    return open(os.path.join(ROOT, n), encoding="utf-8").read()


class LadderMerge(unittest.TestCase):
    def test_the_pages_are_gone_and_redirect_to_their_tabs(self):
        for p in ("grid.html", "gates.html"):
            self.assertFalse(os.path.exists(os.path.join(ROOT, p)), p)
        r = {x["source"]: x["destination"] for x in json.loads(read("vercel.json"))["redirects"]}
        for src, dst in (("/grid", "/levels#grid"), ("/grid.html", "/levels#grid"), ("/gates", "/levels#gates"), ("/gates.html", "/levels#gates")):
            self.assertEqual(r.get(src), dst, src)

    def test_nothing_links_to_the_retired_pages(self):
        bad = []
        for pat in ("*.html", "*.js"):
            for f in glob.glob(os.path.join(ROOT, pat)):
                t = open(f, encoding="utf-8", errors="replace").read()
                if re.search(r"/(grid|gates)\.html", t):
                    bad.append(os.path.basename(f))
        self.assertEqual(bad, [])

    def test_the_merged_page_has_the_eight_tabs_and_no_inline_handlers(self):
        s = read("levels.html")
        for tab in ("all", "structure", "my", "grid", "gates", "attempt", "history", "science"):
            self.assertIn('data-tab="%s"' % tab, s)
            self.assertIn('id="tab-%s"' % tab, s)
        self.assertNotIn("onclick", s)
        self.assertIn('src="/omega-ladder.js"', s)
        ids = re.findall(r'\bid="([^"]+)"', s)
        self.assertEqual([i for i in set(ids) if ids.count(i) > 1], [], "duplicate ids")

    def test_the_ladder_comes_from_the_canon_not_from_a_copy(self):
        j = read("omega-ladder.js")
        for needle in ("OmegaCanon.authority", "gate_names", "OmegaCanon.houses"):
            self.assertIn(needle, j)
        j = re.sub(r"/\*.*?\*/", "", j, flags=re.S)   # the header comment explains the old copies; only code can be a copy
        canon = json.load(open(os.path.join(ROOT, "omega-canon.json"), encoding="utf-8"))["authority"]
        for g in canon["gates"]:
            self.assertNotIn(str(g), j, "a canon threshold is hard-coded in omega-ladder.js")
        # 'APEX' is also a gate DOMAIN label here (a different thing); a copied ladder would carry most of the 12 names
        copied = [n for n in canon["gate_names"] if "'%s'" % n in j]
        self.assertLessEqual(len(copied), 1, "canon rank names are hard-coded in omega-ladder.js: %s" % copied)

    def test_member_data_keeps_its_keys_and_failed_writes_are_not_success(self):
        j = read("omega-ladder.js")
        self.assertIn("'omega_gates'", j)
        self.assertIn("'omega_gate_history'", j)
        self.assertIn("COULD NOT SAVE", j)
        self.assertEqual(j.count("COULD NOT SAVE"), 2)   # MARK MASTERED and LOG ATTEMPT both check the write (8.1 class 1)

    def test_the_gate_unlock_rule_is_the_old_one_with_canon_numbers(self):
        j = read("omega-ladder.js")
        self.assertIn("function unlockAt(n) { var t = thr(); return n === 1 ? 0 : n === 12 ? t[11] : t[n - 2]; }", j)

    def test_the_lattice_numbers_moved_verbatim(self):
        s = read("levels.html")
        for text in ("12 levels × 12 phases = 144 intersections", "144 × 729 = 104,976 total lattice nodes", "Kings expansion: 28×28×729 = 571,536 nodes",
                     "26,453,952", "APEX AT 27.8367", "THE LATTICE GRID &middot; THE SCIENCE", "GATES &middot; THE SCIENCE"):
            self.assertIn(text, s)

    def test_browser_suite_when_asked(self):
        if not os.environ.get("OMEGA_LADDER_BROWSER"):
            self.skipTest("set OMEGA_LADDER_BROWSER=1 to run scripts/verify-ladder-page.js")
        r = subprocess.run(["node", os.path.join(ROOT, "scripts", "verify-ladder-page.js")], capture_output=True, text=True, timeout=300)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main()
