"""The 3D podium reflects only the real top-three rows already returned by leaderboard authorities."""
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCULPTURE = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
PAGE = (ROOT / "leaderboard.html").read_text(encoding="utf-8")
LOGIC = (ROOT / "leaderboard.js").read_text(encoding="utf-8")


class LeaderboardPodium3D(unittest.TestCase):
    def test_scene_is_mounted_inside_podium_tab(self):
        start = PAGE.index('id="tab-podium"')
        end = PAGE.index('id="tab-myrank"')
        panel = PAGE[start:end]
        self.assertIn('data-omega-sculpture="podium"', panel)
        self.assertIn('id="lb-podium-source"', panel)

    def test_scene_consumes_only_verified_top_three_rows(self):
        start = SCULPTURE.index("SCENES.podium = function")
        end = SCULPTURE.index("SCENES.world = function", start)
        scene = SCULPTURE[start:end]
        self.assertIn("window.OmegaLeaderboard3D", scene)
        self.assertIn("rows.slice(0, 3)", scene)
        self.assertIn("NO VERIFIED ROW", scene)
        self.assertIn("WAITING FOR VERIFIED RANKING", scene)

    def test_page_publishes_real_authority_sources(self):
        self.assertIn("window.OmegaLeaderboard3D={source:String(source||'VERIFIED RANKING'),rows:rows}", LOGIC)
        self.assertIn("'RANKINGS EDGE'", LOGIC)
        self.assertIn("'DAILY SNAPSHOT'", LOGIC)
        self.assertIn("'PUBLIC LEADERBOARD RPC'", LOGIC)

    def test_reduced_motion_and_cinematic_rotation_are_supported(self):
        start = SCULPTURE.index("SCENES.podium = function")
        end = SCULPTURE.index("SCENES.world = function", start)
        scene = SCULPTURE[start:end]
        self.assertIn("prefers-reduced-motion: reduce", scene)
        self.assertIn("stage.rotation.y = t * 0.045", scene)

    def test_no_mock_rankings_or_external_image_assets(self):
        start = SCULPTURE.index("SCENES.podium = function")
        end = SCULPTURE.index("SCENES.world = function", start)
        scene = SCULPTURE[start:end]
        for banned in ("Math.random", "TextureLoader", "ImageLoader", "fetch("):
            self.assertNotIn(banned, scene)


if __name__ == "__main__":
    unittest.main()
