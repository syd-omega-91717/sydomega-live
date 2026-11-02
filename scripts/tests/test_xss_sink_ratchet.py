#!/usr/bin/env python3
"""xss-sink-ratchet must catch the shapes that caused FIXES_LOG 204a, and only those."""
import importlib.util
import json
import os
import pathlib
import subprocess
import sys
import tempfile
import unittest

SRC = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'xss-sink-ratchet.py')


def load(files, baseline=None):
    spec = importlib.util.spec_from_file_location('xsr', SRC)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    d = tempfile.mkdtemp()
    os.makedirs(os.path.join(d, 'scripts'))
    for name, body in files.items():
        with open(os.path.join(d, name), 'w') as fh:
            fh.write(body)
    if baseline is not None:
        with open(os.path.join(d, 'scripts', 'xss-sink-baseline.json'), 'w') as fh:
            json.dump(baseline, fh)
    m.ROOT = pathlib.Path(d)
    m.BASELINE = m.ROOT / 'scripts' / 'xss-sink-baseline.json'
    return m


def n(js):
    return len(load({'a.js': js}).scan(js)[0])


ESC = "function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}\n"
BAD = "el.innerHTML='<b>'+x+'</b>';"


class T(unittest.TestCase):
    def test_concat_is_counted(self):
        self.assertEqual(n(BAD), 1)

    def test_template_is_counted(self):
        self.assertEqual(n("el.innerHTML=`<b>${x}</b>`;"), 1)

    def test_escape_helper_defined_in_file_is_trusted(self):
        self.assertEqual(n(ESC + "el.innerHTML='<b>'+esc(x)+'</b>';"), 0)

    def test_name_alone_is_not_trusted(self):
        # `h` here is a height, not an escaper; its body does no escaping
        self.assertEqual(n("function h(v){return v*2;}\nel.innerHTML='<b>'+h(x)+'</b>';"), 1)

    def test_partial_escape_is_not_a_whole_call(self):
        self.assertEqual(n(ESC + "el.innerHTML='<b>'+esc(x)+y+'</b>';"), 1)

    def test_map_callback_is_inspected(self):
        bad = "el.innerHTML=rows.map(function(r){return '<td>'+r.name+'</td>';}).join('');"
        good = ESC + "el.innerHTML=rows.map(function(r){return '<td>'+esc(r.name)+'</td>';}).join('');"
        self.assertEqual(n(bad), 1)
        self.assertEqual(n(good), 0)

    def test_arrow_with_nested_template(self):
        self.assertEqual(n("el.innerHTML=rows.map(r=>`<li>${r.t}</li>`).join('');"), 1)
        self.assertEqual(n(ESC + "el.innerHTML=rows.map(r=>`<li>${esc(r.t)}</li>`).join('');"), 0)

    def test_bare_variable_is_judged_by_how_it_was_built(self):
        self.assertEqual(n("var html='';\nhtml+='<b>'+x+'</b>';\nel.innerHTML=html;"), 1)
        self.assertEqual(n(ESC + "var html='';\nhtml+='<b>'+esc(x)+'</b>';\nel.innerHTML=html;"), 0)

    def test_unknown_bare_variable_is_counted(self):
        self.assertEqual(n("function f(html){el.innerHTML=html;}"), 1)

    def test_literals_numbers_and_literal_ternaries_are_safe(self):
        self.assertEqual(n("el.innerHTML='<b>'+rows.length+'</b>'+(ok?'yes':'no')+Math.round(v);"), 0)
        self.assertEqual(n("el.innerHTML='<b>static</b>';"), 0)

    def test_other_sinks(self):
        self.assertEqual(n("el.insertAdjacentHTML('beforeend','<i>'+x+'</i>');"), 1)
        self.assertEqual(n("el.outerHTML='<i>'+x+'</i>';"), 1)
        self.assertEqual(n("document.write('<i>'+x+'</i>');"), 1)

    def test_text_content_is_not_a_sink(self):
        self.assertEqual(n("el.textContent='<i>'+x+'</i>';"), 0)

    def test_exemption_needs_a_real_reason(self):
        self.assertEqual(n("// xss-ok: x is built from a fixed table above\n" + BAD), 0)
        self.assertEqual(n("// xss-ok\n" + BAD), 1)
        self.assertEqual(n("// xss-ok: ok\n" + BAD), 1)

    def test_exemption_is_listed(self):
        js = "// xss-ok: value comes from a frozen table\n" + BAD
        self.assertEqual(len(load({'a.js': js}).scan(js)[1]), 1)

    def test_ratchet_new_file_growth_and_shrink(self):
        self.assertEqual(load({'a.js': BAD}, {}).main([]), 1)              # a new file must be at 0
        self.assertEqual(load({'a.js': BAD}, {'a.js': 1}).main([]), 0)     # at baseline
        self.assertEqual(load({'a.js': BAD + BAD}, {'a.js': 1}).main([]), 1)  # grew
        self.assertEqual(load({'a.js': ''}, {'a.js': 3}).main([]), 0)      # shrank

    def test_update_never_raises_an_existing_baseline(self):
        self.assertEqual(load({'a.js': BAD + BAD}, {'a.js': 1}).main(['--update']), 1)

    def test_update_creates_a_missing_baseline(self):
        m = load({'a.js': BAD})
        self.assertEqual(m.main(['--update']), 0)
        with open(m.BASELINE) as fh:
            self.assertEqual(json.load(fh)['a.js'], 1)

    def test_the_204a_regression_shape(self):
        # stored values straight into innerHTML: the shape CodeQL flagged in omega-daily-brief.js
        self.assertEqual(n("el.innerHTML='<div>'+b.intent+'</div><span>'+b.date+'</span>';"), 2)

    def test_help_exits_zero(self):
        self.assertEqual(subprocess.run([sys.executable, SRC, '--help'], capture_output=True).returncode, 0)


if __name__ == '__main__':
    unittest.main()
