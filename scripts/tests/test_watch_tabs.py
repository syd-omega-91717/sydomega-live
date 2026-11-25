"""movies.html and series.html are the two views of one catalogue and share one tab bar.

cinema.html listed the same twelve films as movies.html, so its descriptions moved onto the film tiles and it
left the tab bar (the file stays: search, the launcher and the media hub still reach it). trailers.html says
no trailer has been filmed. The menu shows one WATCH entry; the tabs are plain anchors, each a real page.
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
TABS = [("movies", "FILMS"), ("series", "SERIES")]


class WatchTabs(unittest.TestCase):
    def test_each_page_has_the_same_tabs_and_marks_itself(self):
        for page, _ in TABS:
            html = (ROOT / (page + ".html")).read_text(encoding="utf-8")
            bars = re.findall(r'<nav class="watch-tabs" aria-label="Watch">(.*?)</nav>', html, re.S)
            self.assertEqual(len(bars), 1, page)
            links = re.findall(r'<a href="/([a-z]+)\.html"( aria-current="page")?>([A-Z ]+)</a>', bars[0])
            self.assertEqual([(k, l) for k, _, l in links], TABS, page)
            self.assertEqual([k for k, cur, _ in links if cur], [page], page)

    def test_cinema_was_merged_into_movies_and_redirects(self):
        import json
        self.assertFalse((ROOT / "cinema.html").exists())
        redirects = {r["source"]: r["destination"] for r in json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))["redirects"]}
        self.assertEqual(redirects.get("/cinema"), "/movies#elements")
        self.assertEqual(redirects.get("/cinema.html"), "/movies#elements")

    def test_every_film_tile_says_what_the_film_is(self):
        html = (ROOT / "movies.html").read_text(encoding="utf-8")
        tiles = re.findall(r'<figure class="omv-tile card".*?</figure>', html, re.S)
        self.assertEqual(len(tiles), 12)
        for tile in tiles:
            desc = re.search(r'<p class="omv-desc">(.+?)</p>', tile)
            self.assertTrue(desc and len(desc.group(1)) > 40, tile[:80])
            self.assertEqual(len(re.findall(r"<span>[A-Z]+</span>", re.search(r'<p class="omv-tags">(.*?)</p>', tile).group(1))), 2)
        # a GATE tag would claim a lock the player does not enforce: every film plays for every member
        self.assertNotIn("GATE", "".join(tiles))

    def test_movies_carries_what_cinema_had_that_was_true(self):
        html = (ROOT / "movies.html").read_text(encoding="utf-8")
        for needle in ('id="elements"', 'id="omv-elements"', 'id="olympians"', 'id="omv-myth-grid"', '/omega-watch-extras.js'):
            self.assertIn(needle, html)
        for dropped in ("144 SERIES", "FEATURED SERIES", "gate-locked"):
            self.assertNotIn(dropped, html, "claims cinema made that the truth contracts deny must not come back")

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
        files = ["nav.js", "gaming.html", "movies.html", "characters.html"]
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
