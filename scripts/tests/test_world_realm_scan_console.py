"""Contract tests for the World page's manual realm scan console."""
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]
PAGE = (ROOT / "world.html").read_text(encoding="utf-8")
SCRIPT = (ROOT / "world-realm-scan.js").read_text(encoding="utf-8")
STYLE = (ROOT / "world-realm-scan.css").read_text(encoding="utf-8")
ENGINE = (ROOT / "omega-world-engine.js").read_text(encoding="utf-8")


class WorldRealmScanConsoleTests(unittest.TestCase):
    def test_world_loads_page_scoped_assets(self):
        self.assertIn('href="/world-realm-scan.css"', PAGE)
        self.assertIn('src="/world-realm-scan.js"', PAGE)
        self.assertIn('data-omega-sculpture="genesis"', PAGE)

    def test_console_exposes_live_scan_metrics_and_manual_rescan(self):
        for element_id in (
            "ow-realm-scan-state", "ow-realm-reachable", "ow-realm-total",
            "ow-realm-last", "ow-realm-select", "ow-realm-rescan",
        ):
            self.assertIn('id="' + element_id + '"', PAGE)
        self.assertIn("engine.verify()", SCRIPT)
        self.assertIn("engine.modules", SCRIPT)

    def test_console_uses_existing_world_registry_and_route_truth(self):
        self.assertIn("var modules=engine&&Array.isArray(engine.modules)?engine.modules:[]", SCRIPT)
        self.assertIn("mod.routeState==='LIVE'", SCRIPT)
        self.assertIn("mod.routeState==='UNAVAILABLE'", SCRIPT)
        self.assertIn("m.verifiedAt", SCRIPT)
        self.assertIn("httpStatus", ENGINE)
        self.assertIn("r.status===401||r.status===403", ENGINE)

    def test_selected_realm_uses_registry_destination_and_description(self):
        self.assertIn("selected.purpose", SCRIPT)
        self.assertIn("selected.role", SCRIPT)
        self.assertIn("safeHref(selected.href)", SCRIPT)
        self.assertIn("value=mod.id", SCRIPT)
        self.assertIn("node.dataset.module", SCRIPT)

    def test_console_does_not_claim_route_reachability_means_full_health(self):
        self.assertIn("does not certify authentication, data access or every page function", PAGE)
        self.assertIn("ROUTES REACHABLE", PAGE)
        self.assertNotIn("ALL SYSTEMS HEALTHY", SCRIPT)

    def test_console_handles_missing_engine_and_failed_scan(self):
        self.assertIn("WORLD ENGINE UNAVAILABLE", SCRIPT)
        self.assertIn("WORLD REGISTRY UNAVAILABLE", SCRIPT)
        self.assertIn("SCAN FAILED · PRIOR RESULTS RETAINED", SCRIPT)
        self.assertIn("INITIAL SCAN STALLED · RETRY", SCRIPT)
        self.assertIn("initialScanStalled=true", SCRIPT)
        self.assertIn("finally", SCRIPT)

    def test_visual_layer_is_responsive_and_reduced_motion_safe(self):
        self.assertIn("@media(max-width:760px)", STYLE)
        self.assertIn("@media(max-width:420px)", STYLE)
        self.assertIn("@media(prefers-reduced-motion:reduce)", STYLE)
        self.assertIn("animation:none", STYLE)
        self.assertIn(".ow-realm-console.is-scanning:before", STYLE)
        self.assertIn("root.classList.toggle('is-scanning',activeScan)", SCRIPT)
        self.assertNotRegex(STYLE, r"#[0-9a-fA-F]{3,8}")
        self.assertNotIn("!important", STYLE)

    def test_page_scoped_styles_do_not_redefine_global_tokens(self):
        self.assertNotRegex(STYLE, re.compile(r"(^|[;{}])\s*--(?:void|gold|cyan|ink|muted)\s*:", re.M))
        self.assertNotIn("service_role", SCRIPT)
        self.assertNotIn("SUPABASE_SERVICE", SCRIPT)


if __name__ == "__main__":
    unittest.main()
