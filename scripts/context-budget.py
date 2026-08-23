#!/usr/bin/env python3
"""Context budget check for sydomega-live.

WHY THIS EXISTS

Every Claude Code / agent session in this repository loads CLAUDE.md into its
context before it reads a single line of code. That cost is paid on every
session, forever, by every contributor and every automated run -- and it is
invisible, because nothing reports it.

It got away from us once already. CLAUDE.md reached 275,623 bytes (~68,900
tokens), of which section 8 alone was 242,802 bytes -- 88% of the file, and
almost all of it closed, verified history that a session starting work does
not need. That history now lives in FIXES_LOG.md, which is read on demand.

The split saved ~58,000 tokens per session. Without a check, it grows straight
back: the repo's own rule (CLAUDE.md section 9) is that every change updates
the docs, so the pressure is always toward appending.

This script measures what a session actually loads and fails when it exceeds
budget. It is deliberately dependency-free and deterministic.

TOKEN ESTIMATION

Tokens are estimated at BYTES/4, the standard rough ratio for English prose.
This is an estimate, not a measurement -- no tokenizer is vendored here, and
the exact count varies by model. It is consistently applied, so the trend and
the budget comparison are meaningful even though the absolute number is
approximate. Anywhere this script prints a token figure it says "approx".

USAGE

    python3 scripts/context-budget.py           # report + enforce
    python3 scripts/context-budget.py --report  # report only, never fails

Exit code 1 if any hard budget is exceeded, 0 otherwise.
"""

import os
import sys

# --- Budgets -----------------------------------------------------------------
# CLAUDE.md sat at ~10,800 tokens right after the FIXES_LOG.md split. The
# budget is set at 16,000 to leave real headroom for genuine standing content
# (a new recurring bug class, an item opening or closing) while still catching
# a slide back toward the 68,900 it reached before. Raising this number is a
# decision to make deliberately, not a step to take to make the check pass.
BYTES_PER_TOKEN = 4
BUDGETS = {
    "CLAUDE.md": 16_000,          # approx tokens, hard fail
}

# Files an agent commonly reads in full during ordinary work. Not auto-loaded,
# so not budgeted -- but worth surfacing, because reading one of these costs
# more than the entire auto-loaded context and the cheap alternative (grep to
# the relevant range, then read with offset/limit) is usually available.
WATCH = [
    "FIXES_LOG.md",
    "GAP_ANALYSIS.md",
    "REPOSITORY_AUDIT.md",
    "CAPABILITY_INVENTORY.md",
    "FEATURE_IDEAS.md",
    "OMEGA_TAXONOMY.md",
    "bg.js",
    "profile.html",
]
WATCH_WARN = 12_000  # approx tokens; above this, say so


def approx_tokens(path):
    try:
        return os.path.getsize(path) // BYTES_PER_TOKEN
    except OSError:
        return None


def bar(tok, budget, width=28):
    """Simple proportional bar; caps at width so an overrun stays readable."""
    filled = min(width, int(width * tok / budget)) if budget else 0
    over = tok > budget
    return ("#" * filled).ljust(width, ".") + ("  OVER" if over else "")


def main():
    report_only = "--report" in sys.argv
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)

    print("=" * 68)
    print("CONTEXT BUDGET  --  what every session loads before any work starts")
    print("=" * 68)

    failures = []
    total = 0

    print("\nAUTO-LOADED (counted against budget)")
    for path, budget in BUDGETS.items():
        tok = approx_tokens(path)
        if tok is None:
            print(f"  {path:<28} MISSING")
            continue
        total += tok
        status = "OVER BUDGET" if tok > budget else "ok"
        print(f"  {path:<28} ~{tok:>6,} / {budget:,} approx tokens  {status}")
        print(f"  {'':<28} [{bar(tok, budget)}]")
        if tok > budget:
            failures.append((path, tok, budget))

    print(f"\n  auto-loaded total: ~{total:,} approx tokens per session")

    print("\nREAD ON DEMAND (not budgeted -- shown so the cost is visible)")
    for path in WATCH:
        tok = approx_tokens(path)
        if tok is None:
            continue
        note = "  <- costs more than the whole auto-loaded context" \
            if tok > total else ("  <- large" if tok > WATCH_WARN else "")
        print(f"  {path:<28} ~{tok:>6,} approx tokens{note}")

    if failures:
        print("\n" + "=" * 68)
        for path, tok, budget in failures:
            print(f"FAIL  {path} is ~{tok:,} approx tokens, over its {budget:,} budget "
                  f"by ~{tok - budget:,}.")
        print("""
A file over budget is not fixed by raising the budget. Move the content that
does not need to be loaded every session:

  - A fixed bug's evidence-cited entry belongs in FIXES_LOG.md, appended at
    the end. CLAUDE.md section 8 changes only when a STANDING fact changes --
    a new recurring bug class, an item opening or closing, a moved baseline
    number, or a method note that would save the next session real time.
  - Detailed audit findings belong in REPOSITORY_AUDIT.md or GAP_ANALYSIS.md.
  - A long procedure belongs in a skill under .claude/skills/, which loads
    only when it is actually invoked.

See CLAUDE.md section 9 for the full rule.""")
        print("=" * 68)
        return 0 if report_only else 1

    print("\n  All auto-loaded files within budget.")
    print("=" * 68)
    return 0


if __name__ == "__main__":
    sys.exit(main())
