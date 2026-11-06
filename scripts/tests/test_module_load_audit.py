"""module-load-audit.py is the evidence behind moving a module to idle loading, so it must not call a load-bearing
module safe, and no idle module may wait for an event that has already fired by the time it arrives.

Why the second test exists: omega-user.js fires `omega:populated` about 300 ms after DOMContentLoaded. A module
injected through __omegaIdleAppend arrives up to 2.5 s after `load`, so a listener it adds then never hears that
event (and `window load` has already fired). Four modules were moved to idle on a check that missed this
(omega-workflow/passport/policy/qr) and were put back; see docs/fixes/2026-11-06-second-idle-batch.md.
"""
import json
import pathlib
import re
import subprocess
import sys
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "module-load-audit.py"
ONE_SHOT = re.compile(r"addEventListener\(\s*['\"](omega:populated|omega:user-loaded|omega:ready|load)['\"]")
# Idle modules that listen for a one-shot event and were READ to be safe. Add one only after reading how it behaves
# when it arrives after the event, and say why here.
KNOWN_SAFE_IDLE = {
    "omega-cinematic.js": "re-runs its count-ups on every omega:populated and documents the late-arrival case",
    "omega-lattice-3d.js": "wires its clicks at once when the document is already loaded (readyState check)",
}

_CACHE = []


def rows():
    if _CACHE:
        return _CACHE[0]
    out = subprocess.run([sys.executable, str(SCRIPT), "--json"], capture_output=True, text=True, cwd=ROOT)
    assert out.returncode == 0, out.stderr
    _CACHE.append(json.loads(out.stdout))
    return _CACHE[0]


class ModuleLoadAudit(unittest.TestCase):
    def test_reads_the_real_loader(self):
        data = rows()
        self.assertGreater(len(data), 100)
        self.assertTrue(any(r["loads"] == "idle" for r in data))

    def test_a_load_bearing_module_is_never_called_safe(self):
        by = {r["module"]: r for r in rows()}
        # No reader of any global, yet it publishes the CSS variables the consent banner and ladder read.
        self.assertIn(by["/omega-bottom-stack.js"]["bucket"], ("REVIEW", "NEEDED"))

    def test_no_idle_module_waits_for_a_one_shot_event(self):
        bad = []
        for r in rows():
            if r["loads"] != "idle":
                continue
            name = r["module"][1:]
            if name in KNOWN_SAFE_IDLE:
                continue
            if ONE_SHOT.search((ROOT / name).read_text(encoding="utf-8", errors="ignore")):
                bad.append(name)
        self.assertEqual(bad, [], "idle module(s) listen for an event that fires before they load")


if __name__ == "__main__":
    unittest.main()
