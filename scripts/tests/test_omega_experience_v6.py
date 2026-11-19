import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = json.loads((ROOT / "config/page-character-manifest.json").read_text(encoding="utf-8"))
WORLD = (ROOT / "omega-page-world.js").read_text(encoding="utf-8")
SURFACES = (ROOT / "omega-archetype-surfaces.js").read_text(encoding="utf-8")
CSS = (ROOT / "omega-platform-experience-v5.css").read_text(encoding="utf-8")


class OmegaExperienceV6Tests(unittest.TestCase):
    def test_all_twelve_manifest_profiles_are_complete(self):
        expected = {
            "command", "identity", "intelligence", "knowledge", "gaming", "media",
            "commerce", "creation", "community", "governance", "finance", "system",
        }
        self.assertEqual(set(MANIFEST["archetypes"]), expected)
        required = {"visual", "motion", "depth", "density", "interaction", "emblem"}
        for name, profile in MANIFEST["archetypes"].items():
            with self.subTest(archetype=name):
                self.assertTrue(required.issubset(profile))

    def test_page_world_publishes_the_canonical_manifest_profiles(self):
        for marker in (
            "root.dataset.omegaArchetype=archetype",
            "root.dataset.omegaVisualProfile=a.visual||'sovereign'",
            "root.dataset.omegaMotionProfile=a.motion||'subtle'",
            "root.dataset.omegaDepthProfile=a.depth||'glass'",
            "root.dataset.omegaDensityProfile=a.density||'clear'",
            "root.dataset.omegaInteractionProfile=a.interaction||'direct'",
            "root.dataset.omegaEmblemProfile=a.emblem||'omega'",
        ):
            self.assertIn(marker, WORLD)

    def test_all_twelve_worlds_have_a_visual_profile(self):
        for name in MANIFEST["archetypes"]:
            with self.subTest(archetype=name):
                self.assertIn(f'data-omega-archetype="{name}"', CSS)

    def test_generic_surface_layer_never_hides_card_content(self):
        self.assertNotIn("max-height: 0", SURFACES)
        self.assertNotIn("display: none", SURFACES)
        self.assertIn("Surface styling never hides data.", SURFACES)

    def test_visual_layer_keeps_accessibility_and_dark_only_contracts(self):
        self.assertIn("@media(prefers-reduced-motion:reduce)", CSS)
        self.assertIn("@media(forced-colors:active)", CSS)
        self.assertNotIn("prefers-color-scheme: light", CSS)
        self.assertIn(":focus-visible", CSS)

    def test_v6_profiles_stay_inside_the_canonical_omega_palette(self):
        v6 = CSS[CSS.index("Ω EXPERIENCE EVOLUTION V6"):]
        for forbidden in ("#AB82F2", "#8FDCE8", "#CF6760", "#3FB27F", "rgba(171,130,242", "rgba(143,220,232", "rgba(207,103,96"):
            self.assertNotIn(forbidden, v6)
        for canonical in ("#C9A84C", "#E8C97A", "#00E5FF", "#8B0000", "#00FF88"):
            self.assertIn(canonical, v6)

    def test_specialized_profiles_use_existing_semantic_surfaces(self):
        for marker in (
            'data-omega-depth-profile="holographic"',
            'data-omega-depth-profile="3d"',
            'data-omega-density-profile="readable"',
            'data-omega-density-profile="data"',
            'data-omega-archetype="gaming"',
            'data-omega-archetype="media"',
            'data-omega-archetype="community"',
            'data-omega-archetype="finance"',
            'data-omega-archetype="governance"',
            'data-omega-archetype="system"',
        ):
            self.assertIn(marker, CSS)


if __name__ == "__main__":
    unittest.main()
