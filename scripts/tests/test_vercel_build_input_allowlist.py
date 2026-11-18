#!/usr/bin/env python3
"""Regression tests for Vercel's source-bundle ignore rules.

The static build runs portable-host-config.py before publishing public/.  A
blanket *.py ignore therefore breaks every deployment unless this one build-time
helper is explicitly re-included.
"""
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
IGNORE = ROOT / ".vercelignore"
BUILD = ROOT / "scripts" / "vercel-build.sh"
HELPER = ROOT / "scripts" / "portable-host-config.py"


class VercelBuildInputAllowlistTests(unittest.TestCase):
    def test_required_build_helper_is_reincluded_after_python_exclusion(self):
        lines = [
            line.strip()
            for line in IGNORE.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        ]
        self.assertIn("*.py", lines)
        self.assertIn("!scripts/portable-host-config.py", lines)
        self.assertLess(lines.index("*.py"), lines.index("!scripts/portable-host-config.py"))

    def test_reincluded_helper_is_the_one_invoked_by_the_build(self):
        self.assertTrue(HELPER.is_file(), "required build helper is missing from the repository")
        build = BUILD.read_text(encoding="utf-8")
        self.assertIn("python3 scripts/portable-host-config.py", build)

    def test_other_python_sources_remain_excluded(self):
        lines = [
            line.strip()
            for line in IGNORE.read_text(encoding="utf-8").splitlines()
            if line.strip() and not line.lstrip().startswith("#")
        ]
        self.assertIn("*.py", lines)
        self.assertEqual(
            [line for line in lines if line.startswith("!")],
            ["!scripts/portable-host-config.py"],
            "do not broaden the deployment bundle by re-including unrelated Python sources",
        )


if __name__ == "__main__":
    unittest.main()
