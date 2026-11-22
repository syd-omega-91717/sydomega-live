"""blockchain.html must not present the dormant Omega Token economy as live.

CLAUDE.md section 9: a monetizable feature ships dormant behind platform_settings (tokens_enabled=false) and its copy stays in future tense until the
flag is on. Before this test, only step V of the workflow admitted the economy was dormant; steps I-IV, the architecture cards and the meta
description asserted it as live ("Tokens are earned through platform participation", "Platform activity is the primary source of sovereign tokens"),
and no gate saw it because commerce-contract.py only looks for currency amounts and revenue-shaped accumulators. This pins the copy.
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as fh:
        return fh.read()


PAGE = read("blockchain.html")
SEARCH = read("search.html")
TEXT = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", PAGE))

# present-tense statements that the economy exists or operates; each was on the page as fact
ASSERTED_AS_LIVE = [
    "Tokens are earned through platform participation",
    "Platform activity is the primary source of sovereign tokens",
    "Sovereign NFTs are minted at gate thresholds",
    "held in your sovereign wallet contribute to your lattice standing",
    "The sovereign marketplace enables peer-to-peer exchange",
    "The 9.17% sovereign commission applies to all marketplace transactions",
    "The full token economy maps across",
    "Token and NFT values are anchored to authority score",
    "The Omega Token is the native utility currency",
]


class BlockchainDormancyTruth(unittest.TestCase):
    def test_a_status_banner_says_nothing_exists_and_names_the_flag(self):
        m = re.search(r'id="token-status"[^>]*>(.*?)</div>', PAGE, re.S)
        self.assertIsNotNone(m, "the not-live banner is missing")
        banner = re.sub(r"<[^>]+>", " ", m.group(1))
        self.assertIn("NOT LIVE", banner)
        self.assertIn("tokens_enabled", banner)
        self.assertIn("no commission is charged", banner)

    def test_no_present_tense_claim_that_the_economy_operates(self):
        for phrase in ASSERTED_AS_LIVE:
            with self.subTest(phrase=phrase):
                self.assertNotIn(phrase, TEXT)

    def test_headline_parameters_are_labelled_planned(self):
        self.assertIn("PLANNED MAX SUPPLY", PAGE)
        self.assertIn("PLANNED COMMISSION", PAGE)
        self.assertNotRegex(PAGE, r'sp-lbl">(MAX SUPPLY|COMMISSION)<')

    def test_every_workflow_step_is_planned(self):
        steps = re.findall(r'class="wf-body">(.*?)</div></div></div>', PAGE, re.S)
        self.assertEqual(len(steps), 5)
        for step in steps:
            with self.subTest(step=step[:40]):
                self.assertIn("Planned:", step)

    def test_metadata_and_the_search_index_do_not_call_it_live(self):
        desc = re.search(r'<meta name="description" content="([^"]*)"', PAGE).group(1)
        self.assertIn("Not live", desc)
        self.assertIn("Not live", re.search(r"p:'/blockchain\.html',d:'([^']*)'", SEARCH).group(1))

    def test_the_scanner_has_teeth(self):
        # a planted live claim must be caught by the same substring check
        planted = TEXT + " Tokens are earned through platform participation."
        self.assertTrue(any(p in planted for p in ASSERTED_AS_LIVE))


if __name__ == "__main__":
    unittest.main()
