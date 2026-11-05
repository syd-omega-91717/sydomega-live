"""Twelve ambient modules load after the page is idle, not during load (bg.js __omegaIdleAppend).

Same modules, same pages. They are inserted after `load` via requestIdleCallback (capped at 2.5 s), so they stop
competing with first paint. __omegaAppend still de-duplicates at the moment of insertion. These tests keep the
batch explicit: a module may move in or out only by editing this list on purpose.
"""
import pathlib
import re
import unittest

BG = (pathlib.Path(__file__).resolve().parents[2] / "bg.js").read_text(encoding="utf-8")
BATCH = [
    "omega-cinematic.js", "omega-cinematic-animations-phase1.js", "omega-cinematic-animations-phase2.js",
    "omega-motion-v3.js", "omega-voice-responsive.js", "omega-voice.js", "omega-voice-sync.js", "omega-music.js",
    "omega-living-art.js", "omega-orbital-ring.js", "omega-lattice-3d.js", "omega-depth-tilt.js",
]


class IdleModules(unittest.TestCase):
    def test_the_helper_waits_for_load_and_has_a_cap(self):
        m = re.search(r"function __omegaIdleAppend\(el\)\{.*?\n\}\n", BG, re.S)
        self.assertIsNotNone(m, "__omegaIdleAppend is missing")
        body = m.group(0)
        self.assertIn("requestIdleCallback(run,{timeout:2500})", body)
        self.assertIn("document.readyState==='complete'", body)
        self.assertIn("addEventListener('load',go,{once:true})", body)
        self.assertIn("__omegaAppend(el)", body)  # still de-duplicated at insertion

    def test_exactly_the_batch_uses_it(self):
        used = []
        for line in BG.split("\n"):
            if "__omegaIdleAppend(" in line and "function __omegaIdleAppend" not in line:
                src = re.search(r"\.src='/([a-z0-9-]+\.js)'", line)
                self.assertIsNotNone(src, line[:80])
                used.append(src.group(1))
        self.assertEqual(sorted(used), sorted(BATCH))

    def test_the_batch_is_still_injected_once_each(self):
        for f in BATCH:
            self.assertEqual(BG.count(".src='/" + f + "'"), 1, f)


if __name__ == "__main__":
    unittest.main()
