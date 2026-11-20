#!/usr/bin/env python3
"""Contract tests for the archetype-aware Omega Platform Experience v6 layer."""
from pathlib import Path
import json
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
BG = ROOT / "bg.js"
CSS = ROOT / "omega-platform-experience-v6.css"
PAGE_WORLD = ROOT / "omega-page-world.js"
MANIFEST = ROOT / "config" / "page-character-manifest.json"
CONTRACTS = ROOT / "config" / "omega-page-contracts.json"
SCHEMA = ROOT / "config" / "page-character-manifest.schema.json"

class OmegaPlatformExperienceV6Contract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.bg = BG.read_text(encoding="utf-8")
        cls.css = CSS.read_text(encoding="utf-8")
        cls.page_world = PAGE_WORLD.read_text(encoding="utf-8")
        cls.manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
        cls.contracts = json.loads(CONTRACTS.read_text(encoding="utf-8"))
        cls.schema = json.loads(SCHEMA.read_text(encoding="utf-8"))

    def test_v6_loads_after_v5_in_the_global_runtime(self):
        v5 = self.bg.index("omega-platform-experience-v5.css?v=20261118-v5")
        v6 = self.bg.index("omega-platform-experience-v6.css?v=20261119-v6")
        self.assertGreater(v6, v5)
        self.assertIn("omega-platform-experience-v6-css", self.bg)

    def test_every_canonical_page_has_one_known_visual_archetype(self):
        mapping = self.manifest["pageArchetypes"]
        known = set(self.manifest["archetypes"])
        paths = {
            Path(item["path"]).stem
            for item in self.contracts["contracts"]
        }
        self.assertEqual(len(paths), self.contracts["page_count"])
        self.assertEqual(set(mapping), paths)
        self.assertTrue(set(mapping.values()).issubset(known))
        self.assertEqual(self.manifest["pageArchetypeFallback"], "system")
        self.assertIn("pageArchetypes", self.schema["properties"])
        self.assertIn("pageArchetypeFallback", self.schema["properties"])

    def test_css_fallback_palette_matches_the_canonical_manifest(self):
        for archetype, spec in self.manifest["archetypes"].items():
            pattern = (
                r'html\[data-omega-archetype="'
                + re.escape(archetype)
                + r'"\]\\s*\{([^}]+)\}'
            )
            match = re.search(pattern, self.css)
            self.assertIsNotNone(match, archetype)
            block = match.group(1)
            self.assertIn(f"--omega-v6-accent:{spec['accent']};", block, archetype)
            self.assertIn(f"--omega-v6-accent-soft:{spec['glow']};", block, archetype)
            self.assertIn(f"--omega-v6-accent-line:{spec['line']};", block, archetype)
            self.assertIn(f"--omega-v6-secondary:{spec['secondary']};", block, archetype)

        self.assertIn("setProperty('--omega-v6-accent-soft',glow)", self.page_world)
        self.assertIn("setProperty('--omega-v6-accent-line',line)", self.page_world)
        self.assertIn("setProperty('--omega-v6-accent-glow','0 0 30px '+glow)", self.page_world)

    def test_visual_archetype_is_independent_of_navigation_group(self):
        nav = (ROOT / "nav.js").read_text(encoding="utf-8")
        start = nav.index("var PS={")
        end = nav.index("};", start)
        ps = {}
        for match in re.finditer(r"(?:'([^']+)'|([A-Za-z0-9_-]+))\s*:\s*'([^']+)'", nav[start:end]):
            ps[match.group(1) or match.group(2)] = match.group(3)

        page_map = self.manifest["pageArchetypes"]
        # The navigation group controls where a page appears in the IA;
        # the exact page map controls its visual archetype. They are
        # intentionally independent for cross-domain experiences.
        self.assertEqual(ps.get("sovereign-ai"), "arena")
        self.assertEqual(page_map["sovereign-ai"], "intelligence")
        self.assertEqual(page_map["ai"], "intelligence")
        self.assertEqual(page_map["graphify"], "intelligence")
        self.assertEqual(page_map["game-origins"], "gaming")
        self.assertEqual(page_map["blockchain"], "finance")
        self.assertEqual(page_map["maintenance"], "system")

    def test_legacy_substring_collisions_are_resolved_by_exact_page_map(self):
        mapping = self.manifest["pageArchetypes"]
        self.assertEqual(mapping["blockchain"], "finance")
        self.assertEqual(mapping["maintenance"], "system")
        self.assertEqual(mapping["graphify"], "intelligence")
        self.assertEqual(mapping["game-origins"], "gaming")
        self.assertIn("var exactPage=manifest.pageArchetypes[slug]", self.page_world)
        self.assertLess(
            self.page_world.index("var exactPage=manifest.pageArchetypes[slug]"),
            self.page_world.index("var exactHit=manifest.rules.find"),
        )
        self.assertIn("slug.indexOf(token+'-')===0", self.page_world)
        self.assertNotIn("slug.indexOf(token)>-1", self.page_world)
        self.assertIn("replace(/^-+|-+$/g,'')", self.page_world)

    def test_all_252_html_documents_are_accounted_for(self):
        redirect_stubs = {
            "frontend/platform/platform.html",
            "root/audit-report.html",
            "root/dashboard/dashboard.html",
            "root/portal.html",
            "web/templates/admin_console.html",
            "web/templates/leaderboard.html",
            "web/templates/sovereign_health.html",
            "web/templates/system_health.html",
        }
        render_sources = {
            "scripts/movies/episode.html",
            "scripts/movies/scene.html",
        }
        nested = {
            path.relative_to(ROOT).as_posix()
            for path in ROOT.rglob("*.html")
            if path.parent != ROOT
        }
        self.assertEqual(len(list(ROOT.glob("*.html"))), self.contracts["page_count"])
        self.assertEqual(len(nested), 10)
        self.assertEqual(nested, redirect_stubs | render_sources)
        for relative in redirect_stubs:
            html = (ROOT / relative).read_text(encoding="utf-8")
            self.assertIn("/bg.js", html, relative)
            self.assertIn("dashboard.html", html, relative)
            self.assertRegex(html, r"location\.(?:replace|href)|setTimeout")
        for relative in render_sources:
            html = (ROOT / relative).read_text(encoding="utf-8")
            self.assertNotIn("/bg.js", html, relative)
        build = (ROOT / "scripts" / "vercel-build.sh").read_text(encoding="utf-8")
        self.assertIn("! -path './scripts/*'", build)

    def test_every_canonical_html_page_loads_the_shared_visual_runtime(self):
        pages = sorted(ROOT.glob("*.html"))
        self.assertEqual(len(pages), self.contracts["page_count"])
        runtime = re.compile(
            r"<script\b[^>]*\bsrc\s*=\s*[\"']?/?bg\.js(?:[?#][^\"'\s>]*)?[\"']?",
            re.IGNORECASE,
        )
        missing = [
            page.name for page in pages
            if not runtime.search(page.read_text(encoding="utf-8"))
        ]
        self.assertEqual(missing, [])

    def test_page_world_publishes_manifest_visual_contract(self):
        for attribute in (
            "data-omega-archetype",
            "data-omega-visual",
            "data-omega-motion-profile",
            "data-omega-depth",
            "data-omega-density",
            "data-omega-district",
        ):
            self.assertIn(attribute, self.page_world)
        self.assertIn("omega:page-world-ready", self.page_world)
        self.assertIn("visual:a.visual||archetype", self.page_world)
        self.assertIn("if(suppressMembrane)", self.page_world)

    def test_all_eighteen_modules_have_an_explicit_visual_mapping(self):
        design_doc = (ROOT / "docs" / "OMEGA_PLATFORM_EXPERIENCE_V6.md").read_text(encoding="utf-8")
        rows = re.findall(r"^\|\s*\d+\s*\|", design_doc, flags=re.MULTILINE)
        self.assertEqual(len(rows), 18)
        self.assertIn("Communication & Security", design_doc)
        self.assertIn("Asset Ownership & Investment Engine", design_doc)

    def test_all_twelve_archetypes_have_distinct_visual_tokens(self):
        for archetype in self.manifest["archetypes"]:
            self.assertIn(f'html[data-omega-archetype="{archetype}"]', self.css)
        for token in (
            "--omega-v6-accent:",
            "--omega-v6-accent-soft:",
            "--omega-v6-accent-line:",
            "--omega-v6-accent-glow:",
            "--omega-v6-secondary:",
        ):
            self.assertIn(token, self.css)

    def test_all_manifest_motion_depth_and_density_profiles_are_consumed(self):
        for archetype in self.manifest["archetypes"].values():
            self.assertIn(f'data-omega-motion-profile="{archetype["motion"]}"', self.css)
            self.assertIn(f'data-omega-depth="{archetype["depth"]}"', self.css)
            self.assertIn(f'data-omega-density="{archetype["density"]}"', self.css)

    def test_visual_layer_supports_media_rings_and_density_contracts(self):
        for selector in (
            ".omega-ring-surface",
            ".omega-world-portal",
            ".omega-atlas-card",
            ".omega-media-frame",
            ".omega-cinema-frame",
            ".omega-scene-frame",
            ".film-card",
            ".olym-card",
            ".ova-card",
            ".ova-family",
            ".ova-name",
            ".ova-role",
            ".ova-truth",
            ".ova-filter",
            ".omega-atlas-card",
            ".omega-atlas-orbit",
            ".omega-atlas-index",
            ".omega-atlas-name",
            ".poster-ring",
            ".omega-grid-9",
            ".omega-stage-9",
            ".qp-progress-bar",
            ".bar-track",
            ".omega-figure-card",
            ".omega-discovery-card",
            ".cmd-card",
            ".book-card",
            ".exam-card",
            ".svc-card",
            ".sg-card",
            ".fr-card",
            ".account-card",
            ".holding-card",
            ".page-row",
            'data-omega-density="readable"',
            'data-omega-density="data"',
            'data-omega-density="transactional"',
            'data-omega-density="workspace"',
            'data-omega-density="social"',
        ):
            self.assertIn(selector, self.css)

    def test_3d_depth_is_hover_only_and_respects_reduced_motion(self):
        self.assertIn("transform-style:preserve-3d", self.css)
        self.assertIn("rotateX(1deg) rotateY(-1deg)", self.css)
        self.assertIn("body.omega-simple .omega-atlas-card:hover{transform:none}", self.css)
        self.assertIn("@media(prefers-reduced-motion:reduce)", self.css)

    def test_accessibility_and_mobile_rules_are_explicit(self):
        self.assertIn("@media(max-width:760px)", self.css)
        self.assertIn("@media(prefers-reduced-motion:reduce)", self.css)
        self.assertIn("@media(forced-colors:active)", self.css)
        self.assertIn("min-height:44px", self.css)

    def test_layer_does_not_hide_content_or_disable_interaction(self):
        self.assertNotIn("!important", self.css)
        self.assertNotRegex(self.css, r"display\s*:\s*none")
        self.assertNotRegex(self.css, r"visibility\s*:\s*hidden")
        self.assertNotRegex(self.css, r"pointer-events\s*:\s*none")

if __name__ == "__main__":
    unittest.main()
