#!/usr/bin/env python3
"""Contract for THE TWELVE HOUSES S1, the vertical micro-episodes on series.html.

- The season file must match omega-agents.json canon for every house (CLAUDE.md
  8.1 class 8: two divergent copies of one canonical table).
- Each episode's voice line must be that guide's canon greeting.
- Every rendered episode must exist, stay within the renderer's budget, and be
  faststart (moov before mdat), as cinematic-media requires for streaming.
- The player renders season text with textContent, never innerHTML.
"""

from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
SEASON = json.loads((ROOT / "assets/series/twelve-houses-s1.json").read_text(encoding="utf-8"))
AGENTS = json.loads((ROOT / "omega-agents.json").read_text(encoding="utf-8"))["agents"]
SERIES = (ROOT / "series.html").read_text(encoding="utf-8")
SIGN_ORDER = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra",
              "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"]


def player_script():
    m = re.search(r"/\* THE TWELVE HOUSES S1 player\..*?</script>", SERIES, re.S)
    # Code only: the header comment itself says "No coins".
    return re.sub(r"/\*.*?\*/", "", m.group(0), flags=re.S) if m else ""


def atom_order(path):
    """Top-level MP4 atom names in file order."""
    data = path.read_bytes()
    names, i = [], 0
    while i + 8 <= len(data):
        size = int.from_bytes(data[i:i + 4], "big")
        names.append(data[i + 4:i + 8].decode("latin-1"))
        if size < 8:
            break
        i += size
    return names


class TwelveHousesSeasonContract(unittest.TestCase):
    def test_twelve_episodes_in_sign_order(self):
        eps = SEASON["episodes"]
        self.assertEqual([e["n"] for e in eps], list(range(1, 13)))
        self.assertEqual([e["sign"] for e in eps], SIGN_ORDER)

    def test_every_house_matches_agent_canon(self):
        by_sign = {a["sign"]: a for a in AGENTS}
        for ep in SEASON["episodes"]:
            agent = by_sign[ep["sign"]]
            with self.subTest(episode=ep["n"]):
                self.assertEqual(ep["guide"], agent["name"])
                self.assertEqual(ep["god"], agent["god"])
                self.assertEqual(ep["element"], agent["element"])
                self.assertTrue(agent["greeting"].startswith(ep["voice"].rstrip(".")),
                                f"voice is not {agent['name']}'s canon greeting")

    def test_every_episode_is_rendered_within_budget_and_streamable(self):
        for n in range(1, 13):
            mp4 = ROOT / f"assets/series/houses-s1-ep{n:02d}.mp4"
            jpg = ROOT / f"assets/series/houses-s1-ep{n:02d}.jpg"
            with self.subTest(episode=n):
                self.assertTrue(mp4.is_file() and jpg.is_file())
                self.assertLessEqual(mp4.stat().st_size, 1.2 * 1024 * 1024)
                self.assertLessEqual(jpg.stat().st_size, 90 * 1024)
                atoms = atom_order(mp4)
                self.assertIn("moov", atoms)
                self.assertLess(atoms.index("moov"), atoms.index("mdat"), "not faststart")

    def test_series_page_plays_the_season_without_coins(self):
        script = player_script()
        self.assertTrue(script, "player script missing from series.html")
        self.assertIn("/assets/series/twelve-houses-s1.json", script)
        self.assertIn('data-omega-audio-required="true"', SERIES)
        self.assertIn("STATUS: STREAMING", SERIES)
        self.assertNotIn("innerHTML", script)
        self.assertIsNone(re.search(r"coin|unlock|paywall|price", script, re.I))
        self.assertIn("if(!r.ok)throw", script)


if __name__ == "__main__":
    unittest.main()
