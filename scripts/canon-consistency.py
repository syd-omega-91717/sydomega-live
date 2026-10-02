#!/usr/bin/env python3
"""
Refuse a sign, agent, god, element or token that contradicts the canon.

The platform's brand system is one table: twelve tracks, each a zodiac sign
with its god, element, agent, token, gate and house (omega-canon.json
`tracks`, mirrored by omega-agents.json). CLAUDE.md 8.1 class 8 records what
happens when pages keep their own copies: the live onboarding flow once gave
9 of 12 signs the wrong god and agent. This gate reads every page and module
and checks every record against the canon.

How a record is found: a line (or, inside a long minified line, one
`{...}`/`[...]` item) that names exactly ONE sign, or exactly one agent and no
sign. Every other canon term in that record must be the one the canon pairs
with it:
  - god     -- any Olympian or Titan name, so a wrong god outside the canon's
               own twelve (e.g. "Cronus") is still caught;
  - agent   -- the twelve agent names;
  - token   -- the twelve canonical tokens, plus any ALL-CAPS token in a
               `token:'...'` field;
  - element -- `element:'...'` values must be one of the nine canonical
               elements (FIRE, WATER, WIND, METAL, SAND, SOUL, SPACE, VOID,
               THE ALL); a sign's own element must match its track;
  - ninth   -- the ninth element has one name, the canon's ("THE ALL"); a
               second name for it outside a comment is a finding.
A record naming several signs (a list, a table header) is not a pairing and
is skipped. "Sovereign" is both an agent and the platform's adjective, so it
only counts as an agent next to `agent`/`name` keys or a `//` pairing.

Exit 1 with one line per contradiction; 0 when the estate agrees.

Usage:
  python3 scripts/canon-consistency.py          # gate
  python3 scripts/canon-consistency.py --list   # also print the canon table
"""
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

GODS_ALL = [
    'Zeus', 'Hera', 'Poseidon', 'Demeter', 'Athena', 'Apollo', 'Artemis', 'Ares',
    'Aphrodite', 'Hephaestus', 'Hermes', 'Hestia', 'Dionysus', 'Hades', 'Persephone',
    # Uranus is left out: pages name it as Aquarius's ruling PLANET (horoscope,
    # houses), which is astrology, not the brand's god pairing.
    'Cronus', 'Kronos', 'Rhea', 'Gaia', 'Hyperion', 'Helios', 'Selene',
    'Eos', 'Nyx', 'Eros', 'Nike', 'Hecate', 'Pan', 'Prometheus', 'Atlas', 'Themis',
    'Mnemosyne', 'Oceanus', 'Tethys', 'Chronos',
]
SKIP_FILES = {'omega-canon.json', 'omega-agents.json'}


def load_canon():
    with open(os.path.join(ROOT, 'omega-canon.json'), encoding='utf-8') as fh:
        canon = json.load(fh)
    tracks = canon['tracks']
    elements = [e['name'].upper() for e in canon['elements']]
    return tracks, elements


def words(ws):
    return re.compile(r'(?<![A-Za-z])(' + '|'.join(sorted(map(re.escape, ws), key=len, reverse=True)) + r')(?![A-Za-z])')


def records(line):
    if len(line) <= 400:
        return [line]
    return re.split(r'[}\]]\s*,\s*[{\[]', line)


def check_file(path, tracks, elements):
    by_sign = {t['sign']: t for t in tracks}
    by_agent = {t['agent']: t for t in tracks}
    tokens = {t['token'] for t in tracks}
    rs = words(by_sign)
    rg = words(GODS_ALL)
    ra = words(by_agent)
    rt = words(tokens)
    field_el = re.compile(r"""element\s*:\s*['"]([A-Za-z ]+)['"]""")
    field_tok = re.compile(r"""token\s*:\s*['"]([A-Z]{3,})['"]""")
    agent_field = re.compile(r"""(?:agent|name)\s*:\s*['"](?:""" + '|'.join(by_agent) + r""")['"]""")
    sov_agent = re.compile(r"""(?:agent|name)\s*:\s*['"]Sovereign['"]|//\s*Sovereign\b|Sovereign\s*//""")
    ninth = elements[-1]
    other = 'THE NINTH' if ninth == 'THE ALL' else 'THE ALL'
    retired = re.compile(r"(?<![A-Za-z])" + other + r"(?= *(?:[-\u2014'\"<.,/]|$))")
    out = []
    name = os.path.basename(path)
    with open(path, encoding='utf-8', errors='ignore') as fh:
        lines = fh.readlines()
    for i, line in enumerate(lines, 1):
        for rec in records(line):
            # The ninth element is named in the canon (omega-canon.json); a
            # second name for the same thing ("THE NINTH" vs "THE ALL") split
            # the estate once, with ~15 modules keyed on one and 6 pages on
            # the other.
            if retired.search(rec) and not re.match(r'\s*(//|/\*|\*)', rec):
                out.append('%s:%d names the ninth element %r; canon: %r' % (name, i, retired.search(rec).group(0), elements[-1]))
            for m in field_el.finditer(rec):
                if m.group(1).strip().upper() not in elements:
                    out.append('%s:%d element %r is not one of the nine canonical elements' % (name, i, m.group(1)))
            signs = set(rs.findall(rec))
            agents = set(ra.findall(rec))
            if 'Sovereign' in agents and not sov_agent.search(rec):
                agents.discard('Sovereign')
            if len(signs) == 1:
                t = by_sign[next(iter(signs))]
            elif not signs and len(agents) == 1 and agent_field.search(rec):
                # An agent name alone is often an ordinary word or a title
                # ("Oracle of Ares", "ORACLE SOVEREIGN"); it is a record only
                # when it sits in a name/agent field.
                t = by_agent[next(iter(agents))]
            else:
                continue
            gods = set(rg.findall(rec))
            if len(gods) == 1 and t['god'] not in gods:
                out.append('%s:%d %s is paired with god %s; canon: %s' % (name, i, t['sign'], next(iter(gods)), t['god']))
            if signs and len(agents) == 1 and t['agent'] not in agents:
                out.append('%s:%d %s is paired with agent %s; canon: %s' % (name, i, t['sign'], next(iter(agents)), t['agent']))
            toks = set(rt.findall(rec)) | set(field_tok.findall(rec))
            if len(toks) == 1 and t['token'] not in toks:
                out.append('%s:%d %s is paired with token %s; canon: %s' % (name, i, t['sign'], next(iter(toks)), t['token']))
            els = {m.group(1).strip().upper() for m in field_el.finditer(rec)}
            if len(els) == 1 and next(iter(els)) in elements and next(iter(els)) != t['element'].upper():
                out.append('%s:%d %s is paired with element %s; canon: %s' % (name, i, t['sign'], next(iter(els)), t['element'].upper()))
    return out


def main():
    if '--help' in sys.argv or '-h' in sys.argv:
        print(__doc__)
        return 0
    tracks, elements = load_canon()
    if '--list' in sys.argv:
        for t in tracks:
            print('%-12s %-11s %-6s %-10s %s' % (t['sign'], t['god'], t['element'], t['agent'], t['token']))
    files = sorted(glob.glob(os.path.join(ROOT, '*.html')) + glob.glob(os.path.join(ROOT, '*.js'))
                   + glob.glob(os.path.join(ROOT, '*.json')) + glob.glob(os.path.join(ROOT, 'i18n', '*.json')))
    files = [f for f in files if os.path.basename(f) not in SKIP_FILES
             and not os.path.basename(f).startswith('verify-')]
    findings = []
    for f in files:
        findings.extend(check_file(f, tracks, elements))
    for x in findings:
        print(x)
    if findings:
        print('CANON CONSISTENCY: FAIL (%d contradiction%s across %d files)'
              % (len(findings), '' if len(findings) == 1 else 's', len({x.split(':')[0] for x in findings})))
        return 1
    print('CANON CONSISTENCY: PASS (%d files agree with the %d canonical tracks)' % (len(files), len(tracks)))
    return 0


if __name__ == '__main__':
    sys.exit(main())
