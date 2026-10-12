#!/usr/bin/env python3
"""
Generate and verify docs/IDEA_LEDGER.md: every idea this repo has recorded, in
one place, each with a status and the evidence behind it.

WHY THIS EXISTS

Ideas lived in four places that never met: FEATURE_IDEAS.md (39 numbered
proposals, half with no status in the title), docs/OMEGA_999_CONCEPT_REGISTRY.json
(391 indexed blueprint points, 319 never mapped to the platform), GAP_ANALYSIS.md
section S (standing OPEN/CLOSED items), and conversation requests that were never
written down. Two "proposals" (#25, #29) turned out to be loaded by bg.js on every
page. An idea can only be "not missed" if something lists it and fails when its
status is unknown -- so this file derives the list and --check gates it.

SOURCES
  FEATURE_IDEAS.md          '## N. Title' entries. Status from the title
                            (SHIPPED / shipped dormant / proposal), else from
                            docs/idea-status.json, which carries evidence.
  docs/OMEGA_999_CONCEPT_REGISTRY.json
                            each indexed point. An entry may carry
                            'ledger_status' + 'evidence' once mapped; otherwise
                            REQUIRES_CURRENT_RUNTIME_MAPPING -> UNMAPPED,
                            R&D_OR_LORE -> RND_OR_LORE,
                            DO_NOT_IMPLEMENT_AS_WRITTEN -> REJECTED. The
                            'missing_points' (never extracted) are one row.
  GAP_ANALYSIS.md section S '- **OPEN ...' / '- **CLOSED ...' bullets.
  docs/IDEA_INTAKE.md       '- [STATUS] Title — evidence' lines.

  python3 scripts/idea-ledger.py            # regenerate the ledger
  python3 scripts/idea-ledger.py --check    # exit 1 on drift or an unknown status
  python3 scripts/idea-ledger.py --next     # print the actionable queue

--check fails when: an idea has no known status; an idea-status.json entry lacks
evidence or names an idea that no longer exists; an intake line does not parse;
or the committed ledger differs from what the sources produce.
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import collections
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LEDGER = os.path.join(ROOT, 'docs', 'IDEA_LEDGER.md')

STATUSES = [
    # actionable first: this order is the --next queue order
    'NEEDS_DECISION', 'IN_PROGRESS', 'PROPOSED', 'PARTIAL', 'UNMAPPED',
    'OPEN_GAP', 'UNEXTRACTED',
    # settled
    'DORMANT', 'SHIPPED', 'DECIDED', 'CLOSED', 'SUPERSEDED', 'RND_OR_LORE',
    'REJECTED',
]
ACTIONABLE = set(STATUSES[:7])
REGISTRY_MAP = {
    'REQUIRES_CURRENT_RUNTIME_MAPPING': 'UNMAPPED',
    'R&D_OR_LORE': 'RND_OR_LORE',
    'DO_NOT_IMPLEMENT_AS_WRITTEN': 'REJECTED',
}


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as fh:
        return fh.read()


def clip(text, n=110):
    text = re.sub(r'\s+', ' ', text).strip()
    return text if len(text) <= n else text[:n - 1].rstrip() + '…'


def feature_ideas(errors):
    overrides = json.loads(read('docs/idea-status.json'))
    overrides.pop('_comment', None)
    out, seen = [], set()
    for chunk in re.split(r'(?m)^## ', read('FEATURE_IDEAS.md'))[1:]:
        title = chunk.split('\n', 1)[0].strip()
        m = re.match(r'(\d+)\.\s+(.*)', title)
        if not m:
            continue
        iid = 'F%s' % m.group(1)
        seen.add(iid)
        low = title.lower()
        status, evidence = None, 'FEATURE_IDEAS.md title'
        if iid in overrides:
            o = overrides[iid]
            status, evidence = o.get('status'), o.get('evidence', '')
            if not evidence.strip():
                errors.append('%s: idea-status.json entry has no evidence' % iid)
        elif 'shipped dormant' in low:
            status = 'DORMANT'
        elif 'shipped' in low:
            status = 'SHIPPED'
        elif re.search(r'\bproposal\b', low):
            status = 'PROPOSED'
        out.append((iid, 'FEATURE_IDEAS.md', clip(m.group(2)), status, evidence))
    for iid in overrides:
        if iid not in seen:
            errors.append('%s: idea-status.json names an idea FEATURE_IDEAS.md no longer has' % iid)
    return out


def blueprint(errors):
    data = json.loads(read('docs/OMEGA_999_CONCEPT_REGISTRY.json'))
    out = []
    for e in data.get('entries', []):
        iid = 'B%03d' % e['point']
        if e.get('ledger_status'):
            status, evidence = e['ledger_status'], e.get('evidence', '')
            if not evidence.strip():
                errors.append('%s: ledger_status set without evidence' % iid)
        else:
            status = REGISTRY_MAP.get(e.get('status'))
            evidence = 'registry status %s' % e.get('status')
        out.append((iid, '999 blueprint [%s]' % e.get('class', '?'),
                    clip(e.get('source_text', '')), status, evidence))
    missing = data.get('missing_points', [])
    if missing:
        out.append(('B-MISSING', '999 blueprint',
                    '%d declared points never extracted (needs the source text)' % len(missing),
                    'UNEXTRACTED', 'docs/OMEGA_999_EXTRACTION_TRUTH_20261004.md'))
    return out


def gap_items():
    text = read('GAP_ANALYSIS.md')
    m = re.search(r'(?ms)^## S\..*?(?=^## )', text)
    out = []
    for n, line in enumerate(re.findall(r'(?m)^- \*\*(OPEN|CLOSED)\b([^\n]*)', m.group(0) if m else ''), 1):
        kind, rest = line
        rest = re.sub(r'^[^—]*—\s*', '', rest, count=1).replace('**', '')
        out.append(('G%02d' % n, 'GAP_ANALYSIS.md S', clip(rest),
                    'OPEN_GAP' if kind == 'OPEN' else 'CLOSED', 'GAP_ANALYSIS.md section S'))
    return out


def intake(errors):
    out = []
    body = read('docs/IDEA_INTAKE.md').split('\n## Ideas', 1)
    lines = body[1].splitlines() if len(body) > 1 else []
    n = 0
    for line in lines:
        if not line.startswith('- '):
            continue
        n += 1
        m = re.match(r'- \[([A-Z_]+)\]\s+(.+?)\s+—\s+(.+)$', line)
        if not m:
            errors.append('IDEA_INTAKE.md line does not parse: %s' % clip(line, 80))
            continue
        out.append(('I%02d' % n, 'IDEA_INTAKE.md', clip(m.group(2)), m.group(1), clip(m.group(3), 140)))
    return out


def collect():
    errors = []
    ideas = feature_ideas(errors) + blueprint(errors) + gap_items() + intake(errors)
    for iid, _, title, status, _ in ideas:
        if status not in STATUSES:
            errors.append('%s (%s): unknown status %r' % (iid, title[:50], status))
    return ideas, errors


def render(ideas):
    by = collections.Counter(i[3] for i in ideas)
    src = collections.Counter(i[1].split(' [')[0] for i in ideas)
    rows = ['# Idea ledger', '',
            'Generated by `scripts/idea-ledger.py` — do not edit by hand. Add a new idea to',
            '`docs/IDEA_INTAKE.md`; settle one by changing its status *with evidence* in its',
            'source (`docs/idea-status.json` for a FEATURE_IDEAS entry, `ledger_status` +',
            '`evidence` on a blueprint point). `SHIPPED` means merged to `main`, not that',
            'production serves it.', '',
            '**%d ideas** — %s.' % (len(ideas), ', '.join('%s %d' % kv for kv in sorted(src.items()))), '',
            '| status | count |', '|---|---|']
    rows += ['| %s | %d |' % (s, by[s]) for s in STATUSES if by[s]]
    rows += ['', '## Actionable queue', '',
             'Everything not yet settled, owner decisions first. The weekly idea routine',
             'works this list top-down; `UNMAPPED` blueprint points are mapped in batches.', '']
    for s in STATUSES:
        group = [i for i in ideas if i[3] == s]
        if not group:
            continue
        rows += ['### %s (%d)' % (s, len(group)), '', '| id | source | idea | evidence |', '|---|---|---|---|']
        rows += ['| %s | %s | %s | %s |' % (i[0], i[1], i[2].replace('|', '\\|'), i[4].replace('|', '\\|'))
                 for i in group]
        rows.append('')
        if s == 'UNEXTRACTED':
            rows += ['## Settled', '']
    return '\n'.join(rows).rstrip() + '\n'


def main(argv):
    ideas, errors = collect()
    if '--next' in argv:
        for i in sorted(ideas, key=lambda i: STATUSES.index(i[3]) if i[3] in STATUSES else -1):
            if i[3] in ACTIONABLE:
                print('%-10s %-15s %s' % (i[0], i[3], i[2]))
        return 0
    text = render(ideas)
    for e in errors:
        print('ERROR', e)
    if '--check' in argv:
        try:
            current = open(LEDGER, encoding='utf-8').read()
        except OSError:
            current = ''
        drift = current != text
        if drift:
            print('ERROR docs/IDEA_LEDGER.md is stale: run python3 scripts/idea-ledger.py')
        ok = not errors and not drift
        print('IDEA LEDGER: %s — %d ideas, %d actionable'
              % ('PASS' if ok else 'FAIL', len(ideas), sum(i[3] in ACTIONABLE for i in ideas)))
        return 0 if ok else 1
    if errors:
        return 1
    with open(LEDGER, 'w', encoding='utf-8') as fh:
        fh.write(text)
    print('wrote docs/IDEA_LEDGER.md — %d ideas' % len(ideas))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
