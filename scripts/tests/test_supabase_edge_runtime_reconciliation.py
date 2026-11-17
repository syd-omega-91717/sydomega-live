import hashlib
import importlib.util
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts/supabase-edge-runtime-reconciliation.py"
SPEC = importlib.util.spec_from_file_location("edge_reconciliation", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class EdgeRuntimeDependencyReconciliationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.functions = Path(self.temp.name) / "functions"
        self.function = self.functions / "content-ingest"
        self.shared = self.functions / "_shared"
        self.function.mkdir(parents=True)
        self.shared.mkdir(parents=True)
        (self.function / "index.ts").write_text('import "../_shared/content-validation.mjs";\n', encoding="utf-8")
        (self.shared / "content-validation.mjs").write_text("export const MAX = 50;\n", encoding="utf-8")
        MODULE.FUNCTIONS = self.functions

    def test_all_declared_runtime_dependencies_match_sha256(self):
        helper = self.shared / "content-validation.mjs"
        metadata = {
            "repository_files_blob_sha": {
                "../_shared/content-validation.mjs": MODULE.git_blob_sha(helper),
            }
        }
        self.assertEqual(MODULE.repository_files_drift("content-ingest", metadata), [])

    def test_imported_helper_drift_is_detected(self):
        helper = self.shared / "content-validation.mjs"
        metadata = {
            "repository_files_blob_sha": {
                "../_shared/content-validation.mjs": hashlib.sha256(helper.read_bytes()).hexdigest(),
            }
        }
        helper.write_text("export const MAX = 100;\n", encoding="utf-8")
        self.assertEqual(
            MODULE.repository_files_drift("content-ingest", metadata),
            ["content-ingest:../_shared/content-validation.mjs"],
        )

    def test_path_traversal_outside_functions_root_is_rejected(self):
        metadata = {"repository_files_blob_sha": {"../../../../etc/passwd": "0" * 40}}
        drift = MODULE.repository_files_drift("content-ingest", metadata)
        self.assertEqual(len(drift), 1)
        self.assertIn("escapes supabase/functions", drift[0])

    def test_invalid_hash_format_is_rejected(self):
        metadata = {"repository_files_blob_sha": {"../_shared/content-validation.mjs": "not-a-hash"}}
        drift = MODULE.repository_files_drift("content-ingest", metadata)
        self.assertEqual(len(drift), 1)
        self.assertIn("invalid Git blob SHA", drift[0])


if __name__ == "__main__":
    unittest.main()
