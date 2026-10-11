#!/usr/bin/env python3
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "omega-999-point-inventory.py"


class Omega999InventoryTests(unittest.TestCase):
    def test_counts_duplicates_and_missing_numbers(self):
        source = "* 1. First\n* 2. Second\n* 2. Duplicate\n* 999. Last\n"
        with tempfile.NamedTemporaryFile("w", suffix=".txt", encoding="utf-8", delete=False) as handle:
            handle.write(source)
            path = handle.name
        try:
            result = subprocess.run(
                [sys.executable, str(SCRIPT), path, "--json"],
                check=True,
                text=True,
                capture_output=True,
            )
            data = json.loads(result.stdout)
            self.assertEqual(data["explicit_bullet_count"], 4)
            self.assertEqual(data["unique_point_count"], 3)
            self.assertEqual(data["duplicate_point_numbers"], [2])
            self.assertEqual(len(data["missing_numbers_1_to_999"]), 996)
            self.assertEqual([p["line"] for p in data["points"]], [1, 2, 3, 4])
        finally:
            Path(path).unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
