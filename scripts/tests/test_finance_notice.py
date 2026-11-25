"""The finance "not advice" notice (omega-finance-notice.js, one script tag per money page): static contracts, plus the browser suite.

The browser suite (scripts/verify-finance-notice.js) is skipped when no browser exists and fails instead when OMEGA_REQUIRE_BROWSER
is set, the same rule as verify-runtime.js.
"""
import os
import pathlib
import re
import shutil
import subprocess
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = (ROOT / "omega-finance-notice.js").read_text(encoding="utf-8")
CODE = re.sub(r"/\*.*?\*/", "", SRC, flags=re.S)
NAV = (ROOT / "nav.js").read_text(encoding="utf-8")
TAG = 'src="/omega-finance-notice.js"'
# Money pages that nav.js files outside its "invest" section but that the commerce contract names as money surfaces.
EXTRA = {"blockchain", "marketplace", "income", "subscriptions"}


def invest_section_pages():
    ps = re.search(r"var PS\s*=\s*\{(.*?)\};", NAV, re.S).group(1)
    return {slug for slug, sec in re.findall(r"([a-z0-9_-]+)\s*:\s*'([a-z]+)'", ps) if sec == "invest"}


def tagged_pages():
    return {p.stem for p in ROOT.glob("*.html") if TAG in p.read_text(encoding="utf-8", errors="ignore")}


class Coverage(unittest.TestCase):
    def test_every_money_page_carries_the_notice_exactly_once(self):
        expected = {s for s in invest_section_pages() if (ROOT / (s + ".html")).exists()} | EXTRA
        self.assertGreaterEqual(len(expected), 12)   # was 14 until budget.html was merged into expenses.html, 13 until payments.html into subscriptions.html
        for s in sorted(expected):
            self.assertTrue((ROOT / (s + ".html")).exists(), s + ".html does not exist (update EXTRA)")
            self.assertEqual((ROOT / (s + ".html")).read_text(encoding="utf-8").count(TAG), 1, s)
        self.assertEqual(tagged_pages() - expected, set(), "a page carries the notice that is not a money page here")

    def test_the_invest_section_is_read_from_nav_not_listed_here(self):
        self.assertTrue({"investment", "treasury", "wallet", "wealth", "expenses"} <= invest_section_pages())   # "budget" was merged into expenses

    def test_bg_js_is_untouched_by_this_feature(self):  # single point of failure; a leaf script tag per page needs none of it
        self.assertNotIn("omega-finance-notice", (ROOT / "bg.js").read_text(encoding="utf-8"))

    def test_the_guard_name_is_unique_to_this_module(self):  # CLAUDE.md 8.1 class 5b
        for f in ROOT.glob("*.js"):
            if f.name != "omega-finance-notice.js":
                self.assertNotIn("OmegaFinanceNotice", f.read_text(encoding="utf-8", errors="ignore"), f.name)


class Source(unittest.TestCase):
    def test_pure_ascii(self):
        SRC.encode("ascii")

    def test_the_notice_says_what_the_platform_is_not_and_nothing_that_can_go_stale(self):
        m = re.search(r"var BODY = (.*?);\n", CODE, re.S)
        self.assertIsNotNone(m)
        body = re.sub(r"['+\s]+", " ", m.group(1)).lower()
        for must in ("not a bank, broker, exchange or regulated financial service", "financial, investment, tax or legal advice",
                     "offer to buy or sell", "illustrations, not predictions or promises of return", "qualified adviser"):
            self.assertIn(must, body, must)
        # facts that change must not be asserted: what is live, what is simulated, which jurisdiction, any figure
        for bad in ("live", "dormant", "simulated", "real money", "regulated by", "licensed", "guarantee", "%", "usd", "eu ", "u.s."):
            self.assertNotIn(bad, body, bad)
        self.assertNotRegex(body, r"\d")

    def test_it_is_a_real_note_in_flow_and_cannot_be_dismissed(self):
        self.assertIn("setAttribute('role', 'note')", CODE)
        for bad in ("position:fixed", "position: fixed", "addEventListener('click'", "localStorage", "sessionStorage", "button", "close", "dismiss"):
            self.assertNotIn(bad, CODE, bad)
        self.assertNotRegex(CODE, r"(?<![-\w])bottom\s*:\s*\d")   # no bottom-anchored constant (CLAUDE.md 4); margin-bottom is not one

    def test_english_only_on_purpose_no_translation_key(self):
        self.assertNotIn("data-i18n", CODE)

    def test_no_network_no_markup_from_strings(self):
        for bad in ("fetch(", "XMLHttpRequest", "import(", "http://", "https://", "innerHTML", "insertAdjacentHTML", "eval(", "document.write"):
            self.assertNotIn(bad, CODE, bad)

    def test_it_never_claims_to_be_legal_review(self):
        self.assertIn("NOT LEGAL ADVICE", SRC)
        self.assertIn("HAS NOT BEEN REVIEWED BY COUNSEL", SRC)

    def test_it_never_uses_the_shell_as_its_column(self):  # CLAUDE.md 4: .shell is a flex row
        self.assertIn("cand.contains(side)", CODE)
        self.assertIn("nextElementSibling", CODE)

    def test_class_names_avoid_the_swept_substrings(self):  # omega-visual-evolution.css selects [class*="card"] / "panel"
        for cls in set(re.findall(r"\.(ofn[a-z-]*)", CODE)):
            self.assertNotIn("card", cls)
            self.assertNotIn("panel", cls)


class Browser(unittest.TestCase):
    def test_browser_validation(self):
        node = shutil.which("node")
        if not node:
            self.skipTest("node not available")
        r = subprocess.run([node, str(ROOT / "scripts" / "verify-finance-notice.js")], capture_output=True, text=True, timeout=540)
        out = r.stdout + r.stderr
        if "SKIPPED" in out and not os.environ.get("OMEGA_REQUIRE_BROWSER"):
            self.skipTest("no browser available")
        self.assertEqual(r.returncode, 0, out)


if __name__ == "__main__":
    unittest.main()
