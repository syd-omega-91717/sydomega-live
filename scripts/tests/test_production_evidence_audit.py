import importlib.util
import json
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / "scripts" / "production-evidence-audit.py"


spec = importlib.util.spec_from_file_location("production_evidence_audit", SCRIPT)
if spec is None or spec.loader is None:
    raise RuntimeError(f"cannot load {SCRIPT}")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ProductionEvidenceAuditTests(unittest.TestCase):
    def test_current_repository_required_files_and_runtime_surface(self):
        required = module.check_required()
        self.assertEqual(required["status"], "PASS", required)

        runtime = module.check_runtime_surface()
        self.assertGreater(runtime["html_pages"], 0, runtime)
        self.assertGreater(runtime["omega_modules"], 0, runtime)
        self.assertGreater(runtime["pages_with_bg_reference"], 0, runtime)

    def test_current_vercel_contract_is_static_and_valid(self):
        result = module.check_static_architecture()
        self.assertEqual(result["status"], "PASS", result)

    def test_json_output_is_machine_readable(self):
        result = module.main
        self.assertTrue(callable(result))

        with patch("sys.argv", ["production-evidence-audit.py", "--json"]), patch("builtins.print") as printer:
            exit_code = result()

        self.assertEqual(exit_code, 0)
        output = printer.call_args.args[0]
        parsed = json.loads(output)
        self.assertEqual(parsed["audit"], "production-evidence-audit")
        self.assertFalse(parsed["live_services_touched"])
        self.assertIn("checks", parsed)

    def test_static_architecture_rejects_nonempty_install_command(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "vercel.json").write_text(
                json.dumps({"installCommand": "npm install", "outputDirectory": "public", "framework": None}),
                encoding="utf-8",
            )
            with patch.object(module, "ROOT", root):
                result = module.check_static_architecture()
        self.assertEqual(result["status"], "FAIL")
        self.assertTrue(any("installCommand" in issue for issue in result["issues"]))

    def test_static_architecture_rejects_non_public_output(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "vercel.json").write_text(
                json.dumps({"installCommand": "", "outputDirectory": "dist", "framework": None}),
                encoding="utf-8",
            )
            with patch.object(module, "ROOT", root):
                result = module.check_static_architecture()
        self.assertEqual(result["status"], "FAIL")
        self.assertTrue(any("outputDirectory" in issue for issue in result["issues"]))

    def test_secret_scan_covers_sql_files(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            sql = root / "unsafe.sql"
            sql.write_text("select 'SUPABASE_SERVICE_ROLE';", encoding="utf-8")
            with patch.object(module, "ROOT", root):
                result = module.check_secrets()
        self.assertEqual(result["status"], "FAIL")
        self.assertEqual(result["files"], ["unsafe.sql"])


if __name__ == "__main__":
    unittest.main()
