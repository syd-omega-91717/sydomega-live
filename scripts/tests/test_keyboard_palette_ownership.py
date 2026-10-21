#!/usr/bin/env python3
"""Regression contract for the global navigation palette and keyboard ownership."""

from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[2]


class CommandPaletteOwnershipContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.keyboard = (ROOT / "omega-keyboard.js").read_text(encoding="utf-8")
        cls.nav = (ROOT / "nav.js").read_text(encoding="utf-8")

    def test_navigation_palette_is_the_primary_ctrl_k_owner(self):
        guard = "if(document.getElementById('omega-command-palette') || window.OmegaCommandPalette) return;"
        self.assertIn(guard, self.keyboard)
        self.assertLess(self.keyboard.index(guard), self.keyboard.index("window.OmegaSearch.open()"))
        self.assertIn("document.addEventListener('keydown',function(e){\n      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}", self.nav)

    def test_palette_exposes_combobox_and_active_option_state(self):
        self.assertIn("input.setAttribute('role','combobox')", self.nav)
        self.assertIn("input.setAttribute('aria-controls','omega-command-palette-list')", self.nav)
        self.assertIn("input.setAttribute('aria-expanded','true')", self.nav)
        self.assertIn("input.setAttribute('aria-activedescendant','omega-command-option-'+active)", self.nav)
        self.assertIn("row.id='omega-command-option-'+i", self.nav)
        self.assertIn("input.removeAttribute('aria-activedescendant')", self.nav)
        self.assertIn("row.addEventListener('mouseenter',function(){setActive(i);});", self.nav)
        self.assertNotIn("row.addEventListener('mouseenter',function(){active=i;render(input.value);});", self.nav)

    def test_keyboard_help_matches_the_primary_command(self):
        self.assertIn("desc:'Open quick navigation'", self.keyboard)
        self.assertIn("Ctrl+K → Quick navigation", self.keyboard)


if __name__ == "__main__":
    unittest.main()
