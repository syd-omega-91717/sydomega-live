"""celestial-covenants.html is concept key art for a fictional franchise, and the franchise brief it came from is marked Proprietary / Confidential.

This repository is public and every served file is fetchable by URL (CLAUDE.md 8.2), so the page carries only the creative concept layer. It must also never claim
a capability it does not have: the brief specifies device eye-tracking, microphone-reactive teeth, GPS geofencing and a data purge, and this page implements none of the
first three. Pinned here: honest labels, no sensor APIs, no confidential business facts, no scripture used as a mechanic, no injection surface, reachable from the nav.
"""
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as fh:
        return fh.read()


HTML = read("celestial-covenants.html")
JS = read("omega-celestial-covenants.js")
TEXT = re.sub(r"\s+", " ", re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", HTML, flags=re.S | re.I))
TEXT = re.sub(r"<[^>]+>", " ", TEXT)
JS_CODE = re.sub(r"//[^\n]*", "", re.sub(r"/\*.*?\*/", "", JS, flags=re.S))   # the header comment names what the file avoids
ALL = (HTML + "\n" + JS_CODE).lower()

# facts from the confidential brief that must never be published here
CONFIDENTIAL = ["trademark", "copyright regist", "insurance", "errors & omissions", "risk register", "crisis playbook", "advisory board", "$5,000", "scholar sign",
                "sign-off", "investor", "budget", "dpo@", "media@", "celestialcovenants.com", "tcc-frn", "proprietary", "esrb", "pegi", "geo-blocking", "72 hours", "24 months", "salt"]
SENSORS = ["getusermedia", "navigator.geolocation", "audiocontext", "mediadevices", "webkitaudiocontext", "deviceorientation", "devicemotion", "eyetrack", "facedetector", "mediarecorder"]


class CelestialCovenantsTruth(unittest.TestCase):
    def test_it_says_concept_and_not_released_prominently(self):
        self.assertIn("CONCEPT KEY ART", TEXT)
        self.assertRegex(TEXT, r"Nothing here is released, on sale, licensed or live")
        self.assertIn("No product, ticketing, game or AR app exists", TEXT)
        self.assertIn("Fiction.", TEXT)

    def test_no_sensor_api_is_used_anywhere(self):
        for api in SENSORS:
            with self.subTest(api=api):
                self.assertNotIn(api, ALL)

    def test_unbuilt_brief_features_are_labelled_not_built(self):
        self.assertIn("NOT ACTIVE, NO AR RUNTIME", TEXT)
        self.assertIn("device eye-tracking is not used", TEXT)
        self.assertIn("it is not built", TEXT)
        self.assertIn("never asks for a microphone", TEXT)
        self.assertIn("a true planetary hour needs your location", TEXT.lower())

    def test_the_data_purge_and_lore_safe_toggle_really_do_what_they_say(self):
        self.assertIn("localStorage.removeItem(KEY)", JS)
        self.assertRegex(JS, r"var KEY = 'omega_covenants_lore_safe'")
        self.assertIn('data-lore="religious"', HTML)
        self.assertIn('data-lore="neutral"', HTML)
        self.assertRegex(HTML, r'\.cc\[data-lore-safe="on"\] \[data-lore="religious"\]\{display:none\}')
        self.assertIn('data-lore-safe="on"', HTML, "Lore-Safe Mode must default to on")

    def test_the_two_disabled_controls_are_really_disabled(self):
        self.assertEqual(len(re.findall(r'<button type="button" disabled aria-disabled="true"', HTML)), 2)

    def test_no_confidential_business_facts_are_published(self):
        for term in CONFIDENTIAL:
            with self.subTest(term=term):
                self.assertNotIn(term, ALL)

    def test_no_scripture_and_no_mechanic_built_on_religious_text(self):
        for term in ["quran", "qur'an", "surah", "ayah", "verse of", "damage", "hit points", "spell"]:
            with self.subTest(term=term):
                self.assertNotIn(term, TEXT.lower() + JS_CODE.lower())

    def test_the_merchandise_and_the_eula_are_not_invented(self):
        for term in ["plush", "statue", "eula", "i agree", "checkbox", "add to cart", "buy now", "pre-order"]:   # the page may DISCLAIM merchandise, never show it
            with self.subTest(term=term):
                self.assertNotIn(term, TEXT.lower())

    def test_no_injection_surface_and_no_network(self):
        for bad in ["innerhtml", "outerhtml", "insertadjacenthtml", "document.write", "eval(", "new function", "fetch(", "xmlhttprequest", "websocket", "sendbeacon"]:
            with self.subTest(bad=bad):
                self.assertNotIn(bad, JS_CODE.lower())
        self.assertNotRegex(HTML, r"<script[^>]+src=[\"']https?://")
        self.assertNotRegex(HTML, r"\son[a-z]+\s*=")

    def test_it_is_wired_into_the_platform_and_reachable(self):
        nav = read("nav.js")
        self.assertIn("'celestial-covenants':'media'", nav)
        self.assertIn("['celestial-covenants','CELESTIAL COVENANTS','/celestial-covenants.html']", nav)
        self.assertIn('<script src="/bg.js" defer></script>', HTML)
        self.assertIn('id="omega-side" data-page="celestial-covenants"', HTML)
        self.assertEqual(len(re.findall(r"<h1[ >]", HTML)), 1)

    def test_reduced_motion_is_honoured_in_css_and_js(self):
        self.assertIn("prefers-reduced-motion:reduce", HTML)
        self.assertIn("prefers-reduced-motion: reduce", JS)

    def test_the_scanners_have_teeth(self):
        planted = ALL + " navigator.geolocation.getcurrentposition trademark"
        self.assertTrue(any(a in planted for a in SENSORS))
        self.assertTrue(any(c in planted for c in CONFIDENTIAL))


if __name__ == "__main__":
    unittest.main()
