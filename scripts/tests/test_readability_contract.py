from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
PROFILE = (ROOT / "profile.html").read_text(encoding="utf-8")
DASHBOARD = (ROOT / "dashboard.html").read_text(encoding="utf-8")
CSS = (ROOT / "omega-readable-layout.css").read_text(encoding="utf-8")


class ReadabilityContractTests(unittest.TestCase):
    def test_profile_and_dashboard_opt_into_scoped_readability_layer(self):
        self.assertIn('data-omega-page="profile"', PROFILE)
        self.assertIn('data-omega-page="dashboard"', DASHBOARD)
        self.assertIn('/omega-readable-layout.css?v=20261119-r1', PROFILE)
        self.assertIn('/omega-readable-layout.css?v=20261119-r1', DASHBOARD)

    def test_readability_floor_is_not_below_thirteen_pixels(self):
        self.assertIn('--omega-readable-label: clamp(13px', CSS)
        self.assertIn('--omega-readable-body: clamp(14px', CSS)
        self.assertIn('--omega-readable-section: clamp(18px', CSS)

    def test_dark_brand_palette_is_preserved(self):
        self.assertIn('var(--cyan, #00E5FF)', CSS)
        self.assertIn('var(--gold, #C9A84C)', CSS)
        self.assertNotIn('prefers-color-scheme: light', CSS)

    def test_focus_visibility_and_profile_skip_link_exist(self):
        self.assertIn('class="omega-skip-link" href="#profile-main"', PROFILE)
        self.assertIn('<main class="main">', PROFILE)
        self.assertIn('id="profile-main" tabindex="-1"', PROFILE)
        self.assertIn(':focus-visible', CSS)

    def test_dashboard_mission_bar_can_grow_when_metadata_wraps(self):
        self.assertIn('height: auto;', CSS)
        self.assertIn('flex-wrap: wrap;', CSS)


if __name__ == "__main__":
    unittest.main()
