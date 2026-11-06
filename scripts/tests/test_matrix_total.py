"""The matrix total is 12 x 12 x 9 x 9 x 9 = 104,976. 729 is the inner 9 x 9 x 9 cube at one intersection.

The owner confirmed this on 2026-11-06; omega-canon.js asserts it at load and docs/IDEA_INTAKE.md rejected
"9x9x9 = 729-node matrix" as the total on 2026-10-13, yet a pasted spec brought it back. This pins the decision so a
page, prompt or catalogue cannot call 729 the whole matrix again. 729 stays valid where it names the inner cube
("9x9x9 INNER", "729 inner nodes", A^3 = 729), so only the wrong phrasings are forbidden.
"""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
FORBIDDEN = re.compile(r"729[- ]node (?:mastery )?matrix|729 total nodes|matrix (?:of|with|has) 729 nodes", re.I)
# Files where "729-node matrix" is accurate as written. Add one only with the reason.
ACCURATE = {
    "config/omega-civilization-atlas.json": "describes the database model (omega_matrix_nodes holds 729 rows); pinned by its contract test",
    "news.html": "twelve phases, each a 729-node matrix = 8,748 states (12 x 729)",
    "sculpture.html": "aria-label of the 9x9x9 cube itself",
    "omega-sculpture.js": "aria-label of the 9x9x9 cube itself",
    "city.html": "a city-scale 9^3 matrix, named as 9^3 in the same sentence",
    "cosmic-ledger.html": "historical: what the original design set described",
}


class MatrixTotal(unittest.TestCase):
    def test_canon_total_is_104976(self):
        self.assertEqual(12 * 12 * 9 * 9 * 9, 104976)
        self.assertIn("12 * 12 * 9 * 9 * 9", (ROOT / "omega-canon.js").read_text(encoding="utf-8"))

    def test_no_page_prompt_or_catalogue_calls_729_the_total(self):
        files = list(ROOT.glob("*.html")) + list(ROOT.glob("*.js")) + [ROOT / "supabase" / "index.sql"] \
            + list((ROOT / "config").glob("*.json"))
        bad = []
        for p in files:
            if p.relative_to(ROOT).as_posix() in ACCURATE:
                continue
            for n, line in enumerate(p.read_text(encoding="utf-8", errors="ignore").split("\n"), 1):
                if FORBIDDEN.search(line):
                    bad.append("%s:%d" % (p.relative_to(ROOT), n))
        self.assertEqual(bad, [], "729 is the inner cube; the matrix total is 104,976")

    def test_catalogue_names_the_real_total(self):
        cat = json.loads((ROOT / "config" / "omega-product-catalog.json").read_text(encoding="utf-8"))
        self.assertIn("104,976-node matrix", json.dumps(cat, ensure_ascii=False))


if __name__ == "__main__":
    unittest.main()
