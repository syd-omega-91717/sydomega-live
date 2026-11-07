"""The Studios canon registry must stay consistent, and the validator must really catch contradictions.

A validator that reports 0 findings proves nothing until it is shown to fail on a planted violation (CLAUDE.md 8.4).
"""
import copy
import importlib.util
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("studio_canon_check", ROOT / "scripts" / "studio-canon-check.py")
chk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(chk)
REG = chk.load(chk.REG_PATH)
SLATE = chk.load(chk.SLATE_PATH)
PROD = chk.load(chk.PROD_PATH)


class StudioCanon(unittest.TestCase):
    def test_the_real_registry_passes(self):
        self.assertEqual(chk.validate(REG, SLATE, PROD), [])

    def test_bibles_are_current(self):
        for f in REG["franchises"]:
            p = chk.BIBLE_DIR / f["id"] / "bible.md"
            self.assertTrue(p.is_file(), f["id"])
            self.assertEqual(p.read_text(encoding="utf-8"), chk.render_bible(REG, f), f["id"])

    def test_catalogue_matches_the_brief(self):
        self.assertEqual([f["number"] for f in REG["franchises"]], list(range(1, 8)))
        self.assertEqual(len(REG["ages"]), 7)
        self.assertEqual(len(REG["divisions"]), 7)
        self.assertEqual(sum(len(f["films"]) for f in REG["franchises"]), 26)

    def test_film_status_matches_its_production_record(self):
        prod = {p["id"]: p for p in PROD["productions"]}
        for f in REG["franchises"]:
            for film in f["films"]:
                if film.get("production"):
                    self.assertEqual(film["status"], prod[film["production"]]["status"], film["id"])
                else:
                    self.assertEqual(film["status"], "CONCEPT", film["id"])

    def test_two_screenplay_drafts_are_registered(self):
        drafts = sorted(film["id"] for f in REG["franchises"] for film in f["films"] if film["status"] == "SCREENPLAY_DRAFT")
        self.assertEqual(drafts, ["myth-of-the-stones/the-seven-stones", "zodiac-wars/the-rise-of-aries"])

    def test_renames_from_the_resolved_conflicts_are_applied(self):
        ch = {c["id"]: c for c in REG["characters"]}
        self.assertEqual(ch["elias-veyron"]["name"], "Elian Veyron")
        self.assertEqual(ch["tharion-voss"]["name"], "Tharion Vorne")
        self.assertEqual(ch["seraphine"]["aliasOf"], "eryndor")
        titles = {film["id"]: film["title"] for f in REG["franchises"] for film in f["films"]}
        self.assertEqual(titles["zodiac-wars/the-twelve-houses"], "The Thirteenth Seat")

    def test_planted_missing_production_and_alias_are_caught(self):
        bad = copy.deepcopy(REG)
        bad["franchises"][0]["films"][1]["production"] = "does-not-exist"
        bad["characters"][0]["aliasOf"] = "nobody"
        errs = " | ".join(chk.validate(bad, SLATE, PROD))
        self.assertIn("does not exist", errs)
        self.assertIn("aliasOf", errs)

    def test_planted_name_collision_is_caught(self):
        bad = copy.deepcopy(REG)
        bad["characters"].append({"id": "kael-planted", "name": "Kael Planted", "franchise": "myth-of-the-stones",
                                  "role": "x", "canonStatus": "PROPOSED", "source": "test"})
        errs = chk.validate(bad, SLATE, PROD)
        self.assertTrue(any("'kael'" in e for e in errs), errs)

    def test_a_recorded_conflict_clears_the_collision(self):
        bad = copy.deepcopy(REG)
        bad["characters"].append({"id": "kael-planted", "name": "Kael Planted", "franchise": "myth-of-the-stones",
                                  "role": "x", "canonStatus": "PROPOSED", "source": "test"})
        bad["conflicts"].append({"id": "C-99", "kind": "name", "subjects": ["kael-planted", "kael-marren"],
                                 "resolution": "test", "status": "OPEN"})
        self.assertEqual(chk.validate(bad, SLATE, PROD), [])

    def test_planted_bad_status_unknown_age_and_duplicate_are_caught(self):
        bad = copy.deepcopy(REG)
        bad["franchises"][0]["canonStatus"] = "APPROVED_BY_NOBODY"
        bad["franchises"][1]["ages"].append("age-99")
        bad["characters"].append(copy.deepcopy(bad["characters"][0]))
        errs = " | ".join(chk.validate(bad, SLATE, PROD))
        self.assertIn("outside vocabulary", errs)
        self.assertIn("unknown age", errs)
        self.assertIn("duplicate id", errs)

    def test_a_film_cannot_claim_more_than_concept_without_a_production(self):
        bad = copy.deepcopy(REG)
        bad["franchises"][0]["films"][1]["status"] = "PUBLISHED"
        self.assertTrue(any("no production record" in e for e in chk.validate(bad, SLATE, PROD)))

    def test_a_film_cannot_outrun_its_production_record(self):
        bad = copy.deepcopy(REG)
        bad["franchises"][0]["films"][0]["status"] = "PUBLISHED"
        self.assertTrue(any("its production says" in e for e in chk.validate(bad, SLATE, PROD)))

    def test_frequency_guard_matches_only_the_short_form(self):
        self.assertTrue(chk.BAD_FREQ.search("a hum of 9.17 Hz"))
        self.assertFalse(chk.BAD_FREQ.search("a hum of 9.1717 Hz"))

    def test_mapped_ids_exist_in_the_merged_slate(self):
        ids = {f["id"] for f in SLATE["franchises"]}
        for f in REG["franchises"]:
            self.assertTrue(set(f["mappedFrom"]) <= ids, f["id"])

    def test_every_merged_slate_franchise_is_mapped_somewhere(self):
        mapped = {m for f in REG["franchises"] for m in f["mappedFrom"]}
        self.assertEqual(mapped, {f["id"] for f in SLATE["franchises"]})

    def test_universe_bible_names_every_franchise_and_conflict(self):
        bible = (ROOT / "docs" / "studios" / "canon" / "OMEGA_STUDIOS_UNIVERSE_BIBLE.md").read_text(encoding="utf-8")
        for f in REG["franchises"]:
            self.assertIn(f["title"], bible, f["id"])
        for c in REG["conflicts"]:
            self.assertIn("| %s |" % c["id"], bible, c["id"])
            row = [l for l in bible.splitlines() if l.startswith("| %s |" % c["id"])][0]
            self.assertEqual("**open**" in row, c["status"] == "OPEN", c["id"])

    def test_approval_needs_a_date_a_note_and_an_approved_production(self):
        bad = copy.deepcopy(PROD)
        bad["productions"][0]["approvedByOwner"] = True
        errs = " | ".join(chk.validate(REG, SLATE, bad))
        self.assertIn("without approvedOn and approvalNote", errs)
        bad2 = copy.deepcopy(REG)
        bad2["characters"][0]["canonStatus"] = "FOUNDER_APPROVED"
        self.assertIn("FOUNDER_APPROVED without an approved production", " | ".join(chk.validate(bad2, SLATE, PROD)))

    def test_seven_stones_is_approved_and_rise_of_aries_is_not(self):
        prod = {p["id"]: p for p in PROD["productions"]}
        self.assertTrue(prod["myth-of-the-stones-the-seven-stones"]["approvedByOwner"])
        self.assertFalse(prod["zodiac-wars-rise-of-aries"]["approvedByOwner"])

    def test_series_and_game_claims_need_their_files(self):
        bad = copy.deepcopy(REG)
        bad["franchises"][2]["series"]["bible"] = "docs/studios/no-such-series-bible.md"   # a series claiming a status whose bible file is absent
        bad["franchises"][5]["game"]["status"] = "PROTOTYPE"  # the-human-frontier has no design document
        bad["franchises"][2]["game"]["multiplayer"] = "LIVE"
        errs = " | ".join(chk.validate(bad, SLATE, PROD))
        self.assertIn("bible file is missing", errs)
        self.assertIn("design document is missing", errs)
        self.assertIn("multiplayer may not be claimed", errs)

    def test_only_origins_is_a_prototype_designed_games_have_documents_and_none_is_released_or_multiplayer(self):
        # Origins is a PROTOTYPE (Vertical Slice 0 exists, nobody has play-tested it). Four games are DESIGNED, each with a
        # design document that exists; every other game is still CONCEPT.
        designed = []
        for f in REG["franchises"]:
            allowed = ("PROTOTYPE",) if f["id"] == "myth-of-the-stones" else ("CONCEPT", "DESIGNED")
            self.assertIn(f["game"]["status"], allowed, f["id"])
            self.assertEqual(f["game"]["multiplayer"], "UNAVAILABLE", f["id"])
            if f["game"]["status"] == "DESIGNED":
                designed.append(f["id"])
                self.assertTrue((ROOT / f["game"]["gdd"]).is_file(), f["id"])
        self.assertEqual(designed, ["zodiac-wars", "the-omega-chronicles", "the-last-galactic-empire"])
        past = [f["id"] for f in REG["franchises"] if f["game"]["status"] != "CONCEPT"]
        self.assertEqual(past, ["myth-of-the-stones"] + designed)

    def test_a_series_with_scripts_names_files_that_exist_and_no_other_series_claims_scripts(self):
        with_scripts = []
        for f in REG["franchises"]:
            s = f["series"]
            if s["status"] == "SCRIPTS_DRAFT":
                with_scripts.append(f["id"])
                self.assertTrue(s["scripts"] and all((ROOT / x).is_file() for x in s["scripts"]), f["id"])
                self.assertTrue((ROOT / s["bible"]).is_file(), f["id"])
            else:
                self.assertNotIn("scripts", s, f["id"])
        self.assertEqual(with_scripts, ["myth-of-the-stones", "zodiac-wars", "the-omega-chronicles", "the-lost-civilizations", "the-last-galactic-empire", "the-human-frontier"])

    def test_help_exits_zero(self):
        import subprocess, sys
        out = subprocess.run([sys.executable, str(ROOT / "scripts" / "studio-canon-check.py"), "--help"],
                             capture_output=True, text=True)
        self.assertEqual(out.returncode, 0)
        self.assertIn("Studios canon registry", out.stdout)


if __name__ == "__main__":
    unittest.main()
