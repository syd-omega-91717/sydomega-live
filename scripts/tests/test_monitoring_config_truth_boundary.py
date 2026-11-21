#!/usr/bin/env python3
"""Truth-boundary and privacy contracts for the monitoring configuration."""

import importlib.util
import json
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]
SPEC = importlib.util.spec_from_file_location(
    "omega_monitoring_validator", ROOT / "scripts" / "validate-monitoring.py"
)
VALIDATOR = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(VALIDATOR)


class MonitoringConfigurationTruthBoundary(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.config = json.loads((ROOT / "monitoring-config.json").read_text(encoding="utf-8"))

    def test_unwired_alerts_reports_and_general_rate_limit_are_disabled(self):
        monitoring = self.config["monitoring"]
        self.assertFalse(monitoring["alerts"]["enabled"])
        self.assertEqual(monitoring["alerts"]["channels"], [])
        self.assertFalse(monitoring["reports"]["enabled"])
        self.assertNotIn("recipients", monitoring["reports"])
        self.assertFalse(self.config["rateLimit"]["enabled"])
        self.assertEqual(self.config["rateLimit"]["policies"], [])
        self.assertGreater(len(self.config["rateLimit"]["proposedPolicies"]), 0)

    def test_public_monitoring_config_contains_no_personal_report_recipient(self):
        serialized = json.dumps(self.config, ensure_ascii=False)
        self.assertNotIn("@", serialized)
        self.assertIn("NOT_CONFIGURED", self.config["monitoring"]["reports"]["status"])

    def test_alert_validator_accepts_disabled_delivery_without_channels(self):
        self.assertEqual(VALIDATOR.validate_alerts(self.config), [])

    def test_alert_validator_warns_when_enabled_delivery_has_no_channels(self):
        config = {"monitoring": {"alerts": {"enabled": True, "channels": []}}}
        issues = VALIDATOR.validate_alerts(config)
        self.assertEqual(len(issues), 1)
        self.assertIn("while alert delivery is enabled", issues[0])

    def test_web_vitals_and_runtime_monitor_use_distinct_namespaces(self):
        metrics = (ROOT / "omega-metrics.js").read_text(encoding="utf-8")
        monitor = (ROOT / "omega-monitoring.js").read_text(encoding="utf-8")
        self.assertIn("window.OmegaVitals=omegaVitalsApi", metrics)
        self.assertIn("window.OmegaMetrics=omegaVitalsApi", metrics)
        self.assertIn("window.OmegaMonitor = {", monitor)
        self.assertNotIn("monitoring-config.json", metrics)
        self.assertNotIn("monitoring-config.json", monitor)


if __name__ == "__main__":
    unittest.main()
