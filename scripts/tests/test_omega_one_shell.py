"""omega-one-shell.js (stage 2 of docs/OMEGA_ONE_SHELL_PLAN.md): the properties that must not erode.

Static only. Behaviour (routes, back/forward, hostile hashes, link interception, missing registry, phone, reduced motion)
is measured in a real browser by scripts/shell-check.js.

NAME DISCIPLINE: `omega-shell.js` is a DIFFERENT, older module (the async loading/empty/error/retry region shell, OmegaShell.bind,
used by bg.js, sw.js, omega-a11y.js). An early draft of this module overwrote it by sharing the name. These tests pin that the
two stay separate (CLAUDE.md 8.1 class 5: a guard name is a module's identity).
"""
import re
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = (ROOT / "omega-one-shell.js").read_text(encoding="utf-8")


def code_only(src):
    """The source with block and line comments removed, so a rule about code is not tripped by prose about it."""
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    return re.sub(r"(?m)^\s*//.*$", "", src)


CODE = code_only(SRC)


class OneShellTests(unittest.TestCase):
    def test_it_is_not_the_async_region_shell(self):
        old = (ROOT / "omega-shell.js").read_text(encoding="utf-8")
        self.assertIn("ASYNC REGION SHELL", old, "omega-shell.js must still be the async region shell")
        self.assertIn("OmegaShell", old)
        self.assertNotIn("OmegaShell", CODE, "the one-shell router must not touch the OmegaShell global")
        self.assertNotRegex(CODE, r"data-omega-shell\b")
        self.assertIn("data-omega-one-shell", CODE)

    def test_no_data_ever_becomes_markup(self):
        for sink in (r"\.innerHTML", r"\.outerHTML", r"insertAdjacentHTML", r"document\.write", r"\beval\(", r"new Function"):
            self.assertIsNone(re.search(sink, CODE), "forbidden sink in omega-one-shell.js: " + sink)

    def test_route_keys_are_validated_before_use(self):
        self.assertIn("var KEY = /^[a-z0-9][a-z0-9-]{0,60}$/;", CODE)
        self.assertIn(r"/^#\/(hub|p)\/([a-z0-9-]+)$/", CODE)

    def test_hosting_is_default_deny(self):
        m = re.search(r"function hostable\(key\) \{(.*?)\n  \}", CODE, re.S) or re.search(r"function hostable\(key\) \{[^\n]*", CODE)
        self.assertIsNotNone(m)
        body = m.group(0)
        self.assertIn("e.status === 'hostable'", body)
        self.assertIn("!isHub(key)", body)
        self.assertIn("key !== selfKey", body, "the shell must never host its own page inside itself")

    def test_an_unreadable_registry_hosts_nothing(self):
        self.assertIn("/config/omega-panel-eligibility.json", CODE)
        self.assertRegex(CODE, r"\.catch\(function \(\) \{ return null; \}\)")
        self.assertIn("reg = r[2];", CODE)

    def test_it_reads_the_hub_map_it_does_not_own_one(self):
        self.assertIn("window.OmegaWorkspaces", CODE)
        self.assertNotRegex(CODE, r"'/(ascend|cosmos|vault|order|intel|govern|invest)\.html'", "no hub table may be copied here")

    def test_hosting_goes_through_the_engine_and_never_clears_its_host(self):
        self.assertIn("window.OmegaPanels.open(", CODE)
        self.assertNotRegex(CODE, r"stageHost\.textContent\s*=", "OmegaPanels keeps a reference to the stage it puts in its host")

    def test_link_interception_leaves_the_escape_hatches_alone(self):
        for needle in ("op-open", "e.metaKey", "e.ctrlKey", "u.origin !== location.origin", "u.pathname === location.pathname", "e.button !== 0"):
            self.assertIn(needle, CODE)

    def test_motion_respects_the_users_setting(self):
        self.assertIn("prefers-reduced-motion:reduce", CODE.replace(" ", ""))
        self.assertIn("animation:none", CODE.replace(" ", ""))

    def test_the_page_mounts_it_once_and_loads_it(self):
        html = (ROOT / "sovereign-core.html").read_text(encoding="utf-8")
        self.assertEqual(html.count("data-omega-one-shell"), 1)
        self.assertEqual(html.count('src="/omega-one-shell.js"'), 1)
        self.assertNotIn('src="/omega-shell.js"', html)

    def test_the_workspace_module_publishes_a_copy(self):
        src = (ROOT / "omega-single-page-workspaces.js").read_text(encoding="utf-8")
        self.assertIn("window.OmegaWorkspaces={hubs:hubs,panels:panels,label:label}", src)
        self.assertIn(".slice()", src[src.index("window.OmegaWorkspaces") - 400:src.index("window.OmegaWorkspaces")])


if __name__ == "__main__":
    unittest.main()
