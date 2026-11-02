"""Four pages put stored or third-party values into HTML unescaped (FIXES_LOG 209). Reproduced in a browser first:
injected script ran on all four. These source contracts fail if a fixed value goes back to a raw interpolation, or
an id/URL goes back into an inline handler's JS string, where no HTML escaping can protect it."""
from pathlib import Path
import re
import shutil
import subprocess
import unittest

ROOT = Path(__file__).resolve().parents[2]


def src(name):
    return (ROOT / name).read_text(encoding="utf-8")


class Decisions(unittest.TestCase):
    S = src("decisions.html")

    def test_status_date_urgency_are_escaped(self):
        self.assertIn("esc(String(d.status||'DRAFT').toUpperCase())", self.S)
        self.assertIn("esc(d.decidedAt||'DRAFT')", self.S)
        self.assertIn("esc(String(d.urgency||'').toUpperCase())", self.S)

    def test_id_is_never_inside_an_inline_handler(self):
        self.assertNotRegex(self.S, r"on(click|change)=\"[^\"]*\$\{d\.id\}")
        self.assertEqual(len(re.findall(r'data-id="\$\{esc\(d\.id\)\}"', self.S)), 3)

    def test_delegation_calls_the_three_actions(self):
        for act in ("edit", "outcome", "del"):
            self.assertIn('data-dec-act="%s"' % act, self.S)
        self.assertIn("e.target.closest('[data-dec-act]')", self.S)


class Targets(unittest.TestCase):
    S = src("targets.html")

    def test_stored_text_is_escaped(self):
        for expr in ("esc(obj.title)", "esc(obj.desc)", "esc(kr.title)", "esc(kr.unit)", "esc(kr.start)",
                     "esc(kr.current)", "esc(kr.target)", "esc(String(obj.cat).toUpperCase())"):
            self.assertIn(expr, self.S, expr)

    def test_no_raw_stored_field_in_the_objective_template(self):
        for raw in ("${obj.title}", "${obj.desc}", "${kr.title}", "${kr.unit}", "${kr.start}", "${kr.current}",
                    "${kr.target}", "${obj.cat.toUpperCase()}", "${obj.title.slice"):
            self.assertNotIn(raw, self.S, raw)


class Breath(unittest.TestCase):
    S = src("breath.html")

    def test_loadlogs_coerces_every_field(self):
        m = re.search(r"function loadLogs\(\)\{.*?\n\}", self.S, re.S)
        self.assertIsNotNone(m)
        body = m.group(0)
        for piece in ("Array.isArray", "Number(l.cycles)||0", "Number(l.duration)||0", "String(l.technique"):
            self.assertIn(piece, body, piece)

    def test_log_card_is_built_with_text_content(self):
        self.assertIn("nm.textContent=l.technique", self.S)
        self.assertNotIn("'+l.technique+'", self.S)


class Signal(unittest.TestCase):
    S = src("signal.html")

    def test_no_inline_window_open(self):
        self.assertNotRegex(self.S, r"window\.open\(\\'")
        self.assertEqual(len(re.findall(r'data-open-url="', self.S)), 4)

    def test_open_goes_through_one_delegated_handler_with_noopener(self):
        self.assertIn("window.open(u,'_blank','noopener,noreferrer')", self.S)

    @unittest.skipUnless(shutil.which("node"), "node not installed")
    def test_safe_http_url_refuses_other_schemes(self):
        fn = re.search(r"function safeHttpUrl\(u\)\{.*\}", self.S).group(0)
        js = fn + ";console.log(JSON.stringify([safeHttpUrl('javascript:alert(1)'),safeHttpUrl('JAVASCRIPT:1')," \
                  "safeHttpUrl('data:text/html,x'),safeHttpUrl('//evil.test'),safeHttpUrl(null),safeHttpUrl('#')," \
                  "safeHttpUrl(' https://ok.test/a?b=1 '),safeHttpUrl(\"http://x.test/a');b\")]))"
        out = subprocess.run(["node", "-e", js], capture_output=True, text=True, check=True).stdout
        self.assertEqual(out.strip(), '["","","","","","","https://ok.test/a?b=1","http://x.test/a\');b"]')


if __name__ == "__main__":
    unittest.main()
