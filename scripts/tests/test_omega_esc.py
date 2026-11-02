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

    def test_bg_js_does_not_inject_the_helper_file(self):
        # An injected script runs in no fixed order, so injecting the file cannot guarantee it exists before a module
        # looks it up. bg.js defines the helper inline instead (BootstrapParity); pages that want it earlier still
        # load it with a plain <script> tag.
        s = (ROOT / "bg.js").read_text(encoding="utf-8")
        self.assertNotRegex(s, r"""\.src\s*=\s*['"]/omega-esc\.js""")


def bootstrap_source():
    s = (ROOT / "bg.js").read_text(encoding="utf-8")
    m = re.search(r"/\* omega-esc-bootstrap:begin \*/\n(.*?)/\* omega-esc-bootstrap:end \*/", s, re.S)
    assert m, "bg.js lost its omega-esc bootstrap markers"
    return s, m.group(1)


def canonical_source():
    s = (ROOT / "omega-esc.js").read_text(encoding="utf-8")
    return s[s.index("(function () {"):].rstrip() + "\n"


def run_source(src, expr):
    js = ("const vm=require('vm');const ctx=vm.createContext({});vm.runInContext('this.window=this',ctx);"
          "vm.runInContext(%s,ctx);const O=ctx.OmegaEsc;console.log(JSON.stringify(%s));" % (json.dumps(src), expr))
    return json.loads(subprocess.run([NODE, "-e", js], capture_output=True, text=True, check=True).stdout)


@unittest.skipUnless(NODE, "node not installed")
class BootstrapParity(unittest.TestCase):
    """bg.js carries a verbatim second copy of omega-esc.js so window.OmegaEsc exists before ANY module runs (a module
    may execute before an injected file, so call-time lookup alone is not enough). That is the one allowed duplicate;
    this is what keeps it from drifting."""

    BATTERY = ("[O.esc(`<a href=\"x\" t='y'>&</a>`),O.esc(null),O.esc(undefined),O.esc(0),O.esc(12.5),O.esc('&amp;'),"
               "O.num('7.5'),O.num('x'),O.num(null),O.num(undefined,9),O.url(' https://ok.test/a '),O.url('javascript:alert(1)'),"
               "O.url('//evil.test'),O.url(null),O.version,Object.isFrozen(O),Object.keys(O).sort()]")

    def test_the_source_is_identical(self):
        _, boot = bootstrap_source()
        norm = lambda t: re.sub(r"\s+", " ", t).strip()
        self.assertEqual(norm(boot), norm(canonical_source()))

    def test_the_behaviour_is_identical(self):
        _, boot = bootstrap_source()
        self.assertEqual(run_source(boot, self.BATTERY), run_source(canonical_source(), self.BATTERY))

    def test_it_sits_after_the_fetch_recorder_and_before_any_injection(self):
        s, _ = bootstrap_source()
        a, b, c = s.index("DATA-FETCH RECORDER"), s.index("omega-esc-bootstrap:begin"), s.index("function __omegaAppend(el){")
        self.assertLess(a, b)
        self.assertLess(b, c)
        self.assertEqual(s.count("omega-esc-bootstrap:begin"), 1)

    def test_a_page_that_loads_omega_esc_first_is_unaffected(self):
        # the helper file guards with `if (window.OmegaEsc) return;`, so whichever copy ran first wins and they match
        _, boot = bootstrap_source()
        both = boot + "\n" + canonical_source()
        self.assertEqual(run_source(both, self.BATTERY), run_source(canonical_source(), self.BATTERY))


class ModulesLookItUpAtCallTime(unittest.TestCase):
    """A module can run before omega-esc.js has executed. Binding the helper once at load would lock in the blank
    fail-closed fallback for the life of the page (the page alias is fine: pages load the file with a plain tag)."""

    BIND_AT_LOAD = re.compile(r"(?:const|let|var)\s+[A-Za-z_$][\w$]*\s*=\s*\(?\s*window\.OmegaEsc\s*&&\s*OmegaEsc\.esc\s*\)?\s*\|\|")

    def test_no_root_module_binds_the_helper_at_load(self):
        for p in sorted(ROOT.glob("*.js")):
            if p.name in ("omega-esc.js", "bg.js", "sw.js"):
                continue
            self.assertNotRegex(p.read_text(encoding="utf-8", errors="ignore"), self.BIND_AT_LOAD,
                                p.name + " binds window.OmegaEsc once at load; look it up at call time")

    def test_the_wrapper_fails_closed_and_follows_the_helper_once_it_arrives(self):
        wrap = "function esc(v) { return window.OmegaEsc ? OmegaEsc.esc(v) : ''; }"
        js = ("const vm=require('vm');const ctx=vm.createContext({});vm.runInContext('this.window=this',ctx);"
              "vm.runInContext(%s,ctx);const before=vm.runInContext(\"esc('<b>')\",ctx);"
              "vm.runInContext(%s,ctx);const after=vm.runInContext(\"esc('<b>')\",ctx);"
              "console.log(JSON.stringify([before,after]));") % (json.dumps(wrap), json.dumps(canonical_source()))
        if NODE:
            out = json.loads(subprocess.run([NODE, "-e", js], capture_output=True, text=True, check=True).stdout)
            self.assertEqual(out, ["", "&lt;b&gt;"])


class EveryAdopter(unittest.TestCase):
    """Every page that loads the shared helper must load it once, before the script that binds the alias, and must not
    keep a local copy (50 pages were migrated in bulk; this is what keeps a bad edit from slipping in)."""

    def pages(self):
        return [p for p in sorted(ROOT.glob("*.html")) if "/omega-esc.js" in p.read_text(encoding="utf-8", errors="ignore")]

    def test_a_meaningful_number_of_pages_adopted_it(self):
        self.assertGreaterEqual(len(self.pages()), 50)

    def test_loaded_once_before_the_alias_and_no_local_copy(self):
        # The local name may differ (escH, escHtml, escapeHTML, escOFF keep their names so no call site changes), and a
        # page whose helper lived in two script blocks binds it once per block (`var`, so redeclaring is legal).
        alias = re.compile(r"(?:const|var) [A-Za-z_$][\w$]* = \(window\.OmegaEsc && OmegaEsc\.esc\) \|\|")
        block = re.compile(r"<script(?:\s[^>]*)?>(.*?)</script\s*>", re.S | re.I)
        for p in self.pages():
            s = p.read_text(encoding="utf-8")
            self.assertEqual(s.count('<script src="/omega-esc.js"></script>'), 1, p.name)
            tag, m = s.index('<script src="/omega-esc.js"></script>'), alias.search(s)
            if m is None:
                # loads the helper only so a root module it hosts finds it (modules look it up at call time, and a
                # module tag can run before bg.js): the module tag must come AFTER the helper
                self.assertRegex(s[tag:], r'<script\b[^>]*\bsrc="/(?:omega-[\w-]+|approvals|platform-kernel-runtime)\.js"',
                                 p.name + " loads the helper but neither binds it nor hosts a module that uses it")
            else:
                self.assertLess(tag, m.start(), p.name)
            self.assertNotRegex(s, r"(?m)^\s*function esc\s*\(", p.name + " still has a local copy")
            for b in block.finditer(s):
                self.assertLessEqual(len(alias.findall(b.group(1))), 1, p.name + ": one block binds it twice")

    def test_the_alias_fails_closed_never_open(self):
        for p in self.pages():
            s = p.read_text(encoding="utf-8")
            if not re.search(r"OmegaEsc && OmegaEsc\.esc\) \|\|", s):
                continue            # a module host: the module's own call-time wrapper fails closed (tested separately)
            self.assertTrue("|| (() => '');" in s or "|| (function () { return ''; });" in s, p.name)


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

    def test_a_short_wrapper_above_a_different_sanitiser_is_not_a_copy(self):
        # omega-emblems.js: esc() is a call-time wrapper and glyphText() directly below it escapes. The old
        # 'next 300 characters' window read the neighbour and counted the wrapper as a copy.
        src = ("function esc(v) { return window.OmegaEsc ? OmegaEsc.esc(v) : ''; }\n"
               "function glyphText(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/\"/g,'&quot;');}\n")
        self.assertEqual(load_ratchet({}).count(src), 0)
        # and a real copy followed by something else is still found
        self.assertEqual(load_ratchet({}).count(COPY + "function other(){return 1;}\n"), 1)

    def test_bg_js_may_carry_exactly_one_bootstrap_copy(self):
        self.assertEqual(load_ratchet({"bg.js": COPY}, {}).main([]), 0)              # the allowed one
        self.assertEqual(load_ratchet({"bg.js": COPY + COPY}, {}).main([]), 1)       # a second is not
        self.assertEqual(load_ratchet({"other.js": COPY}, {}).main([]), 1)           # nobody else gets one

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
