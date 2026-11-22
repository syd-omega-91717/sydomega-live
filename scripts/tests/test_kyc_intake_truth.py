"""profile.html must not say identity-document intake is active, compliant or ready while it is closed.

kyc_intake_enabled defaults to false (20260927110344_kyc_intake_rpcs.sql) and no licensed KYC/AML provider is connected, so nothing is collected or
verified. The Identity Verification block nevertheless said "READY TO ACTIVATE", "All intake flows, status tracking, and document management are active",
"All documents are encrypted and handled under GDPR/CCPA compliance" (a legal claim nothing proves), "This is a legal requirement" and promised that completing
steps would "unlock economic features, token access" (tokens are dormant). Those strings also lived in the English table and six translation packs, so this
pins all eight places.
"""
import json
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LANGS = ("ar", "es", "fr", "hi", "nl", "zh")
KEYS = ("prof_passport_submit_header", "prof_kyc_intro", "prof_kyc_status_desc")


def read(path):
    with open(os.path.join(ROOT, path), encoding="utf-8") as fh:
        return fh.read()


PAGE = read("profile.html")
BANNED = [
    "READY TO ACTIVATE",
    "intake flows, status tracking, and document management are active",
    "GDPR/CCPA",
    "legal requirement -- not a platform choice",
    "unlock economic features, token access",
    "securely encrypted",
]


def t_en(key):
    m = re.search(r'^"' + re.escape(key) + r'":("(?:[^"\\]|\\.)*"),?$', read("i18n.js"), re.M)
    return json.loads(m.group(1))


class KycIntakeTruth(unittest.TestCase):
    def test_the_page_carries_none_of_the_false_claims(self):
        for phrase in BANNED:
            with self.subTest(phrase=phrase):
                self.assertNotIn(phrase, PAGE)

    def test_the_notice_says_intake_is_closed_and_names_the_flag(self):
        m = re.search(r'<div class="ra-note">(.*?)</div>', PAGE, re.S)
        self.assertIsNotNone(m)
        text = re.sub(r"<[^>]+>", " ", m.group(1))
        self.assertIn("NOT ACTIVE", text)
        self.assertIn("kyc_intake_enabled", text)
        self.assertIn("no document is collected", text)

    def test_the_intro_and_status_copy_say_verification_is_planned_not_live(self):
        self.assertIn("not active yet", t_en("prof_kyc_intro"))
        self.assertIn("planned", t_en("prof_kyc_intro"))
        self.assertIn("No identity verification is in progress", t_en("prof_kyc_status_desc"))

    def test_the_page_html_matches_the_english_table(self):
        for key in ("prof_kyc_intro", "prof_kyc_status_desc"):
            with self.subTest(key=key):
                self.assertIn(t_en(key), PAGE)

    def test_the_header_has_no_ready_tail_in_english_or_any_pack(self):
        self.assertEqual(t_en("prof_passport_submit_header"), "SUBMIT IDENTITY DOCUMENT")
        for lang in LANGS:
            with self.subTest(lang=lang):
                v = json.loads(read("i18n/%s.json" % lang))["prof_passport_submit_header"]
                self.assertNotIn("  .  ", v, "the old two-part heading ('... . READY TO ACTIVATE') survived in the %s pack" % lang)

    def test_no_pack_still_carries_the_old_intro_or_status_promise(self):
        old_intro_marker = {"es": "GDPR", "fr": "GDPR", "nl": "GDPR", "hi": "GDPR", "ar": "GDPR", "zh": "GDPR"}
        for lang in LANGS:
            data = json.loads(read("i18n/%s.json" % lang))
            for key in KEYS:
                self.assertIn(key, data)
            with self.subTest(lang=lang):
                self.assertNotIn(old_intro_marker[lang], data["prof_kyc_intro"])
                self.assertNotEqual(data["prof_kyc_intro"], t_en("prof_kyc_intro"), "left in English: the pack must be translated")

    def test_the_scanner_has_teeth(self):
        planted = PAGE + " READY TO ACTIVATE"
        self.assertTrue(any(p in planted for p in BANNED))


if __name__ == "__main__":
    unittest.main()
