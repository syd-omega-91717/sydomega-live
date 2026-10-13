#!/usr/bin/env python3
"""
scripts/idea-ledger.py must fail --check whenever an idea could be lost or
mislabelled. Each violator below is planted in a throwaway copy of the five
sources and must fail; the clean copy must pass:

  - a FEATURE_IDEAS.md entry with no status in its title and no override;
  - an idea-status.json override without evidence;
  - an override naming an idea FEATURE_IDEAS.md no longer has;
  - an intake line that does not parse, or uses an unknown status;
  - a blueprint ledger_status without evidence;
  - a committed ledger that no longer matches its sources (drift).

Run: python3 -m unittest scripts/tests/test_idea_ledger.py -v
"""
import importlib.util
import io
import json
import tempfile
import unittest
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location("idea_ledger", ROOT / "scripts" / "idea-ledger.py")
il = importlib.util.module_from_spec(spec)
spec.loader.exec_module(il)

FEATURES = "# Ideas\n\n## 1. Shipped thing — SHIPPED\n\nbody\n\n## 2. Open question\n\nbody\n"
STATUS = {"_comment": "x", "F2": {"status": "NEEDS_DECISION", "evidence": "asks the owner"}}
REGISTRY = {"entries": [{"point": 1, "source_text": "a point", "class": "X",
                         "status": "REQUIRES_CURRENT_RUNTIME_MAPPING"}], "missing_points": [2, 3]}
GAP = "# Gaps\n\n## S. Standing\n\n- **OPEN 2026-10-12 — a gap.** detail\n\n## 0. Next\n"
INTAKE = "# Intake\n\n## Ideas\n\n- [PROPOSED] New idea — next step (2026-10-12)\n"


class IdeaLedger(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        (self.root / "docs").mkdir()
        self.write(FEATURES, STATUS, REGISTRY, GAP, INTAKE)
        self.saved = (il.ROOT, il.LEDGER)
        il.ROOT, il.LEDGER = str(self.root), str(self.root / "docs" / "IDEA_LEDGER.md")
        self.assertEqual(self.run_ledger([]), 0)

    def tearDown(self):
        il.ROOT, il.LEDGER = self.saved
        self.tmp.cleanup()

    def write(self, features=None, status=None, registry=None, gap=None, intake=None):
        if features is not None:
            (self.root / "FEATURE_IDEAS.md").write_text(features, encoding="utf-8")
        if status is not None:
            (self.root / "docs" / "idea-status.json").write_text(json.dumps(status), encoding="utf-8")
        if registry is not None:
            (self.root / "docs" / "OMEGA_999_CONCEPT_REGISTRY.json").write_text(json.dumps(registry), encoding="utf-8")
        if gap is not None:
            (self.root / "GAP_ANALYSIS.md").write_text(gap, encoding="utf-8")
        if intake is not None:
            (self.root / "docs" / "IDEA_INTAKE.md").write_text(intake, encoding="utf-8")

    def run_ledger(self, argv):
        with redirect_stdout(io.StringIO()):
            return il.main(argv)

    def assertCheckFails(self):
        self.assertEqual(self.run_ledger(["--check"]), 1)

    def test_clean_sources_pass(self):
        self.assertEqual(self.run_ledger(["--check"]), 0)
        ideas, errors = il.collect()
        self.assertEqual(errors, [])
        self.assertEqual({i[3] for i in ideas},
                         {"SHIPPED", "NEEDS_DECISION", "UNMAPPED", "UNEXTRACTED", "OPEN_GAP", "PROPOSED"})

    def test_idea_without_status_fails(self):
        self.write(features=FEATURES + "\n## 3. Untitled status\n\nbody\n")
        self.assertCheckFails()

    def test_override_without_evidence_fails(self):
        self.write(status={"F2": {"status": "NEEDS_DECISION", "evidence": " "}})
        self.assertCheckFails()

    def test_override_for_vanished_idea_fails(self):
        self.write(status=dict(STATUS, F9={"status": "SHIPPED", "evidence": "x"}))
        self.assertCheckFails()

    def test_unparseable_intake_line_fails(self):
        self.write(intake=INTAKE + "- just a thought\n")
        self.assertCheckFails()

    def test_unknown_intake_status_fails(self):
        self.write(intake=INTAKE + "- [MAYBE] Something — later (2026-10-12)\n")
        self.assertCheckFails()

    def test_blueprint_status_without_evidence_fails(self):
        reg = json.loads(json.dumps(REGISTRY))
        reg["entries"][0]["ledger_status"] = "SHIPPED"
        self.write(registry=reg)
        self.assertCheckFails()

    def test_drift_fails(self):
        self.write(intake=INTAKE + "- [PROPOSED] Another — later (2026-10-12)\n")
        self.assertCheckFails()
        self.assertEqual(self.run_ledger([]), 0)
        self.assertEqual(self.run_ledger(["--check"]), 0)


if __name__ == "__main__":
    unittest.main()
