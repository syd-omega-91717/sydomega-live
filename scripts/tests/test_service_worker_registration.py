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

# No page may register /sw.js itself; omega-sw-register.js is the only owner.
# (dashboard.html was the last exception; its design branch no longer exists.)
LEGACY_ALLOWLIST = {}


def html_pages():
    excluded = {".git", "node_modules", ".vercel", ".cache"}
    for path in ROOT.rglob("*.html"):
        if excluded.intersection(path.parts):
            continue
        yield path


class ServiceWorkerRegistrationContractTests(unittest.TestCase):
    def test_no_page_registers_the_service_worker_itself(self):
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
