import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = json.loads((ROOT / "config/page-character-manifest.json").read_text(encoding="utf-8"))
WORLD_MANIFEST = json.loads((ROOT / "config/omega-world-manifest.json").read_text(encoding="utf-8"))
PAGE_ACTIONS = json.loads((ROOT / "config/page-world-actions.json").read_text(encoding="utf-8"))
PAGE_OVERRIDES = json.loads((ROOT / "config/page-world-overrides.json").read_text(encoding="utf-8"))
WORLD = (ROOT / "omega-page-world.js").read_text(encoding="utf-8")
SURFACES = (ROOT / "omega-archetype-surfaces.js").read_text(encoding="utf-8")
CSS = (ROOT / "omega-platform-experience-v5.css").read_text(encoding="utf-8")


class OmegaExperienceV6Tests(unittest.TestCase):
    def test_every_html_surface_resolves_to_a_valid_archetype(self):
        action_by_slug = {
            row.get("slug") or Path(row.get("page", "")).stem: row.get("archetype")
            for row in PAGE_ACTIONS.get("pages", [])
        }
        district_by_slug = {}
        for district in WORLD_MANIFEST.get("districts", []):
            for page in district.get("pages", []):
                district_by_slug[Path(str(page)).stem] = district.get("archetype")
        for slug, district_id in PAGE_OVERRIDES.get("entries", {}).items():
            if slug not in district_by_slug:
                district = next(
                    (d for d in WORLD_MANIFEST.get("districts", []) if d.get("id") == district_id),
                    None,
                )
                if district:
                    district_by_slug[slug] = district.get("archetype")
        root_pages = sorted(p for p in ROOT.rglob("*.html") if p.is_file())
        self.assertGreaterEqual(len(root_pages), 250)
        for page in root_pages:
            slug = page.stem
            district = district_by_slug.get(slug)
            action = action_by_slug.get(slug)
            exact = next(
                (
                    row for row in MANIFEST.get("rules", [])
                    if any(token.startswith("=") and slug == token[1:] for token in row.get("match", "").split("|"))
                ),
                None,
            )
            broad = next(
                (
                    row for row in MANIFEST.get("rules", [])
                    if any(not token.startswith("=") and (slug == token or token in slug) for token in row.get("match", "").split("|"))
                ),
                None,
            )
            archetype = (
                exact.get("archetype") if exact and exact.get("archetype") in MANIFEST["archetypes"] else
                action if action != "command" and action in MANIFEST["archetypes"] else
                broad.get("archetype") if broad and broad.get("archetype") in MANIFEST["archetypes"] else
                district if district in MANIFEST["archetypes"] else
                action if action in MANIFEST["archetypes"] else
                "command"
            )
            with self.subTest(page=page.name):
                self.assertIn(archetype, MANIFEST["archetypes"])

    def test_all_twelve_manifest_profiles_are_complete(self):
        expected = {
            "command", "identity", "intelligence", "knowledge", "gaming", "media",
            "commerce", "creation", "community", "governance", "finance", "system",
        }
        self.assertEqual(set(MANIFEST["archetypes"]), expected)
        required = {"visual", "motion", "depth", "density", "interaction", "emblem", "accent", "secondary", "glow", "line"}
        for name, profile in MANIFEST["archetypes"].items():
            with self.subTest(archetype=name):
                self.assertTrue(required.issubset(profile))

    def test_shared_world_membrane_uses_archetype_accents_and_readable_actions(self):
        self.assertIn("host.dataset.omegaArchetype=archetype", WORLD)
        self.assertIn("var(--omega-v6-accent,var(--gold))", WORLD)
        self.assertIn("font-size:13px", WORLD)
        self.assertIn("min-height:44px", WORLD)

    def test_page_world_publishes_the_canonical_manifest_profiles(self):
        for marker in (
            "root.dataset.omegaArchetype=archetype",
            "root.dataset.omegaVisualProfile=a.visual||'sovereign'",
            "root.dataset.omegaMotionProfile=a.motion||'subtle'",
            "root.dataset.omegaDepthProfile=a.depth||'glass'",
            "root.dataset.omegaDensityProfile=a.density||'clear'",
            "root.dataset.omegaInteractionProfile=a.interaction||'direct'",
            "root.dataset.omegaEmblemProfile=a.emblem||'omega'",
            "root.style.setProperty('--omega-v6-accent',a.accent||'#C9A84C')",
            "root.style.setProperty('--omega-v6-secondary',a.secondary||'#00E5FF')",
            "root.style.setProperty('--omega-v6-glow',a.glow||'rgba(201,168,76,.13)')",
            "root.style.setProperty('--omega-v6-line',a.line||'rgba(201,168,76,.34)')",
        ):
            self.assertIn(marker, WORLD)

    def test_all_twelve_worlds_have_a_visual_profile(self):
        self.assertIn("html[data-omega-archetype]", CSS)
        for name, profile in MANIFEST["archetypes"].items():
            with self.subTest(archetype=name):
                self.assertTrue(profile["visual"])
                self.assertTrue(profile["accent"])
                self.assertTrue(profile["secondary"])

    def test_generic_surface_layer_never_hides_card_content(self):
        self.assertNotIn("max-height: 0", SURFACES)
        self.assertNotIn("display: none", SURFACES)
        self.assertIn("Surface styling never hides data.", SURFACES)

    def test_visual_layer_preserves_page_specific_image_art(self):
        v6 = CSS[CSS.index("Ω EXPERIENCE EVOLUTION V6"):]
        self.assertNotIn("background-image:", v6)
        self.assertNotIn("background:", v6)
        self.assertIn("background-color:rgba(10,10,15,.18)", v6)

    def test_visual_layer_keeps_accessibility_and_dark_only_contracts(self):
        self.assertIn("@media(prefers-reduced-motion:reduce)", CSS)
        self.assertIn("@media(forced-colors:active)", CSS)
        self.assertNotIn("prefers-color-scheme: light", CSS)
        self.assertIn(":focus-visible", CSS)

    def test_page_world_prefers_curated_profiles_before_generic_command_fallback(self):
        find_start = WORLD.index("function findArchetype()")
        find_end = WORLD.index("\n  }", find_start)
        find_body = WORLD[find_start:find_end]
        self.assertLess(find_body.index("token.charAt(0)==='='"), find_body.index("pageWorld.archetype!=='command'"))
        self.assertLess(find_body.index("pageWorld.archetype!=='command'"), find_body.index("district&&district.archetype"))
        self.assertIn("if(pageWorld&&pageWorld.pages)", WORLD)
        self.assertIn("archetype=findArchetype()", WORLD)

    def test_intelligence_match_does_not_capture_unrelated_words(self):
        intelligence_rule = next(r for r in MANIFEST["rules"] if r["archetype"] == "intelligence" and "prediction" in r["match"])
        self.assertIn("ai-", intelligence_rule["match"].split("|"))
        self.assertNotIn("ai", intelligence_rule["match"].split("|"))
        for slug in ("trailers", "maintenance"):
            self.assertFalse(any(slug == token or token in slug for token in intelligence_rule["match"].split("|")))

    def test_manifest_explicitly_classifies_previously_unmapped_pages(self):
        expected = {
            "achieve": "gaming", "archive": "knowledge", "ascend": "knowledge",
            "control-center": "system", "cosmetics": "identity",
            "data-observatory": "intelligence", "insight": "intelligence",
            "intel": "intelligence", "invest": "finance", "ladder": "gaming",
            "life": "identity", "my-quests": "gaming",
            "omega-platform-navigator": "command", "order": "community",
            "orrery": "intelligence", "platform-kernel": "system",
            "quest-progress": "gaming", "seasonal-events": "gaming",
            "sovereign-core": "command", "world-atlas": "intelligence",
            "worlds": "media", "graph-admin": "system", "maintenance": "system",
            "trailers": "media",
        }
        for slug, archetype in expected.items():
            exact = next(
                (
                    row for row in MANIFEST["rules"]
                    if any(token == "=" + slug for token in row["match"].split("|"))
                ),
                None,
            )
            with self.subTest(page=slug):
                self.assertIsNotNone(exact)
                self.assertEqual(exact["archetype"], archetype)


    def test_v6_profiles_stay_inside_the_canonical_omega_palette(self):
        allowed = {"#C9A84C", "#E8C97A", "#00E5FF", "#8B0000", "#00FF88"}
        for name, profile in MANIFEST["archetypes"].items():
            with self.subTest(archetype=name):
                self.assertIn(profile["accent"], allowed)
                self.assertIn(profile["secondary"], allowed)
                self.assertTrue(profile["glow"].startswith("rgba("))
                self.assertTrue(profile["line"].startswith("rgba("))

    def test_all_density_and_motion_profiles_have_rendering_rules(self):
        for value in {p["density"] for p in MANIFEST["archetypes"].values()}:
            with self.subTest(density=value):
                self.assertIn(f'data-omega-density-profile="{value}"', CSS)
        for value in {p["motion"] for p in MANIFEST["archetypes"].values()}:
            with self.subTest(motion=value):
                self.assertIn(f'data-omega-motion-profile="{value}"', CSS)

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
