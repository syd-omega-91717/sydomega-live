"""The meditation page was folded into the breathwork page. These tests keep it folded and keep it from losing what it carried."""
import json
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
BREATH = (ROOT / "breath.html").read_text(encoding="utf-8")


class BreathMerge(unittest.TestCase):
    def test_the_meditation_page_is_gone_and_its_address_redirects(self):
        self.assertFalse((ROOT / "meditate.html").exists())
        redirects = {r["source"]: r for r in json.loads((ROOT / "vercel.json").read_text())["redirects"]}
        for src in ("/meditate", "/meditate.html"):
            self.assertEqual(redirects[src]["destination"], "/breath")
            self.assertTrue(redirects[src]["permanent"])

    def test_nothing_still_links_to_the_retired_page(self):
        skip = ("docs/fixes", "FIXES_LOG.md", "GAP_ANALYSIS.md", "EVIDENCE_MATRIX.md", "REPOSITORY_AUDIT.md", "FEATURE_IDEAS.md", "docs/PAGE_CONSOLIDATION.md",
                "docs/plans", "docs/OMEGA_", "vercel.json", "visual-page-survey.json", "tests/", "scripts/tests/test_breath_merge.py")
        offenders = []
        for p in ROOT.rglob("*"):
            rel = p.relative_to(ROOT).as_posix()
            if not p.is_file() or p.suffix not in (".html", ".js", ".json", ".py") or rel.startswith((".git/", "public/", "node_modules/")) or any(rel.startswith(s) for s in skip):
                continue
            if "/meditate.html" in p.read_text(encoding="utf-8", errors="ignore"):
                offenders.append(rel)
        self.assertEqual(offenders, [])

    def test_the_techniques_the_old_page_had_are_here(self):
        for name in ("TRIANGLE", "ENERGIZE", "RESONANT", "PHYSIOLOGICAL SIGH", "4-7-8 CALM", "BOX BREATHING"):
            self.assertIn("name:'%s'" % name, BREATH)
        self.assertIn("ratio:[5.5,0,5.5,0]", BREATH)
        for guide in ("WIM HOF METHOD", "UJJAYI (OCEAN BREATH)"):
            self.assertIn(guide, BREATH)

    def test_timed_sessions_pause_and_both_logs_survive(self):
        self.assertIn("const MIN_OPTIONS = [2,5,10,15,20]", BREATH)
        self.assertIn("function pauseSession", BREATH)
        self.assertIn("const MEDITATE_KEY = 'omega_meditate_log'", BREATH)   # omega-today.js and omega-life-log.js read this key as STILLNESS minutes
        self.assertIn("const BREATH_KEY = 'omega_breath_log'", BREATH)
        for reader in ("omega-today.js", "omega-life-log.js"):
            self.assertIn("omega_meditate_log", (ROOT / reader).read_text(encoding="utf-8"))

    def test_no_new_inline_handler_and_the_shared_escaper_is_used(self):
        self.assertNotIn("onclick=\"pauseSession", BREATH)
        self.assertIn('<script src="/omega-esc.js"></script>', BREATH)
        self.assertFalse(re.search(r"function escH|function esc\(", BREATH))


if __name__ == "__main__":
    unittest.main()
