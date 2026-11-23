"""The invest hub says what each page is in a few words and keeps every honesty claim.

The hub (invest.html) is a navigation page, so its copy has a word budget; but several cards are also where a member learns that something is disabled, local-only or
not a balance (CLAUDE.md 9: dormant features say so). The status chip under each card carries the state; the sentence carries the claim a chip cannot. This pins both:
the budget (so the page does not regrow) and the claims (so a trim cannot quietly drop one).
"""
import html
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
SRC = (ROOT / "invest.html").read_text(encoding="utf-8")
CARDS = {m.group(1): (html.unescape(m.group(2)), html.unescape(m.group(3)), html.unescape(m.group(4)))
         for m in re.finditer(r'<a class="card" href="([^"]+)"><h2>([^<]*)</h2><p>([^<]*)</p><div class="meta">([^<]*)</div></a>', SRC)}
LEAD = html.unescape(re.search(r'<p class="lead">([^<]*)</p>', SRC).group(1))
TRUTH = html.unescape(re.search(r"TRUTH BOUNDARY:[^<]*", SRC).group(0))


def words(t):
    return len(t.split())


class Budget(unittest.TestCase):
    def test_the_lead_is_short(self):
        self.assertLessEqual(words(LEAD), 25, LEAD)

    def test_every_card_sentence_is_short(self):
        for href, (title, text, chip) in CARDS.items():
            # advertising: its sentence is pinned verbatim by the commerce contract; ad-network: a three-part "has not" disclosure that a chip cannot hold
            cap = 20 if href in ("/advertising.html", "/ad-network.html") else 14
            self.assertLessEqual(words(text), cap, href + ": " + text)

    def test_the_truth_boundary_is_one_short_paragraph(self):
        self.assertLessEqual(words(TRUTH), 40, TRUTH)

    def test_total_prose_stays_under_the_budget(self):
        body = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", SRC, flags=re.S)
        total = sum(words(html.unescape(re.sub(r"\s+", " ", m.group(2)))) for m in re.finditer(r"<(p|div)\b[^>]*>([^<]{25,})</\1>", body)
                    if words(html.unescape(m.group(2))) >= 8)
        self.assertLessEqual(total, 230, total)     # was 354 before the trim (2026-11-23)

    def test_there_are_fifteen_cards_and_each_still_has_a_status_chip(self):
        self.assertEqual(len(CARDS), 15)
        for href, (title, text, chip) in CARDS.items():
            self.assertTrue(chip.strip(), href)


class Claims(unittest.TestCase):
    """The claim each sentence makes that its chip does not."""
    REQUIRED = {
        "/portfolio.html": "Not a financial tracker",
        "/wealth.html": "not verified balances",
        "/wallet.html": "never platform balances",
        "/revenue.html": "no settlement or paid revenue is claimed",
        "/payments.html": "no payments are inferred",
        "/expenses.html": "not ledger truth",
        "/subscriptions.html": "billing are disabled",
        "/blockchain.html": "no on-chain balance is claimed",
        "/marketplace.html": "not implemented",
        "/advertising.html": "payouts remain disabled pending legal and payment readiness",
        "/ad-network.html": "has not carried a paid campaign",
    }

    def test_each_disclosure_survives(self):
        for href, needle in self.REQUIRED.items():
            self.assertIn(needle.lower(), CARDS[href][1].lower(), href)

    def test_the_status_chips_are_unchanged_in_meaning(self):
        for href, needle in {"/blockchain.html": "TOKENS DISABLED", "/payments.html": "DISABLED", "/subscriptions.html": "BILLING DISABLED", "/ad-network.html": "NOT OPERATIONAL",
                             "/marketplace.html": "PURCHASE FLOW DISABLED", "/wallet.html": "NO AUTHORITATIVE BALANCE", "/expenses.html": "USER-LOCAL"}.items():
            self.assertIn(needle, CARDS[href][2], href)

    def test_the_truth_boundary_keeps_its_three_promises(self):
        low = TRUTH.lower()
        for needle in ("invented", "browser-local data stays local", "authorization"):
            self.assertIn(needle, low)
        for thing in ("portfolio balance", "market price", "reserve", "revenue", "transaction", "currency value"):
            self.assertIn(thing, low)

    def test_the_status_strip_above_the_cards_is_unchanged(self):
        for chip in ("USER-LOCAL: INVESTMENT / TREASURY / WALLET / BUDGET / EXPENSES", "PLATFORM STATE: MEMBERSHIP READ-ONLY · BILLING DISABLED", "PLANNED: SOVEREIGN ECONOMY / RESERVE CLAIMS"):
            self.assertIn(chip, html.unescape(SRC))


if __name__ == "__main__":
    unittest.main()
