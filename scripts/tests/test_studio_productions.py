"""A Studios production may be called a screenplay draft only if the screenplay exists, and may claim nothing more
without evidence. Guards CLAUDE.md 8.1 class 9 (fabricated data presented as fact) for the entertainment division."""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
REG = json.loads((ROOT / "config" / "omega-studio-productions.json").read_text(encoding="utf-8"))
_AG = json.loads((ROOT / "omega-agents.json").read_text(encoding="utf-8"))
AGENTS = {a["sign"]: a for a in (_AG["agents"] if isinstance(_AG, dict) else _AG)}
MEDIA = (ROOT / "media.html").read_text(encoding="utf-8")
CLAIMS = re.compile(r"\b(streaming now|now streaming|in theatres|in theaters|out now|available now|coming soon|now playing)\b", re.I)


def text(rel):
    return (ROOT / rel).read_text(encoding="utf-8")


class StudioProductions(unittest.TestCase):
    def test_every_listed_file_exists(self):
        for p in REG["productions"]:
            for rel in [p["package"]] + p["screenplay"] + p["mediaFiles"]:
                self.assertTrue((ROOT / rel).is_file(), rel)

    def test_status_needs_what_it_claims(self):
        for p in REG["productions"]:
            self.assertIn(p["status"], REG["statuses"])
            if p["status"] in ("IN_PRODUCTION", "PUBLISHED"):
                self.assertTrue(p["mediaFiles"], p["id"] + " claims " + p["status"] + " with no media file")
            if p["status"] == "PUBLISHED":
                self.assertTrue(p["release"], p["id"])
            if p["status"] == "SCREENPLAY_DRAFT":
                self.assertTrue(p["screenplay"], p["id"])
                self.assertFalse(p["mediaFiles"], "a draft with media files should be re-statused")

    def test_unapproved_stays_flagged_in_the_package(self):
        for p in REG["productions"]:
            if not p["approvedByOwner"]:
                self.assertIn("Not approved", text(p["package"]).replace("not approved", "Not approved"))

    def test_screenplay_is_a_screenplay_not_a_synopsis(self):
        for p in REG["productions"]:
            words = sum(len(text(rel).split()) for rel in p["screenplay"])
            self.assertGreater(words, 10000, p["id"])
            body = "\n".join(text(rel) for rel in p["screenplay"])
            self.assertGreater(len(re.findall(r"^(?:INT|EXT)\.", body, re.M)), 25)
            self.assertIn("THE END", text(p["screenplay"][-1]))

    def test_no_release_claims_in_the_screenplay(self):
        for p in REG["productions"]:
            for rel in p["screenplay"]:
                self.assertIsNone(CLAIMS.search(text(rel)), rel)

    def test_no_authoring_notes_left_in_any_screenplay(self):
        stray = re.compile(r"\b(TODO|TBD|FIXME|XXX|LOREM)\b|\?\s+NO\b")
        for p in REG["productions"]:
            for rel in p["screenplay"]:
                for n, line in enumerate(text(rel).splitlines(), 1):
                    self.assertIsNone(stray.search(line), "%s:%d %s" % (rel, n, line[:60]))

    def test_canon_parity_for_the_seven_stones(self):
        p = [x for x in REG["productions"] if x["id"] == "myth-of-the-stones-the-seven-stones"][0]
        body = "\n".join(text(r) for r in p["screenplay"])
        for name in ("AUREN", "LYRA", "TORIN", "SERAPHINE", "MALACHAR", "ERYNDOR"):
            self.assertIn(name, body, name)
        self.assertNotRegex(body, r"\bKAEL\b")
        self.assertNotRegex(body, r"(?i)9\.17\s?Hz")
        self.assertIn("9.1717 Hz", body)
        self.assertGreater(len(body.split()), 14000)

    def test_canon_parity_for_the_rise_of_aries(self):
        body = "\n".join(text(r) for r in REG["productions"][0]["screenplay"])
        for name in ("Kael Marren", "Adaeze Okonkwo-Reyes", "Vahn Ossara"):
            self.assertIn(name.split()[0].upper(), body, name)
            self.assertIn(name.split()[-1] if name != "Vahn Ossara" else "Ossara", MEDIA, name)
        for sign, god in (("Aries", "Ares"), ("Pisces", "Poseidon")):
            self.assertEqual(AGENTS[sign]["god"], god)
            self.assertIn(god.upper(), body)
        self.assertEqual(AGENTS["Libra"]["god"], "Hera")
        self.assertIn("HERA", body)
        self.assertNotRegex(body, r"(?i)orion")


if __name__ == "__main__":
    unittest.main()
