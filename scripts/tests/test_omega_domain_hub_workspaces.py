#!/usr/bin/env python3
"""Contracts for the 242-page estate, 184 specialist routes and 14 persistent domain workspaces."""
from __future__ import annotations

import json
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
MATRIX = ROOT / "config" / "omega-page-hub-ownership.json"
RUNTIME = ROOT / "omega-domain-hubs.js"
STYLES = ROOT / "omega-domain-hub.css"
GLOBAL_EXPERIENCE = ROOT / "omega-platform-experience-v5.css"
BOOTSTRAP = ROOT / "bg.js"
NAV = ROOT / "nav.js"


class OmegaDomainHubWorkspaces(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.matrix = json.loads(MATRIX.read_text(encoding="utf-8"))
        cls.runtime = RUNTIME.read_text(encoding="utf-8")
        cls.styles = STYLES.read_text(encoding="utf-8")
        cls.global_experience = GLOBAL_EXPERIENCE.read_text(encoding="utf-8")
        cls.bootstrap = BOOTSTRAP.read_text(encoding="utf-8")
        cls.nav = NAV.read_text(encoding="utf-8")

    def test_domain_workspace_entry_pages_have_semantic_h1(self):
        expected = {
            "dashboard.html": "COMMAND",
            "profile.html": "IDENTITY",
            "cosmos.html": "COSMOS",
            "vault.html": "VAULT",
            "services.html": "SERVICES",
            "sovereign-ai.html": "SOVEREIGN AI",
        }
        for path, heading in expected.items():
            page = (ROOT / path).read_text(encoding="utf-8")
            self.assertRegex(page, r"<h1[^>]*>\s*" + re.escape(heading) + r"\s*</h1>", path)

    def test_global_visual_experience_v5_covers_platform_surfaces(self):
        for selector in (
            "body.omega-simple", ".topbar", ".side", ".hero-band",
            ".profile-hero", ".oeh-hero", ".ow-hud", ".ohz-hero",
            ".card", ".native-card", ".kpi", ".omega-depth-card",
            ".franchise-card", ".emblem-orb", ".ohz-brand-mark",
        ):
            self.assertIn(selector, self.global_experience)
        self.assertIn("@keyframes omega-v5-orbit-breathe", self.global_experience)
        self.assertIn("@keyframes omega-v5-hero-sweep", self.global_experience)
        self.assertIn("@media(max-width:760px)", self.global_experience)
        self.assertIn('[style*="width:"]', self.global_experience)
        self.assertIn("@media(prefers-reduced-motion:reduce)", self.global_experience)
        self.assertIn("omega-platform-experience-v5.css?v=20261118-v5", self.bootstrap)
        self.assertIn("document.addEventListener('DOMContentLoaded',inject,{once:true})", self.bootstrap)
        self.assertIn("(document.body||document.head||document.documentElement).appendChild(link)", self.bootstrap)

    def test_all_canonical_hubs_exist_and_match_the_runtime_allowlist(self):
        expected = {hub["path"] for hub in self.matrix["hubs"]}
        self.assertEqual(len(expected), 14)
        match = re.search(r"var HUB_PATHS=\[(.*?)\];", self.runtime, re.S)
        self.assertIsNotNone(match)
        actual = set(re.findall(r"'([^']+)'", match.group(1)))
        self.assertEqual(actual, expected)
        for path in expected:
            self.assertTrue((ROOT / path).is_file(), path)
            page = (ROOT / path).read_text(encoding="utf-8")
            self.assertRegex(page, r"<h1\b", path)

    def test_every_hub_page_has_a_supported_workspace_mount_root(self):
        for hub in self.matrix["hubs"]:
            page = (ROOT / hub["path"]).read_text(encoding="utf-8")
            self.assertRegex(
                page,
                r"<main[^>]*>|class=[\"'][^\"']*(?:main|page-shell|page)[^\"']*[\"']",
                hub["path"],
            )
        self.assertIn("main.main,main,.main,.page-shell,.page", self.runtime)

    def test_specialist_routes_are_embedded_without_deleting_legacy_paths(self):   # was test_184_...: the count moves with every page added to a hub
        hubs = {hub["path"] for hub in self.matrix["hubs"]}
        children = [
            row for row in self.matrix["pages"]
            if row["classification"] == "CANDIDATE_MERGE_PANEL"
            and row["path"] != row["candidate_hub"]
            and row["page_id"] != "sovereign-core"
        ]
        self.assertEqual(len(children), 183)   # was 185 (+1 celestial-covenants, media hub); -1: budget merged into expenses (invest hub); -1: trophies merged into honors
        self.assertEqual(self.matrix["classification_counts"]["CANDIDATE_MERGE_PANEL"], 198)
        core = next(row for row in self.matrix["pages"] if row["page_id"] == "sovereign-core")
        self.assertEqual(core["candidate_hub"], "dashboard.html")
        self.assertEqual(core["classification"], "CANDIDATE_MERGE_PANEL")
        covered_hubs = {row["candidate_hub"] for row in children}
        covered_hubs.update(row["protected_hub"] for row in self.matrix["pages"] if row.get("protected_hub"))
        self.assertEqual(covered_hubs, hubs)
        for row in children:
            self.assertTrue((ROOT / row["path"]).is_file(), row["path"])

    def test_sensitive_and_unresolved_routes_are_not_silently_absorbed(self):
        for row in self.matrix["pages"]:
            if row["classification"] in {"KEEP_SEPARATE", "AMBIGUOUS", "UNMAPPED", "UNMAPPED_SECTION"}:
                self.assertIsNone(row["candidate_hub"], row["path"])
        self.assertEqual(self.matrix["classification_counts"]["KEEP_SEPARATE"], 18)   # was 19 until payments.html was merged into subscriptions.html
        self.assertEqual(self.matrix["classification_counts"]["AMBIGUOUS"], 10)
        self.assertEqual(self.matrix["classification_counts"]["UNMAPPED"], 14)
        self.assertEqual(self.matrix["unresolved_count"], 24)

    def test_protected_workflow_ownership_is_explicit_and_domain_scoped(self):
        protected = [row for row in self.matrix["pages"] if row.get("protected_hub")]
        self.assertEqual(len(protected), 15)   # was 16 until payments.html was merged into subscriptions.html
        for row in protected:
            self.assertEqual(row["classification"], "KEEP_SEPARATE", row["path"])
            self.assertIn(row["protected_hub"], {hub["path"] for hub in self.matrix["hubs"]})

    def test_embedded_runtime_protects_every_keep_separate_route(self):
        separate = {
            Path(row["path"]).stem for row in self.matrix["pages"]
            if row["classification"] == "KEEP_SEPARATE"
        }
        match = re.search(r"var PROTECTED_ROUTE_STEMS=\{(.*?)\};", self.runtime, re.S)
        self.assertIsNotNone(match)
        protected = re.findall(r"(?:'([^']+)'|([a-zA-Z0-9_-]+))\s*:\s*1", match.group(1))
        protected = {a or b for a, b in protected}
        self.assertTrue(separate.issubset(protected))

    def test_protected_routes_are_discoverable_but_open_standalone(self):
        self.assertIn("var protectedRows=", self.runtime)
        self.assertIn("row.classification==='KEEP_SEPARATE'", self.runtime)
        self.assertIn("row.protected_hub===hub.path", self.runtime)
        self.assertIn("PROTECTED WORKFLOWS · OPEN SEPARATELY", self.runtime)
        self.assertIn("link.target='_blank'", self.runtime)
        self.assertIn("var PROTECTED_ROUTE_STEMS=", self.runtime)
        self.assertIn("window.top.location.replace", self.runtime)
        self.assertIn("standalone.searchParams.delete('omega_module')", self.runtime)
        self.assertIn("standalone.searchParams.delete('omega_module_query')", self.runtime)
        self.assertIn("element.setAttribute('target','_blank')", self.runtime)
        self.assertIn("PROTECTED_ROUTE_STEMS[stem]", self.runtime)
        self.assertIn("omega-domain-hub-protected-grid", self.styles)
        self.assertIn("(!rows.length && !protectedRows.length)", self.runtime)

    def test_sensitive_routes_remain_excluded_from_global_workspace_routing(self):
        separate = {
            Path(row["path"]).stem for row in self.matrix["pages"]
            if row["classification"] == "KEEP_SEPARATE"
        }
        match = re.search(r"var HUB_SEPARATE_ROUTE_STEMS=\{(.*?)\};", self.nav, re.S)
        self.assertIsNotNone(match)
        routed_separate = set(re.findall(r"(?:'([^']+)'|([a-zA-Z0-9_-]+))\s*:\s*1", match.group(1)))
        routed_separate = {a or b for a, b in routed_separate}
        self.assertTrue(separate.issubset(routed_separate))

    def test_hub_registry_is_fetched_only_on_canonical_hub_pages(self):
        gate = "if(!embedded && HUB_PATHS.indexOf(currentPath)===-1) return;"
        fetch = "fetch('/config/omega-page-hub-ownership.json'"
        self.assertIn(gate, self.runtime)
        self.assertLess(self.runtime.index(gate), self.runtime.index(fetch))
        self.assertIn("cache:'no-cache'", self.runtime)
        self.assertIn("credentials:'same-origin'", self.runtime)

    def test_bootstrap_hub_allowlist_matches_the_canonical_registry(self):
        expected = {hub["path"] for hub in self.matrix["hubs"]}
        match = re.search(r"var hubPaths=\[(.*?)\];", self.bootstrap, re.S)
        self.assertIsNotNone(match)
        actual = set(re.findall(r"'([^']+)'", match.group(1)))
        self.assertEqual(actual, expected)

    def test_hub_assets_are_not_loaded_on_unrelated_pages(self):
        gate = "if(!embedded && hubPaths.indexOf(path)===-1) return;"
        self.assertIn(gate, self.bootstrap)
        self.assertLess(
            self.bootstrap.index(gate),
            self.bootstrap.index("omega-domain-hub.css?v=20261118-hubs-v1"),
        )

    def test_embedded_routes_keep_same_origin_session_and_permission_runtime(self):
        self.assertIn("searchParams.set('omega_embed','1')", self.runtime)
        self.assertIn("body.omega-embedded", self.styles)
        self.assertIn("event.origin!==window.location.origin", self.runtime)
        self.assertIn("event.source!==frame.contentWindow", self.runtime)
        self.assertIn("classList.add('omega-embedded')", self.bootstrap)
        self.assertIn("window.parent.location.origin===window.location.origin", self.bootstrap)
        self.assertIn("hubPaths.indexOf(parentPath)!==-1", self.bootstrap)
        self.assertIn("function isEmbeddedView()", self.nav)
        self.assertIn("hubParentPaths.indexOf(window.parent.location.pathname)!==-1", self.nav)
        self.assertIn("window.parent.location.origin===window.location.origin", self.runtime)
        self.assertIn("HUB_PATHS.indexOf(parentPath)!==-1", self.runtime)
        self.assertIn("omega-domain-hubs.js?v=20261118-hubs-v1", self.bootstrap)

    def test_embedded_navigation_keeps_same_origin_routes_inside_the_frame(self):
        self.assertIn("preserveEmbeddedNavigation", self.runtime)
        self.assertIn("url.origin!==window.location.origin", self.runtime)
        self.assertIn("url.searchParams.set('omega_embed','1')", self.runtime)
        self.assertIn("target.toLowerCase()!=='_self'", self.runtime)
        self.assertIn("window.addEventListener('click'", self.runtime)
        self.assertIn("window.addEventListener('submit'", self.runtime)
        self.assertIn("link.hasAttribute('onclick')", self.runtime)
        self.assertIn("form.hasAttribute('onsubmit')", self.runtime)

    def test_embedded_layout_preserves_existing_auth_visibility_gates(self):
        self.assertNotIn("body.omega-embedded .shell{display:", self.styles)
        self.assertNotIn("body.omega-embedded .side,", self.styles)
        self.assertNotIn("body.omega-embedded .topbar,", self.styles)
        self.assertNotIn("body.omega-embedded .main,\nbody.omega-embedded main,\nbody.omega-embedded .page,\nbody.omega-embedded #main-content{display:", self.styles)

    def test_navigation_hub_routes_match_the_canonical_registry(self):
        expected = {hub["section"]: "/" + hub["path"] for hub in self.matrix["hubs"]}
        match = re.search(r"var HUB_ROUTE_BY_SECTION=\{(.*?)\};", self.nav, re.S)
        self.assertIsNotNone(match)
        actual = dict(re.findall(r"([a-zA-Z0-9_-]+):'([^']+)'", match.group(1)))
        self.assertEqual(actual, expected)

    def test_global_navigation_routes_candidate_modules_through_their_hubs(self):
        self.assertIn("function workspaceHref(rawHref)", self.nav)
        self.assertIn("var HUB_ROUTE_BY_SECTION={", self.nav)
        self.assertIn("target.searchParams.set('omega_module',modulePath)", self.nav)
        self.assertIn("target.searchParams.set('omega_module_query',forwarded.toString())", self.nav)
        self.assertIn("workspaceHref(sub[2])", self.nav)
        self.assertIn("workspaceHref(item[2])", self.nav)
        self.assertIn("workspaceHref(p.href)", self.nav)
        self.assertIn("workspaceHref(href)", self.nav)
        self.assertIn("workspaceHref(x[2])", self.nav)
        self.assertIn("window.location.assign(routed)", self.nav)
        self.assertIn("link.hasAttribute('onclick')", self.nav)
        self.assertIn("url.pathname===window.location.pathname", self.nav)
        self.assertIn("event.defaultPrevented", self.nav)

    def test_embedded_module_deep_links_preserve_query_and_hash(self):
        self.assertIn("function updateAddress(path,moduleQuery,moduleHash)", self.runtime)
        self.assertIn("frameUrl.searchParams.append(key,value)", self.runtime)
        self.assertIn("frameUrl.hash=moduleHash||''", self.runtime)
        self.assertIn("standaloneUrl.searchParams.append(key,value)", self.runtime)
        self.assertNotIn("standaloneUrl.search=frameUrl.search", self.runtime)
        self.assertIn("params.get('omega_module_query')||''", self.runtime)
        self.assertIn("preserveEmbeddedNavigation", self.runtime)

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
            self.assertRegex(page, r"<script[^>]+src=[\"']?/?bg\.js(?:[?\"'\s>])", row["path"])
            self.assertIn("omega-side", page, row["path"])
            self.assertNotRegex(page, r"(?:window\.)?top\.location\s*(?:=|\.assign|\.replace)", row["path"])
            self.assertNotRegex(page, r"parent\.location\s*(?:=|\.assign|\.replace)", row["path"])
            self.assertNotRegex(page, r"target=[\"']_top[\"']", row["path"])

    def test_mobile_and_reduced_motion_contracts_remain_present(self):
        self.assertIn("@media(max-width:760px)", self.styles)
        self.assertIn("@media(prefers-reduced-motion:reduce)", self.styles)
        self.assertIn(".omega-domain-hub-protected-link{transition:none}", self.styles)
        self.assertIn(":focus-visible", self.styles)
        self.assertIn("loading='lazy'", self.runtime)
        self.assertIn("aria-live", self.runtime)


    def test_skill_registry_census_matches_root_javascript_files(self):
        registry = (ROOT / "OMEGA_SKILL_REGISTRY.md").read_text(encoding="utf-8")
        modules = sorted(ROOT.glob("omega-*.js"))
        root_js = sorted(ROOT.glob("*.js"))
        module_kb = sum(len(path.read_bytes().replace(b"\r\n", b"\n")) for path in modules) // 1024

        self.assertIn(f"| `omega-*.js` modules | {len(modules)} ({module_kb} KB) |", registry)
        self.assertIn(f"| root `.js` files | {len(root_js)} |", registry)

    def test_genesis_command_hub_uses_the_canonical_route_register(self):
        page = (ROOT / "dashboard.html").read_text(encoding="utf-8")
        runtime = (ROOT / "omega-genesis-command.js").read_text(encoding="utf-8")
        styles = (ROOT / "omega-genesis-command.css").read_text(encoding="utf-8")
        config = json.loads((ROOT / "config" / "omega-sovereign-hubs.json").read_text(encoding="utf-8"))
        hub = next(item for item in config["hubs"] if item["id"] == "genesis-command")

        self.assertEqual(hub["canonical_path"], "/dashboard.html")
        self.assertIn('data-tab-action="genesis"', page)
        self.assertIn('id="l-genesis"', page)
        self.assertIn('data-omega-genesis-command', page)
        self.assertIn('omega-genesis-command.js', page)
        self.assertIn('omega-genesis-command.css', page)
        self.assertIn("var tabs=['today','genesis','overview','personal','platform','science']", page)
        self.assertIn("setTab(m[h]||'today')", page)
        self.assertIn("ArrowRight", page)
        self.assertIn("ArrowLeft", page)
        self.assertIn("Home", page)
        self.assertIn("End", page)

        route_block = re.search(r"var ROUTES = Object.freeze\(\[(.*?)\]\);", runtime, re.S)
        self.assertIsNotNone(route_block)
        route_paths = re.findall(r"path:\s*'([^']+)'", route_block.group(1))
        self.assertEqual(set(route_paths), set(hub["destination_paths"]))
        self.assertEqual(len(route_paths), len(set(route_paths)))
        for path in route_paths:
            self.assertTrue((ROOT / path.lstrip("/")).is_file(), path)

        self.assertIn("textContent", runtime)
        self.assertNotIn("innerHTML", runtime)
        self.assertIn("fetch('/.well-known/omega-release.json'", runtime)
        self.assertIn("DEPLOYED BUILD · UNAVAILABLE", runtime)
        self.assertIn(":focus-visible", styles)
        self.assertIn("@media(max-width:760px)", styles)
        self.assertIn("@media(prefers-reduced-motion:reduce)", styles)


if __name__ == "__main__":
    unittest.main()
