#!/usr/bin/env python3
"""No page ships a manipulative ("dark") pattern. Blocking.

WHY THIS EXISTS
The 999-point ledger holds "covert psychological nudging" (steer members by exploiting bias without their knowledge). It is rejected: it works against the
person it is used on. The safe version of the wish (members who come back and finish what they started) is honest, disclosed design: reminders a member
turned on, progress they can see, defaults that favour them. This gate is the guard that stops the rejected version arriving by accident.

WHAT IT ENFORCES (member-visible HTML and client JS)
  1. CONSENT: no consent, marketing, newsletter, tracking or data-sharing checkbox is pre-checked (a default of "yes" is not consent).
  2. URGENCY: no manufactured scarcity or deadline copy ("only 3 left", "offer ends in", "N people are viewing") unless the same line says it is a real, sourced figure.
  3. FAKE CLOCK: no countdown whose deadline is computed from "now" (Date.now() + N) at page load, which restarts on every visit and is therefore invented.
  4. CONFIRMSHAMING: no decline button worded to shame ("No thanks, I don't want to ...", "I prefer to stay ...").

HOW TO READ A RESULT. Exit 0 means none of the four shapes was found IN THE FILES IT SCANS (root pages and modules; docs, tests, vendor, supabase and this file are skipped).
It cannot see manipulation that uses words or layout it does not know (visual hierarchy, hidden costs, roach-motel flows). A 0 is only believable after a positive control:
scripts/tests/test_dark_pattern_gate.py plants each shape in a scratch tree and requires it to be found, and plants look-alikes it must ignore.

Usage: python3 scripts/dark-pattern-gate.py [--root DIR]      exit 1 and a list when anything is found
"""
import argparse
import os
import re
import sys

SKIP_DIRS = {'.git', 'node_modules', 'vendor', 'docs', 'public', '.claude', '__pycache__', 'supabase', 'i18n', 'core', 'mobile'}
SKIP_PREFIXES = ('scripts/', 'tests/')
SKIP_FILES = {'FIXES_LOG.md', 'omega-arcade.js'}   # omega-arcade.js is a word-game dictionary ("hurry" is a legal word there)
TEXT_EXT = {'.html', '.js'}

CHECKBOX = re.compile(r'<input\b[^>]*\btype\s*=\s*["\']?checkbox["\']?[^>]*>', re.I)
CONSENT_ID = re.compile(r'(consent|marketing|newsletter|promo|tracking|analytics|share|subscribe|opt[-_ ]?in|personalis|personaliz|cookie)', re.I)
CHECKED = re.compile(r'(?<![\w.])checked(?![\w.])(?!\s*=\s*["\']?false)', re.I)
QUOTED = re.compile(r'"[^"]*"|\'[^\']*\'')   # attribute values (an onchange="...this.checked" handler is not the attribute)
URGENCY = re.compile(r'(only\s+\d+\s+(?:left|spots?|seats?|remaining|available)|\d+\s+(?:people|others|users|members)\s+(?:are\s+)?(?:viewing|watching|looking)|(?:offer|sale|deal|price)\s+(?:ends|expires)\s+in|hurry[,!]|last\s+chance[!:]|selling\s+fast|almost\s+gone)', re.I)
REAL_FIGURE = re.compile(r'(sourced|real|measured|from the database|live count|\bdata-omega-real\b|example|e\.g\.|test|assert|regex|pattern)', re.I)
FAKE_CLOCK = re.compile(r'(?:Date\.now\(\)|new\s+Date\(\)\.getTime\(\))\s*\+\s*[\d_*\s().]+\s*(?:\*\s*\d+)*[^;\n]{0,80}', re.I)
CLOCK_CONTEXT = re.compile(r'(countdown|offer|sale\b|ends[-_ ]?in|timeLeft|hurry)', re.I)
SHAME = re.compile(r'(no,?\s+thanks?,?\s+i\s+(?:don.?t|do not|prefer|would rather|like being)|i\s+(?:don.?t|do not)\s+want\s+to\s+(?:save|be\s+(?:smart|healthy|successful|rich)|improve|grow)|i\s+prefer\s+to\s+(?:stay|remain|pay\s+full|miss))', re.I)


def files(root):
    for dp, dn, fn in os.walk(root):
        rel_dir = os.path.relpath(dp, root).replace(os.sep, '/')
        dn[:] = [d for d in dn if d not in SKIP_DIRS]
        for f in fn:
            rel = f if rel_dir == '.' else rel_dir + '/' + f
            if rel in SKIP_FILES or rel.startswith(SKIP_PREFIXES) or os.path.splitext(f)[1] not in TEXT_EXT:
                continue
            yield rel, os.path.join(dp, f)


def scan(root):
    out = []
    for rel, path in files(root):
        try:
            with open(path, encoding='utf-8', errors='replace') as fh:
                text = fh.read()
        except OSError:
            continue
        for m in CHECKBOX.finditer(text):
            tag = m.group(0)
            if CHECKED.search(QUOTED.sub('""', tag)) and CONSENT_ID.search(tag):
                line = text.count('\n', 0, m.start()) + 1
                out.append((rel, line, 'consent-type checkbox is pre-checked', tag[:120]))
        for i, line in enumerate(text.split('\n'), 1):
            if len(line) > 4000:
                continue
            u = URGENCY.search(line)
            if u and not REAL_FIGURE.search(line):
                out.append((rel, i, 'manufactured urgency or scarcity copy', u.group(0)))
            c = FAKE_CLOCK.search(line)
            if c and CLOCK_CONTEXT.search(line):
                out.append((rel, i, 'countdown deadline computed from now at load (restarts every visit)', c.group(0).strip()[:100]))
            s = SHAME.search(line)
            if s:
                out.append((rel, i, 'decline wording that shames the member', s.group(0)))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n\n')[0], formatter_class=argparse.RawDescriptionHelpFormatter, epilog=__doc__)
    ap.add_argument('--root', default=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    a = ap.parse_args(argv)
    found = scan(os.path.abspath(a.root))
    for rel, line, why, ex in found:
        print('%s:%d: %s: %s' % (rel, line, why, ex))
    print('DARK-PATTERN GATE: %s' % ('FAIL (%d)' % len(found) if found else 'PASS (no pre-checked consent, manufactured urgency, fake clock or confirmshaming)'))
    return 1 if found else 0


if __name__ == '__main__':
    sys.exit(main())
