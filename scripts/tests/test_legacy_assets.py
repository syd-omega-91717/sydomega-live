#!/usr/bin/env python3
"""
Every artwork file omega-legacy-constellation.js names must exist in the repo.

Its image paths are built in JavaScript, so the broken-asset gate (which reads
src=/href= in markup) cannot see them. All 12 zodiac cards pointed at
/Zodiac_signs/horoscope_sign_*.png.jpeg while those files live in
BlockChain_Market_Analysis_syd_omega_91717/horoscope_sign/ -- 12 broken images
in production, measured 2026-09-28.

Run: python3 -m unittest scripts/tests/test_legacy_assets.py -v
"""
import json
import os
import subprocess
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

PROBE = r"""
global.window = {};
global.document = { readyState: 'loading', addEventListener() {}, getElementById() { return null; } };
require(process.argv[1]);
const L = window.OmegaLegacyConstellation;
const src = require('fs').readFileSync(process.argv[1], 'utf8');
const root = (src.match(/var ROOT='([^']+)'/) || [])[1];
const out = [];
L.phases.forEach(p => out.push(root + 'Phases_syd_omega_91717/' + p[2]));
L.trophies.forEach(f => out.push('/Trophies_S.Y.D_Omega_91717/' + f));
const zdir = (src.match(/assetUrl\(ROOT\+'([^']+)',z\[2\]\)/) || [])[1];
L.zodiac.forEach(z => out.push(root + zdir + z[2]));
console.log(JSON.stringify(out));
"""


class LegacyAssets(unittest.TestCase):
    def test_every_named_asset_exists(self):
        res = subprocess.run(["node", "-e", PROBE, os.path.join(ROOT, "omega-legacy-constellation.js")],
                             capture_output=True, text=True, check=True)
        paths = json.loads(res.stdout)
        self.assertEqual(len(paths), 62)
        missing = [p for p in paths if not os.path.isfile(os.path.join(ROOT, p.lstrip("/")))]
        self.assertEqual(missing, [])


class PassportArt(unittest.TestCase):
    """profile.html shows the member's own sign art and stage medal from
    /assets/legacy/ (the owner's collection, checkerboard cut to alpha)."""

    SIGNS = ("aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio",
             "sagittarius", "capricorn", "aquarius", "pisces")

    def test_all_21_cutouts_exist_and_are_small(self):
        names = ["sign-%s.webp" % s for s in self.SIGNS] + ["stage-%d.webp" % i for i in range(1, 10)]
        for n in names:
            f = os.path.join(ROOT, "assets", "legacy", n)
            self.assertTrue(os.path.isfile(f), n)
            with open(f, "rb") as fh:
                head = fh.read(12)
            self.assertEqual(head[:4], b"RIFF", n)
            self.assertEqual(head[8:12], b"WEBP", n)
            self.assertLess(os.path.getsize(f), 90 * 1024, n)

    def test_passport_art_follows_real_data_only(self):
        with open(os.path.join(ROOT, "profile.html"), encoding="utf-8") as fh:
            src = fh.read()
        body = src[src.index("function ppArt("):]
        body = body[:body.index("\n}\n") + 3]
        self.assertIn("if(!PP_GLY[sign] || !(tier>=1 && tier<=9)) { box.hidden=true; return; }", body)
        self.assertIn("var dir='/assets/legacy/';", body)
        self.assertIn("dir+'sign-'+k+'.webp'", body)
        self.assertIn("dir+'stage-'+tier+'.webp'", body)
        self.assertIn("ppArt(sign, tier);", src)
        # a JS escape in markup renders literally; the seal must be an entity
        self.assertNotIn('<div class="seal">\\u03A9</div>', src)


if __name__ == "__main__":
    unittest.main()
