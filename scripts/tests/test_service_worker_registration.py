#!/usr/bin/env python3
"""Guard the platform-wide single-owner service-worker registration contract."""

import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
PAGE_REGISTER = re.compile(
    r"""navigator\s*\.\s*serviceWorker\s*\.\s*register\s*\(\s*(['"])\/sw\.js\1""",
    re.IGNORECASE,
)
CANONICAL_REGISTER = re.compile(
    r"""navigator\s*\.\s*serviceWorker\s*\.\s*register\s*\(\s*['"]\/sw\.js['"]""",
    re.IGNORECASE,
)

# dashboard.html is deliberately the only temporary exception: it belongs to
# the in-flight design/readability-profile-dashboard-20261119 branch. Remove
# this exception when that branch removes its inline registration.
LEGACY_ALLOWLIST = {"dashboard.html": 1}


def html_pages():
    excluded = {".git", "node_modules", ".vercel", ".cache"}
    for path in ROOT.rglob("*.html"):
        if excluded.intersection(path.parts):
            continue
        yield path


class ServiceWorkerRegistrationContractTests(unittest.TestCase):
    def test_only_the_known_inflight_dashboard_exception_remains(self):
        found = {}
        for path in html_pages():
            content = path.read_text(encoding="utf-8", errors="ignore")
            count = len(PAGE_REGISTER.findall(content))
            if count:
                found[path.relative_to(ROOT).as_posix()] = count
        self.assertEqual(found, LEGACY_ALLOWLIST)

    def test_canonical_module_owns_exactly_one_registration(self):
        canonical = (ROOT / "omega-sw-register.js").read_text(encoding="utf-8")
        self.assertEqual(len(CANONICAL_REGISTER.findall(canonical)), 1)

    def test_shared_shell_injects_the_canonical_module_once(self):
        shell = (ROOT / "bg.js").read_text(encoding="utf-8")
        self.assertIn("/omega-sw-register.js", shell)
        self.assertIn("data-omega-swreg", shell)


if __name__ == "__main__":
    unittest.main()
