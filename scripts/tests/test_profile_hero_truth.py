"""profile.html's hero states only what the member's own row supports.

Until 2026-10-18 every member saw "RANK 9.9.9" and four static badges --
OMEGA MASTER, ALL-TIME ACCESS, VERIFIED ARCHITECT, ABSOLUTE SOVEREIGN -- and
"ALL 36 SEALED AT OMEGA MASTER", with no script ever changing them (CLAUDE.md
8.1 class 9). omega-identity-core.js now derives rank and badges from
profiles + OmegaCanon's gate ladder; the markup ships neutral.
"""
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
PROFILE = (ROOT / "profile.html").read_text(encoding="utf-8")
CORE = (ROOT / "omega-identity-core.js").read_text(encoding="utf-8")


class ProfileHeroTruth(unittest.TestCase):
    def test_no_static_status_claims(self):
        for claim in ("RANK 9.9.9", "ALL-TIME ACCESS", "VERIFIED ARCHITECT",
                      "ABSOLUTE SOVEREIGN", "ALL 36 SEALED"):
            self.assertNotIn(claim, PROFILE, claim)

    def test_hero_is_derived(self):
        self.assertIn('src="/omega-identity-core.js"', PROFILE)
        self.assertIn("data-omega-identity-core", PROFILE)
        self.assertIn("OmegaCanon.authority", CORE)
        self.assertIn("if (p.is_owner) badge(box, 'OWNER'", CORE)


if __name__ == "__main__":
    unittest.main()
