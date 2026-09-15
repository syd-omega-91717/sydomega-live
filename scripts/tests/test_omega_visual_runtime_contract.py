import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class OmegaVisualRuntimeContractTests(unittest.TestCase):
    def setUp(self):
        self.runtime = (ROOT / "omega-visual-runtime.js").read_text(encoding="utf-8")
        self.index = (ROOT / "index.html").read_text(encoding="utf-8")

    def test_opening_runtime_preserves_canonical_mount(self):
        self.assertIn("if(page!=='index') return;", self.runtime)
        self.assertIn('.ohz-hero-art[data-omega-sculpture=\"signet\"]', self.runtime)
        self.assertIn('data-omega-sculpture=\"signet\"', self.index)

    def test_opening_stage_is_real_3d_not_logo_rotation(self):
        self.assertIn("perspective:1100px", self.runtime)
        self.assertIn("transform-style:preserve-3d", self.runtime)
        self.assertIn("translateZ(85px)", self.runtime)
        self.assertIn("rotateX(66deg)", self.runtime)
        self.assertNotIn("animation:omegaGenesisSpin", self.runtime)

    def test_runtime_is_dom_timing_safe(self):
        self.assertIn("if(document.body) mount();", self.runtime)
        self.assertIn("document.addEventListener('DOMContentLoaded',mount", self.runtime)
        self.assertIn("document.addEventListener('DOMContentLoaded',boot", self.runtime)

    def test_motion_and_interaction_are_accessible(self):
        self.assertIn("prefers-reduced-motion:reduce", self.runtime)
        self.assertIn("pointermove", self.runtime)
        self.assertIn("pointerleave", self.runtime)

    def test_entrypoint_remains_deferred(self):
        self.assertIn('<script src="/omega-visual-runtime.js" defer></script>', self.index)


if __name__ == "__main__":
    unittest.main()
