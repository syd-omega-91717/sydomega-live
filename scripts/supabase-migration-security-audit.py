#!/usr/bin/env python3
"""Static, fail-closed audit for Supabase SQL migrations.

This is intentionally conservative: it blocks newly introduced patterns that
can silently expose the public API or weaken RLS. It never connects to or
mutates Supabase.
"""
from __future__ import annotations

import pathlib
import re
import sys

ROOT = pathlib.Path("supabase/migrations")

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


def main() -> int:
    if not ROOT.exists():
        print("SUPABASE_MIGRATION_SECURITY_AUDIT=SKIPPED (no migrations directory)")
        return 0

    failures: list[str] = []
    for path in sorted(ROOT.glob("*.sql")):
        text = path.read_text(encoding="utf-8", errors="replace")
        normalized = re.sub(r"--[^\n]*", "", text).lower()
        for pattern, message in RULES:
            for match in pattern.finditer(normalized):
                fragment = normalized[max(0, match.start()-80):match.end()+80]
                if any(allowed in fragment for allowed in ALLOWLIST):
                    continue
                line = normalized.count("\n", 0, match.start()) + 1
                failures.append(f"{path}:{line}: {message}")

    if failures:
        print("SUPABASE_MIGRATION_SECURITY_AUDIT=FAILED")
        for item in failures:
            print(f"::error::{item}")
        return 1

    print("SUPABASE_MIGRATION_SECURITY_AUDIT=PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
