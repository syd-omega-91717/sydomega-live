#!/usr/bin/env python3
"""Report which modules bg.js injects at page load that could load later. Report-only, always exits 0.

WHY THIS EXISTS

docs/PLATFORM_COMPLEXITY_ANALYSIS.md lever 1: bg.js injects about 140 modules on every page. Moving one to idle
loading (or to load-on-first-use) is only safe if nothing needs it before it arrives. A grep for readers of a
module's `window.Omega*` global is a candidate generator, not a verdict: omega-bottom-stack.js has no reader of any
global and is still load-bearing, because it publishes CSS custom properties that other modules read through
`var(--x, fallback)` (CLAUDE.md 8.1 class 4b; FIXES_LOG.md 160). So this script looks for the other ways a module
can matter and sorts every immediately-injected module into one bucket:

    NEEDED   another root .js/.html file reads a global this module publishes
    REVIEW   nobody reads its globals, but it has a side effect a reader could depend on: it injects CSS, sets a
             CSS custom property, dispatches or listens for an omega: event, or hooks DOMContentLoaded/MutationObserver/scroll/resize
    SAFE     none of the above. A candidate for idle loading; still confirm by rendering (verify-runtime.js)
    (idle)   already loaded through __omegaIdleAppend

It is a static scan. It cannot see a reader that builds a global's name at run time, so SAFE means "no evidence
of a dependency", never "proven independent".

USAGE
    python3 scripts/module-load-audit.py              # summary + the SAFE list, largest first
    python3 scripts/module-load-audit.py --all        # every module with its bucket and reasons
    python3 scripts/module-load-audit.py --json       # machine-readable
"""
import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PUBLISH = [
    re.compile(r"window\.((?:Omega|omega)\w+)\s*="),
    re.compile(r"window\[\s*['\"]((?:Omega|omega)\w+)['\"]\s*\]\s*="),
]
SIDE_EFFECTS = [
    ("injects CSS", re.compile(r"createElement\(\s*['\"]style['\"]\s*\)|adoptedStyleSheets|insertRule\(")),
    ("sets a CSS custom property", re.compile(r"setProperty\(\s*['\"]--")),
    ("dispatches an event", re.compile(r"dispatchEvent\(|new CustomEvent\(")),
    ("listens for an omega: event", re.compile(r"addEventListener\(\s*['\"]omega[:\w.-]*['\"]")),
    ("hooks DOMContentLoaded", re.compile(r"['\"]DOMContentLoaded['\"]")),
    ("uses a MutationObserver", re.compile(r"new MutationObserver\(")),
    ("listens to scroll/resize", re.compile(r"addEventListener\(\s*['\"](?:scroll|resize)['\"]")),
]


def read(path):
    with open(path, encoding="utf-8", errors="ignore") as fh:
        return fh.read()


def injected_modules(bg):
    """Return {'/x.js': 'now'|'idle'} for every root module bg.js injects, by the call that follows its src."""
    out = {}
    for m in re.finditer(r"'(/[a-z0-9\-]+\.js)'", bg):
        window = bg[m.end():m.end() + 500]
        nxt = re.search(r"'/[a-z0-9\-]+\.js'", window)
        if nxt:
            window = window[:nxt.start()]
        idle = window.find("__omegaIdleAppend(")
        now = window.find("__omegaAppend(")
        if idle != -1 and (now == -1 or idle < now):
            out.setdefault(m.group(1), "idle")
        elif now != -1:
            out.setdefault(m.group(1), "now")
    return out


def audit():
    bg = read(os.path.join(ROOT, "bg.js"))
    files = {}
    for pattern in ("*.js", "*.html"):
        for p in glob.glob(os.path.join(ROOT, pattern)):
            files[os.path.basename(p)] = read(p)
    ident = re.compile(r"\b(?:Omega|omega)\w+")
    tokens = {p: set(ident.findall(t)) for p, t in files.items()}
    rows = []
    for mod, when in sorted(injected_modules(bg).items()):
        name = mod[1:]
        if name not in files or name == "bg.js":
            continue
        src = files[name]
        globs = sorted({g for rx in PUBLISH for g in rx.findall(src)})
        readers = sorted(p for p, toks in tokens.items()
                         if p not in (name, "bg.js") and toks.intersection(globs))
        effects = [label for label, rx in SIDE_EFFECTS if rx.search(src)]
        if when == "idle":
            bucket = "idle"
        elif readers:
            bucket = "NEEDED"
        elif effects:
            bucket = "REVIEW"
        else:
            bucket = "SAFE"
        rows.append({"module": mod, "bytes": len(src.encode("utf-8")), "loads": when, "bucket": bucket,
                     "globals": globs, "readers": readers, "effects": effects})
    return rows


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--all", action="store_true", help="list every module with its bucket and reasons")
    ap.add_argument("--json", action="store_true", help="print machine-readable JSON")
    args = ap.parse_args()
    rows = audit()
    if args.json:
        print(json.dumps(rows, indent=1))
        return 0
    total = sum(r["bytes"] for r in rows)
    print("MODULE LOAD AUDIT (report-only): %d modules injected by bg.js, %d KB" % (len(rows), total // 1024))
    for b in ("NEEDED", "REVIEW", "SAFE", "idle"):
        sel = [r for r in rows if r["bucket"] == b]
        print("  %-7s %3d modules  %5d KB" % (b, len(sel), sum(r["bytes"] for r in sel) // 1024))
    show = rows if args.all else [r for r in rows if r["bucket"] == "SAFE"]
    print("\n%s:" % ("all modules" if args.all else "SAFE candidates (largest first)"))
    for r in sorted(show, key=lambda r: -r["bytes"]):
        why = ", ".join(r["effects"]) if r["effects"] else ("read by %d file(s)" % len(r["readers"]) if r["readers"] else "no evidence of a dependency")
        print("  %-7s %7d  %-40s %s" % (r["bucket"], r["bytes"], r["module"], why))
    return 0


if __name__ == "__main__":
    sys.exit(main())
