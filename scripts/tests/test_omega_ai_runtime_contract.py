#!/usr/bin/env python3
"""Run the deterministic AI runtime governance contract in CI."""

from pathlib import Path
import subprocess
import sys
import unittest

ROOT = Path(__file__).resolve().parents[2]


class OmegaAiRuntimeContract(unittest.TestCase):
    def test_governed_model_routing_and_agent_safety(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts" / "omega-ai-runtime-contract.py")],
            cwd=ROOT,
            capture_output=True,
            text=True,
            check=False,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()
