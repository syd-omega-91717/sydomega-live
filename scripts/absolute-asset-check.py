#!/usr/bin/env python3
"""Refuse to ship an asset URL on our own domain that resolves to nothing.

WHY THIS EXISTS

`ci-local.sh`'s broken-asset check and `.github/workflows/ci.yml` step 4 both
resolve LOCAL `src=`/`href=` paths against the repo. Neither looks at an
absolute URL, because an absolute URL usually points at a third party nobody
can validate from here.

That blind spot shipped a real defect. Every page's Open Graph and Twitter card
pointed at:

    https://www.sydomega.com/og-image.png

21 references across 11 pages -- and the file did not exist. Fetched against the
live domain on 2026-09-03 it returned **HTTP 404** and Vercel served the
`404.html` body in its place. So every share of this platform on WhatsApp,
iMessage, Slack, X, LinkedIn or Facebook rendered a preview card with a missing
image, for as long as those tags have been there. Nothing in CI could see it:
the reference is well-formed, the host is real, and the path is simply absent.

WHAT THIS CHECKS

Any asset URL whose host is this platform's own domain is really a local path
wearing an absolute URL, so it is resolvable and therefore checkable. Each one
must correspond to a committed file. A URL on any other host is left alone --
this script deliberately makes no network request, so it stays deterministic
and works offline, exactly like the local-path check it extends.

`vercel.json`'s `cleanUrls: true` means `/foo` also serves `/foo.html`, so a
extension-less path is accepted when either spelling exists.

Findings are BLOCKING. A 404 on a shared preview image is not cosmetic: it is
the first thing anyone sees of this platform, and it is invisible from inside
the app.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Hosts that are really this repo. A path under one of these must be committed.
OWN_HOSTS = ('www.sydomega.com', 'sydomega.com')

# Matches an absolute URL on our own host inside any attribute or meta content.
PATTERN = re.compile(
    r'https://(?:www\.)?sydomega\.com(/[A-Za-z0-9._~\-/]*)',
    re.I,
)

# Paths that are pages/routes rather than files, handled by vercel.json.
ROUTE_OK = {'/', ''}


def pages():
    return sorted(f for f in os.listdir(ROOT)
                  if f.endswith('.html') and os.path.isfile(os.path.join(ROOT, f)))


def resolves(rel):
    """True when this path corresponds to something the deploy will serve."""
    if rel in ROUTE_OK:
        return True
    rel = rel.lstrip('/')
    if not rel:
        return True
    if os.path.isfile(os.path.join(ROOT, rel)):
        return True
    # cleanUrls: /terms serves terms.html
    if not os.path.splitext(rel)[1] and os.path.isfile(os.path.join(ROOT, rel + '.html')):
        return True
    return False


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0

    findings = {}          # path -> [pages referencing it]
    total_refs = 0

    for name in pages():
        try:
            with open(os.path.join(ROOT, name), encoding='utf-8', errors='ignore') as fh:
                text = fh.read()
        except OSError:
            continue
        for rel in PATTERN.findall(text):
            # Trailing punctuation from prose/markup is not part of the path.
            rel = rel.rstrip('.,;:)"\'')
            total_refs += 1
            if not resolves(rel):
                findings.setdefault(rel, [])
                if name not in findings[rel]:
                    findings[rel].append(name)

    print('=' * 68)
    print('ABSOLUTE ASSET CONTRACT')
    print('=' * 68)
    print('  %d page(s), %d absolute reference(s) to %s'
          % (len(pages()), total_refs, ' / '.join(OWN_HOSTS)))
    print()

    if not findings:
        print('  OK -- every absolute URL on our own domain resolves to a file.')
        return 0

    print('  UNRESOLVED -- these point at our own domain and 404 there (BLOCKING)')
    for rel, refs in sorted(findings.items()):
        print('    %s' % rel)
        print('      referenced by %d page(s): %s'
              % (len(refs), ', '.join(refs[:6]) + (' ...' if len(refs) > 6 else '')))
    print()
    print('  Fix: commit the file at that path, or point the tag at one that')
    print('  exists. For og-image.png, run: node scripts/build-og-image.js')
    print()
    print('  %d unresolved path(s) -- BLOCKING.' % len(findings))
    return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
