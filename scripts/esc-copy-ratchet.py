#!/usr/bin/env python3
"""Ratchet local copies of the HTML escaper: new code uses omega-esc.js, it does not paste a 101st copy.

WHY THIS EXISTS

100 root files each defined their own esc() (measured 2026-11-02: 102 definitions). Same intent, many chances to drift,
and four pages had one and still did not call it (FIXES_LOG 208-210). omega-esc.js is now the single definition
(window.OmegaEsc). This gate only lets the number of local copies fall.

WHAT IT COUNTS

Per root *.html / *.js file (omega-esc.js itself excluded), every function or arrow function that
  - is NAMED like an escaper (esc*, escape*, sanitize*, or the one-letter h / e / E / S / x), AND
  - whose own body (the next 300 characters) escapes `&`, `<` and a quote (`&quot;`, `&#39;`, `&#x27;`, `&apos;`).
A bare `const esc = ... OmegaEsc.esc ...` alias is not a copy and is not counted.

HOW TO MIGRATE A PAGE
  1. add <script src="/omega-esc.js"></script> before the script that uses it;
  2. replace the local definition with, at the TOP of the same script block (a const is not hoisted):
         const esc = (window.OmegaEsc && OmegaEsc.esc) || (() => '');
  3. run this script with --update so the baseline falls.

HOW TO MIGRATE A MODULE (a root omega-*.js file)
  A module may run before omega-esc.js has executed, so it must NEVER bind the helper once at load (that would lock in
  the blank fallback). Look it up at CALL time, keep the name and the hoisting:
         function esc(v) { return window.OmegaEsc ? OmegaEsc.esc(v) : ''; }
  bg.js defines window.OmegaEsc itself, before it injects anything, so the lookup always finds it.

THE ONE ALLOWED COPY: bg.js carries a verbatim bootstrap copy of omega-esc.js (see ALLOWED below). It is a deliberate
exception, enforced by scripts/tests/test_omega_esc.py, which executes both and fails on any difference.

A file may not exceed its baseline and a file absent from it must be at 0. --update refuses while anything is over.

Usage: python3 scripts/esc-copy-ratchet.py [--update] [--list]
Exit 0 on pass, 1 when a file is over its baseline.
"""
from __future__ import annotations

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT / "scripts" / "esc-copy-baseline.json"
FUNC = re.compile(
    r"(?:function\s+([A-Za-z_$][\w$]*)\s*\("
    r"|(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*"
    r"(?:function\s*\(|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>))"
)
NAME = re.compile(r"^(?:esc[A-Za-z]*|escape[A-Za-z]*|sanitize[A-Za-z]*|h|e|E|S|x)$")
QUOTE = ("&quot;", "&#39;", "&#x27;", "&apos;")
# Files allowed to carry exactly this many copies, and why. bg.js holds the bootstrap copy of omega-esc.js so that
# window.OmegaEsc exists before any injected module runs; test_omega_esc.py proves it identical to omega-esc.js.
ALLOWED = {"bg.js": 1}


def count(text: str) -> int:
    n = 0
    found = list(FUNC.finditer(text))
    for i, m in enumerate(found):
        name = m.group(1) or m.group(2)
        # The function's own body: at most 300 characters, and never past the next named function. Looking at the next
        # 300 characters alone read the NEIGHBOUR: a short wrapper `esc()` sitting above `glyphText()` was counted as a
        # copy because glyphText's body escapes (the same bug xss-sink-ratchet.py fixed in FIXES_LOG 211).
        stop = found[i + 1].start() if i + 1 < len(found) else len(text)
        body = text[m.end():min(m.end() + 300, stop)]
        if NAME.match(name) and "&amp;" in body and "&lt;" in body and any(q in body for q in QUOTE):
            n += 1
    return n


def counts() -> dict[str, int]:
    out = {}
    for p in sorted(ROOT.glob("*.html")) + sorted(ROOT.glob("*.js")):
        if p.name == "omega-esc.js":
            continue
        n = max(0, count(p.read_text(encoding="utf-8", errors="ignore")) - ALLOWED.get(p.name, 0))
        if n:
            out[p.name] = n
    return out


def main(argv: list[str]) -> int:
    cur = counts()
    if "--list" in argv:
        for k, v in cur.items():
            print(f"{v:2d}  {k}")
        return 0
    base = json.loads(BASELINE.read_text()) if BASELINE.exists() else {}
    base = {k: v for k, v in base.items() if not k.startswith("_")}
    over = {k: (v, base.get(k, 0)) for k, v in cur.items() if v > base.get(k, 0)}
    if "--update" in argv:
        if over and BASELINE.exists():
            print("refusing to update: files are over their baseline:", ", ".join(sorted(over)))
            return 1
        out = {"_doc": "Local copies of the HTML escaper, per root file. May only fall; migrate to omega-esc.js "
                       "(see scripts/esc-copy-ratchet.py)."}
        out.update(dict(sorted(cur.items())))
        BASELINE.write_text(json.dumps(out, indent=1) + "\n")
        print(f"baseline written: {len(cur)} files, {sum(cur.values())} local escaper(s)")
        return 0
    if over:
        print(f"ESC COPY RATCHET FAILED ({len(over)} file(s) over baseline):")
        for k, (v, b) in sorted(over.items()):
            print(f"  {k}: {v} local escaper definition(s), baseline {b}")
        print("Use the shared helper instead: <script src=\"/omega-esc.js\"></script> and")
        print("  const esc = (window.OmegaEsc && OmegaEsc.esc) || (() => '');")
        return 1
    fell = sum(1 for k, v in base.items() if cur.get(k, 0) < v)
    print(f"ESC COPY RATCHET PASSED: {sum(cur.values())} local escaper(s) in {len(cur)} files, none above baseline"
          + (f"; {fell} file(s) below baseline (run --update)" if fell else ""))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(_sys.argv[1:]))
