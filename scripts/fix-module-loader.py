#!/usr/bin/env python3
"""
SYD OMEGA 91717 — fix the four broken module injections in bg.js.

Run from the repository root:  python3 scripts/fix-module-loader.py
Add --dry-run to preview without writing.

BACKGROUND
----------
bg.js injects 65 modules at runtime. Four of them 404 on every page load:

  omega-animate.js  -> file was renamed to omega-animated.js.
                       Verified: the header comment INSIDE omega-animated.js
                       still reads "CINEMATIC ANIMATION ENGINE (omega-animate.js)",
                       and the bg.js injection is commented "Cinematic animation
                       engine". Same module, broken reference. SAFE TO FIX.

  omega-pmi.js      -> file was renamed to omega-pml.js.
                       Verified: the header INSIDE omega-pml.js reads
                       "PLATFORM MEANING INDEX (omega-pmi.js)", and the bg.js
                       injection is commented "Platform Meaning Index".
                       Same module, broken reference. SAFE TO FIX.

  omega-thread.js   -> NO file on disk. Commented "Digital thread —
                       requirements-to-telemetry traceability". Distinct from
                       omega-threat.js, which is a Zero Trust threat detector
                       loaded separately and already working. This module was
                       never written or was lost. NOT SAFE TO GUESS.

  omega-chrome.js   -> NO file on disk, no candidate, no comment describing it.
                       NOT SAFE TO GUESS.

The two verified renames are repaired. The two unknown modules have their
injection removed so they stop 404-ing, and are recorded in DECISIONS.md for an
owner decision. Writing replacements for them from a one-line comment would be
inventing requirements, which is the failure mode this whole process exists to
prevent.
"""

import re
import shutil
import sys
import os

DRY = "--dry-run" in sys.argv
TARGET = "bg.js"

# (broken reference, correct reference, why)
RENAMES = [
    ("/omega-animate.js", "/omega-animated.js",
     "file renamed on disk; internal header confirms same module"),
    ("/omega-pmi.js", "/omega-pml.js",
     "file renamed on disk; internal header confirms same module"),
]

# Modules with no file and no safe candidate — remove the injection block.
REMOVALS = [
    ("omega-thread", "no file on disk; distinct from omega-threat.js"),
    ("omega-chrome", "no file on disk; no candidate, no documented purpose"),
]


def main():
    if not os.path.exists(TARGET):
        sys.exit(f"ERROR: {TARGET} not found. Run from the repository root.")

    src = open(TARGET, encoding="utf-8").read()
    original = src
    log = []

    # --- 1. repair verified renames -----------------------------------------
    for broken, correct, why in RENAMES:
        target_file = correct.lstrip("/")
        if not os.path.exists(target_file):
            log.append(f"SKIP  {broken} -> {correct}: {target_file} not on disk")
            continue
        n = src.count(f"'{broken}'") + src.count(f'"{broken}"')
        if n == 0:
            log.append(f"SKIP  {broken}: already fixed or not present")
            continue
        src = src.replace(f"'{broken}'", f"'{correct}'")
        src = src.replace(f'"{broken}"', f'"{correct}"')
        log.append(f"FIX   {broken} -> {correct}  ({n}x) — {why}")

    # --- 2. remove unresolvable injections -----------------------------------
    # Each injection is a self-contained `if(!document.querySelector(
    # 'script[data-KEY]')){ ... }` block on one line. Match it precisely rather
    # than by line number, so this stays correct if bg.js is reformatted.
    for key, why in REMOVALS:
        # Bound the match length inside the regex itself. These injections are
        # ~200 chars; anything longer means the pattern has escaped its block
        # and is eating adjacent code. Also match an optional IIFE wrapper,
        # which omega-chrome uses and the others do not.
        pattern = re.compile(
            r"(?:\(function\(\)\{)?"
            r"if\(!document\.querySelector\('script\[data-"
            + re.escape(key)
            + r"\]'\)\)\{.{0,400}?\}"
            r"(?:\}\)\(\);)?"
        )
        found = pattern.findall(src)
        if not found:
            log.append(f"SKIP  {key}: injection already removed")
            continue
        # Sanity: a correct match is short and self-contained. If the regex has
        # swallowed half the file, abort rather than corrupt bg.js.
        if any(len(f) > 800 for f in found):
            log.append(f"ABORT {key}: match too large ({max(len(f) for f in found)} "
                       f"chars) — remove by hand, do not force this")
            continue
        src = pattern.sub(
            f"/* REMOVED {key}.js — {why}. See DECISIONS.md. */", src
        )
        log.append(f"STRIP {key}.js injection ({len(found)}x) — {why}")

    # --- 3. report ------------------------------------------------------------
    print("=" * 68)
    print("bg.js module loader repair")
    print("=" * 68)
    for line in log:
        print("  " + line)

    if src == original:
        print("\n  No changes needed.")
        return 0

    if DRY:
        print("\n  --dry-run: nothing written.")
        return 0

    shutil.copy2(TARGET, TARGET + ".bak")
    with open(TARGET, "w", encoding="utf-8") as fh:
        fh.write(src)
    print(f"\n  Written. Backup at {TARGET}.bak")
    print("  Now run: python3 scripts/audit.py")
    print("  Then load enter.html / dashboard.html / profile.html with the")
    print("  console open and confirm zero 404s and zero new errors.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
