"""The front door's Omega is luminous like the owner's reference art, as an opt-in mode that cannot show the canvas edge.

The owner's designs (assets/concept/board-01, reel-01, franchise-01) all centre on a luminous gold mark with a halo, rays and warm embers; the default signet is a dark bronze slab. Mode
`data-sculpt-glow="radiant"` (index.html's hero only) adds emissive gold, a glow, rays and seeded embers, all generated in code. Rendered in headless Chromium - see
docs/fixes/2026-11-15-radiant-signet.md: the first version showed the canvas edge as a faint box (edge step 7.7 against 4.0 with the layers off), because the glow plane (6.4 wide)
was still ~12% bright where the camera's view ends (~1.75 units half-width); resized to the visible area it measures 3.4. This file keeps that from coming back, and keeps the mode opt-in.
Run: python3 -m unittest scripts/tests/test_radiant_signet.py -v
"""
import glob
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
JS = open(os.path.join(ROOT, "omega-sculpture.js"), encoding="utf-8").read()
START = JS.index("var radiant = !!(opt")
BLOCK = JS[START:JS.index("var state = (opt && opt.state)", START)]
VISIBLE_HALF_WIDTH = 1.75          # what the hero canvas sees at the glow's depth (camera z 4.75, fov 38, glow at z -0.6, canvas 478x502)


def plane_sizes(block):
    return [float(m) for m in re.findall(r"new T\.PlaneGeometry\(([\d.]+),", block)]


class RadiantSignet(unittest.TestCase):
    def test_it_is_opt_in_and_only_the_front_door_asks(self):
        self.assertIn("getAttribute('data-sculpt-glow') === 'radiant'", BLOCK)
        users = []
        for f in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
            with open(f, encoding="utf-8", errors="ignore") as fh:
                if 'data-sculpt-glow="radiant"' in fh.read():
                    users.append(os.path.basename(f))
        # The front door asked first; on 2026-11-16 the owner directed that the member's home be the reference's composed ecosystem surface (assets/concept/reel-01.jpg), whose hero is the same
        # luminous mark, so dashboard.html is the second and last opt-in. Its single use, and that no other signet in it opts in, is pinned in test_dashboard_tabs.
        # 2026-11-23: the owner then directed the winged lion into the dashboard hero in place of this signet (test_dashboard_tabs pins that), so the front
        # door is the only remaining opt-in again.
        self.assertEqual(users, ["index.html"], "every other signet on the site keeps the default look")

    def test_nothing_the_glow_draws_reaches_the_canvas_edge(self):
        sizes = plane_sizes(BLOCK)
        self.assertEqual(len(sizes), 2, "the glow plane and the rays plane")
        for size in sizes:
            self.assertLessEqual(size / 2, VISIBLE_HALF_WIDTH * 1.05,
                                 "a plane wider than the view leaves its gradient bright at the canvas edge and the edge shows as a box")
        self.assertNotRegex(BLOCK, r"PlaneGeometry\((?:[4-9]|\d\d)", "the first version used 6.4 and 7.6, and showed the canvas edge")

    def test_the_glow_gradient_ends_at_nothing(self):
        glow = BLOCK[BLOCK.index("var glowTex"):BLOCK.index("glow = new T.Mesh")]
        self.assertRegex(glow, r"addColorStop\(1, 'rgba\(\d+,\d+,\d+,0\)'\)")
        rays = BLOCK[BLOCK.index("var rayTex"):BLOCK.index("rays = new T.Mesh")]
        self.assertRegex(rays, r"addColorStop\(1, 'rgba\(\d+,\d+,\d+,0\)'\)")
        self.assertRegex(rays, r"addColorStop\(0, 'rgba\(\d+,\d+,\d+,0\)'\)", "rays start OUT from the centre; 24 wedges stacking at the exact middle burn it to white")

    def test_it_is_generated_not_loaded(self):
        for banned in ("TextureLoader", "ImageLoader", "assets/", ".jpg", ".webp", ".png", "fetch("):
            self.assertNotIn(banned, BLOCK, banned)
        self.assertIn("CanvasTexture", BLOCK)

    def test_two_renders_are_the_same_picture(self):
        self.assertNotIn("Math.random", BLOCK, "embers come from a seeded generator so the picture can be measured")
        self.assertIn("seedN = 7", BLOCK)

    def test_reduced_motion_gets_one_still_frame(self):
        anim = JS[JS.index("if (radiant) {\n        var tt"):]
        self.assertIn("var tt = reduceMotion ? 0 : t;", anim[:200])

    def test_the_embers_are_warm_gold_not_white(self):
        self.assertIn("color: 0xFFB84D", BLOCK)


if __name__ == "__main__":
    unittest.main()
