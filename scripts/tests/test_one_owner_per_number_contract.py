#!/usr/bin/env python3
"""Contract: one number has one owner (CLAUDE.md 8.1 class 8).

Each pair below once kept two copies of the same member fact, so two pages
showed different values for it. Fixed 2026-10-15 (FIXES_LOG.md):
- water: nutrition.html kept cups in omega_water_track beside water.html's
  ml log omega_water_log.
- weight: physiology.html stored weight on each reading beside body.html's
  omega_body_log.
- spaced repetition: exam.html carried a third SM-2 copy beside omega-srs.js.
- net worth: wallet.html and wealth.html both headlined "SOVEREIGN NET WORTH"
  from different stores; wealth.html is its home.
- certificates: credentials.html marked four threshold "certificates" EARNED
  that exist in no table; it now reads the certificates table.
- budget: expenses.html kept its own ledger and 15-category limits beside
  budget.html's months and 8 targets; it is now a view over budget.html's
  store, keeping each row's fine category as 'sub'.
- contacts: network.html kept a second CRM; it now reads and writes
  contacts.html's book, its circles mapped onto contacts' Dunbar tiers.
"""

from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[2]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


class OneOwnerPerNumber(unittest.TestCase):
    def test_water_has_one_store(self):
        nut = read("nutrition.html")
        self.assertIn("const WATER_KEY = 'omega_water_log';", nut)
        self.assertIsNone(re.search(r"setItem\(\s*LEGACY_WATER_KEY", nut))

    def test_weight_is_written_to_body_log_only(self):
        phys = read("physiology.html")
        self.assertIn("var BODY_KEY='omega_body_log';", phys)
        self.assertIn("weight:null,vo2:vo2", phys)
        self.assertNotIn("weight:weight,vo2:vo2", phys)

    def test_exam_uses_the_shared_scheduler(self):
        exam = read("exam.html")
        self.assertIn('<script src="/omega-srs.js"></script>', exam)
        self.assertIn("OmegaSRS.review(o,g,'word')", exam)
        self.assertNotIn("o.easiness=Math.max(1.3", exam)

    def test_net_worth_has_one_home(self):
        self.assertNotIn("SOVEREIGN NET WORTH", read("wallet.html"))
        self.assertIn('href="/wealth.html"', read("wallet.html"))
        wealth = read("wealth.html")
        self.assertIn("SOVEREIGN NET WORTH", wealth)
        self.assertIn("NOT INCLUDED ABOVE", wealth)

    def test_credentials_reads_issued_certificates(self):
        cred = read("credentials.html")
        self.assertIn("sb.from('certificates')", cred)
        self.assertNotIn("var CERTS=[", cred)
        self.assertNotIn("KNOWLEDGE CERTIFICATE", cred)
        self.assertNotIn("innerHTML", cred[cred.index("function renderCerts"):cred.index("function renderKYC")])

    def test_expenses_is_a_view_over_budget(self):
        exp = read("expenses.html")
        self.assertIn("const BUDGET_MONTHS_KEY='omega_budget_months'", exp)
        self.assertNotIn("localStorage.setItem('omega_expenses'", exp)
        self.assertNotIn("localStorage.setItem('omega_budgets'", exp)
        self.assertIn("sub:e.cat", exp)  # fine category kept, no detail lost
        bud = read("budget.html")
        self.assertIn("if (_targets[c.id] == null)", bud)  # a 0 target stays 0

    def test_network_shares_the_contact_book(self):
        net = read("network.html")
        self.assertIn("const CONTACTS_KEY     = 'omega_contacts';", net)
        self.assertIn("const INTERACTIONS_KEY = 'omega_contact_ints';", net)
        self.assertNotIn("localStorage.getItem('omega_network_contacts')", read("dashboard.html"))
        self.assertIn("c.lastContact||''", read("contacts.html"))

    def test_dashboard_sums_row_amounts(self):
        self.assertIn("function sumAmt(a)", read("dashboard.html"))


if __name__ == "__main__":
    unittest.main()
