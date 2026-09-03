#!/usr/bin/env python3
"""Refuse to ship a money claim the platform cannot honour.

WHY THIS EXISTS

CLAUDE.md section 9 requires every monetizable or legally-sensitive feature to
ship dormant behind public.platform_settings, with user-facing copy in future
tense until the flag is on. That rule was enforced by whoever remembered it, so
it was eventually forgotten: ad-network.html shipped to main rendering

    TOTAL REVENUE  $0.10      CREATOR SHARE  $0.07      PLATFORM SHARE  $0.03

to every approved member, above the sentence "Creators earn 70% revenue share".

Measured, not inferred. The dollar figures came from omega-ad-network.js doing

    REVENUE.total        += 0.05;
    REVENUE.creator_share += 0.035;

inside recordImpression(), which fires when a HARD-CODED specimen advertisement
is painted. No advertiser was ever billed, no payout path existed, and the
counter reset to zero on reload -- so it was not even a persistent fiction. A
headless render of that commit shows exactly ["$0.10","$0.07","$0.03"].

That is two distinct failures at once, and this repo has a name for both:
CLAUDE.md section 8.1 class 9 (fabricated data rendered as fact) landing on a
financial surface, and section 9's dormancy rule going unapplied. The cost of
the second is not a broken page -- it is a written, member-visible statement
that people are owed a 70% share of money that does not exist.

WHAT IT CHECKS

  1  EARNINGS CLAIM WITHOUT A GATE
     A client file that states an earnings entitlement -- a revenue share, a
     payout, "creators earn", a percentage cut -- must also reference the gating
     mechanism (platform_settings, data-omega-flag, or OmegaFlags). A page that
     promises members money while naming no flag is either live (and needs
     terms) or dormant (and must say so).

  2  SYNTHESISED CURRENCY
     A module must not accumulate a hard-coded amount into a revenue-shaped
     variable and render it with a currency symbol. That is the exact shape
     above, and it is never correct: real money comes from Stripe or from the
     member's own entry, never from a literal added on render.

WHAT IT DELIBERATELY DOES NOT CHECK

  A page showing the member their OWN figures -- budget, expenses, wealth -- is
  not making a claim about what the platform owes anyone, so a currency symbol
  alone is never a finding. Verified rather than assumed: a headless render of
  contracts, income, marketplace, blockchain, subscriptions, revenue,
  investment, wealth, treasury and payments found zero non-zero currency
  amounts, so this gate starts with no legitimate violations to whitelist.

  It also cannot tell whether a flag is actually FALSE in the live database.
  Naming the gate is what is checkable from source; whether the owner has since
  turned it on is a live question (CLAUDE.md section 8.4 -- a green source check
  never stands in for a live one).

Findings are BLOCKING (exit 1). A false claim about money is not advisory.
"""

import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Files that describe the problem rather than commit it: this gate, its tests,
# the flag module whose whole purpose is the fix, and the audit documents that
# quote the offending strings as evidence.
EXEMPT = {
    'scripts/commerce-contract.py',
    'omega-flags.js',
}
EXEMPT_DIRS = ('scripts/', 'supabase/', '.github/', 'node_modules/', '.git/', 'i18n/')

# An entitlement: a statement that someone RECEIVES money. Anchored on the money
# sense of each word.
#
# The false positives are real and were measured, not guessed -- a first pass
# reported 20 files, of which 13 were noise:
#   "decommission"  matched "commission"      (audio.js, nav.js, omega-a11y.js)
#   "earn points"   matched "you earn"        (i18n.js)
#   "20% share" of effort, not money          (matrix.html)
# so the patterns below require a money-bearing context, and strip_noise() below
# blanks comments and <label> text before any of them run.
CLAIM_PATTERNS = [
    (re.compile(r'(?<![a-z])creators?\s+earn', re.I),                'creators earn'),
    (re.compile(r'revenue\s+shar(?:e|ing)', re.I),                   'revenue share'),
    (re.compile(r'profit\s+shar(?:e|ing)', re.I),                    'profit share'),
    (re.compile(r'earns?\s+\d+\s*%', re.I),                          'earns N%'),
    (re.compile(r'\d+\s*%\s*(?:revenue|payout|commission|cut)', re.I), 'N% of revenue'),
    (re.compile(r'(?<![a-z])payouts?(?![a-z])', re.I),               'payout'),
    (re.compile(r'(?<!de)(?<![a-z])commission\s+(?:rate|of|is|paid|earned)', re.I), 'commission rate'),
    (re.compile(r'you\s+(?:will\s+)?earn\s*\$', re.I),               'you earn $'),
    (re.compile(r'(?<![a-z])get\s+paid(?![a-z])', re.I),             'get paid'),
]

# Naming any of these means the file acknowledges the gating mechanism.
GATE_REF = re.compile(r'platform_settings|data-omega-flag|OmegaFlags', re.I)

# Shape 2: `<revenue-ish>.<field> += 0.05` or `<revenue-ish> += 0.05`
SYNTH = re.compile(
    r'\b([A-Za-z_$][\w$]*(?:\.[\w$]+)?)\s*\+=\s*([0-9]*\.[0-9]+|[0-9]+)\s*[;\n]')
MONEY_NAME = re.compile(r'revenue|earning|payout|balance|income|share|wallet|credit', re.I)
CURRENCY = re.compile(r"['\"]\s*\$|\$'\s*\+|\\\$|toFixed\(2\)")


def client_files():
    out = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in dirnames
                       if d not in ('.git', 'node_modules', 'scripts', 'supabase', 'i18n')
                       and not d.startswith('.')]
        for fn in filenames:
            if not fn.endswith(('.html', '.js')):
                continue
            rel = os.path.relpath(os.path.join(dirpath, fn), ROOT).replace(os.sep, '/')
            if rel in EXEMPT or rel.startswith(EXEMPT_DIRS):
                continue
            out.append(rel)
    return sorted(out)


BLOCK_COMMENT = re.compile(r'/\*.*?\*/', re.S)
HTML_COMMENT = re.compile(r'<!--.*?-->', re.S)
LINE_COMMENT = re.compile(r'^[ \t]*//[^\n]*$', re.M)
# A <label> names a control the MEMBER fills in. contracts.html's contract
# calculator has <label>COMMISSION RATE (%)</label> over an input the member
# edits -- that is the member's own arithmetic, not a statement about what the
# platform pays anyone, so it is not a claim.
LABEL_TEXT = re.compile(r'<label\b[^>]*>.*?</label>', re.S | re.I)


def strip_noise(src, rel):
    """Blank out regions where a money word is discussed, not claimed.

    Replaced with spaces rather than removed, so byte offsets -- and therefore
    reported line numbers -- stay true to the original file.
    """
    def blank(m):
        return re.sub(r'[^\n]', ' ', m.group(0))

    if rel.endswith('.js'):
        src = BLOCK_COMMENT.sub(blank, src)
        src = LINE_COMMENT.sub(blank, src)
    else:
        src = HTML_COMMENT.sub(blank, src)
        src = LABEL_TEXT.sub(blank, src)
        # An inline <script> inside a page can carry the same doc comments.
        src = BLOCK_COMMENT.sub(blank, src)
    return src


def line_of(text, idx):
    return text.count('\n', 0, idx) + 1


def check(rel):
    """Return a list of (rule, line, detail) findings for one file."""
    path = os.path.join(ROOT, rel)
    try:
        with open(path, encoding='utf-8') as fh:
            src = fh.read()
    except (OSError, UnicodeDecodeError):
        return []

    findings = []
    gated = bool(GATE_REF.search(src))
    scan = strip_noise(src, rel)

    # Rule 1 -- an entitlement with no gate named anywhere in the file.
    #
    # One finding per FILE, not per pattern. The gate is file-scoped (naming a
    # flag anywhere clears the file), so emitting a separate finding per matched
    # phrase reported the same defect four times at the same line -- these pages
    # are single-line minified HTML, so every match reports as line 1.
    if not gated:
        hits = []
        for pat, label in CLAIM_PATTERNS:
            m = pat.search(scan)
            if m:
                hits.append((label, m))
        if hits:
            first = min(hits, key=lambda h: h[1].start())[1]
            findings.append((
                'UNGATED EARNINGS CLAIM', line_of(scan, first.start()),
                'states %s but names no platform_settings flag, data-omega-flag, '
                'or OmegaFlags gate; first at %r'
                % (', '.join('"%s"' % h[0] for h in hits),
                   first.group(0).strip()[:60])))

    # Rule 2 -- currency synthesised from a literal.
    if CURRENCY.search(scan):
        for m in SYNTH.finditer(scan):
            name, amount = m.group(1), m.group(2)
            if MONEY_NAME.search(name):
                findings.append((
                    'SYNTHESISED CURRENCY', line_of(scan, m.start()),
                    '%s += %s in a file that renders a currency amount; money '
                    'must come from a payment processor or the member, never '
                    'from a literal added on render' % (name, amount)))
    return findings


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0

    files = client_files()
    all_findings = []
    for rel in files:
        for rule, line, detail in check(rel):
            all_findings.append((rel, rule, line, detail))

    print('=' * 68)
    print('COMMERCE CONTRACT')
    print('=' * 68)
    print('  scanned %d client files (.html/.js outside scripts, supabase, i18n)'
          % len(files))
    print()

    if not all_findings:
        print('  OK -- no ungated earnings claim, no synthesised currency.')
        print()
        print('  Note: this proves the SOURCE names a gate. Whether that flag is')
        print('  actually false in the live database is a separate, live check.')
        return 0

    for rel, rule, line, detail in all_findings:
        print('  %s' % rule)
        print('    %s:%d' % (rel, line))
        print('    %s' % detail)
        print()
    print('  %d finding(s) -- BLOCKING.' % len(all_findings))
    print()
    print('  Fix by either: gating the surface behind a platform_settings flag')
    print('  (see supabase/omega_commerce_flags.sql and omega-flags.js), or')
    print('  rewriting the copy so it does not promise money the platform')
    print('  cannot pay. Do not silence this by deleting the word.')
    return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
