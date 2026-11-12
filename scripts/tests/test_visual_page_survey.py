#!/usr/bin/env python3
"""Regression tests for the visual page survey's visibility and identity rules."""
from __future__ import annotations

import importlib.util
import tempfile
import unittest
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SCRIPT = REPO_ROOT / "scripts" / "visual-page-survey.py"
SPEC = importlib.util.spec_from_file_location("visual_page_survey", SCRIPT)
assert SPEC and SPEC.loader
survey = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(survey)


class VisualPageSurveyTests(unittest.TestCase):
    def test_hidden_inline_and_inactive_tab_content_is_excluded(self) -> None:
        html = """
        <div style="display: none">HIDDEN INLINE</div>
        <div class="tab-panel">HIDDEN TAB</div>
        <div class="tab-panel active">VISIBLE TAB</div>
        <div aria-hidden="true">HIDDEN ARIA</div>
        <div hidden>HIDDEN ATTRIBUTE</div>
        <p>VISIBLE BODY</p>
        """
        visible = survey.clean(html).lower()
        self.assertIn("visible tab", visible)
        self.assertIn("visible body", visible)
        for hidden in ("hidden inline", "hidden tab", "hidden aria", "hidden attribute"):
            self.assertNotIn(hidden, visible)

    def test_first_visible_h1_is_selected_not_a_hidden_h1(self) -> None:
        html = """
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Test page</title></head><body>
        <div style="display:none"><h1>Hidden heading</h1></div>
        <h1>Visible heading</h1>
        </body></html>
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            page = root / "nested" / "test.html"
            page.parent.mkdir(parents=True)
            page.write_text(html, encoding="utf-8")
            original_root = survey.ROOT
            try:
                survey.ROOT = root
                result = survey.scan(page)
            finally:
                survey.ROOT = original_root
        self.assertEqual(result["h1"], "Visible heading")

    def test_survey_records_a_unique_relative_path_and_keeps_basename(self) -> None:
        html = """
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Dashboard</title></head><body><h1>Dashboard</h1></body></html>
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            page = root / "root" / "dashboard.html"
            page.parent.mkdir(parents=True)
            page.write_text(html, encoding="utf-8")
            original_root = survey.ROOT
            try:
                survey.ROOT = root
                result = survey.scan(page)
            finally:
                survey.ROOT = original_root
        self.assertEqual(result["page"], "dashboard.html")
        self.assertEqual(result["path"], "root/dashboard.html")

    def test_button_tags_and_styled_non_button_actions_are_counted_once(self) -> None:
        html = """
        <html><head><meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Actions</title></head><body>
        <button class="btn">Submit</button>
        <a class="btn-primary" href="/next.html">Continue</a>
        <p class="button-label">Not an action</p>
        </body></html>
        """
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            page = root / "actions.html"
            page.write_text(html, encoding="utf-8")
            original_root = survey.ROOT
            try:
                survey.ROOT = root
                result = survey.scan(page)
            finally:
                survey.ROOT = original_root
        self.assertEqual(result["buttons"], 2)


if __name__ == "__main__":
    unittest.main()
