#!/usr/bin/env python3
import hashlib
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "omega-999-point-inventory.py"


class Omega999InventoryTests(unittest.TestCase):
    def run_inventory(self, source):
        handle = tempfile.NamedTemporaryFile("wb", suffix=".txt", delete=False)
        path = Path(handle.name)
        try:
            handle.write(source.encode("utf-8"))
            handle.close()
            result = subprocess.run(
                [sys.executable, str(SCRIPT), str(path), "--json"],
                check=True,
                text=True,
                capture_output=True,
            )
            return json.loads(result.stdout), path
        except Exception:
            handle.close()
            path.unlink(missing_ok=True)
            raise

    def test_counts_duplicates_and_missing_numbers(self):
        source = "* 1. First\n* 2. Second\n* 2. Duplicate\n* 999. Last\n"
        data, path = self.run_inventory(source)
        try:
            self.assertEqual(data["explicit_bullet_count"], 4)
            self.assertEqual(data["unique_point_count"], 3)
            self.assertEqual(data["duplicate_point_numbers"], [2])
            self.assertEqual(data["duplicate_point_occurrences"], {"2": [2, 3]})
            self.assertEqual(len(data["missing_numbers_1_to_999"]), 996)
            self.assertEqual([p["line"] for p in data["points"]], [1, 2, 3, 4])
            ids = [point["source_record_id"] for point in data["points"]]
            self.assertEqual(len(ids), len(set(ids)))
            self.assertEqual(data["points"][1]["source_occurrence_index"], 1)
            self.assertEqual(data["points"][2]["source_occurrence_index"], 2)
            self.assertNotEqual(data["points"][1]["source_record_id"], data["points"][2]["source_record_id"])
            repeated = subprocess.run(
                [sys.executable, str(SCRIPT), str(path), "--json"],
                check=True,
                text=True,
                capture_output=True,
            )
            repeated_data = json.loads(repeated.stdout)
            self.assertEqual(ids, [point["source_record_id"] for point in repeated_data["points"]])
            self.assertRegex(ids[0], r"^BP-001-[0-9a-f]{64}$")
            path.write_text("Unrelated leading note\n" + source, encoding="utf-8")
            after_unrelated_insert = subprocess.run(
                [sys.executable, str(SCRIPT), str(path), "--json"],
                check=True,
                text=True,
                capture_output=True,
            )
            after_insert_data = json.loads(after_unrelated_insert.stdout)
            self.assertEqual(len(after_insert_data["points"]), len(ids))
            self.assertEqual(ids, [point["source_record_id"] for point in after_insert_data["points"]])
            self.assertNotEqual(data["source_sha256"], after_insert_data["source_sha256"])
            self.assertEqual(data["source_sha256"], hashlib.sha256(source.encode()).hexdigest())
        finally:
            path.unlink(missing_ok=True)

    def test_preserves_section_context_and_inline_point_ranges(self):
        source = (
            "SECTION I: FOUNDATIONS (1-33)\n"
            "Ω Ownership & Legal Sovereignty (Points 1-11)\n"
            "* 1. First requirement\n"
            "See Point 9 and Points 12-15 for related controls.\n"
            "SECTION II: SECOND SECTION (20-40)\n"
            "* 20. Second requirement\n"
        )
        data, path = self.run_inventory(source)
        try:
            self.assertEqual(data["points"][0]["section"], "SECTION I: FOUNDATIONS (1-33)")
            self.assertEqual(data["points"][0]["subsection"], "Ownership & Legal Sovereignty (Points 1-11)")
            self.assertEqual(data["points"][1]["section"], "SECTION II: SECOND SECTION (20-40)")
            self.assertEqual(data["inline_point_reference_count"], 3)
            self.assertEqual(data["inline_point_references"][2]["referenced_points"], list(range(12, 16)))
            self.assertEqual(len(data["overlapping_section_ranges"]), 1)
            self.assertEqual(data["overlapping_section_ranges"][0]["overlap_start"], 20)
            self.assertEqual(data["overlapping_section_ranges"][0]["overlap_end"], 33)
        finally:
            path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
