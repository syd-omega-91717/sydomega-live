"""omega-esc.js is the one HTML escaper (window.OmegaEsc); esc-copy-ratchet.py stops new local copies (FIXES_LOG 211)."""
import importlib.util
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[2]
RATCHET = ROOT / "scripts" / "esc-copy-ratchet.py"
NODE = shutil.which("node")


def run_helper(expr):
    """Evaluate expr with omega-esc.js loaded into a bare `window`."""
    js = ("const vm=require('vm');const src=require('fs').readFileSync(%r,'utf8');"
          "const w={};const ctx=vm.createContext({window:w});vm.runInContext(src,ctx);"
          "const O=w.OmegaEsc;console.log(JSON.stringify(%s));" % (str(ROOT / "omega-esc.js"), expr))
    return json.loads(subprocess.run([NODE, "-e", js], capture_output=True, text=True, check=True).stdout)


@unittest.skipUnless(NODE, "node not installed")
class Helper(unittest.TestCase):
    def test_esc_the_five_characters_and_nullish(self):
        self.assertEqual(run_helper("[O.esc(`<a href=\"x\" t='y'>&</a>`),O.esc(null),O.esc(undefined),O.esc(0),O.esc(12.5)]"),
                         ["&lt;a href=&quot;x&quot; t=&#39;y&#39;&gt;&amp;&lt;/a&gt;", "", "", "0", "12.5"])

    def test_esc_is_not_idempotent_by_design(self):
        self.assertEqual(run_helper("O.esc(O.esc('<'))"), "&amp;lt;")

    def test_num_refuses_strings_and_non_finite(self):
        self.assertEqual(run_helper("[O.num('12.5'),O.num('<img>'),O.num(NaN),O.num(Infinity),O.num(null),O.num('x',7),O.num(undefined)]"),
                         [12.5, 0, 0, 0, 0, 7, 0])

    def test_url_allows_only_http_and_https(self):
        self.assertEqual(run_helper("['javascript:alert(1)','JAVASCRIPT:1','data:text/html,x','//evil.test','#',null,' https://ok.test/a?b=1 ','HTTP://X.TEST'].map(O.url)"),
                         ["", "", "", "", "", "", "https://ok.test/a?b=1", "HTTP://X.TEST"])

    def test_api_is_frozen_and_a_second_load_does_not_replace_it(self):
        self.assertEqual(run_helper("[Object.isFrozen(O),O.version]"), [True, 1])
        js = ("const vm=require('vm');const src=require('fs').readFileSync(%r,'utf8');const w={OmegaEsc:{marker:1}};"
              "vm.runInContext(src,vm.createContext({window:w}));console.log(w.OmegaEsc.marker)" % str(ROOT / "omega-esc.js"))
        self.assertEqual(subprocess.run([NODE, "-e", js], capture_output=True, text=True, check=True).stdout.strip(), "1")


class Pilot(unittest.TestCase):
    PAGES = ("decisions", "targets", "budget", "signal")

    def test_pages_load_the_helper_before_their_script_and_use_the_failclosed_alias(self):
        for name in self.PAGES:
            s = (ROOT / (name + ".html")).read_text(encoding="utf-8")
            tag = s.index('<script src="/omega-esc.js"></script>')
            alias = s.index("const esc = (window.OmegaEsc && OmegaEsc.esc) || (() => '');")
            self.assertLess(tag, alias, name)
            self.assertRegex(s[tag:alias], r'^<script src="/omega-esc.js"></script>\n(?:<script[^>]*>\n)?', name)
            self.assertNotRegex(s, r"(?m)^function esc\(", name + " still has its own copy")

    def test_bg_js_does_not_inject_the_helper(self):
        # bg.js is the single point of failure and injects after page scripts start; pages load the helper directly
        self.assertNotIn("omega-esc", (ROOT / "bg.js").read_text(encoding="utf-8"))


def load_ratchet(files, baseline=None):
    spec = importlib.util.spec_from_file_location("ecr", RATCHET)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    d = tempfile.mkdtemp()
    os.makedirs(os.path.join(d, "scripts"))
    for name, body in files.items():
        with open(os.path.join(d, name), "w") as fh:
            fh.write(body)
    if baseline is not None:
        with open(os.path.join(d, "scripts", "esc-copy-baseline.json"), "w") as fh:
            json.dump(baseline, fh)
    m.ROOT = pathlib.Path(d)
    m.BASELINE = m.ROOT / "scripts" / "esc-copy-baseline.json"
    return m


COPY = "function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\"/g,'&quot;');}\n"


class CopyRatchet(unittest.TestCase):
    def test_a_full_local_escaper_is_counted(self):
        self.assertEqual(load_ratchet({}).count(COPY), 1)
        self.assertEqual(load_ratchet({}).count("const escapeHtml=(t)=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/'/g,'&#39;');"), 1)

    def test_the_shared_alias_is_not_a_copy(self):
        self.assertEqual(load_ratchet({}).count("const esc = (window.OmegaEsc && OmegaEsc.esc) || (() => '');"), 0)

    def test_a_function_not_named_like_an_escaper_is_not_counted(self):
        self.assertEqual(load_ratchet({}).count(COPY.replace("esc", "render")), 0)

    def test_a_partial_escaper_without_a_quote_is_not_counted(self):
        self.assertEqual(load_ratchet({}).count("function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}"), 0)

    def test_new_file_growth_and_shrink(self):
        self.assertEqual(load_ratchet({"a.js": COPY}, {}).main([]), 1)             # a new file must be at 0
        self.assertEqual(load_ratchet({"a.js": COPY}, {"a.js": 1}).main([]), 0)    # at baseline
        self.assertEqual(load_ratchet({"a.js": COPY + COPY}, {"a.js": 1}).main([]), 1)
        self.assertEqual(load_ratchet({"a.js": ""}, {"a.js": 1}).main([]), 0)      # migrated

    def test_the_helper_itself_is_excluded(self):
        self.assertEqual(load_ratchet({"omega-esc.js": COPY}, {}).main([]), 0)

    def test_update_never_raises_and_creates_a_missing_baseline(self):
        self.assertEqual(load_ratchet({"a.js": COPY + COPY}, {"a.js": 1}).main(["--update"]), 1)
        m = load_ratchet({"a.js": COPY})
        self.assertEqual(m.main(["--update"]), 0)
        self.assertEqual(json.loads(m.BASELINE.read_text())["a.js"], 1)

    def test_help_exits_zero(self):
        self.assertEqual(subprocess.run([sys.executable, str(RATCHET), "--help"], capture_output=True).returncode, 0)

    def test_the_real_tree_matches_its_baseline(self):
        self.assertEqual(subprocess.run([sys.executable, str(RATCHET)], capture_output=True).returncode, 0)


if __name__ == "__main__":
    unittest.main()
