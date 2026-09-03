#!/usr/bin/env python3
"""Keep multicolour emoji out of the interface. Blocking.

WHY THIS EXISTS

The brand is one palette on near-black: gold, cyan, crimson, a muted grey.
A colour emoji ignores all of it -- the font supplies its own bitmap, so
`color:var(--gold)` does nothing and the glyph lands as a saturated
multicolour sticker in the middle of monochrome typography. Measured on
2026-09-03 across the client-shipped surface, **92 distinct glyph sequences
rendered in colour**, on 27 pages and 2 modules.

Two of those were not decoration but the brand's own vocabulary:

  * The zodiac signs U+2648..U+2653 -- the platform's twelve-sign system,
    named in `omega-agents.json` and drawn on `cosmos`, `horoscope`,
    `houses`, `elements` -- default to EMOJI presentation, so every one of
    them shipped as a colour sticker rather than as gold type.
  * `⚡`, `⚔`, `❄`, `❤`, `☀`, `☁` carried U+FE0F (VS16), which explicitly
    ASKS for the colour form. Dropping the selector, or swapping it for
    U+FE0E (VS15), pins the same character to its text form.

HOW IT WAS ESTABLISHED, AND HOW TO RE-ESTABLISH IT

Not from the spec tables alone. Each candidate was drawn white-on-black to a
canvas in the harness Chromium and its pixels read back: any channel spread
means the font supplied a colour glyph. That measurement is what proved the
zodiac signs were colour, and what proved every replacement below is not.
Repeat it -- do not reason about presentation from memory -- with the
`verify-in-browser` harness; the recipe is in `FIXES_LOG.md`.

THE THREE RULES

1. No astral-plane pictograph (U+1F300..U+1FAFF). These have NO text form,
   so there is nothing to pin -- they have to be replaced by a typographic
   mark. `FIXES_LOG.md` carries the curated map that was applied.
2. No U+FE0F anywhere. It exists only to request colour.
3. No bare BMP codepoint whose DEFAULT presentation is emoji. These do have
   a text form: append U+FE0E rather than removing the character.

WHAT IT DOES NOT COVER

`supabase/*.sql` -- four applied migration files carry an emoji inside a SQL
comment. They are not client-shipped, nobody sees them, and editing an
already-applied migration is a worse idea than the comment.

Usage:
  python3 scripts/brand-glyph-check.py          # report and gate
"""

import io
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VS16 = '️'   # requests the colour (emoji) form
VS15 = '︎'   # requests the monochrome (text) form

# No text presentation exists for these -- they can only be replaced.
ASTRAL = re.compile('[\U0001F300-\U0001FAFF]')

# BMP codepoints with Emoji_Presentation=Yes: colour unless pinned with VS15.
# Ranges are inclusive pairs, from the Unicode emoji-data property file.
EMOJI_DEFAULT_RANGES = [
    (0x231A, 0x231B), (0x23E9, 0x23EC), (0x23F0, 0x23F0), (0x23F3, 0x23F3),
    (0x25FD, 0x25FE), (0x2614, 0x2615), (0x2648, 0x2653), (0x267F, 0x267F),
    (0x2693, 0x2693), (0x26A1, 0x26A1), (0x26AA, 0x26AB), (0x26BD, 0x26BE),
    (0x26C4, 0x26C5), (0x26CE, 0x26CE), (0x26D4, 0x26D4), (0x26EA, 0x26EA),
    (0x26F2, 0x26F3), (0x26F5, 0x26F5), (0x26FA, 0x26FA), (0x26FD, 0x26FD),
    (0x2705, 0x2705), (0x270A, 0x270B), (0x2728, 0x2728), (0x274C, 0x274C),
    (0x274E, 0x274E), (0x2753, 0x2755), (0x2757, 0x2757), (0x2795, 0x2797),
    (0x27B0, 0x27B0), (0x27BF, 0x27BF), (0x2B1B, 0x2B1C), (0x2B50, 0x2B50),
    (0x2B55, 0x2B55),
    # Emoji_Presentation=No in the spec, but MEASURED colour in Chromium with
    # the fonts this platform actually renders with. The measurement wins.
    (0x270D, 0x270D),
]


# One compiled character class rather than a per-character Python loop: the
# naive version cost 9.3s across the 357 shipped files, which on the single
# serial CI runner is more than every other static gate put together.
EMOJI_DEFAULT = re.compile(
    '([' + ''.join(
        chr(lo) if lo == hi else '%s-%s' % (chr(lo), chr(hi))
        for lo, hi in EMOJI_DEFAULT_RANGES
    ) + '])(?![' + VS15 + VS16 + '])')


def surfaces():
    """Everything a member's browser is served: pages, modules, static data."""
    for name in sorted(os.listdir(ROOT)):
        path = os.path.join(ROOT, name)
        if os.path.isfile(path) and name.rsplit('.', 1)[-1] in ('html', 'js', 'json'):
            yield name, path
    i18n = os.path.join(ROOT, 'i18n')
    if os.path.isdir(i18n):
        for name in sorted(os.listdir(i18n)):
            if name.endswith('.json'):
                yield 'i18n/' + name, os.path.join(i18n, name)


def scan(name, text):
    out = []
    for m in ASTRAL.finditer(text):
        out.append((m.start(), m.group(0), 'astral-plane pictograph, no text form -- replace it'))
    for m in re.finditer(VS16, text):
        prev = text[m.start() - 1] if m.start() else '?'
        out.append((m.start(), prev + VS16, 'U+FE0F requests the colour form -- use U+FE0E'))
    for m in EMOJI_DEFAULT.finditer(text):
        out.append((m.start(), m.group(1), 'defaults to colour -- append U+FE0E'))
    return out


def line_of(text, offset):
    return text.count('\n', 0, offset) + 1


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0

    findings = []
    scanned = 0
    for name, path in surfaces():
        try:
            text = io.open(path, encoding='utf-8').read()
        except (UnicodeDecodeError, OSError):
            continue
        scanned += 1
        for offset, glyph, why in scan(name, text):
            findings.append((name, line_of(text, offset), glyph, why))

    print('=' * 70)
    print('BRAND GLYPH CHECK  --  no colour emoji in a monochrome interface')
    print('=' * 70)
    print('  %d client-shipped file(s) scanned' % scanned)

    if not findings:
        print('  OK -- every symbol renders in the brand palette.')
        return 0

    print('  %d colour-emoji occurrence(s) in %d file(s) -- BLOCKING.'
          % (len(findings), len(set(f[0] for f in findings))))
    for name, line, glyph, why in findings[:40]:
        print('    %-26s :%-5d  %s  U+%04X  %s'
              % (name, line, glyph[0], ord(glyph[0]), why))
    if len(findings) > 40:
        print('    ... and %d more' % (len(findings) - 40))
    return 1


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
