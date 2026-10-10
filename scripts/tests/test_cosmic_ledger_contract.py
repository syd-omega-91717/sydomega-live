import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]

CANONICAL_BODIES = (
    "sun", "mercury", "venus", "earth", "mars",
    "jupiter", "saturn", "uranus", "neptune",
)


class CosmicLedgerContractTests(unittest.TestCase):
    def test_cosmic_ledger_declares_canonical_nine_bodies(self):
        page = (ROOT / "cosmic-ledger.html").read_text()
        runtime = (ROOT / "omega-cosmic-ledger.js").read_text()
        sculpture = (ROOT / "omega-sculpture.js").read_text()

        self.assertIn('data-omega-sculpture="solar-system"', page)
        for body in CANONICAL_BODIES:
            self.assertIn("id:'%s'" % body, sculpture)
            self.assertIn("id:'%s'" % body, runtime)

        self.assertEqual(len(re.findall(r"id:'(?:sun|mercury|venus|earth|mars|jupiter|saturn|uranus|neptune)'", sculpture)), 9)
        self.assertIn("SCENES['solar-system']", sculpture)
        self.assertIn("'solar-system':", sculpture)

    def test_cosmic_ledger_uses_the_single_webgl_owner(self):
        page = (ROOT / "cosmic-ledger.html").read_text()
        self.assertIn('/omega-sculpture.js', page)
        self.assertNotIn("three.module.js", page)
        self.assertNotIn("WebGLRenderer", page)

    def test_cosmic_ledger_preserves_truth_boundary(self):
        page = (ROOT / "cosmic-ledger.html").read_text()
        runtime = (ROOT / "omega-cosmic-ledger.js").read_text()
        self.assertIn("not astronomical scale", page)
        self.assertIn("LORE / VISUAL", runtime)
        self.assertIn("LORE / R&D", runtime)
        self.assertIn("PRODUCTION WORLD", runtime)

    def test_planet_deep_links_are_real_and_keyboard_accessible(self):
        sculpture = (ROOT / "omega-sculpture.js").read_text()
        runtime = (ROOT / "omega-cosmic-ledger.js").read_text()
        self.assertIn("href:'/cosmic-ledger.html'+b.href", sculpture)
        self.assertIn("hashchange", runtime)
        self.assertIn("location.hash", runtime)


if __name__ == "__main__":
    unittest.main()
