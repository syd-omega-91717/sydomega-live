#!/usr/bin/env python3
"""Keep the Ω MORPH view-transition block identical in every root page's <head>.

Cross-document View Transitions need BOTH documents to opt in, and the incoming
one must have opted in by its first rendering opportunity. bg.js injects its
stylesheet from a deferred script, which cannot be relied on for that. So the
opt-in (an inline <style>) and a synchronous <script src="/omega-morph.js">,
whose handlers name the morphing element on each side, sit at the top of every
page's <head>. The script is external, not inline, so the CSP inline ratchet
(scripts/csp-inline-ratchet.py) keeps moving one way. This file is the single
source of the block.

Usage:
  python3 scripts/omega-morph-sync.py          rewrite pages so each carries BLOCK
  python3 scripts/omega-morph-sync.py --check  exit 1 if any page lacks it or drifted
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
START = "<!-- omega-morph:start -->"
END = "<!-- omega-morph:end -->"

# The dark first-paint background: the incoming page used to paint one frame on
# the browser's default white before any dark style loaded (measured in a
# screencast on main and on this branch alike, brightness 245-255 between two
# dark pages). Low specificity, so any later sheet still owns the background.
STYLE = (
    ":where(html){background-color:#0A0A0F;color-scheme:dark}"
    "@view-transition{navigation:auto}"
    "::view-transition-group(omega-morph){animation-duration:.5s;"
    "animation-timing-function:cubic-bezier(.2,.8,.2,1)}"
    "::view-transition-old(omega-morph),::view-transition-new(omega-morph){height:100%;object-fit:contain}"
    "@media(prefers-reduced-motion:reduce){::view-transition-group(*),::view-transition-old(*),"
    "::view-transition-new(*){animation:none!important}}"
)

SCRIPT_SRC = "/omega-morph.js"

BLOCK = (
    START
    + '<style id="omega-vt">' + STYLE + "</style>"
    + '<script id="omega-vt-morph" src="' + SCRIPT_SRC + '"></script>'
    + END
)

CHARSET = re.compile(r"<meta\s+charset=[^>]*>", re.I)


def pages():
    return sorted(ROOT.glob("*.html"))


def apply(text):
    if START in text:
        return re.sub(re.escape(START) + r".*?" + re.escape(END), lambda _m: BLOCK, text, count=1, flags=re.S)
    m = CHARSET.search(text)
    if not m:
        raise ValueError("no <meta charset>")
    return text[: m.end()] + "\n" + BLOCK + text[m.end():]


def main():
    if "--help" in sys.argv or "-h" in sys.argv:
        print(__doc__.strip())
        return 0
    check = "--check" in sys.argv
    bad = []
    for p in pages():
        text = p.read_text(encoding="utf-8")
        new = apply(text)
        if new != text:
            if check:
                bad.append(p.name)
            else:
                p.write_text(new, encoding="utf-8")
                bad.append(p.name)
    if check:
        if bad:
            print("OMEGA MORPH: FAIL -- %d page(s) missing or drifted: %s" % (len(bad), ", ".join(bad[:10])))
            print("  Fix: python3 scripts/omega-morph-sync.py")
            return 1
        print("OMEGA MORPH: PASS -- %d pages carry the view-transition block" % len(pages()))
        return 0
    print("OMEGA MORPH: wrote %d page(s)" % len(bad))
    return 0


if __name__ == "__main__":
    sys.exit(main())
