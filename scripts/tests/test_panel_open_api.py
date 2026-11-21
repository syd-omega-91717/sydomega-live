"""omega-panels.js: the tab-independent view controller and the public OmegaPanels.open(url, host)
(stage 1 of docs/OMEGA_ONE_SHELL_PLAN.md; the stage 2 shell is its first caller).

Static checks only: they pin the SHAPE so a later edit cannot quietly put tab state back into the loading path or drop
a method. Behaviour (identical hubs before/after, open/replace/close, refusals) was measured in a real browser; see
docs/fixes/2026-11-21-panels-open-extract.md.
"""
import re
import unittest
from pathlib import Path

SRC = (Path(__file__).resolve().parents[2] / "omega-panels.js").read_text(encoding="utf-8")


def function_body(name):
    """Source text of a top-level (2-space indented) function in the IIFE, by brace matching."""
    start = re.search(r"\n  function %s\(" % re.escape(name), SRC)
    assert start, name + " not found"
    i = SRC.index("{", start.end())
    depth = 0
    for j in range(i, len(SRC)):
        c = SRC[j]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return SRC[start.start():j + 1]
    raise AssertionError(name + " is unbalanced")


class PanelOpenApiTests(unittest.TestCase):
    def test_public_surface(self):
        m = re.search(r"window\.OmegaPanels = \{([^}]*)\}", SRC)
        self.assertIsNotNone(m)
        names = {part.split(":")[0].strip() for part in m.group(1).split(",")}
        self.assertEqual(names, {"mount", "boot", "open", "close", "current"})

    def test_the_view_controller_is_tab_free(self):
        body = function_body("view")
        for forbidden in ("tab[", "buttons", "centerTab", "tabs."):
            self.assertNotIn(forbidden, body, "the loading path must not know about tabs: " + forbidden)

    def test_the_view_controller_exposes_open_close_current(self):
        self.assertRegex(function_body("view"), r"return \{ open: open, close: close, current: function")

    def test_tab_mounts_are_a_client_of_the_view(self):
        body = function_body("mount")
        self.assertIn("view(stage", body)
        self.assertNotIn("fetchDoc(", body, "mount() must not load pages itself any more")
        self.assertNotIn("teardown(", body, "teardown belongs to the view")

    def test_open_refuses_a_non_element_and_a_tab_mount(self):
        body = function_body("openIn")
        self.assertIn("host.nodeType !== 1", body)
        self.assertIn("host.__omegaPanels", body)
        self.assertEqual(body.count("Promise.reject"), 2)

    def test_a_load_failure_is_shown_not_thrown(self):
        body = function_body("view")
        self.assertIn(".catch(function (err)", body)
        self.assertIn("could not load here", body)
        # the catch handler must not rethrow
        self.assertNotRegex(body[body.index(".catch(function (err)"):], r"\bthrow\b")

    def test_teardown_still_runs_before_every_open_and_on_close(self):
        body = function_body("view")
        self.assertGreaterEqual(body.count("teardown(active.panel)"), 2)

    def test_the_source_url_is_validated_before_any_use(self):
        """OmegaPanels.open(url, host) is public, so the URL reaches an href: only same-origin http(s) paths pass."""
        body = function_body("view")
        self.assertIn("localPath(o.src)", body)
        self.assertNotIn("o.src", body.replace("localPath(o.src)", ""), "after the guard only the validated `src` may be used")
        helper = function_body("localPath")
        self.assertIn("u.origin !== location.origin", helper)
        self.assertIn("'http:'", helper)


if __name__ == "__main__":
    unittest.main()
