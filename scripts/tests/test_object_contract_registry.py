#!/usr/bin/env python3
"""
scripts/omega-object-contract.py accepts a static config/*.json registry as an
object source (the civilization atlas: planets, worlds, cities, ...), but only
when the registry really backs the object. Each violator below must fail:

  - the registry file is missing;
  - the object declares no recordTypes;
  - a declared record type has no records;
  - a record lacks the identity or label field;
  - a record's state is not in the truth vocabulary.

Run: python3 -m unittest scripts/tests/test_object_contract_registry.py -v
"""
import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("object_contract", ROOT / "scripts" / "omega-object-contract.py")
oc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(oc)

GOOD = {"objects": [
    {"id": "c1", "type": "CITY", "name": "Alpha", "state": "SIMULATED"},
    {"id": "w1", "type": "WORLD", "name": "Earth", "state": "LIVE"},
]}


class RegistrySource(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.path = Path(self.tmp.name) / "registry.json"

    def tearDown(self):
        self.tmp.cleanup()

    def write(self, data):
        self.path.write_text(json.dumps(data), encoding="utf-8")

    def test_valid_registry_has_no_errors(self):
        self.write(GOOD)
        self.assertEqual(oc.registry_errors(self.path, ["CITY", "WORLD"], "id", "name"), [])

    def test_missing_file(self):
        errs = oc.registry_errors(self.path, ["CITY"], "id", "name")
        self.assertTrue(errs and "missing" in errs[0], errs)

    def test_no_record_types_declared(self):
        self.write(GOOD)
        self.assertEqual(oc.registry_errors(self.path, None, "id", "name"),
                         ["registry source declares no recordTypes"])

    def test_declared_type_without_records(self):
        self.write(GOOD)
        self.assertIn("no records of type EMPIRE", oc.registry_errors(self.path, ["EMPIRE"], "id", "name"))

    def test_record_missing_label(self):
        self.write({"objects": [{"id": "c1", "type": "CITY", "state": "SIMULATED"}]})
        self.assertIn("CITY:c1 lacks name", oc.registry_errors(self.path, ["CITY"], "id", "name"))

    def test_record_with_invented_truth_state(self):
        self.write({"objects": [{"id": "c1", "type": "CITY", "name": "A", "state": "AWESOME"}]})
        errs = oc.registry_errors(self.path, ["CITY"], "id", "name")
        self.assertTrue(any("not a truth state" in e for e in errs), errs)

    def test_is_registry_only_for_config_json(self):
        self.assertTrue(oc.is_registry("config/omega-civilization-atlas.json"))
        self.assertFalse(oc.is_registry("profiles"))
        self.assertFalse(oc.is_registry("supabase/live-schema.json"))


class RealModel(unittest.TestCase):
    def test_every_registry_object_declares_record_types(self):
        model = json.loads((ROOT / "config" / "omega-object-model.json").read_text(encoding="utf-8"))
        for obj in model["objects"]:
            if all(oc.is_registry(s) for s in obj.get("sources", [])) and obj.get("sources"):
                self.assertTrue(obj.get("recordTypes"), obj["type"])


if __name__ == "__main__":
    unittest.main()
