#!/usr/bin/env python3
"""Refuse to declare a user journey the deployment cannot serve.

WHY THIS EXISTS

config/user-journey-contract.json names the journeys this platform intends a
member to be able to take -- `from` a page, `to` a page, with a stated goal.
This gate used to validate only the SHAPE of that file: that `version` is a
string, that `rules` is non-empty, that each rule carries id/from/to/goal, that
ids are unique. It never asked whether any named path resolves to something the
deployment actually serves.

So it passed green while five of the six declared journeys routed through
`/discover`, which is not a file, not a rewrite and not a redirect. A gate that
proves a document is well-formed, while the thing the document describes does
not exist, is the "green check standing in for a real one" shape CLAUDE.md 8.4
warns about.

WHAT IT CHECKS NOW

Both, in order:

  1. Shape -- as before.
  2. Resolution -- every `from` and `to` must resolve against the real
     deployment surface, which for this repo means one of:
       · a file in the repo root (`/academy` -> academy.html, since
         vercel.json sets cleanUrls: true; `/academy.html` also accepted)
       · a `redirects` or `rewrites` source in vercel.json (`/` is rewritten
         to /omega-visual-home.html)
     Anything else is a journey to nowhere and fails.

Resolution is deliberately checked against vercel.json rather than assumed:
cleanUrls is a deploy setting, not a law, and if it is ever turned off every
extensionless path in this contract breaks at once.

Usage:
  python3 scripts/user-journey-contract.py            # validate, exit 1 on failure
  python3 scripts/user-journey-contract.py --help     # this text
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CONFIG = ROOT / 'config' / 'user-journey-contract.json'
VERCEL = ROOT / 'vercel.json'


def deployment_surface():
    """Paths the deployment serves, plus whether extensionless paths work.

    Returns (explicit_paths, clean_urls). explicit_paths holds every redirect
    and rewrite source declared in vercel.json; clean_urls says whether
    `/foo` may resolve to `foo.html`.
    """
    explicit = set()
    clean = False
    try:
        cfg = json.loads(VERCEL.read_text(encoding='utf-8'))
    except Exception:
        return explicit, clean
    clean = bool(cfg.get('cleanUrls'))
    for key in ('redirects', 'rewrites'):
        for entry in cfg.get(key) or []:
            src = entry.get('source')
            if isinstance(src, str):
                explicit.add(src)
    return explicit, clean


def resolves(path, explicit, clean):
    """Does this contract path reach something the deployment serves?"""
    if not isinstance(path, str) or not path.startswith('/'):
        return False, 'not an absolute path'
    if path in explicit:
        return True, 'vercel.json rewrite/redirect'
    slug = path.lstrip('/')
    if slug.endswith('.html'):
        return ((ROOT / slug).is_file(),
                'file' if (ROOT / slug).is_file() else 'no such file')
    if not slug:
        return False, 'root is not rewritten in vercel.json'
    target = ROOT / (slug + '.html')
    if target.is_file():
        if clean:
            return True, 'cleanUrls -> %s.html' % slug
        return False, ('%s.html exists but vercel.json does not set cleanUrls, '
                       'so this extensionless path does not resolve' % slug)
    return False, 'no %s.html, no rewrite, no redirect' % slug


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0

    try:
        d = json.loads(CONFIG.read_text(encoding='utf-8'))
    except Exception as exc:
        print('USER JOURNEY CONTRACT: FAIL\n- ' + str(exc))
        return 1

    errors = []
    if not isinstance(d.get('version'), str):
        errors.append('missing version')

    rules = d.get('rules')
    if not isinstance(rules, list) or not rules:
        errors.append('rules must be non-empty')
        rules = []

    ids = set()
    for i, r in enumerate(rules):
        if not isinstance(r, dict):
            errors.append('rules[%d] must be object' % i)
            continue
        for k in ('id', 'from', 'to', 'goal'):
            if not isinstance(r.get(k), str) or not r[k].strip():
                errors.append('rules[%d].%s required' % (i, k))
        if r.get('id') in ids:
            errors.append('duplicate journey id: %s' % r.get('id'))
        ids.add(r.get('id'))

    req = d.get('requirements')
    if not isinstance(req, list) or not req:
        errors.append('requirements must be non-empty')

    # Resolution. Only worth running once the shape is sound.
    checked = 0
    if not errors:
        explicit, clean = deployment_surface()
        for r in rules:
            for end in ('from', 'to'):
                ok, why = resolves(r[end], explicit, clean)
                checked += 1
                if not ok:
                    errors.append('journey %r: %s = %r does not resolve (%s)'
                                  % (r['id'], end, r[end], why))

    if errors:
        print('USER JOURNEY CONTRACT: FAIL')
        for e in errors:
            print('- ' + e)
        return 1

    print('USER JOURNEY CONTRACT: PASS (%d journeys, %d endpoints resolved)'
          % (len(rules), checked))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
