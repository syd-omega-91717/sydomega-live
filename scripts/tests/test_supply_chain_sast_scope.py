#!/usr/bin/env python3
"""Keep blocking Semgrep coverage focused on source formats its parser supports."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
WORKFLOW = (ROOT / ".github/workflows/supply-chain-sbom.yml").read_text(encoding="utf-8")


class SupplyChainSastScopeTests(unittest.TestCase):
    def test_blocking_scan_keeps_errors_enabled_and_explicit_source_scope(self):
        start = WORKFLOW.index("      - name: Semgrep SAST")
        end = WORKFLOW.index("      - name: Identify blocking Semgrep findings", start)
        scan = WORKFLOW[start:end]
        self.assertIn("semgrep scan --config=auto --error --sarif", scan)
        for pattern in ("*.js", "*.mjs", "*.cjs", "*.py", "*.sql", "*.ts"):
            self.assertIn(f"--include '{pattern}'", scan)
        self.assertIn("SCAN_SCOPE", scan)
        self.assertNotIn("--include '*.tsx'", scan)
        self.assertNotIn("--include '*.yml'", scan)
        self.assertNotIn("--no-errors", scan)
        self.assertNotIn("|| true", scan)

    def test_diagnostic_scan_uses_same_scope_without_weakening_gate(self):
        start = WORKFLOW.index("      - name: Identify blocking Semgrep findings")
        end = WORKFLOW.index("      - name: Upload Semgrep SARIF", start)
        diagnostic = WORKFLOW[start:end]
        self.assertIn("semgrep scan --config=auto --error --json", diagnostic)
        self.assertIn("--include '*.js'", diagnostic)
        self.assertIn("--include '*.py'", diagnostic)
        self.assertIn("--include '*.sql'", diagnostic)
        self.assertIn("--include '*.mjs'", diagnostic)
        self.assertIn("|| true", diagnostic)  # diagnostics cannot change the failed blocking scan

    def test_html_inline_script_coverage_is_not_silently_claimed_by_semgrep(self):
        self.assertIn("HTML inline scripts are", WORKFLOW)
        self.assertIn("TSX/JSX inspiration sources", WORKFLOW)
        self.assertIn("workflow-contract-lint", WORKFLOW)


if __name__ == "__main__":
    unittest.main()
