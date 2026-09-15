import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class OmegaVisualRuntimeContractTests(unittest.TestCase):
    def setUp(self):
        self.runtime = (ROOT / "omega-visual-runtime.js").read_text(encoding="utf-8")
        self.opening = (ROOT / "omega-opening-system.css").read_text(encoding="utf-8")
        self.index = (ROOT / "index.html").read_text(encoding="utf-8")

    def test_opening_runtime_preserves_canonical_mount(self):
        self.assertIn("if(page!=='index') return;", self.runtime)
        self.assertIn('.ohz-hero-art[data-omega-sculpture=\"signet\"]', self.runtime)
        self.assertIn('data-omega-sculpture=\"signet\"', self.index)

    def test_opening_stage_is_real_3d_not_logo_rotation(self):
        self.assertIn("perspective:1500px", self.opening)
        self.assertIn("transform-style:preserve-3d", self.opening)
        self.assertIn("translateZ(80px)", self.opening)
        self.assertIn("rotateX(70deg)", self.opening)
        self.assertNotIn("animation:omegaGenesisSpin", self.runtime)
        self.assertNotIn("rotateY(360deg)", self.runtime)

    def test_runtime_is_dom_timing_safe(self):
        self.assertIn("if(document.body) mount();", self.runtime)
        self.assertIn("document.addEventListener('DOMContentLoaded',mount", self.runtime)
        self.assertIn("document.addEventListener('DOMContentLoaded,boot", self.runtime.replace("'DOMContentLoaded',boot", "'DOMContentLoaded,boot"))
        self.assertIn("document.addEventListener('DOMContentLoaded,boot", self.runtime.replace("'DOMContentLoaded',boot", "'DOMContentLoaded,boot"))

    def test_motion_and_interaction_are_accessible(self):
        self.assertIn("prefers-reduced-motion: reduce", self.runtime)
        self.assertIn("prefers-reduced-motion:reduce", self.opening)
        self.assertIn("pointermove", self.runtime)
        self.assertIn("pointerleave", self.runtime)

    def test_entrypoint_remains_deferred(self):
        self.assertIn('<script src="/omega-visual-runtime.js" defer></script>', self.index)


if __name__ == "__main__":
    unittest.main()
