"""omega-platform-navigator.html is a concept catalogue, and must not claim otherwise.

None of its 36 products (Omen Guard, Cipher Vault, Sentinel Watch ...) exists anywhere else in the
repo. It used to label each "Available" and promise military-grade encryption, zero-knowledge backups
and SOC 2 compliance. Status is now "Concept", the page says so once, and the certification and
absolute security claims stay out until something real backs them (CLAUDE.md 8.1 class 9).
"""
import pathlib
import re
import unittest

SRC = (pathlib.Path(__file__).resolve().parents[2] / "omega-platform-navigator.html").read_text(encoding="utf-8")


class NavigatorIsHonest(unittest.TestCase):
    def test_no_product_claims_to_be_available(self):
        self.assertNotIn('class="product-status">Available', SRC)
        self.assertEqual(len(re.findall(r'class="product-status">Concept<', SRC)), 36)

    def test_page_says_it_is_a_concept_catalogue(self):
        self.assertIn("A Concept Catalogue", SRC)
        self.assertIn("None of these is verified as a live feature", SRC)

    def test_no_unbacked_certification_or_absolute_claims(self):
        for phrase in ("SOC 2", "Military-grade", "Zero-knowledge", "zero-knowledge", "24/7"):
            self.assertNotIn(phrase, SRC, phrase)


if __name__ == "__main__":
    unittest.main()
