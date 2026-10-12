#!/usr/bin/env python3
"""
scripts/blueprint-truth-map.py must refuse every way a blueprint point can be
lost or decided by accident:

  - a point classified twice (the second decision would silently win);
  - a point with no classification at all;
  - a committed registry that no longer matches the map (drift);
  - the 8 repeated point numbers and the 14 appendix Nodes being dropped again;
  - a status outside the idea ledger's vocabulary.

Run: python3 -m unittest scripts/tests/test_blueprint_truth_map.py -v
"""
import importlib.util
import io
import json
import shutil
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]


def load(name, rel):
    spec = importlib.util.spec_from_file_location(name, ROOT / rel)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


btm = load("blueprint_truth_map", "scripts/blueprint-truth-map.py")
ledger = load("idea_ledger_for_btm", "scripts/idea-ledger.py")


class BlueprintTruthMap(unittest.TestCase):
    def test_committed_registry_matches_map(self):
        with redirect_stdout(io.StringIO()):
            self.assertEqual(btm.main(["--check"]), 0)

    def test_every_point_classified_with_known_status_and_reason(self):
        reg, unmapped = btm.build()
        self.assertEqual(unmapped, [])
        for e in reg["entries"]:
            self.assertIn(e["ledger_status"], ledger.STATUSES, e.get("id") or e["point"])
            self.assertTrue(e["evidence"].strip())

    def test_repeated_numbers_and_appendix_nodes_are_kept(self):
        reg, _ = btm.build()
        ids = {e.get("id") for e in reg["entries"]}
        for n in (100, 101, 102, 103, 104, 112, 113, 133):
            self.assertIn("B%03d-IV" % n, ids)
        self.assertEqual(sum(1 for i in ids if i and i.startswith("N")), 14)
        self.assertEqual(len(reg["entries"]), 391 + 8 + 14)

    def test_classifying_a_point_twice_is_refused(self):
        once = btm._OnceMap()
        once.update({1: ("PARTIAL", "x")})
        with self.assertRaises(SystemExit):
            once.update({1: ("REJECTED", "y")})

    def test_unclassified_point_fails_check(self):
        saved = dict(btm.MAP)
        try:
            dict.pop(btm.MAP, 245)
            _, unmapped = btm.build()
            self.assertIn(245, unmapped)
        finally:
            dict.clear(btm.MAP)
            dict.update(btm.MAP, saved)

    def test_drift_fails_check(self):
        tmp = tempfile.TemporaryDirectory()
        try:
            copy = Path(tmp.name) / "registry.json"
            shutil.copy(btm.REGISTRY, copy)
            data = json.loads(copy.read_text(encoding="utf-8"))
            data["entries"][0]["ledger_status"] = "SHIPPED"
            copy.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            saved = btm.REGISTRY
            btm.REGISTRY = str(copy)
            try:
                with redirect_stdout(io.StringIO()):
                    self.assertEqual(btm.main(["--check"]), 1)
            finally:
                btm.REGISTRY = saved
        finally:
            tmp.cleanup()


if __name__ == "__main__":
    unittest.main()
