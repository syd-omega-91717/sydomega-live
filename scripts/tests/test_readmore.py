#!/usr/bin/env python3
"""
omega-readmore.js folds long paragraphs to two lines behind a MORE toggle on
every page (injected by bg.js). Legal and consent text must never be folded:
hiding part of terms or a privacy notice is not a presentation choice. These
tests pin the exclusions and the injection so an edit cannot quietly drop them.

Run: python3 -m unittest scripts/tests/test_readmore.py -v
"""

import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def read(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        return f.read()


class ReadMoreContract(unittest.TestCase):
    def test_legal_and_chat_pages_are_excluded(self):
        src = read("omega-readmore.js")
        m = re.search(r"var SKIP_PAGES = \{([^}]*)\}", src)
        self.assertIsNotNone(m, "SKIP_PAGES not found")
        skipped = set(re.findall(r"'?([a-z-]+)'?\s*:\s*1", m.group(1)))
        for page in ("terms", "privacy", "sovereign-covenant", "charter", "chatbot"):
            self.assertIn(page, skipped, "%s must never be folded" % page)
            self.assertTrue(os.path.exists(os.path.join(ROOT, page + ".html")),
                            "%s.html no longer exists; update SKIP_PAGES" % page)

    def test_forms_and_controls_are_never_folded(self):
        src = read("omega-readmore.js")
        for sel in ("form", "table", "dialog", "[data-no-clamp]"):
            self.assertIn(sel, src)
        self.assertIn("button,input,select,textarea,img,svg,canvas,video,iframe", src)

    def test_bg_injects_it_once(self):
        bg = read("bg.js")
        self.assertIn("script[data-omega-readmore]", bg)
        self.assertEqual(bg.count("_orm.src='/omega-readmore.js'"), 1)

    def test_toggle_labels_exist_in_every_language(self):
        import json
        self.assertIn('"ui_read_more"', read("i18n.js"))
        for lang in ("ar", "es", "fr", "hi", "nl", "zh"):
            pack = json.loads(read(os.path.join("i18n", lang + ".json")))
            self.assertIn("ui_read_more", pack)
            self.assertIn("ui_read_less", pack)


if __name__ == "__main__":
    unittest.main()
