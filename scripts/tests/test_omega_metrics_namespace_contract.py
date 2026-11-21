"""Regression tests for the separate Web Vitals and runtime-monitoring APIs."""

from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[2]


class OmegaMetricsNamespaceContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.vitals = (ROOT / "omega-metrics.js").read_text(encoding="utf-8")
        cls.monitor = (ROOT / "omega-monitoring.js").read_text(encoding="utf-8")
        cls.dashboard = (ROOT / "monitoring-dashboard.html").read_text(encoding="utf-8")
        cls.loader = (ROOT / "bg.js").read_text(encoding="utf-8")

    def test_web_vitals_has_a_dedicated_stable_namespace(self):
        self.assertIn("window.OmegaVitals=omegaVitalsApi", self.vitals)
        self.assertIn("window.OmegaMetrics=omegaVitalsApi", self.vitals)

    def test_runtime_monitor_uses_a_different_namespace(self):
        self.assertIn("window.OmegaMonitor = {", self.monitor)
        self.assertNotIn("OmegaMetrics", self.monitor)
        self.assertIn("OmegaMonitor.init()", self.monitor)
        self.assertIn("OmegaMonitor.trackApi(", self.monitor)
        self.assertIn("OmegaMonitor.trackError(", self.monitor)

    def test_monitoring_dashboard_reads_web_vitals_namespace(self):
        self.assertIn("window.OmegaVitals&&window.OmegaVitals.getMetrics", self.dashboard)
        self.assertNotIn("window.OmegaMetrics.getMetrics", self.dashboard)

    def test_global_loader_still_loads_both_independent_modules(self):
        self.assertIn("/omega-metrics.js", self.loader)
        self.assertIn("/omega-monitoring.js", self.loader)


if __name__ == "__main__":
    unittest.main()
