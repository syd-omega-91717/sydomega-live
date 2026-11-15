"""The Chronos tree is drawn from the owner's blueprint board and the canon's nine-fold lattice, and it must stay honest about both.

Rendered in headless Chromium (desktop, phone, reduced motion, no WebGL) with 0 console errors; the drawn count was read back from OmegaSculpture.status().records -
see docs/fixes/2026-11-15-chronos-tree.md. This file is the part CI keeps: the scene is registered and mounted, its sample size follows the canon, it loads no
picture, it invents nothing about the member, and it draws no random positions.
"""
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
PAGE = (ROOT / "sculpture.html").read_text(encoding="utf-8")
CANON = json.loads((ROOT / "omega-canon.json").read_text(encoding="utf-8"))


def scene_body():
    start = JS.index("SCENES.chronos = function")
    end = JS.index("/* ── AGENTS", start)
    return JS[start:end]


class ChronosScene(unittest.TestCase):
    def test_registered_and_mounted(self):
        self.assertIn("SCENES.chronos = function", JS)
        self.assertIn('data-omega-sculpture="chronos"', PAGE)

    def test_lattice_is_the_canons_and_the_sample_is_stated(self):
        nf = CANON["nine_fold"]
        self.assertEqual(nf["dimensions"], 5)
        self.assertEqual(nf["total_nodes"], 9 ** 5)
        stride = int(re.search(r"LATTICE_STRIDE = (\d+);", JS).group(1))
        drawn = -(-nf["total_nodes"] // stride)  # the loop keeps indices 0, stride, 2*stride ...
        self.assertIn(f"{drawn:,} of the {nf['total_nodes']:,}", PAGE, "the caption must state the sampled count")
        self.assertEqual(len(re.findall(r"for \(var (?:A|B|Cc|D|E) = 0; \w+ < 9;", scene_body())), 5, "five nested loops of nine")

    def test_no_picture_is_loaded(self):
        body = scene_body()
        for banned in ("TextureLoader", "ImageLoader", "assets/", ".jpg", ".webp", ".png", "fetch("):
            self.assertNotIn(banned, body, f"the board is the brief, not the texture: {banned}")

    def test_no_random_positions(self):
        self.assertNotIn("Math.random", scene_body(), "the tree, crown and lattice are derived, so two renders show the same tree (the background stars come from a shared helper and may differ)")

    def test_nothing_is_invented_about_the_member(self):
        body = scene_body()
        self.assertIn("marker.visible = reached > 0", body, "no marker without measured progress")
        self.assertIn("data-sculpt-sign", body, "a sign is highlighted only when the mount names one")
        self.assertIn("prefers-reduced-motion", body)


if __name__ == "__main__":
    unittest.main()
