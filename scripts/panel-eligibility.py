#!/usr/bin/env python3
"""Panel eligibility registry: which pages may be hosted IN PLACE by omega-panels.js.

WHY THIS EXISTS

docs/OMEGA_ONE_SHELL_PLAN.md (stage 1). The platform is becoming one persistent shell whose views are the existing
pages. The shell must never try to host a page that cannot be hosted, and must never host one that policy keeps
standalone. `scripts/panel-census.js` MEASURES hostability in a browser (about 10 minutes, headless Chromium); this
script turns that measurement into a committed registry, `config/omega-panel-eligibility.json`, and keeps it honest
in CI without needing a browser.

STATUSES (one per root *.html page, exactly one entry each)

  hostable                 loaded in a panel with content (>= 40 chars), 0 page errors, host not navigated away
  needs-fix                could not load, threw, or showed nothing: a defect to fix, not a policy
  navigates-away           moves the host elsewhere on load (redirect stub, or an auth redirect); stays a link
  standalone-by-policy     public / signed-out page that must render on its own (account, enter, reset, terms, ...)
  excluded-pending-review  payments, KYC, privacy, wallet, subscriptions, marketplace: not hosted until the owner
                           reviews them, even if the census says they would load (docs/OMEGA_ONE_SHELL_PLAN.md §10)
  unmeasured               the census host itself (life.html); not measured because it hosts the others

WHAT --check ENFORCES (static, no browser)

  1. the registry covers exactly the root *.html pages: none missing, none extra, none twice
  2. every status is one of the above; every non-hostable page gives a reason
  3. policy pages carry the status policy requires; no excluded page is ever `hostable`
  4. a `hostable` page records 0 errors and >= 40 chars of content
  5. every page `omega-single-page-workspaces.js` enables as a panel (PANELS) is `hostable`
  6. the `counts` block equals the entries

WHAT IT DOES NOT PROVE

That a page is hostable NOW. The measurement is a point in time (`generated_from`), and a page edited afterwards
may have changed. `--check` reports how many pages changed since they were measured (a warning, never a failure,
because every unrelated page edit would otherwise fail CI); re-run the census and `--build` to refresh. "Loads with
content and no error" is also not "behaves the same as standalone": enabling a page as a hub tab still needs the
stricter comparison named in omega-panels.js.

USAGE

  python3 scripts/panel-eligibility.py                 # --check (default)
  python3 scripts/panel-eligibility.py --summary       # counts per status
  python3 scripts/panel-eligibility.py --build DIR     # DIR holds census-*.json from scripts/panel-census.js
"""
import argparse
import datetime
import glob
import hashlib
import json
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REGISTRY = os.path.join(ROOT, 'config', 'omega-panel-eligibility.json')
WORKSPACES_JS = os.path.join(ROOT, 'omega-single-page-workspaces.js')

HOST = 'life'  # the census host (a hub that already loads the engine); it cannot be measured inside itself
HOST_URL = '/life.html'

STATUSES = ('hostable', 'needs-fix', 'navigates-away', 'standalone-by-policy', 'excluded-pending-review', 'unmeasured')
MIN_TEXT = 40

# bg.js exempts these from the approval guard because they must render for signed-out visitors (CLAUDE.md section 3),
# plus 404. A signed-out page cannot live inside a member shell.
STANDALONE_BY_POLICY = {
    'account': 'public / signed-out page; must render on its own',
    'enter': 'public / signed-out page; must render on its own',
    'reset': 'public / signed-out page; must render on its own',
    'terms': 'public / signed-out page; must render on its own',
    'pending': 'public / signed-out page; must render on its own',
    'index': 'public front door; must render on its own',
    '404': 'error page; must render on its own',
}
# docs/OMEGA_ONE_SHELL_PLAN.md section 10: payments, KYC, consent and privacy stay out until reviewed. Wallet,
# subscriptions and marketplace handle money and are held to the same rule.
EXCLUDED_PENDING_REVIEW = {
    'kyc': 'KYC / identity documents: owner review required before hosting in a shell',
    'privacy': 'privacy controls: owner review required before hosting in a shell',
    'wallet': 'handles money: owner review required before hosting in a shell',
    'subscriptions': 'handles money: owner review required before hosting in a shell',
    'marketplace': 'handles money: owner review required before hosting in a shell',
}


def root_pages(root=ROOT):
    return sorted(os.path.splitext(f)[0] for f in os.listdir(root) if f.endswith('.html'))


def page_hash(key, root=ROOT):
    with open(os.path.join(root, key + '.html'), 'rb') as fh:
        return hashlib.sha256(fh.read()).hexdigest()[:12]


def panel_pages(path=WORKSPACES_JS):
    """Distinct pages enabled as in-place panels (PANELS in omega-single-page-workspaces.js)."""
    with open(path, encoding='utf-8') as fh:
        src = fh.read()
    block = re.search(r"var PANELS=\{(.*?)\n  \};", src, re.S)
    if not block:
        raise SystemExit('could not find PANELS in omega-single-page-workspaces.js (layout changed?)')
    out = set()
    for _hub, words in re.findall(r"'/([\w-]+)\.html':'([^']*)'", block.group(1)):
        out.update(words.split())
    return out


def classify(record):
    """One census record (scripts/panel-census.js) -> (status, reason, measured)."""
    key = record['page'][:-5] if record['page'].endswith('.html') else record['page']
    measured = {'text': record.get('text'), 'errors': record.get('errors')}
    if key in STANDALONE_BY_POLICY:
        return 'standalone-by-policy', STANDALONE_BY_POLICY[key], measured
    if key in EXCLUDED_PENDING_REVIEW:
        return 'excluded-pending-review', EXCLUDED_PENDING_REVIEW[key], measured
    err = record.get('error') or ''
    if record.get('failed'):
        return 'needs-fix', 'the engine could not load it ("could not load here")', measured
    if 'context was destroyed' in err or (record.get('navigated') not in (None, HOST_URL)):
        return 'navigates-away', 'moves the host page elsewhere on load (redirect stub or auth redirect)', measured
    if err:
        return 'needs-fix', 'census error: ' + err[:100], measured
    if (record.get('errors') or 0) > 0:
        return 'needs-fix', 'page error: ' + (record.get('firstError') or '?')[:100], measured
    if (record.get('text') or 0) < MIN_TEXT:
        return 'needs-fix', 'loaded but shows no visible content', measured
    return 'hostable', '', measured


def build(census_dir, root=ROOT, today=None):
    records = []
    for path in sorted(glob.glob(os.path.join(census_dir, 'census-*.json'))):
        with open(path, encoding='utf-8') as fh:
            records.extend(json.load(fh))
    seen = {}
    for r in records:
        seen[r['page'][:-5]] = r
    pages = {}
    for key in root_pages(root):
        if key == HOST:
            pages[key] = {'status': 'unmeasured', 'reason': 'the census host; it hosts the others, so it is not measured'}
            continue
        if key not in seen:
            raise SystemExit('census has no record for %s.html; run the census over every page' % key)
        status, reason, measured = classify(seen[key])
        entry = {'status': status}
        if reason:
            entry['reason'] = reason
        entry['measured'] = measured
        entry['sha'] = page_hash(key, root)
        pages[key] = entry
    extra = sorted(set(seen) - set(pages))
    if extra:
        print('note: census records for pages that no longer exist were ignored: ' + ', '.join(extra))
    try:
        sha = subprocess.run(['git', '-C', root, 'rev-parse', '--short', 'HEAD'], capture_output=True, text=True).stdout.strip()
    except OSError:
        sha = ''
    return {
        'schema': 1,
        'generated_from': {
            'census_date': today or datetime.date.today().isoformat(),
            'method': 'scripts/panel-census.js: each page mounted as an omega-panels.js panel inside life.html, 2.5 s, '
                      'headless Chromium, Supabase stubbed. Proves "loads with content and no page error", not parity '
                      'with the standalone page.',
            'host': HOST_URL,
            'min_text_chars': MIN_TEXT,
            'repo_head': sha,
        },
        'counts': count(pages),
        'pages': pages,
    }


def count(pages):
    c = {s: 0 for s in STATUSES}
    for e in pages.values():
        c[e.get('status')] = c.get(e.get('status'), 0) + 1
    return c


def check(reg, pages_on_disk, panels, root=ROOT):
    """Pure validation. Returns (errors, warnings)."""
    errors, warnings = [], []
    if not isinstance(reg, dict) or reg.get('schema') != 1:
        return ['registry: schema must be 1'], warnings
    entries = reg.get('pages')
    if not isinstance(entries, dict):
        return ['registry: "pages" must be an object'], warnings
    disk = set(pages_on_disk)
    have = set(entries)
    for k in sorted(disk - have):
        errors.append('%s.html is not in the registry (add it: re-run the census and --build)' % k)
    for k in sorted(have - disk):
        errors.append('%s is in the registry but %s.html does not exist (remove it)' % (k, k))
    for k, e in sorted(entries.items()):
        st = e.get('status')
        if st not in STATUSES:
            errors.append('%s: status %r is not one of %s' % (k, st, ', '.join(STATUSES)))
            continue
        if st != 'hostable' and not (e.get('reason') or '').strip():
            errors.append('%s: status %s needs a reason' % (k, st))
        if k in STANDALONE_BY_POLICY and st != 'standalone-by-policy':
            errors.append('%s: policy requires standalone-by-policy, registry says %s' % (k, st))
        if k in EXCLUDED_PENDING_REVIEW and st != 'excluded-pending-review':
            errors.append('%s: policy requires excluded-pending-review, registry says %s (never hostable until reviewed)' % (k, st))
        if st == 'hostable':
            m = e.get('measured') or {}
            if (m.get('errors') or 0) != 0:
                errors.append('%s: hostable but measured %s page error(s)' % (k, m.get('errors')))
            if (m.get('text') or 0) < MIN_TEXT:
                errors.append('%s: hostable but measured only %s chars of content (< %d)' % (k, m.get('text'), MIN_TEXT))
    for k in sorted(panels):
        e = entries.get(k)
        if e is None:
            errors.append('%s is enabled as a panel (PANELS) but is not in the registry' % k)
        elif e.get('status') != 'hostable':
            errors.append('%s is enabled as a panel (PANELS) but the registry says %s' % (k, e.get('status')))
    if reg.get('counts') != count(entries):
        errors.append('counts block does not match the entries (re-run --build)')
    gen = reg.get('generated_from') or {}
    if not gen.get('census_date'):
        errors.append('generated_from.census_date is missing')
    changed = 0
    for k, e in entries.items():
        if k in disk and e.get('sha'):
            try:
                if page_hash(k, root) != e['sha']:
                    changed += 1
            except OSError:
                pass
    if changed:
        warnings.append('%d page(s) changed since they were measured; re-run the census and --build to refresh' % changed)
    return errors, warnings


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0],
                                 epilog='Run with --help for the full docstring in the script header.')
    ap.add_argument('--check', action='store_true', help='validate the committed registry (default)')
    ap.add_argument('--summary', action='store_true', help='print counts per status')
    ap.add_argument('--build', metavar='DIR', help='write the registry from census-*.json files in DIR')
    args = ap.parse_args(argv)

    if args.build:
        reg = build(args.build)
        with open(REGISTRY, 'w', encoding='utf-8') as fh:
            json.dump(reg, fh, indent=1, sort_keys=True, ensure_ascii=False)
            fh.write('\n')
        print('wrote %s: %s' % (os.path.relpath(REGISTRY, ROOT), json.dumps(reg['counts'], sort_keys=True)))
        return 0

    if not os.path.exists(REGISTRY):
        print('FAIL: %s does not exist; run the census then --build' % os.path.relpath(REGISTRY, ROOT))
        return 1
    with open(REGISTRY, encoding='utf-8') as fh:
        reg = json.load(fh)
    if args.summary:
        for s, n in reg.get('counts', {}).items():
            print('%-26s %d' % (s, n))
        return 0
    errors, warnings = check(reg, root_pages(), panel_pages())
    for w in warnings:
        print('warning: ' + w)
    if errors:
        print('PANEL ELIGIBILITY: FAIL (%d)' % len(errors))
        for e in errors:
            print('  ' + e)
        return 1
    c = reg['counts']
    print('PANEL ELIGIBILITY: PASS - %d pages: %d hostable, %d needs-fix, %d navigates-away, %d standalone-by-policy, '
          '%d excluded-pending-review, %d unmeasured' % (len(reg['pages']), c['hostable'], c['needs-fix'],
          c['navigates-away'], c['standalone-by-policy'], c['excluded-pending-review'], c['unmeasured']))
    return 0


if __name__ == '__main__':
    sys.exit(main())
