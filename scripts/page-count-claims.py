#!/usr/bin/env python3
"""Refuse a page-count claim in member-visible copy that is no longer true.

WHY THIS EXISTS

CLAUDE.md 8.4 says it plainly: "a number stored in prose drifts; derive it
instead". One class of number keeps appearing in copy a member actually reads,
and every instance had drifted when measured on 2026-09-05:

    notifications.html   "169 pages active across 15 sections"   (a system
                         notification, so the member reads it as status)
    ecosystem.html       "62-PAGE PLATFORM ... comprises 62 pages"
    roadmap.html         "170 pages. 85 engines. 110 SQL files."
    world-shell.html     "all 150+ pages"
    settings.html        "48 pages keep what you enter in this browser only"

Real values that day: 189 pages, 149 omega-* modules, 126 SQL files. The
settings.html figure is different in kind -- it is the LOCAL_ONLY count from
evidence-audit.py, and it went stale because wiring three pages to Postgres
moved them out of that class. A number can rot because the estate grew OR
because you fixed something.

WHAT IT CHECKS

Every "<N> pages" in a .html file must equal one of:
  - the number of .html files in the repo root (the whole estate), or
  - a class count from evidence-audit.py (BUILT / PARTIAL / LOCAL_ONLY /
    STATIC / BROKEN / UNREACHABLE), since a page may legitimately talk about
    a subset, as settings.html does.

Anything else is a claim nothing in the repo supports. The check is
deliberately narrow: it does not try to police every number in copy, only the
one shape that has demonstrably drifted five times.

Usage:
  python3 scripts/page-count-claims.py            # exit 1 on a stale claim
  python3 scripts/page-count-claims.py --help     # this text
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CLAIM = re.compile(r'(\d{2,4})\+?\s+pages\b', re.I)

# Diagnostic harnesses, not member-visible copy.
SKIP = {'verify-deployment.html', 'verify-modules.html'}


def allowed_counts():
    """The estate size, plus every evidence class count."""
    counts = {len([p for p in ROOT.glob('*.html')])}
    try:
        out = subprocess.run([sys.executable, str(ROOT / 'scripts' / 'evidence-audit.py'),
                              '--summary'], capture_output=True, text=True,
                             cwd=str(ROOT), timeout=180).stdout
        for m in re.finditer(r'^\s+(BUILT|PARTIAL|LOCAL_ONLY|STATIC|BROKEN|UNREACHABLE)\s+(\d+)',
                             out, re.M):
            counts.add(int(m.group(2)))
    except Exception:
        pass          # estate size alone still catches the common case
    return counts


def i18n_findings(ok):
    """Claims in the dictionary, and the translations of each one.

    A data-i18n string is rendered from i18n.js's T_EN and the six packs, not
    from the page's own markup, so scanning *.html alone missed them: on
    2026-09-26 T_EN said "ALL 206 PAGES" and all six packs still said 205.
    The pages word is translated, so a pack is held to the English value's
    number instead: a key whose T_EN value claims N pages must carry N in every
    pack.
    """
    out = []
    if not (ROOT / 'i18n.js').exists():
        return out          # no dictionary in this tree: nothing to hold
    src = (ROOT / 'i18n.js').read_text(encoding='utf-8', errors='replace')
    start = src.find('var T_EN={')
    end = src.find('\n};', start)
    if start < 0 or end < 0:
        return ['i18n.js: T_EN block not found; the dictionary was not checked']
    t_en = dict(re.findall(r'"([A-Za-z0-9_]+)":"((?:[^"\\]|\\.)*)"', src[start:end]))
    import json
    packs = {}
    for pack in sorted((ROOT / 'i18n').glob('*.json')):
        try:
            packs[pack.name] = json.loads(pack.read_text(encoding='utf-8'))
        except ValueError:
            out.append('i18n/%s: does not parse' % pack.name)
    for key, val in sorted(t_en.items()):
        m = CLAIM.search(val)
        if not m:
            continue
        n = int(m.group(1))
        if n not in ok:
            out.append('i18n.js T_EN.%s claims "%s" — no count in the repo supports it' % (key, m.group(0)))
        for name, d in packs.items():
            tv = d.get(key)
            if tv is not None and not re.search(r'(?<!\d)%d(?!\d)' % n, tv):
                out.append('i18n/%s %s drops the English count %d: "%s"' % (name, key, n, tv))
    return out


STAT = re.compile(r'data-countup>(\d+)</dt>\s*<dd class="ohz-stat-l">([A-Z]+)<')


def front_door_findings():
    """The front door's stat row, held to the sources its own comment names.

    index.html renders "216 SURFACES" and "14 SERVICES" -- not the "N pages"
    shape -- so this gate passed while both were stale (2026-10-09: 238 pages,
    16 deployed Edge Functions). SERVICES counts what is DEPLOYED live per
    docs/runtime/supabase-edge-functions-live.json, never source-only
    functions: a member reads the row as what is running.
    """
    import json
    index = ROOT / 'index.html'
    if not index.exists():
        return []
    expected = {'SURFACES': len(list(ROOT.glob('*.html')))}
    agents = ROOT / 'omega-agents.json'
    if agents.exists():
        try:
            expected['AGENTS'] = len(json.loads(agents.read_text(encoding='utf-8'))['agents'])
        except (ValueError, KeyError, TypeError):
            pass
    live = ROOT / 'docs' / 'runtime' / 'supabase-edge-functions-live.json'
    if live.exists():
        try:
            fns = json.loads(live.read_text(encoding='utf-8'))['functions']
            expected['SERVICES'] = sum(1 for f in fns.values() if f.get('state') == 'DEPLOYED')
        except (ValueError, KeyError, TypeError, AttributeError):
            pass
    out = []
    for m in STAT.finditer(index.read_text(encoding='utf-8', errors='replace')):
        n, label = int(m.group(1)), m.group(2)
        if label in expected and n != expected[label]:
            out.append('index.html stat row claims %d %s; the source says %d'
                       % (n, label, expected[label]))
    return out


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0

    ok = allowed_counts()
    findings = []
    for path in sorted(ROOT.glob('*.html')):
        if path.name in SKIP:
            continue
        text = path.read_text(encoding='utf-8', errors='replace')
        for m in CLAIM.finditer(text):
            n = int(m.group(1))
            if n in ok:
                continue
            line = text[:m.start()].count('\n') + 1
            findings.append('%s:%d claims "%s" — no count in the repo supports it '
                            '(estate and evidence classes: %s)'
                            % (path.name, line, m.group(0).strip(),
                               ', '.join(str(c) for c in sorted(ok))))

    findings.extend(i18n_findings(ok))
    findings.extend(front_door_findings())

    if findings:
        print('PAGE COUNT CLAIMS: FAIL')
        for f in findings:
            print('- ' + f)
        return 1
    print('PAGE COUNT CLAIMS: PASS (every "N pages" claim matches a real count)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
