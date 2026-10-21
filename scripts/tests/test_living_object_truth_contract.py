#!/usr/bin/env python3
"""Fail-closed truth contract for interactive living-object chrome."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


class LivingObjectTruthContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (ROOT / "omega-actions.js").read_text(encoding="utf-8")

    def test_unregistered_objects_are_not_assumed_live_or_owned(self):
        self.assertIn("var owner=obj.owner||'Unassigned';", self.source)
        self.assertIn("var state=obj.state||'unverified';", self.source)
        self.assertIn("var actions=page?['OPEN']:[];", self.source)

    def test_only_registered_navigation_and_real_handlers_are_offered(self):
        self.assertIn("NO VERIFIED ACTION REGISTERED", self.source)
        self.assertIn("if(act==='OPEN'&&pg){location.href=pg;return;}", self.source)
        self.assertNotIn("showToast(act+': '+title", self.source)
        self.assertNotIn("showToast('Admin mode:'", self.source)
        self.assertIn("location.href='/control-center.html'", self.source)
        start = self.source.index("function showContextMenu")
        end = self.source.index("function hideContextMenu", start)
        menu = self.source[start:end]
        for unsupported in ("label:'HISTORY'", "label:'EXPORT'", "label:'DEPENDENCIES'", "label:'PERMISSIONS'"):
            self.assertNotIn(unsupported, menu)

    def test_unregistered_insights_do_not_invent_facts(self):
        self.assertIn("No verified object contract is registered.", self.source)
        self.assertIn("Treat values and behavior as unverified.", self.source)
        start = self.source.index("function getInsight")
        end = self.source.index("/* ── HOVER PANEL", start)
        self.assertNotIn("OmegaIntelligence.ask", self.source[start:end])

    def test_derived_metrics_are_not_mislabeled_as_live(self):
        self.assertIn("state:'calculated'", self.source)
        self.assertIn("state:'unverified'", self.source)
        self.assertIn("Approved Members", self.source)
        self.assertIn("approval is not the same as recent activity", self.source)


if __name__ == "__main__":
    unittest.main()
