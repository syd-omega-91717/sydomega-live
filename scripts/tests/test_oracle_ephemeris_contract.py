#!/usr/bin/env python3
"""Contract: oracle.html shows computed sky positions, never invented ones.

Before 2026-10-15 its Planets tab placed each planet by a linear fraction of
its orbital period since 2000-01-01 (not astronomy), decided retrograde from
Math.sin noise, and showed 'TODAY'S POWER' and an 'elemental power index' that
were sin() of the date (CLAUDE.md 8.1 class 9). The page now runs a
low-precision ephemeris (JPL/Standish elements + truncated lunar series).

This test runs the page's own ephemeris code in node and compares it with
reference longitudes from the astronomy-engine library (fixtures below,
generated once with astronomy-engine 2.x).
"""

from pathlib import Path
import json
import re
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]
ORACLE = (ROOT / "oracle.html").read_text(encoding="utf-8")

# (utc ms, {body: (geocentric ecliptic longitude of date, retrograde)})
FIXTURES = [
    (1552219200000, {'sun': (349.622, False), 'moon': (32.516, False), 'mercury': (358.022, True), 'venus': (310.457, False), 'mars': (46.179, False), 'jupiter': (262.868, False), 'saturn': (288.512, False), 'uranus': (30.190, False), 'neptune': (346.297, False), 'pluto': (292.657, False)}),
    (1625140800000, {'sun': (99.871, False), 'moon': (5.524, False), 'mercury': (79.032, False), 'venus': (125.231, False), 'mars': (132.318, False), 'jupiter': (331.995, True), 'saturn': (312.350, True), 'uranus': (43.818, False), 'neptune': (353.195, True), 'pluto': (295.949, True)}),
    (1712577600000, {'sun': (19.140, False), 'moon': (15.430, False), 'mercury': (24.962, True), 'venus': (4.119, False), 'mars': (342.846, False), 'jupiter': (48.986, False), 'saturn': (344.425, False), 'uranus': (51.157, False), 'neptune': (358.184, False), 'pluto': (301.964, False)}),
    (1792065600000, {'sun': (202.152, False), 'moon': (257.625, False), 'mercury': (226.893, False), 'venus': (215.584, True), 'mars': (129.912, False), 'jupiter': (142.025, False), 'saturn': (10.444, True), 'uranus': (65.205, True), 'neptune': (2.476, True), 'pluto': (303.068, True)}),
    (1863604800000, {'sun': (300.720, False), 'moon': (5.621, False), 'mercury': (291.378, True), 'venus': (285.529, False), 'mars': (190.548, False), 'jupiter': (206.735, False), 'saturn': (34.625, False), 'uranus': (70.519, True), 'neptune': (6.437, False), 'pluto': (308.175, False)}),
]


def ephem_source():
    start = ORACLE.index("var OmegaEphem=(function(){")
    end = ORACLE.index("})();", start) + len("})();")
    return ORACLE[start:end]


class OracleEphemerisContract(unittest.TestCase):
    def test_no_invented_sky_numbers(self):
        for gone in ("dailyPower", "elemForecast", "TODAY'S POWER", "ELEMENTAL POWER INDEX", "var ORBITAL="):
            self.assertNotIn(gone, ORACLE)
        self.assertIsNone(re.search(r"function isRetrograde[^}]*Math\.sin", ORACLE))
        self.assertIn("symbolic fiction for reflection, not prediction", ORACLE)

    @unittest.skipUnless(shutil.which("node"), "node not installed")
    def test_positions_match_reference(self):
        js = ephem_source() + """
const fx = JSON.parse(process.argv[1]); const out = [];
for (const [ms, row] of fx) { const d = new Date(ms);
  for (const [b, [lon, retro]] of Object.entries(row)) {
    const m = OmegaEphem.lon(b, d);
    out.push([b, Math.abs(((m - lon) + 540) % 360 - 180), OmegaEphem.retrograde(b, d) === retro]); } }
console.log(JSON.stringify(out));"""
        fx = [[ms, {k: [v[0], v[1]] for k, v in row.items()}] for ms, row in FIXTURES]
        res = subprocess.run(["node", "-e", js, json.dumps(fx)], capture_output=True, text=True, check=True)
        for body, err, retro_ok in json.loads(res.stdout):
            with self.subTest(body=body):
                self.assertLess(err, 0.5 if body == "moon" else 0.15)
                self.assertTrue(retro_ok, "retrograde flag disagrees with the reference")


if __name__ == "__main__":
    unittest.main()
