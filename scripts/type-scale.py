#!/usr/bin/env python3
"""Raise the platform's type off the floor, to one professional scale.

WHY THIS EXISTS

The platform was set in microtype. Measured on 2026-09-03 across the estate:

    2,423 px font-size declarations in 172 pages' own <style> blocks
      972  at <= 8px      (twenty of them at 6px)
      909  at 9-11px
      185  at 12-13px
      357  at 14px+

    bg.js's injected stylesheet holds only 24 of them -- 1% of the total.

A render of `dashboard.html` counted **416 visible text elements at <= 11px on
one page**. That is below any usable reading size, and it is why the interface
read as unreadable dark-grey-on-black rather than as cinematic.

The same render also found 52 elements set in Cinzel Decorative at <= 14px, and
the first version of this file called that "the single most amateur-looking
thing in the interface". **That was wrong, and reading the selectors is what
corrected it.** The 116 such rules across 60 pages are overwhelmingly ENTITY
NAMES -- `.award-name`, `.cer-title`, `.ec-name`, `.ad-title`, `.mc-name` --
where a display face is deliberate brand expression, not a mistake. And the
shared system is already correct: bg.js uses `--D` on exactly five rules
(`.topbar .t`, `.topbar-title`, `.kpi-val`, `.bar-val`, `.f-d`), all of them
titles or values.

So the face is REPORTED here and never rewritten. The defect was the size, not
the typeface, and sweeping the family would have stripped brand character from
60 pages to fix a problem that did not exist.

WHY THIS IS A SWEEP AND NOT A TOKEN CHANGE

There is no type-size scale to change. `bg.js`'s `:root` defines three family
tokens and a spacing scale, and no size scale at all -- every size on the
platform is a hardcoded literal. And bg.js cannot override the pages from
above: CLAUDE.md section 4 records that it is stylesheet **1 of 53**, so every
later sheet wins an equal-specificity tie, and the same file's header forbids
reaching for `!important`. The declarations have to be edited where they live.

THE SCALE

Sizes only ever go UP, and nothing at or above the floor moves at all, so no
two sizes can swap order and every relationship above 12px is preserved exactly.
Display type, headings and the large numerals are untouched -- this is a floor,
not a restyle.

    anything below 12px -> 12px
    12px and above      -> unchanged

WHERE IT LOOKS, AND WHY ALL THREE ARE NEEDED

Sweeping only <style> blocks moved the estate from 78% of visible text at <=11px
to 63% -- the rest was not there. Measured, the sub-12px declarations live in
three places:

    2,423  page <style> blocks        (172 pages)
    1,350  inline style= attributes   (per-instance, but overwhelmingly static)
      280  root .js injected CSS      (bg.js 34, nav.js 11, 40+ omega-* modules)

The .js ones matter most per line: bg.js reaches all 186 pages, so one
declaration there sets thousands of elements. All three are swept.

WHAT IT STILL DOES NOT TOUCH

  * A size the code COMPUTES -- `font-size:'+n+'px` and friends. The pattern
    requires literal digits, so an expression is skipped automatically rather
    than being corrupted into a syntax error.
  * Canvas type (`ctx.font='bold 16px serif'`). That is not a `font-size:`
    declaration, so it never matches -- which is correct: canvas text is drawn
    at a size the surrounding geometry depends on.
  * clamp() / calc() / em / rem / % sizes -- only bare `px` literals are in
    scope, so a responsive size keeps its own logic.

VERIFY AFTER RUNNING, ALWAYS

Raising type can overflow a fixed-width container. `node scripts/verify-runtime.js
--all` asserts no horizontal overflow on every page and is the check that proves
this sweep safe; run it, do not assume. `--dry-run` reports the blast radius
without writing.

Usage:
  python3 scripts/type-scale.py --dry-run       # report only (default)
  python3 scripts/type-scale.py --apply         # rewrite the <style> blocks
  python3 scripts/type-scale.py --check         # fail if any page is below floor
"""

import os
import re
import sys
import collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# One floor, deliberately, after a first version got this wrong twice.
#
# The obvious map -- spread 4-11px across 11/12/13px -- is broken two ways, and
# both only showed up when the tool was run against its own output:
#
#   NOT IDEMPOTENT. Its outputs (11,12,13) are also inputs, so a second --apply
#   re-lifted 11px to 13px and kept inflating. A sweep over 172 pages must be
#   safe to re-run; one that silently grows the type each time is a trap.
#
#   IT INVERTED THE HIERARCHY. Lifting 11px to 13px while leaving 12px alone
#   made former-11px text LARGER than former-12px text -- the exact opposite of
#   what those pages had set.
#
# A single floor avoids both: every size below FLOOR becomes FLOOR, every size
# at or above it is untouched. Outputs and inputs are disjoint, so re-running is
# a no-op, and no pair of sizes can swap order because nothing above the floor
# moves.
#
# The cost is honest: the 4-11px band collapses to one size, losing the
# distinction between, say, a 7px sub-label and a 10px label. That distinction
# was not perceptible -- both were unreadable -- and 12px still reads as chrome
# against the 14/16/18px sizes above it, which keep their own relationships.
FLOOR = 12          # professional minimum for interface chrome
SCALE = {}          # no per-size mapping; the floor is the whole rule
DISPLAY_MAX = 14    # the decorative face must not be used at or below this

STYLE_BLOCK = re.compile(r'(<style[^>]*>)(.*?)(</style>)', re.S | re.I)
FONT_SIZE = re.compile(r'(font-size\s*:\s*)([0-9]+(?:\.[0-9]+)?)(px)')


STYLE_ATTR = re.compile(r'(style=")([^"]*)(")')


def pages():
    return sorted(f for f in os.listdir(ROOT)
                  if f.endswith('.html') and os.path.isfile(os.path.join(ROOT, f)))


def scripts():
    """Root .js files, whose injected CSS reaches every page."""
    return sorted(f for f in os.listdir(ROOT)
                  if f.endswith('.js') and os.path.isfile(os.path.join(ROOT, f)))


def rescale_css(css, stats):
    """Rewrite bare px font-sizes inside one CSS string."""
    def sub(m):
        head, num, unit = m.group(1), m.group(2), m.group(3)
        val = float(num)
        # Fractional sizes (7.5px, 10.5px) round to the nearest whole step
        # before mapping, so 10.5px lands with 10px rather than being treated
        # as an unknown and dumped on the bare floor -- which would have made
        # 10.5px SMALLER than 10px after the sweep, inverting a hierarchy the
        # page had deliberately set.
        key = int(round(val))
        new = SCALE.get(key)
        if new is None and val < FLOOR:
            new = FLOOR
        if new is None or new == val:
            stats['kept'] += 1
            return m.group(0)
        stats['changed'] += 1
        stats['moves'][f'{num}px -> {new}px'] += 1
        return f'{head}{new}{unit}'
    return FONT_SIZE.sub(sub, css)


def process(text, stats):
    """A page: its <style> blocks and its inline style= attributes."""
    def block(m):
        return m.group(1) + rescale_css(m.group(2), stats) + m.group(3)
    text = STYLE_BLOCK.sub(block, text)

    def attr(m):
        return m.group(1) + rescale_css(m.group(2), stats) + m.group(3)
    return STYLE_ATTR.sub(attr, text)


def process_script(text, stats):
    """A .js file: any literal `font-size:Npx` wherever it appears.

    These sit inside JS string literals that build CSS. Rewriting only the
    numeric literal cannot change the surrounding syntax, and a computed size
    (`font-size:'+n+'px`) has no digits to match, so it is left alone.
    """
    return rescale_css(text, stats)


def find_small_display(text):
    """Rules that pair the decorative face with a size at or below DISPLAY_MAX.

    Reported, never auto-rewritten: which face a small label should use is a
    design call per rule (Courier Prime for chrome, Rajdhani for prose), and a
    regex guessing it would be exactly the kind of blind sweep that breaks a
    page while looking correct in the diff.
    """
    out = []
    for _, css, _ in STYLE_BLOCK.findall(text):
        for rule in re.findall(r'\{[^}]*\}', css):
            if not re.search(r'font-family\s*:\s*var\(--D\)|Cinzel', rule):
                continue
            m = re.search(r'font-size\s*:\s*([0-9.]+)px', rule)
            if m and float(m.group(1)) <= DISPLAY_MAX:
                out.append(f'{m.group(1)}px')
    return out


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0

    apply_ = '--apply' in argv
    check = '--check' in argv

    stats = {'changed': 0, 'kept': 0, 'moves': collections.Counter()}
    touched, display_hits, below_floor = [], collections.Counter(), []

    for name in pages():
        path = os.path.join(ROOT, name)
        with open(path, encoding='utf-8') as fh:
            text = fh.read()

        for size in find_small_display(text):
            display_hits[name] += 1

        before = stats['changed']
        new = process(text, stats)
        if stats['changed'] > before:
            touched.append((name, stats['changed'] - before))
            if check:
                below_floor.append(name)
            if apply_:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new)

    for name in scripts():
        path = os.path.join(ROOT, name)
        with open(path, encoding='utf-8') as fh:
            text = fh.read()
        before = stats['changed']
        new = process_script(text, stats)
        if stats['changed'] > before:
            touched.append((name, stats['changed'] - before))
            if check:
                below_floor.append(name)
            if apply_:
                with open(path, 'w', encoding='utf-8') as fh:
                    fh.write(new)

    print('=' * 68)
    print('TYPE SCALE' + ('  (APPLIED)' if apply_ else '  (dry run)' if not check else '  (check)'))
    print('=' * 68)
    print('  %d page(s) + %d script(s) scanned, %d unchanged, %d rescaled'
          % (len(pages()), len(scripts()), stats['kept'], stats['changed']))
    print()

    if stats['moves']:
        print('  size moves:')
        for move, n in sorted(stats['moves'].items(),
                              key=lambda kv: -kv[1]):
            print('    %-18s %4d' % (move, n))
        print()

    if touched:
        print('  pages affected: %d  (largest: %s)'
              % (len(touched),
                 ', '.join('%s %d' % t for t in sorted(touched, key=lambda t: -t[1])[:5])))
        print()

    if display_hits:
        total = sum(display_hits.values())
        print('  DECORATIVE FACE AT <=%dpx -- %d rule(s) across %d page(s)'
              % (DISPLAY_MAX, total, len(display_hits)))
        print('  Reported only. Cinzel Decorative is a titling face; a 10px')
        print('  label wants var(--M) or var(--R). Which one is a per-rule')
        print('  design call, so it is not swept blind.')
        for name, n in display_hits.most_common(8):
            print('    %-28s %d' % (name, n))
        print()

    if check:
        if below_floor:
            print('  %d page(s) still declare type below the %dpx floor -- BLOCKING.'
                  % (len(below_floor), FLOOR))
            for n in below_floor[:20]:
                print('    %s' % n)
            return 1
        print('  OK -- no page declares type below the %dpx floor.' % FLOOR)
        return 0

    if not apply_:
        print('  Dry run. Re-run with --apply to write, then verify with:')
        print('    node scripts/verify-runtime.js --all')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
