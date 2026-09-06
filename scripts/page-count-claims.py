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

    if findings:
        print('PAGE COUNT CLAIMS: FAIL')
        for f in findings:
            print('- ' + f)
        return 1
    print('PAGE COUNT CLAIMS: PASS (every "N pages" claim matches a real count)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
