"""The Studio Orrery is a navigable story map, not production telemetry."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "media.html").read_text(encoding="utf-8")
SCULPTURE = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")


def studio_scene():
    start = SCULPTURE.index("SCENES.studio = function")
    comment = SCULPTURE.rfind("/*", 0, start)   # the scene's contract is written in the block comment directly above it
    if comment != -1 and SCULPTURE.find("*/", comment) < start and not SCULPTURE[SCULPTURE.find("*/", comment) + 2:start].strip():
        start = comment
    end = SCULPTURE.index("SCENES.world = function", start)
    return SCULPTURE[start:end]


class StudioFranchiseOrrery(unittest.TestCase):
    def test_scene_is_mounted_once_inside_the_franchise_tab(self):
        self.assertEqual(PAGE.count('data-omega-sculpture="studio"'), 1)
        panel_start = PAGE.index('id="tab-franchises"')
        panel_end = PAGE.index('id="tab-series"', panel_start)
        self.assertIn('data-omega-sculpture="studio"', PAGE[panel_start:panel_end])

    def test_seven_world_nodes_match_the_canonical_franchise_titles(self):
        body = studio_scene()
        worlds = re.findall(r"\{ id: '([IVX]+)', title: (['\"])(.*?)\2", body)
        self.assertEqual([world[0] for world in worlds], ["I", "II", "III", "IV", "V", "VI", "VII"])
        franchise_start = PAGE.index("const FRANCHISES=[")
        franchise_end = PAGE.index("];", franchise_start)
        block = PAGE[franchise_start:franchise_end]
        franchise_titles = [m[1].replace(chr(92) + "'", "'") for m in re.findall(r"\{uni:'[IVX]+',title:(['\"])((?:\\.|(?!\1).)*)\1", block)]
        self.assertEqual([world[2] for world in worlds], franchise_titles)

    def test_every_orbit_node_targets_its_matching_two_dimensional_card(self):
        body = studio_scene()
        self.assertIn("href: '#studio-franchise-' + world.id", body)
        builder = PAGE[PAGE.index("function buildFranchises"):PAGE.index("function buildSeriesGrid")]
        self.assertIn("c.id='studio-franchise-'+fr.uni", builder)
        self.assertIn("c.tabIndex=-1", builder)
        self.assertIn('id="franchise-grid"', PAGE)

    def test_story_map_does_not_claim_production_or_release_state(self):
        body = studio_scene()
        self.assertIn("narrative index", body)
        # the scene's accessible description lives in the module's description table, not inside the scene function
        self.assertIn("narrative navigation only, not production or release telemetry", SCULPTURE)
        self.assertIn("STORY MAP · NOT RELEASE STATUS", PAGE)
        self.assertNotIn("IN PRODUCTION", body)
        self.assertNotIn("PUBLISHED", body)

    def test_reduced_motion_and_shared_renderer_boundaries_are_preserved(self):
        body = studio_scene()
        self.assertIn("prefers-reduced-motion: reduce", body)
        self.assertIn("data-omega-sculpture", PAGE)
        self.assertNotIn("new THREE.WebGLRenderer", PAGE)
        self.assertNotIn("localStorage", body)
        self.assertNotIn("OmegaSB", body)

    def test_existing_two_dimensional_franchise_dossiers_remain_available(self):
        self.assertIn('id="franchise-grid"', PAGE)
        self.assertIn("function buildFranchises()", PAGE)
        self.assertIn("The 2D franchise dossiers below are the readable fallback", PAGE)


if __name__ == "__main__":
    unittest.main()
