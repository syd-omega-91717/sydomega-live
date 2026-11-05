"""Page-wide observers run once per frame, and bottom-stack keeps ONE ResizeObserver.

Measured 2026-11-05 on an idle journal.html (nothing happening): omega-bottom-stack.js created ~58 new
ResizeObservers and ~170 getComputedStyle calls a second for as long as the page was open, because measure()
rebuilt its observer every time and a new ResizeObserver reports each element immediately, which called
schedule(), which ran measure() again. Three other observers ran a whole-page querySelectorAll on every
mutation batch. These tests pin the shape of the fixes; the numbers are in the fix entry.
"""
import pathlib
import re
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]


def read(name):
    return (ROOT / name).read_text(encoding="utf-8")


class BottomStack(unittest.TestCase):
    def body(self):
        src = read("omega-bottom-stack.js")
        m = re.search(r"function observeChrome\(els, trans\) \{.*?\n  \}\n", src, re.S)
        self.assertIsNotNone(m, "observeChrome is missing")
        return re.sub(r"/\*.*?\*/", "", m.group(0), flags=re.S)  # code only: the comment explains the old loop

    def test_one_observer_for_the_life_of_the_page(self):
        body = self.body()
        self.assertIn("if (!_ro) _ro = new ResizeObserver(schedule);", body)
        self.assertNotIn("disconnect()", body, "rebuilding the observer re-fires it for every element: an endless loop")
        self.assertEqual(body.count("new ResizeObserver"), 1)

    def test_only_the_watched_set_changes(self):
        body = self.body()
        self.assertIn("_ro.unobserve(", body)
        self.assertIn("_ro.observe(", body)
        self.assertIn("_obs = want;", body)


class OncePerFrame(unittest.TestCase):
    def test_heading_signs(self):
        src = read("omega-content.js")
        self.assertIn("new MutationObserver(signSoon)", src)
        self.assertNotIn("new MutationObserver(sign)", src)

    def test_holo(self):
        src = read("omega-9d.js")
        self.assertIn("new MutationObserver(holoSoon)", src)
        self.assertNotIn("new MutationObserver(function () { holo(); })", src)

    def test_password_reveal_scan(self):
        src = read("bg.js")
        self.assertIn("new MutationObserver(scanSoon)", src)
        self.assertNotIn("new MutationObserver(scan).observe(document.documentElement", src)


if __name__ == "__main__":
    unittest.main()
