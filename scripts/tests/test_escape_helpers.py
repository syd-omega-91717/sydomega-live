#!/usr/bin/env python3
"""
Behavioural contract for every page-local HTML escape helper.

Pages build markup as strings and pass member data through a local
`esc()`/`escHtml()`/`escapeHtml()` before it reaches `.innerHTML`. Those
helpers had drifted into ~10 shapes: most left `"` and `'` raw (an attribute
break-out wherever the result lands in `value="..."`/`data-*="..."`), the
`(s||'')` forms threw a TypeError on any non-zero number, and two were identity
functions that escaped nothing while still being named `esc`.

A regex over the source cannot tell those apart, so this test extracts every
helper definition and *executes* it in Node against the five HTML-significant
characters. It fails if any helper leaves one raw, throws on a number, or
renders null/undefined as text.

Run: python3 -m unittest scripts/tests/test_escape_helpers.py -v
"""

import glob
import json
import os
import re
import shutil
import subprocess
import unittest

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
HEAD = re.compile(r"function\s+(esc|escHtml|escapeHtml)\s*\(\s*(\w+)\s*\)\s*\{")


def extract_helpers():
    """Yield (file, line, source) for every escape-helper definition."""
    files = sorted(glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "*.js")))
    for path in files:
        with open(path, encoding="utf-8", errors="ignore") as fh:
            src = fh.read()
        for m in HEAD.finditer(src):
            i, depth = m.end(), 1
            while i < len(src) and depth:
                depth += {"{": 1, "}": -1}.get(src[i], 0)
                i += 1
            body = src[m.start():i]
            # `function esc(e){...}` passed to addEventListener('keydown', ...) is
            # an Escape-key handler that happens to share the name, not an escaper.
            if "keydown" in src[max(0, m.start() - 40):m.start()]:
                continue
            yield os.path.basename(path), src.count("\n", 0, m.start()) + 1, m.group(1), body


PROBE = r"""
const helpers = JSON.parse(require('fs').readFileSync(0, 'utf8'));
const out = [];
for (const [file, line, name, body] of helpers) {
  const where = file + ':' + line;
  let fn;
  try { fn = new Function(body + '\nreturn ' + name + ';')(); }
  catch (e) { out.push(where + ' does not evaluate: ' + e.message); continue; }
  try {
    const r = String(fn('<b a="1" b=\'2\'>&</b>'));
    for (const ch of ['<', '>', '"', "'"]) if (r.includes(ch)) out.push(where + ' leaves ' + ch + ' raw: ' + r);
    if (/&(?!amp;|lt;|gt;|quot;|#39;|#x27;)/.test(r)) out.push(where + ' leaves & raw: ' + r);
  } catch (e) { out.push(where + ' throws on a string: ' + e.message); }
  try { if (String(fn(42)) !== '42') out.push(where + ' mangles a number: ' + fn(42)); }
  catch (e) { out.push(where + ' throws on a number: ' + e.message); }
  for (const v of [null, undefined]) {
    try { const r = String(fn(v)); if (r === 'null' || r === 'undefined') out.push(where + ' renders ' + r); }
    catch (e) { out.push(where + ' throws on ' + v + ': ' + e.message); }
  }
}
process.stdout.write(JSON.stringify(out));
"""


@unittest.skipUnless(shutil.which("node"), "node is required to execute the helpers")
class EscapeHelperContract(unittest.TestCase):
    def run_probe(self, helpers):
        res = subprocess.run(["node", "-e", PROBE], input=json.dumps(helpers),
                             capture_output=True, text=True, check=True)
        return json.loads(res.stdout)

    def test_every_helper_escapes_all_five_characters(self):
        helpers = list(extract_helpers())
        # Guard against a broken extractor reporting a vacuous pass.
        self.assertGreater(len(helpers), 40, "extractor found too few helpers")
        self.assertEqual(self.run_probe(helpers), [])

    def test_probe_catches_known_bad_shapes(self):
        bad = [
            ["planted.html", 1, "esc", "function esc(s){return(s==null?'':String(s));}"],
            ["planted.html", 2, "esc", "function esc(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}"],
        ]
        found = self.run_probe(bad)
        self.assertTrue(any("planted.html:1 leaves <" in f for f in found), found)
        self.assertTrue(any("planted.html:2 leaves \" raw" in f for f in found), found)
        self.assertTrue(any("planted.html:2 throws on a number" in f for f in found), found)


if __name__ == "__main__":
    unittest.main()
