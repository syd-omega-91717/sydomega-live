#!/usr/bin/env python3
"""Regression contract: no page may present uptime or service health as measured.

Live on 2026-10-14 the monitoring tables were empty (incidents, slo_metrics,
system_health, system_incidents: 0 rows) and every error_budget_policy row was
a 2026-07-27 seed with status 'green' and budget_4wk_pct null. The dashboard
still showed "99.9% SLO UPTIME 30-DAY", and the Observatory showed
"ALL SYSTEMS OPERATIONAL", a computed 100.00% uptime and five GREEN services,
including through the 2026-10-06 production pause (CLAUDE.md 8.1 class 9).
"""

from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
OBS = (ROOT / "observatory.html").read_text(encoding="utf-8")
DASH = (ROOT / "dashboard.html").read_text(encoding="utf-8")


class UptimeTruthContract(unittest.TestCase):
    def test_observatory_has_no_static_health_claims(self):
        self.assertNotIn("ALL SYSTEMS OPERATIONAL", OBS)
        self.assertNotIn("PLATFORM CLEAN", OBS)
        self.assertNotIn('id="budget-pct">2.3%', OBS)
        self.assertNotIn('id="k-uptime" style="color:var(--green)">99.9%', OBS)
        self.assertIsNone(re.search(r"STATUS: <span[^>]*>GREEN</span>", OBS))

    def test_uptime_is_not_derived_from_an_incident_log(self):
        # An empty incidents table must never become "100.00%".
        self.assertNotIn("uptimePct", OBS)
        self.assertNotIn("sid('k-uptime'", OBS)

    def test_slo_card_colour_requires_a_computed_budget(self):
        self.assertIn("if(sv.budget_4wk_pct==null)return;", OBS)
        self.assertIn("if(!slo.error&&slo.data)", OBS)

    def test_incident_read_failure_is_not_shown_as_no_incidents(self):
        self.assertIn("if(inc.error)", OBS)
        self.assertIn("INCIDENT LOG UNAVAILABLE", OBS)

    def test_dashboard_uptime_tile_is_labelled_a_target(self):
        tile = re.search(r'<div class="kpi"[^>]*data-living="platform-health".*?</div></div></div>', DASH, re.S)
        self.assertIsNotNone(tile)
        self.assertIn('data-i18n="slo_target_unmonitored"', tile.group(0))
        self.assertIn("Target only", tile.group(0))
        self.assertNotIn('data-i18n="thirty_day"', tile.group(0))


if __name__ == "__main__":
    unittest.main()
