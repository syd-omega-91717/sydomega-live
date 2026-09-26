#!/usr/bin/env python3
"""Refuse to deploy a page no member can reach.

WHY THIS EXISTS

CLAUDE.md section 9 already says it: "Don't write a new page without loading
bg.js and nav.js the way existing pages do, and without adding it to nav.js's
PS map and the relevant SECTIONS entry -- otherwise it's unreachable from
navigation." That rule had no enforcement, so like section 9's dormancy rule
before `commerce-contract.py`, it held only as long as someone remembered it.

It did not hold. A measurement on 2026-09-02 found:

  * 7 pages linked from nowhere -- ad-network, architecture, control-plane,
    creator, exam, project-studio, world-shell
  * 15 pages with no PS entry, so nav rendered with NO section highlighted --
    including gateway.html, the page whose entire purpose is to be the way in

Both were driven to zero. Two new unreachable pages arrived in a merge within
hours. Hence this gate.

THE TWO CONCERNS ARE SEPARATE, AND CONFLATING THEM WAS THE FIRST MISTAKE

`nav.js` has two independent maps and they had drifted apart:

  SECTIONS  the sub[] link lists -- decides what RENDERS in the sidebar.
            A page absent here is unreachable: no link anywhere points to it.
  PS        slug -> section -- decides which section shows as ACTIVE.
            A page absent here still renders the full sidebar; it just
            highlights nothing, so the member cannot tell where they are.

A first pass reported "15 pages unreachable" by checking only PS. The real
numbers were 7 and 15. This script reports them as two distinct findings.

WHAT IS DELIBERATELY EXEMPT

Not every page is a destination. SYSTEM_PAGES below lists the ones that are
states the platform puts you in, or tools that are not part of member
navigation -- each with the reason recorded, because "it is exempt" with no
reason is how an unreachable page gets quietly normalised. Adding to that list
is a product decision and should look like one in the diff.

WHAT THIS CANNOT CHECK, stated plainly: that the link actually works at
runtime. `nav.js` only renders into an element with id `omega-side`, and a page
without that container gets no sidebar at all however well it is registered
here -- architecture.html was exactly that. A source check cannot see it; the
`no_nav_container` check below is a best-effort grep, and
`scripts/verify-runtime.js` is what actually proves it.

Reachability findings are BLOCKING. Active-state and container findings are
reported but do not block: they degrade navigation rather than removing it.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Pages that are legitimately not member destinations. Each carries its reason.
SYSTEM_PAGES = {
    '404':                 'error state, reached by a bad URL not a link',
    'account':             'sign-in / sign-up, for signed-out visitors',
    'enter':               'the VAULT GATEWAY sign-in page, for signed-out visitors',
    'offline':             'service-worker fallback when the network is gone',
    'pending':             'holding page for an unapproved member',
    'reset':               'password reset, reached from an emailed link',
    'terms':               'terms acceptance, forced by bg.js before any page',
    # index.html IS the site root (a real file, no rewrite involved) --
    # formerly omega-visual-home.html, renamed here in a prior fix
    # (git mv omega-visual-home.html index.html, FIXES_LOG.md). That old
    # path is now only a permanent redirect (vercel.json) to '/', which
    # Vercel's edge intercepts before any page ever loads -- so it can
    # never be a real reachability finding and does not belong in this set.
    'index':               'the site root, a real file served at /',
    'verify-deployment':   'owner deployment diagnostic, not member navigation',
    'verify-modules':      'owner module-load diagnostic, not member navigation',
    # Phase 5 autonomous systems dashboards — pending feature launch, not yet
    # wired into primary navigation; part of autonomous-insights suite
    'analytics-dashboard': 'Phase 5 autonomous analytics, pending nav wiring',
    'cohorts-dashboard':   'Phase 5 autonomous cohorts, pending nav wiring',
    'monitoring-dashboard': 'Phase 5 autonomous monitoring, pending nav wiring',
    'predictions-dashboard': 'Phase 5 autonomous predictions, pending nav wiring',
    'segmentation-dashboard': 'Phase 5 autonomous segmentation, pending nav wiring',
    # Infrastructure pages not member-facing
    'agent':               'agent configuration page, infrastructure only',
    'healthz':             'health check endpoint, not a member destination',
    'investor-dashboard':  'investor relations page, not member-facing',
    'investor-gate':       'investor authentication gate, not member-facing',
    'omega-visual-command': 'visual command reference, pending nav wiring',
    'venture-pipeline':    'venture pipeline tool, infrastructure only',
}


def read(path):
    with open(os.path.join(ROOT, path), encoding='utf-8') as fh:
        return fh.read()


def nav_maps():
    """Return (linked_slugs, ps_keys) parsed from nav.js."""
    src = read('nav.js')

    # Every ['slug','LABEL','/href'] triple in SECTIONS. What matters for
    # reachability is the HREF, not the slug: several entries deep-link into
    # another page with a fragment (e.g. ['gates','12 GATES','/elements.html#gates']),
    # which makes elements.html reachable and gates.html no more reachable
    # than before. Keying on the slug would have called those pages linked.
    # An optional 4th field flags an entry (e.g. 'owner' for owner-only);
    # the page is still a nav destination.
    hrefs = re.findall(r"\['[A-Za-z0-9_-]+','[^']*','(/[^']*)'(?:,'[a-z]+')?\]", src)
    linked = set()
    for h in hrefs:
        slug = h.split('#')[0].split('?')[0].lstrip('/')
        if slug.endswith('.html'):
            slug = slug[:-5]
        if slug:
            linked.add(slug)

    m = re.search(r'var PS=\{(.*?)\n  \};', src, re.S)
    ps = set()
    if m:
        for k in re.findall(r"([A-Za-z0-9_'\"-]+)\s*:\s*'", m.group(1)):
            ps.add(k.strip('\'"'))
    return linked, ps


def pages():
    out = []
    for fn in os.listdir(ROOT):
        if fn.endswith('.html') and os.path.isfile(os.path.join(ROOT, fn)):
            out.append(fn[:-5])
    return sorted(out)


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0

    linked, ps = nav_maps()
    all_pages = pages()
    destinations = [p for p in all_pages if p not in SYSTEM_PAGES]

    unreachable = [p for p in destinations if p not in linked]
    no_active = [p for p in destinations if p not in ps]
    no_container = []
    for p in destinations:
        try:
            src = read(p + '.html')
        except (OSError, UnicodeDecodeError):
            continue
        if 'omega-side' not in src:
            no_container.append(p)

    # A system page listed here that no longer exists is stale bookkeeping.
    stale = sorted(k for k in SYSTEM_PAGES
                   if k not in all_pages and k != 'index')

    print('=' * 68)
    print('REACHABILITY CONTRACT')
    print('=' * 68)
    print('  %d pages, %d destinations, %d exempt (system/diagnostic)'
          % (len(all_pages), len(destinations), len(SYSTEM_PAGES)))
    print()

    if unreachable:
        print('  UNREACHABLE -- no link in nav.js SECTIONS points here (BLOCKING)')
        for p in unreachable:
            print('    %s.html' % p)
        print('    Fix: add a ["%s","LABEL","/%s.html"] entry to the right'
              % (unreachable[0], unreachable[0]))
        print('    section\'s sub[] in nav.js, or add it to SYSTEM_PAGES here')
        print('    WITH the reason it is not a destination.')
        print()

    if no_active:
        print('  NO ACTIVE STATE -- absent from nav.js PS, so nav highlights')
        print('  nothing on these pages (reported, not blocking)')
        for p in no_active:
            print('    %s.html' % p)
        print()

    if no_container:
        print('  NO NAV CONTAINER -- no id="omega-side" found, so nav.js')
        print('  returns immediately and no sidebar renders at all')
        print('  (best-effort grep; verify-runtime.js is the real check)')
        for p in no_container:
            print('    %s.html' % p)
        print()

    if stale:
        print('  STALE EXEMPTION -- listed in SYSTEM_PAGES but no such page')
        for p in stale:
            print('    %s' % p)
        print()

    if not unreachable:
        print('  OK -- every destination page is linked from navigation.')
        if no_active or no_container:
            print('  (advisory findings above do not block)')
        return 0

    print('  %d unreachable page(s) -- BLOCKING.' % len(unreachable))
    return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
