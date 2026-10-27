#!/usr/bin/env python3
"""Fail when the two palette-token owners disagree about a shared token.

CLAUDE.md section 4: every palette/type token is owned by theme.js (DUSK_CSS
:root block) AND css/omega-system.css (first :root block), never bg.js. "Change
both owners or it does not ship." Nothing enforced that, so the two drifted:
--muted, --ink and --line already differ. Whichever sheet loads later wins at
runtime, so a member sees one value while the other file reads as correct.

This gate is a ratchet, not a purge. Known divergences are recorded in
config/token-parity-baseline.json and tolerated; it fails on

  * a NEW divergence (a shared token whose values differ and is not recorded),
  * a STALE baseline entry (recorded, but the owners now agree or one dropped it),
  * a baseline entry whose recorded values no longer match either file.

Resolving a divergence is a design decision (which value is intended) and is
deliberately not made here. Run with --write-baseline to re-record after a
reviewed change. Exit 0 = clean.
"""
import argparse
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE = os.path.join(ROOT, 'config', 'token-parity-baseline.json')
DECL = re.compile(r'(--[a-z0-9-]+)\s*:\s*([^;}]+?)\s*(?=;|})', re.I)


def first_root_block(text):
    m = re.search(r':root\s*\{', text)
    if not m:
        return ''
    depth, i = 1, m.end()
    while i < len(text) and depth:
        depth += {'{': 1, '}': -1}.get(text[i], 0)
        i += 1
    return text[m.end():i - 1]


def strip_comments(s):
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)


def norm(v):
    v = re.sub(r'\s+', '', v.lower())
    return re.sub(r'(?<![0-9])\.(\d)', r'0.\1', v)


def tokens(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as f:
        block = strip_comments(first_root_block(f.read()))
    return {n: norm(v) for n, v in DECL.findall(block)}


def divergences():
    a, b = tokens('theme.js'), tokens('css/omega-system.css')
    return {n: [a[n], b[n]] for n in sorted(set(a) & set(b)) if a[n] != b[n]}


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('--write-baseline', action='store_true',
                    help='re-record current divergences (after review)')
    args = ap.parse_args()
    cur = divergences()
    if args.write_baseline:
        with open(BASELINE, 'w', encoding='utf-8') as f:
            json.dump({'_note': 'token -> [theme.js, css/omega-system.css]; see scripts/token-parity-contract.py',
                       'divergences': cur}, f, indent=2)
            f.write('\n')
        print('wrote %d divergences' % len(cur))
        return 0
    with open(BASELINE, encoding='utf-8') as f:
        base = json.load(f)['divergences']
    bad = []
    for n, v in cur.items():
        if n not in base:
            bad.append('NEW   %s: theme.js=%s omega-system.css=%s' % (n, v[0], v[1]))
        elif base[n] != v:
            bad.append('MOVED %s: recorded %s, now %s' % (n, base[n], v))
    for n in base:
        if n not in cur:
            bad.append('STALE %s: owners now agree (or one dropped it); remove from baseline' % n)
    shared = len(set(tokens('theme.js')) & set(tokens('css/omega-system.css')))
    print('token-parity: %d shared tokens, %d divergent (%d recorded)' % (shared, len(cur), len(base)))
    for line in bad:
        print('  ' + line)
    if not shared:
        print('  no shared tokens parsed -- the parser is broken, not the palette')
        return 1
    return 1 if bad else 0


if __name__ == '__main__':
    sys.exit(main())
