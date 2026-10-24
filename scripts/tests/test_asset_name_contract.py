#!/usr/bin/env python3
"""Tests for scripts/asset-name-contract.py (blueprint point 31).

A gate that reports 0 is only meaningful if it can report 1 (CLAUDE.md 8.4),
so these plant a new generic name and require the check to fail on it, and
confirm descriptive names already used in the repo are not flagged.

Run: python3 -m unittest scripts/tests/test_asset_name_contract.py -v
"""

import importlib.util
import io
import os
import unittest
from contextlib import redirect_stdout

HERE = os.path.dirname(os.path.abspath(__file__))
SPEC = importlib.util.spec_from_file_location(
    'asset_name_contract', os.path.join(HERE, '..', 'asset-name-contract.py'))
mod = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mod)


class GenericPattern(unittest.TestCase):
    def test_generic_names_match(self):
        for name in ['IMG-20260101-WA0327.jpg', 'IMG_1234.JPG', 'img1.png', 'image1.png',
                     'DSC_0001.jpg', 'PXL_20260101_123456789.jpg', 'Screenshot 2026-10-19 at 10.00.00.png',
                     'screenshot.png', 'untitled.svg', 'image.png', '12.png', 'a3f9c0d1e2b4c5d6.webp',
                     'WhatsApp Image 2026-01-01 at 10.00.00.jpeg', 'VID_20260101.mp4']:
            self.assertTrue(mod.GENERIC.match(name), name)

    def test_descriptive_names_pass(self):
        for name in ['reel-01.mp4', 'board-01.jpg', 'icon-192.png', 'og-image.png', 'omega-signet.svg',
                     'certificate-initiate.png', 'OMEGA_DOJO_LVL2_CRASH_SIM_V1.png', 'copy-link.svg',
                     'new-member-badge.svg', 'photo-frame-gold.svg']:
            self.assertIsNone(mod.GENERIC.match(name), name)


class Ratchet(unittest.TestCase):
    def run_main(self, tracked, baseline):
        orig_t, orig_b = mod.tracked_media, mod.load_baseline
        mod.tracked_media = lambda: tracked
        mod.load_baseline = lambda: set(baseline)
        try:
            buf = io.StringIO()
            with redirect_stdout(buf):
                code = mod.main([])
            return code, buf.getvalue()
        finally:
            mod.tracked_media, mod.load_baseline = orig_t, orig_b

    def test_planted_new_generic_name_fails(self):
        code, out = self.run_main(['assets/IMG-20260101-WA0001.jpg', 'assets/IMG_9999.png'],
                                  ['assets/IMG-20260101-WA0001.jpg'])
        self.assertEqual(code, 1)
        self.assertIn('NEW generic name: assets/IMG_9999.png', out)

    def test_baselined_names_pass(self):
        code, out = self.run_main(['assets/IMG-20260101-WA0001.jpg', 'assets/omega-signet.svg'],
                                  ['assets/IMG-20260101-WA0001.jpg'])
        self.assertEqual(code, 0)
        self.assertIn('PASS', out)

    def test_removed_baseline_entry_is_info_not_failure(self):
        code, out = self.run_main([], ['assets/IMG-20260101-WA0001.jpg'])
        self.assertEqual(code, 0)
        self.assertIn('no longer present', out)

    def test_live_repo_passes(self):
        buf = io.StringIO()
        with redirect_stdout(buf):
            self.assertEqual(mod.main([]), 0)


if __name__ == '__main__':
    unittest.main()
