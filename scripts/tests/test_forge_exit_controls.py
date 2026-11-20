"""Regression coverage for the Forge exercise exit controls.

The generated exercise markup is embedded in forge.html script strings, so a
normal HTML parser does not inspect those button templates. This source-level
contract catches duplicate class attributes before they ship: browsers discard
the duplicate attribute, which made .exitBtn lookups return null.
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "forge.html"


def button_tags(source):
    return re.findall(r"<button\\b[^>]*>", source, flags=re.IGNORECASE | re.DOTALL)


class ForgeExitControlContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = SOURCE.read_text(encoding="utf-8")
        cls.buttons = button_tags(cls.source)

    def test_each_button_has_at_most_one_class_attribute(self):
        duplicates = [
            tag for tag in self.buttons
            if len(re.findall(r"\\bclass\\s*=", tag, flags=re.IGNORECASE)) > 1
        ]
        self.assertEqual(
            duplicates, [],
            "button templates must use one class attribute; combine class tokens",
        )

    def test_every_exit_button_is_discoverable_and_has_one_listener(self):
        exit_buttons = [
            tag for tag in self.buttons
            if re.search(
                r"""\\bclass\\s*=\\s*["'][^"']*\\bexitBtn\\b[^"']*["']""",
                tag,
                flags=re.IGNORECASE,
            )
        ]
        exit_bindings = len(re.findall(
            r"""querySelector\\(\\s*['"]\\.exitBtn['"]\\s*\\)\\s*\\.addEventListener""",
            self.source,
        ))
        self.assertGreater(exit_bindings, 0, "expected at least one exit binding")
        self.assertEqual(
            len(exit_buttons), exit_bindings,
            "each generated exit button must have one matching event binding",
        )


if __name__ == "__main__":
    unittest.main()
