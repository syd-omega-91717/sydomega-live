"""Attribute translation (title, aria-label, placeholder, tooltip) in the i18n engine.

Before: apply() in i18n.js reached element text, input placeholders and image alt only. profile.html carried data-i18n-placeholder on two fields while
nothing read it (no script, and neither key existed in any dictionary), so both placeholders stayed English in every language, and a tooltip had no way to be
translated at all. Now four hooks name the attribute to write, the dictionary text is written in every language including English (so switching back
restores it), and scripts/i18n-contract.py (check E) keeps the authored English equal to T_EN.
Render proof (Arabic, Chinese, and en -> fr -> en with the page open): docs/fixes/2026-11-15-translate-attributes.md.
"""
import importlib.util
import json
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
JS = (ROOT / "i18n.js").read_text(encoding="utf-8")
_spec = importlib.util.spec_from_file_location("i18n_contract", ROOT / "scripts" / "i18n-contract.py")
C = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(C)

HOOKED = ["tip_auth", "tip_gate", "tip_element", "profile_placeholder_character_name", "profile_placeholder_legacy_statement"]


class AttributeTranslation(unittest.TestCase):
    def test_engine_implements_all_four_hooks_and_updates_a_mounted_tooltip(self):
        for hook, target in (("data-i18n-placeholder", "placeholder"), ("data-i18n-title", "title"),
                             ("data-i18n-aria-label", "aria-label"), ("data-i18n-tooltip", "data-tooltip")):
            self.assertIn("['%s','%s']" % (hook, target), JS, hook)
        self.assertIn("_tippy.setContent", JS)

    def test_every_page_hook_resolves_and_its_english_equals_the_dictionary(self):
        en = C.load_t_en()
        refs = C.markup_hook_refs()
        self.assertGreaterEqual(len(refs), 5, "found almost no hooks: the check would pass on nothing")
        problems = [p for _page, hook, key, authored in refs for p in C.hook_problems([(hook, key, authored)], en)]
        self.assertEqual(problems, [])

    def test_hooked_keys_exist_in_every_language_pack(self):
        for pack in sorted((ROOT / "i18n").glob("*.json")):
            d = json.loads(pack.read_text(encoding="utf-8"))
            missing = [k for k in HOOKED if not d.get(k)]
            self.assertEqual(missing, [], pack.name)

    def test_the_check_can_fail(self):
        """Zero problems only counts if a missing key and a drifted English string are seen."""
        en = {"k1": "Hello"}
        self.assertEqual(C.hook_problems(C.hook_refs('<input data-i18n-placeholder="k1" placeholder="Hello">'), en), [])
        self.assertTrue(C.hook_problems(C.hook_refs('<input data-i18n-placeholder="nope" placeholder="x">'), en))      # no T_EN entry
        self.assertTrue(C.hook_problems(C.hook_refs('<input data-i18n-placeholder="k1" placeholder="Hello!">'), en))   # English drifted
        self.assertTrue(C.hook_problems(C.hook_refs('<div data-tooltip="Bye" data-i18n-tooltip="k1">'), en))
        # a runtime-built key is skipped, not guessed at
        self.assertEqual(C.hook_refs('<a data-i18n-title="a+b" title="x">'), [])
        # the target attribute is not confused with the hook's own name (data-i18n-title contains "title")
        self.assertEqual(C.hook_refs('<a data-i18n-title="k1">'), [("title", "k1", None)])


if __name__ == "__main__":
    unittest.main()
