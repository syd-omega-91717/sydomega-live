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

    def test_shared_helper_calls_and_aliases_count_as_escaped(self):
        self.assertEqual(n("el.innerHTML='<b>'+OmegaEsc.esc(x)+'</b>';"), 0)
        self.assertEqual(n("el.innerHTML='<b>'+window.OmegaEsc.num(x)+'</b>';"), 0)
        alias = "const esc = (window.OmegaEsc && OmegaEsc.esc) || (() => '');\n"
        self.assertEqual(n(alias + "el.innerHTML='<b>'+esc(x)+'</b>';"), 0)

    def test_url_alone_is_not_enough_and_an_undeclared_esc_still_counts(self):
        self.assertEqual(n("el.innerHTML='<b>'+OmegaEsc.url(x)+'</b>';"), 1)
        self.assertEqual(n("el.innerHTML='<b>'+esc(x)+'</b>';"), 1)
        self.assertEqual(n("el.innerHTML='<b>'+OmegaEsc.esc(x)+y+'</b>';"), 1)

    def test_a_neighbouring_escaper_does_not_make_a_function_one(self):
        # timeAgo() sat directly above esc(); looking at the next N characters read esc()'s body and classed timeAgo
        # as an escaper, so the miscount only appeared once esc() was removed (FIXES_LOG 211).
        above = "function timeAgo(d){return d+'m';}\n"
        esc = "function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}\n"
        self.assertEqual(n(above + esc + "el.innerHTML='<b>'+timeAgo(x)+'</b>';"), 1)
        self.assertEqual(n(above + esc + "el.innerHTML='<b>'+esc(x)+'</b>';"), 0)
        self.assertEqual(n(above + "el.innerHTML='<b>'+timeAgo(x)+'</b>';"), 1)

    def test_expression_bodied_arrow_escaper_is_recognised(self):
        arrow = "const h = t => String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');\n"
        self.assertEqual(n(arrow + "el.innerHTML='<b>'+h(x)+'</b>';"), 0)

    def test_call_time_wrapper_of_the_shared_helper_is_an_escaper(self):
        # modules may run before omega-esc.js has executed, so they look it up at call time instead of binding once
        wrap = "function esc(v){ return window.OmegaEsc ? OmegaEsc.esc(v) : ''; }\n"
        dash = "function esc(v){ return v == null ? '—' : (window.OmegaEsc ? OmegaEsc.esc(v) : ''); }\n"
        arrow = "const esc = (v) => (window.OmegaEsc ? OmegaEsc.esc(v) : '');\n"
        for helper in (wrap, dash, arrow):
            self.assertEqual(n(helper + "el.innerHTML='<b>'+esc(x)+'</b>';"), 0, helper)
            self.assertEqual(n(helper + "el.innerHTML='<b>'+esc(x)+y+'</b>';"), 1, helper)   # partial is still a finding

    def test_a_long_function_that_escapes_one_field_is_not_an_escaper(self):
        long_fn = ("function render(r){ const t = OmegaEsc.esc(r.title); var out = '<li>' + t + '</li>'; "
                   "out += '<i>' + r.note + '</i>'; out += '<u>' + r.more + '</u>'; return out; }\n")
        self.assertEqual(n(long_fn + "el.innerHTML='<ul>'+render(x)+'</ul>';"), 1)
        # short, but it builds markup: still a renderer, not an escaper
        short_fn = "function row(v){ return '<b>' + OmegaEsc.esc(v) + '</b>' + v.raw; }\n"
        self.assertEqual(n(short_fn + "el.innerHTML='<ul>'+row(x)+'</ul>';"), 1)

    def test_help_exits_zero(self):
        self.assertEqual(subprocess.run([sys.executable, SRC, '--help'], capture_output=True).returncode, 0)


if __name__ == '__main__':
    unittest.main()
