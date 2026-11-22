#!/usr/bin/env python3
"""Contract tests for the deterministic browser-script dependency inventory."""
import importlib.util
import tempfile
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "omega-script-dependency-graph.py"
SPEC = importlib.util.spec_from_file_location("omega_script_dependency_graph", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
assert SPEC and SPEC.loader
SPEC.loader.exec_module(MODULE)

class ScriptDependencyGraphTests(unittest.TestCase):
    def test_finds_html_consumers_and_bg_loader_state(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "bg.js").write_text("var a='/omega-a.js'; __omegaAppend(a); var b='/omega-b.js'; __omegaIdleAppend(b);")
            (root / "omega-a.js").write_text("window.OmegaA = {};")
            (root / "omega-b.js").write_text("window.OmegaB = window.OmegaA;")
            (root / "index.html").write_text('<script src="/bg.js"></script><script src="/omega-b.js"></script>')
            result = MODULE.build_inventory(root)
            self.assertEqual(result["root_script_count"], 3)
            self.assertEqual(result["bg_load_states"]["immediate"], ["omega-a.js"])
            self.assertEqual(result["bg_load_states"]["idle"], ["omega-b.js"])
            by_path = {row["path"]: row for row in result["scripts"]}
            self.assertEqual(by_path["omega-b.js"]["pages"], ["index.html"])
            self.assertIn("OmegaA", by_path["omega-b.js"]["reads_published_globals"])

    def test_topological_order_places_local_import_before_consumer(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "a.js").write_text("window.A = true;")
            (root / "b.js").write_text("import './a.js'; window.B = true;")
            result = MODULE.build_inventory(root)
            self.assertEqual(result["deterministic_topological_order"], ["a.js", "b.js"])
            self.assertEqual(result["hard_dependency_edges"], [
                {"from": "a.js", "to": "b.js", "type": "static-local-import"}
            ])

    def test_reports_hard_dependency_cycles_deterministically(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "a.js").write_text("import './b.js';")
            (root / "b.js").write_text("import './a.js';")
            result = MODULE.build_inventory(root)
            self.assertEqual(result["hard_dependency_cycles_or_blocked_nodes"], ["a.js", "b.js"])

    def test_excludes_external_and_vendor_script_references(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "app.js").write_text("window.App = true;")
            (root / "index.html").write_text(
                '<script src="https://example.test/x.js"></script>'
                '<script src="/vendor/lib.js"></script><script src="/app.js"></script>'
            )
            result = MODULE.build_inventory(root)
            self.assertEqual(result["scripts"][0]["pages"], ["index.html"])
            self.assertEqual(result["root_script_count"], 1)

if __name__ == "__main__":
    unittest.main()
