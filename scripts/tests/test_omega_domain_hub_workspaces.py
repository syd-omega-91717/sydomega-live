#!/usr/bin/env python3
"""Contracts for reducing 241 specialist routes into 14 persistent domain workspaces."""
from __future__ import annotations

import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
MATRIX = ROOT / "config" / "omega-page-hub-ownership.json"
RUNTIME = ROOT / "omega-domain-hubs.js"
STYLES = ROOT / "omega-domain-hub.css"
BOOTSTRAP = ROOT / "bg.js"


class OmegaDomainHubWorkspaces(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.matrix = json.loads(MATRIX.read_text(encoding="utf-8"))
        cls.runtime = RUNTIME.read_text(encoding="utf-8")
        cls.styles = STYLES.read_text(encoding="utf-8")
        cls.bootstrap = BOOTSTRAP.read_text(encoding="utf-8")

    def test_all_canonical_hubs_exist_and_match_the_runtime_allowlist(self):
        expected = {hub["path"] for hub in self.matrix["hubs"]}
        self.assertEqual(len(expected), 14)
        match = re.search(r"var HUB_PATHS=\[(.*?)\];", self.runtime, re.S)
        self.assertIsNotNone(match)
        actual = set(re.findall(r"'([^']+)'", match.group(1)))
        self.assertEqual(actual, expected)
        for path in expected:
            self.assertTrue((ROOT / path).is_file(), path)

    def test_197_specialist_routes_are_embedded_without_deleting_legacy_paths(self):
        hubs = {hub["path"] for hub in self.matrix["hubs"]}
        children = [
            row for row in self.matrix["pages"]
            if row["classification"] == "CANDIDATE_MERGE_PANEL"
            and row["path"] != row["candidate_hub"]
        ]
        self.assertEqual(len(children), 197)
        self.assertEqual({row["candidate_hub"] for row in children}, hubs)
        for row in children:
            self.assertTrue((ROOT / row["path"]).is_file(), row["path"])

    def test_sensitive_and_unresolved_routes_are_not_silently_absorbed(self):
        for row in self.matrix["pages"]:
            if row["classification"] in {"KEEP_SEPARATE", "AMBIGUOUS", "UNMAPPED", "UNMAPPED_SECTION"}:
                self.assertIsNone(row["candidate_hub"], row["path"])
        self.assertEqual(self.matrix["classification_counts"]["KEEP_SEPARATE"], 3)
        self.assertEqual(self.matrix["classification_counts"]["AMBIGUOUS"], 11)
        self.assertEqual(self.matrix["classification_counts"]["UNMAPPED"], 16)

    def test_hub_registry_is_fetched_only_on_canonical_hub_pages(self):
        gate = "if(HUB_PATHS.indexOf(currentPath)===-1) return;"
        fetch = "fetch('/config/omega-page-hub-ownership.json'"
        self.assertIn(gate, self.runtime)
        self.assertLess(self.runtime.index(gate), self.runtime.index(fetch))
        self.assertIn("cache:'no-cache'", self.runtime)
        self.assertIn("credentials:'same-origin'", self.runtime)

    def test_embedded_routes_keep_same_origin_session_and_permission_runtime(self):
        self.assertIn("omega_embed=1", self.runtime)
        self.assertIn("body.omega-embedded", self.styles)
        self.assertIn("event.origin!==window.location.origin", self.runtime)
        self.assertIn("event.source!==frame.contentWindow", self.runtime)
        self.assertIn("classList.add('omega-embedded')", self.bootstrap)
        self.assertIn("omega-domain-hubs.js?v=20261118-hubs-v1", self.bootstrap)

    def test_dynamic_labels_use_text_content_not_html_injection(self):
        self.assertIn("node.textContent=textValue", self.runtime)
        self.assertNotIn("innerHTML", self.runtime)
        self.assertNotIn("insertAdjacentHTML", self.runtime)

    def test_legacy_module_routes_keep_their_global_runtime(self):
        children = [
            row for row in self.matrix["pages"]
            if row["classification"] == "CANDIDATE_MERGE_PANEL"
            and row["path"] != row["candidate_hub"]
        ]
        for row in children:
            page = (ROOT / row["path"]).read_text(encoding="utf-8")
            self.assertRegex(page, r"<script[^>]+src=[\"']/?bg\.js(?:[?\"'])", row["path"])

    def test_mobile_and_reduced_motion_contracts_remain_present(self):
        self.assertIn("@media(max-width:760px)", self.styles)
        self.assertIn("@media(prefers-reduced-motion:reduce)", self.styles)
        self.assertIn("loading='lazy'", self.runtime)
        self.assertIn("aria-live", self.runtime)


if __name__ == "__main__":
    unittest.main()
