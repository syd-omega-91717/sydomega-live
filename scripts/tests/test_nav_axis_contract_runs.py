"""Run scripts/tests/test_omega_navigation_axis_contract.js with the unit tests.

That Node contract (every reachable page has a PS mapping, no duplicate PS keys, each section's home page maps to
its own section) ran in no workflow and had been failing on main unnoticed. Running it here puts it in CI.
"""
import pathlib
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


class NavAxisContract(unittest.TestCase):
    @unittest.skipUnless(shutil.which("node"), "node is not installed")
    def test_navigation_axis_contract_passes(self):
        proc = subprocess.run(
            ["node", str(ROOT / "scripts" / "tests" / "test_omega_navigation_axis_contract.js")],
            capture_output=True, text=True, cwd=ROOT, timeout=60,
        )
        self.assertEqual(proc.returncode, 0, proc.stdout + proc.stderr)
        self.assertIn("PASS navigation axis contract", proc.stdout)


if __name__ == "__main__":
    unittest.main()
