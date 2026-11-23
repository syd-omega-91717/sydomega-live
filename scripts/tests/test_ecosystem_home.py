"""The ecosystem home (omega-ecosystem-home.js + its skeleton in dashboard.html).

The owner's reference design (assets/concept/reel-01.jpg) is one composed surface, and the mock-up it came from carries figures this platform has no data for ("9,171,717 Omega",
an uptime curve, a revenue chart). Those are exactly the CLAUDE.md 8.1 class 9 trap, so this file pins the honesty contract: every panel reads a real source, names no
column the live schema lacks, never renders a number the platform did not measure, and never builds markup from data.
"""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
RAW = (ROOT / "omega-ecosystem-home.js").read_text(encoding="utf-8")
# The header comment quotes the mock-up's invented figures while explaining why they are refused, so content checks read the code, not the comments.
JS = re.sub(r"/\*.*?\*/", "", RAW, flags=re.S)
JS = re.sub(r"(?m)^\s*//.*$", "", JS)
HTML = (ROOT / "dashboard.html").read_text(encoding="utf-8")
SCHEMA = json.loads((ROOT / "supabase" / "live-schema.json").read_text(encoding="utf-8"))["tables"]


def cols(table):
    t = SCHEMA.get(table) or SCHEMA.get("public." + table) or {}
    return set(t.keys()) if isinstance(t, dict) else set(t)


class EcosystemHome(unittest.TestCase):
    def test_no_markup_is_built_from_data(self):
        for bad in ("innerHTML", "insertAdjacentHTML", "outerHTML", "document.write", "eval(", "new Function"):
            self.assertNotIn(bad, JS, bad)
        self.assertNotRegex(JS, r"\bon[a-z]+\s*=\s*['\"]")

    def test_every_column_read_exists_live(self):
        m = re.search(r"var COLS = '([^']+)'", JS)
        self.assertIsNotNone(m)
        missing = [c for c in m.group(1).split(",") if c not in cols("profiles")]
        self.assertEqual(missing, [])
        for table, expr in (("news", r"from\('news'\)\.select\('([^']+)'\)"), ("activity_feed", r"from\('activity_feed'\)\.select\('([^']+)'\)")):
            sel = re.search(expr, JS)
            self.assertIsNotNone(sel, table)
            self.assertEqual([c for c in sel.group(1).split(",") if c not in cols(table)], [], table)
        for table, col in (("news", "is_published"), ("activity_feed", "user_id")):
            self.assertIn(col, cols(table))

    def test_the_sources_are_exactly_these_four_reads(self):
        reads = re.findall(r"sb\.(?:from|rpc)\('([a-z_]+)'\)", JS)
        self.assertEqual(sorted(reads), sorted(["profiles", "my_sovereign_summary", "news", "activity_feed"]))

    def test_activity_is_the_members_own_not_the_public_feed(self):
        """Its policy is `is_public OR user_id = auth.uid()`; the panel says 'Your first task', so an unfiltered read would show other members' rows under that wording."""
        self.assertRegex(JS, r"from\('activity_feed'\)[^;]*\.eq\('user_id',\s*s\.user\.id\)")

    def test_profile_read_is_the_members_own_row(self):
        self.assertRegex(JS, r"from\('profiles'\)\.select\(COLS\)\.eq\('id',\s*s\.user\.id\)")

    def test_no_private_column_is_read(self):
        """Birth date, phone, email and the KYC fields are the owner's 'private by default' set; this surface has no use for any of them."""
        m = re.search(r"var COLS = '([^']+)'", JS)
        for private in ("dob", "birth_date", "phone", "email", "kyc_status", "kyc_doc_path", "country"):
            self.assertNotIn(private, m.group(1).split(","))
        self.assertNotRegex(JS, r"\.(dob|birth_date|phone|email)\b")

    def test_no_figure_is_invented(self):
        self.assertNotIn("Math.random", JS)
        self.assertNotRegex(JS + HTML[HTML.index("data-omega-ecosystem-home"):HTML.index("data-omega-daily")], r"9,171,717|9\.171\.717")
        # The one formatted number is the member's own authority, computed by the canon (OmegaCharacterCard.authorityOf) from their stored axes, the same figure the character page shows.
        self.assertEqual(re.findall(r"[^\n]*toFixed\([^\n]*", JS), ["    if (auth !== null && auth !== undefined) bits.push('AUTH ' + Number(auth).toFixed(2));"])
        self.assertIn("C.authorityOf(p, canon)", JS)
        self.assertNotRegex(JS, r"Math\.floor\(Math")

    def test_wallet_is_a_standing_not_money(self):
        self.assertIn("SOVEREIGN POINTS", JS)
        self.assertIn("A standing in the platform, not money.", JS)
        self.assertNotRegex(JS, r"[$€£]\s*\d|USD|currency")

    def test_every_panel_has_an_honest_failure_and_empty_state(self):
        for phrase in ("could not be read right now", "No news has been published yet.", "No points are recorded for you yet.", "Nothing has happened yet."):
            self.assertIn(phrase, JS, phrase)

    def test_each_read_checks_error_before_rendering(self):
        self.assertGreaterEqual(len(re.findall(r"res\.error|prof\.error", JS)), 4)

    def test_only_https_avatars_are_used(self):
        self.assertRegex(JS, r"new URL\(String\(p\.avatar_url[\s\S]{0,40}u\.protocol === 'https:'")

    def test_the_skeleton_has_every_mount_the_module_fills(self):
        block = HTML[HTML.index("data-omega-ecosystem-home"):HTML.index("data-omega-daily")]
        for key in re.findall(r"q\('([a-z]+)'\)", JS):
            self.assertIn('data-oeh="%s"' % key, block, key)
        self.assertEqual(len(re.findall(r'data-omega-sculpture="lion"', block)), 1)          # the hero art is the winged lion (owner direction 2026-11-23)
        self.assertEqual(len(re.findall(r'data-sculpt-glow="radiant"', block)), 0)
        self.assertEqual(len(re.findall(r'data-omega-sculpture="chronos"', block)), 1)
        self.assertNotIn('data-omega-constellation', block, "omega-constellation.js is a minimum 860px square: in this 231px box it made the panel 941px tall")

    def test_the_loaded_scripts_are_in_the_page(self):
        self.assertIn('<script src="/omega-character-card.js" defer></script>', HTML)
        self.assertIn('<script src="/omega-ecosystem-home.js" defer></script>', HTML)

    def test_every_asset_it_names_exists(self):
        self.assertTrue((ROOT / "assets" / "legacy").is_dir())
        for sign in ("aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"):
            self.assertTrue((ROOT / "assets" / "legacy" / ("sign-%s.webp" % sign)).exists(), sign)
        movies = sorted((ROOT / "assets" / "movies").glob("franchise-*-640.webp"))
        self.assertEqual(len(movies), 12)

    def test_the_loop_link_has_a_target(self):
        self.assertIn('href="#oeh-today-loop"', HTML)
        self.assertEqual(HTML.count('id="oeh-today-loop"'), 1)

    def test_type_floor_and_no_card_classes(self):
        css = "".join(re.findall(r"font-size:(\d+)px", JS))
        sizes = [int(x) for x in re.findall(r"font-size:(\d+)px", JS)]
        self.assertTrue(all(s >= 12 for s in sizes), sizes)
        self.assertIsNotNone(css)
        self.assertNotRegex("".join(re.findall(r"'\.oeh[^{]*\{", JS)), r"card")

    def test_the_primary_button_label_beats_the_platform_link_colour_and_survives_hover(self):
        """The platform's a[href]:not(.on):not(.nav-home):not(.nav-back):not(.skip-link) weighs 5 classes, so a scoped `.oeh .oeh-btns a.btn-fill` (3) lost and `color` computed gold on the gold fill: the runtime contrast gate
        read 1:1 in CI (the label looked right only because -webkit-text-fill-color was dark). The rule must outweigh it, set `color` itself, and restate hover, where the platform swaps to a dark fill."""
        rest = re.search(r"'(\.oeh\.oeh \.oeh-btns a\.btn\.btn-fill\[href\])\{color:#120d02;-webkit-text-fill-color:#120d02", JS)
        self.assertIsNotNone(rest)
        self.assertRegex(JS, r"a\.btn\.btn-fill\[href\]:hover[^{]*\{color:#E2C86D;-webkit-text-fill-color:#E2C86D\}")

    def test_the_ring_uses_the_agents_own_signs_and_existing_art_not_a_second_table(self):
        """The ring is built from the agents list (name, sign, href) and the same signArt() medallion the agent list uses; it carries no sign table of its own."""
        self.assertRegex(JS, r"renderWheel\(q\('wheel'\), agents\)")
        wheel = JS[JS.index("function renderWheel"):JS.index("function renderUniverse")]
        self.assertIn("signArt(a.sign)", wheel)
        for sign in ("Aries", "Taurus", "Gemini", "Virgo", "Pisces"):
            self.assertNotIn(sign, wheel, "a literal sign name in the ring would be a second copy of the canon table")
        self.assertNotIn("innerHTML", wheel)

    def test_the_ring_keeps_the_44px_tap_target(self):
        self.assertIn("width:44px;height:44px;margin:-22px 0 0 -22px", RAW)

    def test_the_posters_show_four_across_not_a_fixed_pixel_width(self):
        self.assertIn("flex:0 0 max(150px,calc((100% - 36px)/4))", RAW)

    def test_an_avatar_that_fails_to_load_falls_back_to_the_medallion_once(self):
        """A populated-data render found a valid https avatar URL that did not load showing as a black disc with a broken-image icon. Scheme validation is not load validation."""
        block = JS[JS.index("function renderProfile"):JS.index("function num(")]
        self.assertIn("img.addEventListener('error'", block)
        self.assertIn("if (img.getAttribute('src') !== medallion) img.src = medallion;", block)
        self.assertNotRegex(block, r"\.onerror\s*=|onerror=", "no inline or property handler; addEventListener only")

    def test_it_declares_itself_once(self):
        self.assertIn("window.__omegaEcosystemHome", JS)
        self.assertIn("if (window.__omegaEcosystemHome) return;", JS)
        self.assertEqual(len(re.findall(r"window\.__omegaEcosystemHome\s*=\s*1", JS)), 1)


if __name__ == "__main__":
    unittest.main()
