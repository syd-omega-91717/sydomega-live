#!/usr/bin/env python3
"""Refuse any shipped Supabase project URL or publishable key that is not bg.js's.

WHY THIS EXISTS

bg.js owns the one browser client (window.OmegaSB.get -> window.__omegaSb) and
declares the canonical URL and publishable key. omega-evidence-graph.js built
its own client with `sb_publishable_4L5Qy5vQ9pQm8hM0QmQ`, a key that does not
exist on the project (checked 2026-09-29 against the live key list). Because the
module ran before bg.js's client resolved, that was the normal path: every read
failed, auth.getUser() failed, and a signed-in member was told to sign in.

No gate saw it -- the service-role scan looks for privileged keys, not wrong
ones -- and a wrong key fails at runtime exactly like a signed-out visitor.

WHAT IT CHECKS

Every .html/.js/.json file that ships (the same exclusions as
scripts/vercel-build.sh) may only contain:
  - the publishable key bg.js declares, and
  - the Supabase project host bg.js declares.

Usage:
  python3 scripts/supabase-client-key-contract.py         # exit 1 on a mismatch
  python3 scripts/supabase-client-key-contract.py --help  # this text
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
EXCLUDE = ('public', '.git', 'node_modules', 'tests', 'scripts', 'supabase',
           'core', 'docs', 'vendor')
KEY_RE = re.compile(r'sb_publishable_[A-Za-z0-9_-]+')
HOST_RE = re.compile(r'https://([a-z0-9]{20})\.supabase\.co')


def canonical(root):
    bg = (root / 'bg.js').read_text(encoding='utf-8', errors='replace')
    url = re.search(r'var URL = "https://([a-z0-9]{20})\.supabase\.co"', bg)
    key = re.search(r'var KEY = "(sb_publishable_[A-Za-z0-9_-]+)"', bg)
    if not url or not key:
        return None, None
    return url.group(1), key.group(1)


def shipped(root):
    for p in root.rglob('*'):
        if not p.is_file() or p.suffix not in ('.html', '.js', '.json'):
            continue
        rel = p.relative_to(root)
        if rel.parts[0] in EXCLUDE:
            continue
        yield rel, p


def findings(root):
    ref, key = canonical(root)
    if not ref:
        return ['bg.js: canonical `var URL`/`var KEY` declaration not found']
    out = []
    for rel, p in shipped(root):
        text = p.read_text(encoding='utf-8', errors='replace')
        for m in set(KEY_RE.findall(text)):
            if m != key:
                out.append('%s: publishable key %s is not bg.js\'s' % (rel, m))
        for m in set(HOST_RE.findall(text)):
            if m != ref:
                out.append('%s: Supabase project %s is not bg.js\'s' % (rel, m))
    return sorted(out)


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0
    bad = findings(ROOT)
    if bad:
        print('SUPABASE CLIENT KEY CONTRACT: FAIL -- %d finding(s)' % len(bad))
        for b in bad:
            print(' - ' + b)
        print('Use window.OmegaSB.get() instead of building a client.')
        return 1
    print('SUPABASE CLIENT KEY CONTRACT: PASS -- one project, one publishable key')
    return 0


if __name__ == '__main__':
    raise SystemExit(main(sys.argv[1:]))
