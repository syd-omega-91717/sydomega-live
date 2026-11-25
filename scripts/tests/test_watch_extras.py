"""cinema.html was retired into movies.html; omega-watch-extras.js carries the two true, unique things it had."""
import os, re, subprocess, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))


def read(n):
    return open(os.path.join(ROOT, n), encoding="utf-8").read()


class WatchExtras(unittest.TestCase):
    def test_third_party_text_is_never_written_as_markup(self):
        j = re.sub(r"/\*.*?\*/", "", read("omega-watch-extras.js"), flags=re.S)
        self.assertNotIn("innerHTML", j)
        self.assertNotIn("insertAdjacentHTML", j)
        self.assertIn("^https:\\/\\/en\\.wikipedia\\.org\\/", j, "the link must be validated before it reaches href")

    def test_the_lists_come_from_the_tiles_not_from_a_copy(self):
        j = read("omega-watch-extras.js")
        self.assertIn("'.omv-tile[data-film]'", j)
        self.assertNotIn("War Sovereign", re.sub(r"/\*.*?\*/", "", j, flags=re.S), "film titles are read from the tiles")

    def test_the_claims_the_truth_contracts_deny_were_not_carried_over(self):
        for f in ("movies.html", "omega-watch-extras.js"):
            t = re.sub(r"/\*.*?\*/", "", read(f), flags=re.S)
            for dropped in ("144 SERIES", "FEATURED SERIES", "gate-locked", "Sovereign Genesis", "Kings of the Lattice"):
                self.assertNotIn(dropped, t, f)

    def test_no_page_links_to_cinema_html(self):
        bad = [f for f in os.listdir(ROOT) if f.endswith((".html", ".js")) and re.search(r"/cinema\.html", read(f))]
        self.assertEqual(bad, [])

    def test_browser_suite_when_asked(self):
        if not os.environ.get("OMEGA_WATCH_BROWSER"):
            self.skipTest("set OMEGA_WATCH_BROWSER=1 to run scripts/verify-watch-extras.js")
        r = subprocess.run(["node", os.path.join(ROOT, "scripts", "verify-watch-extras.js")], capture_output=True, text=True, timeout=300)
        self.assertEqual(r.returncode, 0, r.stdout + r.stderr)


if __name__ == "__main__":
    unittest.main()
