"""Hub module pickers are plain links, never iframes (production forbids framing).

vercel.json sends X-Frame-Options: DENY and frame-ancestors 'none' on every
path, so an <iframe> of any page is blocked in the browser (reproduced in
headless Chromium with the exact header set). This pins the picker as links,
keeps the documenting JSON equal to the loaded list, and keeps every module a
real page in exactly one hub (except the lattice pages the owner chose to keep
in two, 2026-10-19).
"""
import json
import os
import re
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
JS = open(os.path.join(ROOT, "omega-single-page-workspaces.js"), encoding="utf-8").read()
CFG = json.load(open(os.path.join(ROOT, "config", "omega-single-page-workspaces.json"), encoding="utf-8"))
WS = CFG.get("workspaces", CFG)
LATTICE_IN_TWO = {"levels", "phases", "ascension", "domain-mastery"}


def code(s):
    s = re.sub(r"/\*.*?\*/", "", s, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", s)


def js_lists():
    return {m.group(1): re.findall(r"'([^']+)'", m.group(2))
            for m in re.finditer(r"'(/[a-z-]+\.html)':\[([^\]]*)\]", JS)}


class HubPickerLinks(unittest.TestCase):
    def test_no_frame_or_dialog(self):
        c = code(JS)
        for bad in ("iframe", "createElement('dialog')", "showModal"):
            self.assertNotIn(bad, c, bad)

    def test_chips_are_anchors(self):
        self.assertIn("createElement('a')", code(JS))
        self.assertIn("a.href=route(k)", code(JS))

    def test_legacy_module_hash_redirects(self):
        self.assertIn("location.replace(route(", code(JS))

    def test_json_matches_loaded_lists(self):
        lists = js_lists()
        self.assertEqual(len(lists), len(WS))
        for key, v in WS.items():
            self.assertEqual(lists[v["canonical"]], v["capabilities"], key)

    def test_every_module_is_a_page_in_one_hub(self):
        seen = {}
        for path, mods in js_lists().items():
            for m in mods:
                self.assertTrue(os.path.exists(os.path.join(ROOT, m + ".html")), m)
                seen.setdefault(m, []).append(path)
        dup = {m: h for m, h in seen.items() if len(h) > 1 and m not in LATTICE_IN_TWO}
        self.assertEqual(dup, {}, "module listed in two hubs")


if __name__ == "__main__":
    unittest.main()
