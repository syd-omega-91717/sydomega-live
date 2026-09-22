#!/usr/bin/env python3
"""Gate the cross-module contracts: a value one module PUBLISHES and another READS.

WHY THIS EXISTS

FIXES_LOG.md 160. `omega-bottom-stack.js` publishes two custom properties that
`omega-legal.js`, `omega-pwa.js`, `omega-share.js` and `bg.js`'s floating ladder
all read. A one-line rewrite of bg.js's injected stylesheet silently deleted the
module's only injection, and every reader kept working -- because each reads its
value through `var(--omega-chrome-bottom, 0px)`, and the fallback that makes the
module safe to load late is exactly what makes its absence invisible. The
platform shipped eight days with the consent banner back on top of the mobile
navigation. `node --check` passed. `audit.py` logged a WARNING among fourteen.

That is CLAUDE.md 8.1 class 4(b) -- *a shared accessor that nothing publishes* --
and it has now produced `window.OmegaSupabase` (11 readers, 1 assigner, on a page
nothing loaded), `window.sb` in omega-hercules.js, and this. It is the repo's
quietest failure class: nothing throws, nothing logs, and a feature simply does
not happen.

WHAT THE FILE-LEVEL CHECK MISSES, AND WHY THIS ONE NEEDS TWO FACTS

A scan of publishers and readers across `*.js` would NOT have caught it. The
publisher existed on disk the whole time and published correctly; it was never
loaded. So a contract is intact only when BOTH hold:

    1. some module publishes the value, AND
    2. that publisher is REACHABLE -- injected by a loader, or pulled in by a
       module that is, transitively from the real roots.

This script asserts the conjunction. Run against the tree one commit before the
fix, it names `--omega-chrome-bottom` and `--omega-transient-bottom`; run
against the fix, it does not. That A/B is the only evidence that a green result
here means anything (see `scripts/tests/test_module_contract.py`, which pins
both halves plus a planted violator).

WHAT COUNTS AS A CONTRACT

  custom properties   `setProperty('--omega-x', …)` publishes; `var(--omega-x…)`
                      reads. Scoped to the `--omega-` prefix: the palette tokens
                      are declared in stylesheets by three separate owners
                      (CLAUDE.md 4) and are not module-to-module contracts.
  shared accessors    `window.OmegaThing = …` publishes; `window.OmegaThing`
                      elsewhere reads.

A module that reads only what it itself publishes is not a contract and is
ignored. A reader that is itself unreachable is reported separately and does not
fail the gate -- dead code reading dead code breaks nothing today.

Exit 0 when every contract read by reachable code has a reachable publisher.
"""

import argparse
import collections
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---- what publishes, and what reads -------------------------------------
PROP_READ = re.compile(r"var\(\s*(--omega-[a-z0-9-]+)")
PROP_PUB = re.compile(
    r"setProperty\(\s*['\"](--omega-[a-z0-9-]+)['\"]"      # direct
    r"|=\s*['\"](--omega-[a-z0-9-]+)['\"]"                  # via a PROP constant
)
GLOB_PUB = re.compile(r"window\.(Omega[A-Za-z0-9_]+)\s*=(?!=)")
GLOB_READ = re.compile(r"window\.(Omega[A-Za-z0-9_]+)")

# ---- reachability, mirrored from audit.py's module graph ----------------
# Deliberately re-derived rather than imported: audit.py resolves its own ROOT
# and chdir()s, so it cannot be pointed at a fixture. test_module_contract.py
# asserts the two agree, so a change to one that the other misses is caught.
LOADERS = ("bg.js", "nav.js")
SRC_ASSIGN_RE = re.compile(r"""\.src\s*=\s*['"]([^'"]+\.js)['"]""")
ESM_IMPORT_RE = re.compile(
    r"""(?:\bimport\s*\(\s*|\bimport\b[^;'"]*?\bfrom\s*|\bimport\s*)['"]([^'"]+\.js)['"]"""
)
REMOTE_RE = re.compile(r"""^(?:[a-z][a-z0-9+.-]*:)?//""", re.I)
SCRIPT_TAG_RE = re.compile(r"""<script[^>]+src=(?:["']([^"']+)["']|([^\s>"'=]+))""")


def read(path):
    try:
        with open(path, encoding="utf-8", errors="replace") as fh:
            return fh.read()
    except OSError:
        return ""


def strip_comments(src):
    """Remove // and /* */ comments, leaving string literals intact.

    Not cosmetic. Writing the fix for `window.OmegaCelebrate` meant NAMING it in
    the comment that explains it, and this scanner then read its own explanation
    as a live read and kept failing. A scanner that counts prose about a bug as
    the bug cannot be used to prove the bug is gone. `evidence-audit.py` hit the
    same class from the other side (a table named `as`, captured out of a string
    literal) -- so strings stay, comments go.
    """
    out, i, n = [], 0, len(src)
    quote = None
    while i < n:
        c = src[i]
        if quote:
            out.append(c)
            if c == "\\" and i + 1 < n:
                out.append(src[i + 1]); i += 2; continue
            if c == quote:
                quote = None
            i += 1
            continue
        if c in "\"'`":
            quote = c; out.append(c); i += 1; continue
        if c == "/" and i + 1 < n:
            if src[i + 1] == "/":
                j = src.find("\n", i)
                i = n if j < 0 else j
                continue
            if src[i + 1] == "*":
                j = src.find("*/", i + 2)
                i = n if j < 0 else j + 2
                out.append(" ")
                continue
        out.append(c); i += 1
    return "".join(out)


def basename(ref):
    return ref.split("/")[-1].split("?")[0]


def edges_from(path):
    src = read(path)
    return {
        basename(m)
        for m in SRC_ASSIGN_RE.findall(src) + ESM_IMPORT_RE.findall(src)
        if not REMOTE_RE.match(m)
    }


def reachable_modules():
    """Every .js reachable from the real roots: the loaders, plus anything a
    page includes with its own <script> tag. Expanding from every .js on disk
    instead would let two dead modules vouch for each other."""
    roots = {f for f in LOADERS if os.path.exists(f)}
    for page in (f for f in os.listdir(".") if f.endswith(".html")):
        for a, b in SCRIPT_TAG_RE.findall(read(page)):
            roots.add(basename(a or b))
    seen = set(roots)
    queue = [m for m in roots if m.endswith(".js") and os.path.exists(m)]
    while queue:
        for dep in edges_from(queue.pop()) - seen:
            seen.add(dep)
            if os.path.exists(dep):
                queue.append(dep)
    # A service worker is reached by navigator.serviceWorker.register(), never a
    # <script> tag or an injected src, so the closure cannot see it. audit.py
    # exempts it for the same reason; a module it publishes to is still live.
    seen |= {f for f in os.listdir(".") if f == "sw.js"}
    # Names the graph asked for that are not files on disk (a vendored bundle,
    # a typo) are not modules and must not inflate the count.
    return {m for m in seen if m.endswith(".js") and os.path.exists(m)}


def collect():
    pub = collections.defaultdict(set)
    rd = collections.defaultdict(set)
    for f in sorted(x for x in os.listdir(".") if x.endswith(".js")):
        src = strip_comments(read(f))
        for a, b in PROP_PUB.findall(src):
            pub[a or b].add(f)
        for name in PROP_READ.findall(src):
            rd[name].add(f)
        for name in GLOB_PUB.findall(src):
            pub["window." + name].add(f)
        for name in GLOB_READ.findall(src):
            rd["window." + name].add(f)
    for name in list(rd):
        rd[name] -= pub.get(name, set())     # self-reads are not contracts
    return pub, rd


def main():
    ap = argparse.ArgumentParser(description=__doc__.strip().splitlines()[0])
    ap.add_argument("--verbose", action="store_true",
                    help="also list the healthy contracts")
    args = ap.parse_args()

    os.chdir(ROOT)
    live = reachable_modules()
    pub, rd = collect()

    broken, dormant, healthy = [], [], []
    for name in sorted(rd):
        readers = sorted(rd[name])
        live_readers = [r for r in readers if r in live]
        publishers = sorted(pub.get(name, ()))
        live_pubs = [p for p in publishers if p in live]
        if live_pubs:
            healthy.append((name, live_pubs, live_readers))
        elif live_readers:
            broken.append((name, publishers, live_readers))
        elif readers:
            dormant.append((name, publishers, readers))
        # no readers left after removing self-reads: an internal value, not a
        # contract. A module assigning its own namespace and using it is normal.

    print("=" * 68)
    print("MODULE CONTRACTS  --  published/read values across module boundaries")
    print("=" * 68)
    print(f"  reachable modules: {len(live)}   contracts: "
          f"{len(healthy) + len(broken) + len(dormant)}")

    if args.verbose:
        for name, p, r in healthy:
            print(f"  ok    {name:32s} {','.join(p)} -> {len(r)} reader(s)")

    if dormant:
        print(f"\n  note -- read only by unreachable modules ({len(dormant)}), "
              f"not gating:")
        for name, p, r in dormant:
            print(f"    {name:32s} read by {', '.join(r)}")

    if broken:
        print(f"\n  BROKEN CONTRACT ({len(broken)}) -- reachable code reads a "
              f"value nothing reachable publishes:")
        for name, p, r in broken:
            where = (f"published only by UNREACHABLE {', '.join(p)}"
                     if p else "published by NOTHING")
            print(f"    {name}")
            print(f"      {where}")
            print(f"      read by: {', '.join(r)}")
        print("\n  Every reader guards or falls back, so nothing throws and "
              "nothing logs --")
        print("  the feature simply does not happen. See FIXES_LOG.md 160.")
        print("\nMODULE CONTRACTS: FAILED")
        return 1

    print("\nMODULE CONTRACTS: PASSED")
    return 0


if __name__ == "__main__":
    sys.exit(main())
