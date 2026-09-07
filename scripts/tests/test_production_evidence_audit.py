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
    def test_current_repository_required_files(self):
        result = module.check_required()
        self.assertEqual(result["status"], "PASS", result)

    def test_current_repository_runtime_surface(self):
        result = module.check_runtime_surface()
        self.assertGreater(result["html_pages"], 0, result)
        self.assertGreater(result["omega_modules"], 0, result)
        self.assertGreater(result["pages_with_bg_reference"], 0, result)

    def test_current_vercel_contract_is_static(self):
        result = module.check_static_architecture()
        self.assertEqual(result["status"], "PASS", result)

    def test_static_architecture_rejects_nonempty_install_command(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            (root / "vercel.json").write_text(
                json.dumps({"installCommand": "npm install"}), encoding="utf-8"
            )
            with patch.object(module, "ROOT", root):
                result = module.check_static_architecture()
        self.assertEqual(result["status"], "FAIL")
        self.assertTrue(any("installCommand" in issue for issue in result["issues"]))

    def test_json_mode_is_machine_readable(self):
        with patch("sys.argv", ["production-evidence-audit.py", "--json"]), patch("builtins.print") as printer:
            exit_code = module.main()
        self.assertIn(exit_code, (0, 2))
        parsed = json.loads(printer.call_args.args[0])
        self.assertEqual(parsed["audit"], "production-evidence-audit")
        self.assertFalse(parsed["live_services_touched"])
        self.assertIn("checks", parsed)


if __name__ == "__main__":
    unittest.main()
