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
# Idle since PR #1169/#1170 and exposed to the same ordering problem. Not verified either way; do not add to this
# list. Remove an entry once the module is shown to catch up on a missed event (or is made immediate).
UNVERIFIED_IDLE = {"omega-cinematic.js", "omega-lattice-3d.js", "omega-music.js", "omega-voice.js"}


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
            if name in UNVERIFIED_IDLE:
                continue
            if ONE_SHOT.search((ROOT / name).read_text(encoding="utf-8", errors="ignore")):
                bad.append(name)
        self.assertEqual(bad, [], "idle module(s) listen for an event that fires before they load")


if __name__ == "__main__":
    unittest.main()
