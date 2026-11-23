"""The budget page was folded into the expenses page (one store, one page). These tests keep it folded and keep it from losing what it carried.

Static contracts plus the browser suite (scripts/verify-expenses-merge.js). The browser suite is skipped when no browser exists and fails instead when
OMEGA_REQUIRE_BROWSER is set, the same rule as verify-runtime.js.
"""
import json
import os
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
EXP = (ROOT / "expenses.html").read_text(encoding="utf-8")
CODE = "\n".join(re.findall(r"<script(?![^>]*src)[^>]*>(.*?)</script>", EXP, flags=re.S))


class Merge(unittest.TestCase):
    def test_the_budget_page_is_gone_and_both_addresses_redirect(self):
        self.assertFalse((ROOT / "budget.html").exists())
        redirects = {r["source"]: r for r in json.loads((ROOT / "vercel.json").read_text(encoding="utf-8"))["redirects"]}
        for src in ("/budget", "/budget.html"):
            self.assertEqual(redirects[src]["destination"], "/expenses")
            self.assertTrue(redirects[src]["permanent"])

    def test_nothing_still_links_to_the_retired_page(self):
        skip = ("docs/", "FIXES_LOG.md", "GAP_ANALYSIS.md", "EVIDENCE_MATRIX.md", "REPOSITORY_AUDIT.md", "FEATURE_IDEAS.md", "PLATFORM_SCALING_ROADMAP.md",
                "PHASE_3_FEATURE_ROADMAP.md", "OMEGA_PAGE_CHARACTER_FRAMEWORK.md", "vercel.json", "visual-page-survey.json", "tests/", "supabase/",
                "scripts/tests/test_budget_expenses_merge.py", "scripts/verify-expenses-merge.js",   # this test and the browser suite name it on purpose, to assert it is gone
                "expenses.html")   # expenses.html names the old page in comments that explain the merge
        offenders = []
        for p in ROOT.rglob("*"):
            rel = p.relative_to(ROOT).as_posix()
            if not p.is_file() or p.suffix not in (".html", ".js", ".json", ".py") or rel.startswith((".git/", "public/", "node_modules/")) or any(rel.startswith(s) for s in skip):
                continue
            if "/budget.html" in p.read_text(encoding="utf-8", errors="ignore"):
                offenders.append(rel)
        self.assertEqual(offenders, [])

    def test_navigation_has_no_entry_for_the_retired_page_and_keeps_the_survivor(self):
        nav = (ROOT / "nav.js").read_text(encoding="utf-8")
        self.assertNotIn("'/budget.html'", nav)
        self.assertNotIn("budget:'invest'", nav)
        self.assertIn("['expenses','EXPENSES','/expenses.html'", nav)
        self.assertIn("'invest','investment','portfolio','treasury','revenue','wallet','expenses','wealth'", nav)   # the invest section lists it once, as expenses

    def test_the_one_store_is_unchanged_so_no_member_data_moves(self):
        for key in ("omega_budget_months", "omega_budget_targets"):
            self.assertIn("'%s'" % key, CODE)
            self.assertIn("'%s'" % key, EXP.split("OmegaLocalBackup.exportKeys(")[1][:120])   # the backup button still covers both keys
        self.assertIn("migrateLegacy", CODE)                                                  # members of the older ledger are still moved over once

    def test_what_budget_html_had_that_the_survivor_lacked_is_here(self):
        for token in ("function changeMonth", "function renderTrends", "function drawYear", "function drawRate", "function monthTotals", "function groupActual",
                      'id="tab-trends"', 'data-tab="trends"', 'id="budget-month-kpis"', 'id="trend-rate-canvas"'):
            self.assertIn(token, EXP, token)

    def test_months_are_read_by_store_key_and_month_arithmetic_is_integer(self):
        self.assertIn("function monthRows(key){var m=readMonths()[key]", CODE)
        i = CODE.index("function changeMonth")
        body = CODE[i:i + 260]
        self.assertNotIn("toISOString", body)                       # budget.html built the next month with toISOString() on a local date: a month early east of UTC
        self.assertIn("Math.floor(i/12)", body)

    def test_no_new_inline_handler_and_new_markup_is_built_without_unescaped_sinks(self):
        for token in ('id="mn-prev"', 'id="mn-next"', 'id="tab-btn-trends"'):
            self.assertIn(token, EXP)
        for bad in ("onclick=\"changeMonth", "onclick=\"setTrendYear", "onclick=\"switchTab('trends'"):
            self.assertNotIn(bad, EXP)
        self.assertIn("escapeHTML(largestExp.desc)", CODE)          # a member-entered description reached innerHTML unescaped before the merge

    def test_every_read_of_the_store_is_normalised_and_trend_years_are_four_digits(self):
        # budget.html normalised its ledger on load; expenses.html did not, and one junk row in an imported backup stopped the page (found by the hostile-store case).
        self.assertIn("function readMonths(){return normaliseMonths(readJSON(BUDGET_MONTHS_KEY,{}));}", CODE)
        self.assertIn("if(k==='__proto__')return;", CODE)
        self.assertIn("amount:Number(e.amount)||0", CODE)
        self.assertIn("/^\\d{4}$/.test(y)", CODE)

    def test_the_vault_shows_one_row_for_the_one_store(self):
        vc = (ROOT / "omega-vault-core.js").read_text(encoding="utf-8")
        self.assertIn("label: 'BUDGET & EXPENSES', href: '/expenses.html'", vc)
        self.assertEqual(vc.count("id: 'budget'"), 1)
        self.assertNotIn("id: 'expenses'", vc)
        self.assertIn("arr('omega_expenses')", vc)                  # the legacy list is still counted until expenses.html migrates it

    def test_the_invest_hub_has_one_card_for_it(self):
        inv = (ROOT / "invest.html").read_text(encoding="utf-8")
        self.assertEqual(inv.count('href="/expenses.html"'), 1)
        self.assertNotIn('href="/budget.html"', inv)
        self.assertIn("BUDGET &amp; EXPENSES", inv)

    def test_the_registries_that_track_pages_no_longer_list_it(self):
        for cfg in ("omega-page-contracts", "omega-page-contract-bootstrap", "omega-page-review-tasks", "omega-page-hub-ownership", "page-cores", "page-world-overrides"):
            self.assertNotIn('"budget.html"', (ROOT / "config" / (cfg + ".json")).read_text(encoding="utf-8"), cfg)


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-expenses-merge.js")], capture_output=True, text=True, timeout=300)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
