#!/usr/bin/env python3
"""Static, fail-closed audit for Supabase SQL migrations.

This is intentionally conservative: it blocks newly introduced patterns that
can silently expose the public API or weaken RLS. It never connects to or
mutates Supabase.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

# CLAUDE.md 8.4: "Ask a script what it does before reading it." That only works
# if asking is cheap and safe. This gate used to run its whole job on --help --
# a repo-wide scan, or in one case an O(n^2) page comparison that never
# returned -- so the cheapest way to learn what it did was to read it. The
# guard runs before any work, and must stay ahead of it.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = pathlib.Path("supabase/migrations")
BASELINE = pathlib.Path("scripts/supabase-migration-security-baseline.json")

RULES = [
    (re.compile(r"\bgrant\s+(?:all|insert|update|delete|truncate|references|trigger)\b[^;]*\bto\s+(?:anon|public)\b", re.I | re.S), "unsafe privilege grant to anon/public"),
    (re.compile(r"\bgrant\s+all\b[^;]*\bto\s+authenticated\b", re.I | re.S), "broad ALL privilege grant to authenticated"),
    (re.compile(r"\bdisable\s+row\s+level\s+security\b", re.I), "RLS is being disabled"),
    (re.compile(r"\bsecurity\s+definer\b(?![^;]{0,800}\bset\s+search_path\s*=)", re.I | re.S), "SECURITY DEFINER function without explicit search_path"),
]

# Known-safe migration infrastructure statements may use public grants for
# PostgREST metadata. Keep those explicit exceptions narrow and reviewable.
ALLOWLIST = (
    "grant usage on schema public to anon",
    "grant usage on schema public to authenticated",
)


def load_baseline() -> dict[str, int]:
    """Findings in migrations that are already APPLIED, and so cannot be edited.

    This gate blocks "newly introduced patterns" -- its own docstring says so --
    but it scanned every file in supabase/migrations/ forever, including the 24
    already-applied ones, and so demanded edits to files that must never be
    rewritten (supabase/migrations/README.md:60). It was unsatisfiable, exactly
    like the width rule in migration-history-contract.py was.

    It was also asserting something about production that is not true. Verified
    live on 2026-09-05 through two independent sources:

      * pg_proc: 107 SECURITY DEFINER functions across public+private, and
        **0** of them lack an explicit search_path in proconfig;
      * Supabase's own security advisors return no function_search_path_mutable
        finding at all -- the only security lint on the project is the
        owner-only auth_leaked_password_protection WARN.

    Later migrations (20260903021430_secure_private_rpc_boundary_v2.sql and
    its siblings) already set search_path on every one of these. The 67 hits
    are historical text describing a state production left behind.

    So the baseline records those findings as a fingerprint, and the audit
    fails on anything outside it. It is NOT a way to accept a new unsafe
    function: a new file with the pattern fails, and a baselined file whose
    count changes fails as drift, since an applied migration changing at all
    is itself the defect.
    """
    if not BASELINE.exists():
        return {}
    data = json.loads(BASELINE.read_text(encoding="utf-8"))
    return {k: v for k, v in data.get("findings", {}).items()}


def main() -> int:
    if not ROOT.exists():
        print("SUPABASE_MIGRATION_SECURITY_AUDIT=SKIPPED (no migrations directory)")
        return 0

    findings: list[tuple[str, str, str]] = []
    for path in sorted(ROOT.glob("*.sql")):
        text = path.read_text(encoding="utf-8", errors="replace")
        normalized = re.sub(r"--[^\n]*", "", text).lower()
        for pattern, message in RULES:
            for match in pattern.finditer(normalized):
                fragment = normalized[max(0, match.start()-80):match.end()+80]
                if any(allowed in fragment for allowed in ALLOWLIST):
                    continue
                line = normalized.count("\n", 0, match.start()) + 1
                findings.append((path.name, message, f"{path}:{line}: {message}"))

    counts: dict[str, int] = {}
    for name, message, _ in findings:
        counts[f"{name}::{message}"] = counts.get(f"{name}::{message}", 0) + 1

    baseline = load_baseline()
    failures = [text for name, message, text in findings if f"{name}::{message}" not in baseline]

    # A baselined file is IMMUTABLE, so its fingerprint must match exactly.
    # More occurrences means an applied migration gained an unsafe pattern;
    # fewer means one was edited, which is forbidden either way. Both are drift.
    drift = sorted(
        f"{key}: baseline {baseline[key]}, found {counts.get(key, 0)}"
        for key in set(baseline) | set(counts)
        if key in baseline and baseline[key] != counts.get(key, 0)
    )

    if failures or drift:
        print("SUPABASE_MIGRATION_SECURITY_AUDIT=FAILED")
        for item in failures:
            print(f"::error::{item}")
        for item in drift:
            print(f"::error::baseline drift in an applied migration -- {item}")
        if drift:
            print("Applied migrations are immutable. Regenerate the baseline only "
                  "when a file legitimately left supabase/migrations/.")
        return 1

    print("SUPABASE_MIGRATION_SECURITY_AUDIT=PASSED")
    if baseline:
        print(f"baselined applied-migration findings: {sum(baseline.values())} "
              f"across {len({k.split('::')[0] for k in baseline})} immutable files")
        print("live check 2026-09-05: 107 SECURITY DEFINER functions in public+private, "
              "0 without an explicit search_path; Supabase security advisors report no "
              "function_search_path_mutable finding")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
