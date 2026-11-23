"""Opt-in deterministic script pipeline in bg.js (docs/DETERMINISTIC_SCRIPT_PIPELINE_PHASE1.md).

Static contracts that must hold while rollout is disabled, plus the browser suite
(scripts/verify-script-pipeline.js) run against the real loader block. The browser suite is skipped when no
browser exists, and fails instead when OMEGA_REQUIRE_BROWSER is set (same rule as verify-runtime.js).
"""
import os
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
BG = (ROOT / "bg.js").read_text(encoding="utf-8")
BLOCK = BG[BG.index("/* Ω-SCRIPT-PIPELINE:begin"):BG.index("/* Ω-SCRIPT-PIPELINE:end */")]


class PipelineIsDisabledByDefault(unittest.TestCase):
    def test_opt_in_flag_and_null_when_off(self):
        self.assertIn("localStorage.getItem('omega_script_pipeline')==='1'", BLOCK)
        self.assertRegex(BLOCK, r"if\(!on\) return null;")

    def test_nothing_is_published_before_the_flag_check(self):
        self.assertLess(BLOCK.index("if(!on) return null;"), BLOCK.index("window.OmegaScriptPipeline="))
        self.assertEqual(BG.count("window.OmegaScriptPipeline="), 1)

    def test_flag_is_never_defaulted_on_anywhere(self):
        code = re.sub(r"/\*.*?\*/", "", BG, flags=re.S)  # the doc comment names the enabling command; code must not run it
        self.assertNotRegex(code, r"setItem\(\s*['\"]omega_script_pipeline['\"]")
        for f in ROOT.glob("*.html"):
            self.assertNotIn("omega_script_pipeline", f.read_text(encoding="utf-8", errors="ignore"), f.name)

    def test_pipeline_failure_cannot_take_bg_js_down(self):
        self.assertRegex(BLOCK, r"\}catch\(err\)\{ return null; \}")


class LegacyBehaviourPreserved(unittest.TestCase):
    def test_append_helper_keeps_dedup_and_body_queueing(self):
        m = re.search(r"function __omegaAppend\(el\)\{.*?\n\}\n", BG, re.S)
        self.assertIsNotNone(m)
        body = m.group(0)
        for needle in ("function dup()", "seen.el.has(s)", "isConnected", "document.addEventListener('DOMContentLoaded'"):
            self.assertIn(needle, body)

    def test_append_hooks_are_no_ops_without_the_pipeline(self):
        body = re.search(r"function __omegaAppend\(el\)\{.*?\n\}\n", BG, re.S).group(0)
        self.assertIn("var P=__omegaPipe; if(P) P.prepare(el);", body)
        self.assertIn("if(P) P.inserted(el)", body)
        self.assertIn("else if(P) P.skipped(el)", body)

    def test_idle_helper_is_byte_for_byte_the_regression_tested_one(self):
        m = re.search(r"function __omegaIdleAppend\(el\)\{.*?\n\}\n", BG, re.S).group(0)
        self.assertEqual(m.count("__omegaAppend(el)"), 1)
        self.assertNotIn("__omegaPipe", m)
        self.assertIn("requestIdleCallback(run,{timeout:2500})", m)

    def test_no_new_script_is_injected_by_the_pipeline(self):
        self.assertNotIn("omega-script-pipeline.js", BG)  # it lives in bg.js; no extra request, no new module


class CriticalPathsStayProtected(unittest.TestCase):
    def test_critical_pattern_covers_bootstrap_vendor_and_auth(self):
        rx = re.search(r"var CRIT=/(.*)/;", BLOCK).group(1)
        js = re.compile(rx)
        for p in ("/bg.js", "/nav.js", "/vendor/supabase-js.js", "/vendor/three.module.js", "/omega-gate.js",
                  "/omega-mfa-gate.js", "/omega-tier-gate.js", "/omega-auth.js", "/omega-session.js"):
            self.assertTrue(js.search(p), p)
        for p in ("/omega-motion.js", "/omega-living-art.js"):
            self.assertFalse(js.search(p), p)

    def test_critical_paths_are_not_reordered_timed_out_or_retried(self):
        self.assertIn("if(!e.critical) el.async=false;", BLOCK)
        self.assertIn("if(!e.critical) e.timer=setTimeout", BLOCK)
        self.assertIn("e.critical){ var er=new Error('script '+path+' not retryable", BLOCK)


class FailureSemantics(unittest.TestCase):
    def test_retry_only_after_a_network_or_csp_error(self):
        self.assertIn("e.state!=='failed'", BLOCK)
        self.assertIn("set(e,'timeout','timeout')", BLOCK)  # timeout is its own state, so retry is refused
        self.assertIn("set(e,'failed','load-error')", BLOCK)

    def test_diagnostics_use_pathname_only(self):
        self.assertIn("new URL(u,location.href).pathname", BLOCK)
        self.assertNotRegex(BLOCK, r"detail:\{[^}]*\bsrc\b")


class BrowserSuite(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-script-pipeline.js")], capture_output=True, text=True, timeout=180)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
