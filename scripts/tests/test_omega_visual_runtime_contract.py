import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class OmegaVisualRuntimeContractTests(unittest.TestCase):
    def setUp(self):
        self.runtime = (ROOT / "omega-visual-runtime.js").read_text(encoding="utf-8")
        self.opening = (ROOT / "omega-opening-system.css").read_text(encoding="utf-8")
        self.elevation = (ROOT / "omega-page-elevation.css").read_text(encoding="utf-8")
        self.index = (ROOT / "index.html").read_text(encoding="utf-8")
        self.visual = (ROOT / "omega-visual-universe.css").read_text(encoding="utf-8")

    def test_opening_runtime_preserves_canonical_mount(self):
        self.assertIn("if(page!=='index') return;", self.runtime)
        self.assertIn(".ohz-hero-art[data-omega-sculpture]", self.runtime)
        self.assertIn('data-omega-sculpture=\"signet\"', self.index)

    def test_hero_emblem_is_dimensional_without_generic_orbit_spin(self):
        """Owner direction reaffirmed 2026-11-19: preserve the live 3-D signet,
        but keep the Omega readable with restrained sway, not a spinning ring."""
        self.assertNotIn("installOpeningStage", self.runtime)
        self.assertNotIn("omega-gateway-vault", self.runtime)
        self.assertNotIn("omega-home-depth-correction", self.runtime)
        self.assertFalse((ROOT / "omega-home-depth-correction.css").exists())
        self.assertNotIn(".ohz-hero-art canvas{opacity", self.opening)
        sculpture = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
        self.assertIn("mark.rotation.y = Math.sin(t * 0.33) * swayAmp", sculpture)
        self.assertNotIn("orbit.rotation.z = t * 0.30;", sculpture)
        self.assertIn("IDLE (sway & glow)", sculpture)

    def test_runtime_is_dom_timing_safe(self):
        self.assertIn("if(document.body) mount();", self.runtime)
        self.assertIn("document.addEventListener('DOMContentLoaded',mount", self.runtime)
        self.assertIn("document.addEventListener('DOMContentLoaded',boot", self.runtime)

    def test_motion_and_interaction_are_accessible(self):
        # The runtime no longer animates the hero; the signet's motion, pointer
        # response and reduced-motion still frame live in omega-sculpture.js.
        sculpture = (ROOT / "omega-sculpture.js").read_text(encoding="utf-8")
        self.assertIn("prefers-reduced-motion", sculpture)
        self.assertIn("pointermove", sculpture)
        self.assertIn("prefers-reduced-motion:reduce", self.opening)

    def test_platform_wide_elevation_remains_additive(self):
        self.assertIn("transform-style:preserve-3d", self.elevation)
        self.assertIn("perspective:1400px", self.elevation)
        self.assertIn("prefers-reduced-motion:reduce", self.elevation)
        self.assertNotIn("display:none", self.elevation)

    def test_visual_universe_uses_bg_canonical_tokens_and_type(self):
        self.assertIn("--omega-void:var(--void,#0A0A0F)", self.visual)
        self.assertIn("--omega-gold:var(--gold,#C9A84C)", self.visual)
        self.assertIn("--omega-cyan:var(--cyan,#00E5FF)", self.visual)
        self.assertIn("font-family:var(--R,", self.visual)
        self.assertIn("font-family:var(--D,", self.visual)
        self.assertIn("font-family:var(--M,", self.visual)
        self.assertNotIn("font-family:Inter", self.visual)
        self.assertNotIn("@import", self.visual)

    def test_entrypoint_remains_deferred(self):
        self.assertIn('<script src="/omega-visual-runtime.js" defer></script>', self.index)


if __name__ == "__main__":
    unittest.main()
