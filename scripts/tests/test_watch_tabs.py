"""movies.html, cinema.html and series.html are three views of one catalogue and share one tab bar.

movies and cinema list the same twelve films; trailers.html says no trailer has been filmed. The menu shows
one WATCH entry and the three pages link to each other with plain anchors (no script, each tab a real page).
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
TABS = [("movies", "FILMS"), ("cinema", "FILM GUIDE"), ("series", "SERIES")]


class WatchTabs(unittest.TestCase):
    def test_each_page_has_the_same_three_tabs_and_marks_itself(self):
        for page, _ in TABS:
            html = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            bars = re.findall(r'<nav class="watch-tabs" aria-label="Watch">(.*?)</nav>', html, re.S)
            self.assertEqual(len(bars), 1, page)
            links = re.findall(r'<a href="/([a-z]+)\.html"( aria-current="page")?>([A-Z ]+)</a>', bars[0])
            self.assertEqual([(k, l) for k, _, l in links], TABS, page)
            self.assertEqual([k for k, cur, _ in links if cur], [page], page)

    def test_every_tab_is_a_real_page(self):
        for page, _ in TABS:
            self.assertTrue((ROOT / (page + ".html")).exists(), page)

    def test_the_menu_has_one_watch_entry_and_the_empty_trailers_page_is_folded_not_deleted(self):
        nav = (ROOT / "nav.js").read_text(encoding="utf-8")
        self.assertIn("['movies','WATCH','/movies.html']", nav)
        self.assertIn("['trailers','TRAILERS','/trailers.html','folded']", nav)
        self.assertIn("cosmos:['cosmos','horoscope','media','movies'],", nav)
        self.assertTrue((ROOT / "trailers.html").exists())

    def test_the_active_tab_outranks_the_global_link_tint(self):
        css = (ROOT / "css" / "omega-system.css").read_text(encoding="utf-8")
        self.assertIn('.watch-tabs a[href][aria-current="page"]:not(.on):not(.nav-home):not(.nav-back):not(.skip-link){color:#0A0A0F;background:#C9A84C', css)


class SpatialIntegrationStillAgrees(unittest.TestCase):
    """spatial-nav-materialize.yml runs integrate-spatial-realms.js and then `git diff --exit-code`.
    The script looked for the literal label MOVIES, so renaming the entry to WATCH made it throw
    (run 43537200579). ci-local.sh did not mirror that workflow, so the failure reached main."""

    def test_the_script_runs_clean_and_changes_nothing(self):
        import subprocess
        files = ["nav.js", "gaming.html", "cinema.html", "movies.html", "characters.html"]
        before = {f: (ROOT / f).read_bytes() for f in files if (ROOT / f).exists()}
        try:
            r = subprocess.run(["node", "scripts/integrate-spatial-realms.js"], cwd=ROOT, capture_output=True, text=True)
            self.assertEqual(r.returncode, 0, r.stderr[-400:])
            changed = [f for f, b in before.items() if (ROOT / f).read_bytes() != b]
            self.assertEqual(changed, [], "the integration script rewrote files it should find already integrated")
        finally:
            for f, b in before.items():
                if (ROOT / f).read_bytes() != b:
                    (ROOT / f).write_bytes(b)


if __name__ == "__main__":
    unittest.main()
