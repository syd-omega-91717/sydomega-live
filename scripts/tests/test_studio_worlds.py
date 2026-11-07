"""The Studios Worlds layer must stay sourced, and the validator must really catch invented canon.

A validator that reports 0 findings proves nothing until it is shown to fail on a planted violation (CLAUDE.md 8.4).
Each test below plants one violation in a deep copy of the real data and asserts the finding it should raise.
"""
import copy
import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("studio_worlds_check", ROOT / "scripts" / "studio-worlds-check.py")
chk = importlib.util.module_from_spec(spec)
spec.loader.exec_module(chk)
W = chk.load(chk.WORLDS_PATH)
REG = chk.load(chk.REG_PATH)
PROD = chk.load(chk.PROD_PATH)
CANON = chk.load(chk.CANON_PATH)
KINGS = chk.real_king_names()


def run(w):
    return chk.validate(w, REG, PROD, CANON, KINGS)


def find(w, section, eid):
    return next(e for e in w[section] if e["id"] == eid)


class StudioWorlds(unittest.TestCase):
    def test_the_real_data_passes(self):
        self.assertEqual(run(W), [])

    def test_real_world_kings_are_read_from_the_page(self):
        self.assertIn("alexander the great", KINGS)
        self.assertGreaterEqual(len(KINGS), 9)

    def test_the_twelve_worlds_cover_every_track_once(self):
        tracks = sorted(e["track"] for e in W["worlds"] if e.get("track"))
        self.assertEqual(tracks, list(range(1, 13)))
        self.assertEqual(len(W["worlds"]), 13)  # twelve ruled worlds plus Earth, the thirteenth seat

    def test_only_media_anchored_worlds_claim_repo_canon_for_a_ruled_world(self):
        repo = sorted(e["id"] for e in W["worlds"] if e["status"] == "REPO_CANON" and e.get("ruler"))
        self.assertEqual(repo, ["ceres", "mars", "neptune"])

    def test_duplicate_id_is_caught(self):
        w = copy.deepcopy(W)
        w["places"][1]["id"] = w["places"][0]["id"]
        self.assertTrue(any("duplicate id" in f for f in run(w)))

    def test_unknown_status_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "places", "aurelith")["status"] = "CANON"
        self.assertTrue(any("outside vocabulary" in f for f in run(w)))

    def test_a_missing_source_file_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "places", "aurelith")["sources"] = ["docs/studios/does-not-exist.md"]
        self.assertTrue(any("does not exist" in f for f in run(w)))

    def test_a_place_not_named_in_its_source_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "places", "kharesh-basin")["name"] = "Zorvath Basin"
        self.assertTrue(any("not named in any cited source" in f for f in run(w)))

    def test_a_guessed_world_claiming_repo_canon_from_a_proposal_is_caught(self):
        # Juno is only PROPOSED in docs/canon; promoting it on that citation alone is the exact error this layer once made.
        w = copy.deepcopy(W)
        find(w, "worlds", "juno")["status"] = "REPO_CANON"
        fs = run(w)
        self.assertTrue(any("outside docs/" in f for f in fs), fs)

    def test_a_repo_canon_world_not_named_with_its_ruler_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "worlds", "mars")["sources"] = ["omega-canon.json"]  # real file, but it never says Ares-Mars
        self.assertTrue(any("names Ares and Mars together" in f for f in run(w)))

    def test_a_ruler_that_is_not_the_canon_god_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "worlds", "mars")["ruler"] = "Zeus"
        self.assertTrue(any("not the canon god" in f for f in run(w)))

    def test_two_worlds_on_one_track_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "worlds", "venus")["track"] = 1
        find(w, "worlds", "venus")["ruler"] = "Ares"
        self.assertTrue(any("exactly one world" in f for f in run(w)))

    def test_founder_approval_needs_an_owner_approved_production(self):
        w = copy.deepcopy(W)
        find(w, "places", "aurelith")["approvedBy"] = "zodiac-wars-rise-of-aries"  # draft, not owner-approved
        self.assertTrue(any("not owner-approved" in f for f in run(w)))

    def test_founder_approval_needs_the_place_in_that_package(self):
        w = copy.deepcopy(W)
        p = find(w, "places", "ormel-hesh")
        p["status"] = "FOUNDER_APPROVED"
        p["approvedBy"] = "myth-of-the-stones-the-seven-stones"  # Ormel Hesh is only in the unapproved Season 1 bible
        self.assertTrue(any("approved production's package" in f for f in run(w)))

    def test_approved_by_on_a_proposal_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "places", "meridian-city")["approvedBy"] = "myth-of-the-stones-the-seven-stones"
        self.assertTrue(any("only valid on a FOUNDER_APPROVED" in f for f in run(w)))

    def test_a_holder_outside_the_character_registry_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "thrones", "throne-imperial")["holders"][0]["character"] = "emperor-nobody"
        self.assertTrue(any("not in the character registry" in f for f in run(w)))

    def test_an_unresolved_world_reference_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "places", "ares-foundry")["world"] = "atlantis"
        self.assertTrue(any("is not a world" in f for f in run(w)))

    def test_a_placed_entry_must_say_why_it_is_placed(self):
        w = copy.deepcopy(W)
        del find(w, "places", "ares-foundry")["worldBasis"]
        self.assertTrue(any("worldBasis" in f for f in run(w)))

    def test_an_open_slot_nobody_asked_about_is_caught(self):
        w = copy.deepcopy(W)
        for q in w["openQuestions"]:
            q["subjects"] = [s for s in q["subjects"] if s != "throne-ash"]
        w["openQuestions"] = [q for q in w["openQuestions"] if q["subjects"]]
        self.assertTrue(any("no openQuestion raises it" in f for f in run(w)))

    def test_an_open_slot_may_not_be_filled_with_a_cited_name(self):
        w = copy.deepcopy(W)
        find(w, "places", "imperial-capital")["sources"] = ["media.html"]
        self.assertTrue(any("OPEN slot must not cite sources" in f for f in run(w)))

    def test_a_real_world_king_in_the_fiction_is_caught(self):
        w = copy.deepcopy(W)
        find(w, "thrones", "throne-nefara")["name"] = "Napoleon Bonaparte"
        self.assertTrue(any("real-world king" in f for f in run(w)))

    def test_a_stale_character_table_is_caught(self):
        w = copy.deepcopy(W)
        w["characters"]["ithren"]["status"] = "PROPOSED"  # the registry says FOUNDER_APPROVED
        self.assertTrue(any("out of sync with the registry" in f for f in run(w)))

    def test_the_ring_wall_keeps_two_blanks(self):
        w = copy.deepcopy(W)
        w["sky"]["rings"]["blank"] = 0
        self.assertTrue(any("two blank" in f for f in run(w)))

    def test_every_open_slot_is_raised_in_the_real_data(self):
        opens = {e["id"] for s in chk.SECTIONS for e in W[s] if e["status"] == "OPEN"}
        raised = {s for q in W["openQuestions"] for s in q["subjects"]}
        self.assertTrue(opens <= raised, opens - raised)


if __name__ == "__main__":
    unittest.main()
