"""payments.html was merged into subscriptions.html (PAYMENT HISTORY and METHODS tabs). Nothing may point at the retired page."""
import glob, json, os, re, unittest

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
SRC_GLOBS = ("*.html", "*.js")


def read(name):
    return open(os.path.join(ROOT, name), encoding="utf-8").read()


class PaymentsMergedIntoSubscriptions(unittest.TestCase):
    def test_the_page_is_gone_and_redirects_to_the_tab(self):
        self.assertFalse(os.path.exists(os.path.join(ROOT, "payments.html")))
        redirects = {r["source"]: r["destination"] for r in json.loads(read("vercel.json"))["redirects"]}
        self.assertEqual(redirects.get("/payments"), "/subscriptions#payments")
        self.assertEqual(redirects.get("/payments.html"), "/subscriptions#payments")

    def test_nothing_links_to_the_retired_page(self):
        bad = []
        for pattern in SRC_GLOBS:
            for f in glob.glob(os.path.join(ROOT, pattern)):
                if "/payments.html" in open(f, encoding="utf-8", errors="replace").read().replace("omega-payments-ledger.js", ""):
                    bad.append(os.path.basename(f))
        self.assertEqual(bad, [])

    def test_subscriptions_carries_the_ported_surfaces(self):
        s = read("subscriptions.html")
        for needle in ('id="tab-payments"', 'id="tab-methods"', 'data-tab-open="methods"', 'id="tx-body"', 'id="kpi-inflow">—</div>',
                       "STRIPE — CARD" if "STRIPE — CARD" in s else "STRIPE &mdash; CARD", "/omega-payments-ledger.js"):
            self.assertIn(needle, s)
        self.assertIn("['plan','tiers','payments','methods','science']", s)

    def test_no_inline_handlers_were_added_for_the_port(self):
        s = read("subscriptions.html")
        self.assertNotIn("filterTx(this", s)
        self.assertNotIn("setTab('methods')", s)

    def test_the_ledger_code_stays_unavailable_and_uses_text_nodes(self):
        j = read("omega-payments-ledger.js")
        self.assertIn("TRANSACTION LEDGER UNAVAILABLE", j)
        self.assertIn("tb.replaceChildren();", j)
        self.assertNotIn("innerHTML", j)


if __name__ == "__main__":
    unittest.main()
