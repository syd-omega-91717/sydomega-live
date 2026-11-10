"""Contracts for the single canonical graph workspace and legacy route preservation."""
import json
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
ROUTES = {
    "graph-anomalies": "anomaly",
    "graph-centrality": "central",
    "graph-evidence": "evidence",
    "graph-explorer": "graph",
    "graph-timeline": "time",
    "graphify": "graph",
}


class InsightLegacyRouteTests(unittest.TestCase):
    def test_legacy_routes_redirect_to_the_expected_canonical_lens(self):
        for page, lens in ROUTES.items():
            with self.subTest(page=page):
                source = (ROOT / (page + ".html")).read_text(encoding="utf-8")
                self.assertIn('href="/insight.html?lens=' + lens, source)
                self.assertIn("params.set('lens', '" + lens + "')", source)
                self.assertIn('src="/bg.js"', source)
                self.assertIn('http-equiv="refresh"', source)
                self.assertIn("location.replace", source)
                self.assertNotIn(".from(", source)

    def test_graphify_redirect_opens_the_honest_held_tools_panel(self):
        source = (ROOT / "graphify.html").read_text(encoding="utf-8")
        self.assertIn("params.set('tools', '1')", source)
        insight = (ROOT / "insight.html").read_text(encoding="utf-8")
        self.assertIn('id="ins-ai-tools"', insight)
        self.assertIn("not yet disclosed as a processor", insight)
        self.assertIn("per-member daily cost limit", insight)

    def test_canonical_insight_contains_all_read_only_graph_lenses_and_exports(self):
        html = (ROOT / "insight.html").read_text(encoding="utf-8")
        js = (ROOT / "omega-insight.js").read_text(encoding="utf-8")
        for lens in ("graph", "time", "central", "anomaly", "evidence"):
            self.assertIn("['" + lens + "'", js)
        for action in ("ins-export-json", "ins-export-evidence", "ins-depth"):
            self.assertIn('id="' + action + '"', html)
        for marker in ("function panelTimeline()", "function panelEvidence()", "function visibleIds()", "function exportGraph()", "function exportEvidence()"):
            self.assertIn(marker, js)
        self.assertIn("relationship.source_entity_id", js)
        self.assertIn("relationship.target_entity_id", js)
        self.assertIn("current[1] >= maxDepth", js)
        self.assertIn("Math.min(5", js)

    def test_graph_constellation_and_owner_admin_remain_separate(self):
        graph = (ROOT / "graph.html").read_text(encoding="utf-8")
        admin = (ROOT / "graph-admin.html").read_text(encoding="utf-8")
        self.assertNotIn("insight.html?lens=", graph)
        self.assertIn("CONSTELLATION GRAPH", graph)
        self.assertIn("GRAPH ADMIN", admin)

    def test_navigation_and_workspace_expose_one_graph_destination(self):
        nav = (ROOT / "nav.js").read_text(encoding="utf-8")
        workspace = (ROOT / "omega-single-page-workspaces.js").read_text(encoding="utf-8")
        for legacy in ROUTES:
            self.assertNotIn("'" + legacy + "':'intel'", nav)
            self.assertNotIn("'" + legacy + "'", workspace)
        self.assertIn("insight:'intel'", nav)
        self.assertIn("'insight'", workspace)
        self.assertIn("'graph-admin'", workspace)

    def test_page_core_and_contract_registry_record_redirects(self):
        cores = json.loads((ROOT / "config/page-cores.json").read_text(encoding="utf-8"))
        intel = next(item for item in cores["cores"] if item["core"] == "intel")
        for legacy in ROUTES:
            self.assertNotIn(legacy, intel["pages"])
        contracts = json.loads((ROOT / "config/omega-page-contracts.json").read_text(encoding="utf-8"))
        by_id = {item["page_id"]: item for item in contracts["contracts"]}
        for page, lens in ROUTES.items():
            self.assertIn("/insight.html?lens=" + lens, by_id[page]["purpose"])
            self.assertEqual(by_id[page]["data_sources"]["supabase_tables"], [])
            self.assertEqual(by_id[page]["traceability"]["data_evidence"], "none — compatibility redirect only")


if __name__ == "__main__":
    unittest.main()
