import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = json.loads((ROOT / "config/page-character-manifest.json").read_text(encoding="utf-8"))
WORLD_MANIFEST = json.loads((ROOT / "config/omega-world-manifest.json").read_text(encoding="utf-8"))
PAGE_OVERRIDES = json.loads((ROOT / "config/page-world-overrides.json").read_text(encoding="utf-8"))
WORLD = (ROOT / "omega-page-world.js").read_text(encoding="utf-8")
SURFACES = (ROOT / "omega-archetype-surfaces.js").read_text(encoding="utf-8")
CSS = (ROOT / "omega-platform-experience-v5.css").read_text(encoding="utf-8")


def resolve_archetype(slug):
    mapped = MANIFEST.get("pageArchetypes", {}).get(slug)
    if mapped in MANIFEST["archetypes"]:
        return mapped
    district_by_slug = {}
    for district in WORLD_MANIFEST.get("districts", []):
        for page in district.get("pages", []):
            district_by_slug[Path(str(page)).stem] = district
    district = district_by_slug.get(slug)
    if not district:
        district_id = PAGE_OVERRIDES.get("entries", {}).get(slug)
        district = next(
            (d for d in WORLD_MANIFEST.get("districts", []) if d.get("id") == district_id),
            None,
        )
    if district and district.get("archetype") in MANIFEST["archetypes"]:
        return district["archetype"]
    for rule in MANIFEST.get("rules", []):
        for token in rule.get("match", "").split("|"):
            token = token.lower()
            if (
                slug == token
                or slug.startswith(token + "-")
                or slug.endswith("-" + token)
                or ("-" + token + "-") in slug
            ):
                if rule.get("archetype") in MANIFEST["archetypes"]:
                    return rule["archetype"]
    fallback = MANIFEST.get("pageArchetypeFallback", "system")
    return fallback if fallback in MANIFEST["archetypes"] else "system"


class OmegaExperienceV6Tests(unittest.TestCase):
    def test_all_242_root_pages_have_explicit_valid_archetypes(self):
        root_pages = sorted(p for p in ROOT.glob("*.html") if p.is_file())
        self.assertGreaterEqual(len(root_pages), 240)
        self.assertEqual(len(MANIFEST.get("pageArchetypes", {})), 242)
        for page in root_pages:
            with self.subTest(page=page.name):
                self.assertIn(MANIFEST["pageArchetypes"].get(page.stem), MANIFEST["archetypes"])

    def test_all_252_html_surfaces_resolve_to_a_valid_archetype(self):
        html_pages = sorted(p for p in ROOT.rglob("*.html") if p.is_file())
        self.assertGreaterEqual(len(html_pages), 250)
        for page in html_pages:
            with self.subTest(page=str(page.relative_to(ROOT))):
                self.assertIn(resolve_archetype(page.stem), MANIFEST["archetypes"])

    def test_all_twelve_manifest_profiles_are_complete(self):
        expected = {
            "command", "identity", "intelligence", "knowledge", "gaming", "media",
            "commerce", "creation", "community", "governance", "finance", "system",
        }
        self.assertEqual(set(MANIFEST["archetypes"]), expected)
        required = {
            "visual", "motion", "depth", "density", "interaction", "emblem",
            "worldRole", "worldVerb", "primaryActions", "successOutcome",
            "accent", "secondary", "glow", "line",
        }
        for name, profile in MANIFEST["archetypes"].items():
            with self.subTest(archetype=name):
                self.assertTrue(required.issubset(profile))

    def test_page_world_publishes_every_visual_contract_attribute_and_token(self):
        for marker in (
            "visualRoot.setAttribute('data-omega-archetype'",
            "visualRoot.setAttribute('data-omega-visual'",
            "visualRoot.setAttribute('data-omega-motion-profile'",
            "visualRoot.setAttribute('data-omega-depth'",
            "visualRoot.setAttribute('data-omega-density'",
            "visualRoot.setAttribute('data-omega-interaction'",
            "visualRoot.setAttribute('data-omega-emblem'",
            "visualRoot.style.setProperty('--omega-v6-accent'",
            "visualRoot.style.setProperty('--omega-v6-secondary'",
            "visualRoot.style.setProperty('--omega-v6-glow'",
            "visualRoot.style.setProperty('--omega-v6-line'",
        ):
            self.assertIn(marker, WORLD)

    def test_shared_world_membrane_uses_archetype_accents_and_readable_actions(self):
        self.assertIn("host.dataset.omegaArchetype=archetype", WORLD)
        self.assertIn("var(--omega-v6-accent,var(--gold))", WORLD)
        self.assertIn("font-size:13px", WORLD)
        self.assertIn("min-height:44px", WORLD)

    def test_generic_surface_layer_never_hides_card_content(self):
        self.assertNotIn("max-height: 0", SURFACES)
        self.assertNotIn("display: none", SURFACES)
        self.assertIn("Surface styling never hides data.", SURFACES)

    def test_all_visual_profiles_have_a_matching_css_world(self):
        for profile in MANIFEST["archetypes"].values():
            selector = f'html[data-omega-visual="{profile["visual"]}"]'
            with self.subTest(visual=profile["visual"]):
                self.assertIn(selector, CSS)

    def test_all_density_motion_and_depth_profiles_have_css_rules(self):
        for field, attribute in (
            ("density", "data-omega-density"),
            ("motion", "data-omega-motion-profile"),
            ("depth", "data-omega-depth"),
        ):
            for value in {p[field] for p in MANIFEST["archetypes"].values()}:
                with self.subTest(field=field, value=value):
                    self.assertIn(f'{attribute}="{value}"', CSS)

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
        self.assertIn("min-height:44px", WORLD)

    def test_known_route_archetypes_are_canonical(self):
        expected = {
            "achieve": "gaming",
            "trailers": "media",
            "maintenance": "system",
            "worlds": "media",
            "invest": "finance",
        }
        for slug, archetype in expected.items():
            with self.subTest(page=slug):
                self.assertEqual(MANIFEST["pageArchetypes"].get(slug), archetype)

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
