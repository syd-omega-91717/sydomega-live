#!/usr/bin/env python3
"""SYD OMEGA 91717 production contract gate.

Deterministic source contract for the static production deployment. Runtime
claims remain separate: architecture.html exposes executable browser probes,
while this gate verifies that the control-plane assets are shipped.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

# CLAUDE.md 8.4: "Ask a script what it does before reading it." That only works
# if asking is cheap and safe. This gate used to run its whole job on --help --
# a repo-wide scan, or in one case an O(n^2) page comparison that never
# returned -- so the cheapest way to learn what it did was to read it. The
# guard runs before any work, and must stay ahead of it.
if __name__ == "__main__" and ("--help" in sys.argv or "-h" in sys.argv):
    print(__doc__)
    raise SystemExit(0)

ROOT = Path(__file__).resolve().parents[1]
FAIL = 0


def error(path: Path, message: str) -> None:
    global FAIL
    FAIL += 1
    print(f"ERROR {path}: {message}")


def check_pages() -> None:
    pages = sorted(ROOT.glob("*.html"))
    if not pages:
        error(ROOT, "no production HTML pages found")
        return

    for page in pages:
        src = page.read_text(encoding="utf-8", errors="ignore")
        # Attribute values may be unquoted -- valid HTML5, and several pages are
        # written that way (`src=/bg.js`). Requiring a quote made this report
        # "missing /bg.js runtime" for 5 pages that load it correctly.
        if not re.search(r'<script[^>]+src=["\']?/+bg\.js(?:[?#"\'\s>]|$)', src, re.I):
            error(page, "missing /bg.js runtime")

        # Same unquoted-attribute blind spot: this silently skipped every id on
        # those pages, so the duplicate-id check was not running there at all.
        ids = [a or b for a, b in
               re.findall(r'\bid=(?:["\']([^"\']+)["\']|([^\s>"\'=]+))', src, re.I)]
        seen: set[str] = set()
        for ident in ids:
            if ident in seen:
                error(page, f"duplicate id={ident!r}")
            seen.add(ident)

        refs = re.findall(r'\b(?:src|href)=["\'](/[^"\'#?]+)["\']', src, re.I)
        for ref in sorted(set(refs)):
            rel = ref.lstrip("/")
            if rel.startswith(("http://", "https://")):
                continue
            target = ROOT / rel
            if not target.exists():
                error(page, f"missing local asset {ref}")


def check_json() -> None:
    for path in sorted(ROOT.glob("*.json")):
        try:
            json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            error(path, f"invalid JSON: {exc}")


def check_client_credentials() -> None:
    patterns = (
        re.compile(r"service_role", re.I),
        re.compile(r"SUPABASE_SERVICE_ROLE_KEY", re.I),
    )
    for path in sorted(ROOT.glob("*.js")) + sorted(ROOT.glob("*.html")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        for pattern in patterns:
            if pattern.search(text):
                error(path, f"client credential marker detected: {pattern.pattern}")


def check_architecture_control_plane() -> None:
    runtime = ROOT / "omega-architecture-runtime.js"
    dashboard = ROOT / "architecture.html"
    contract = ROOT / "docs" / "architecture" / "16-block-system.json"
    for path in (runtime, dashboard, contract):
        if not path.exists():
            error(path, "required 16-block control-plane asset is missing")
    if dashboard.exists():
        text = dashboard.read_text(encoding="utf-8", errors="ignore")
        if '/omega-architecture-runtime.js' not in text:
            error(dashboard, "does not load the architecture runtime")
    if runtime.exists():
        text = runtime.read_text(encoding="utf-8", errors="ignore")
        required = (
            'api-gateway', 'load-balancer', 'microservices', 'event-driven',
            'database', 'caching', 'data-partitioning', 'object-blob-storage',
            'message-queues', 'fault-tolerance', 'cdn', 'high-availability',
            'observability', 'security-identity', 'ai-llm-gateway', 'vector-search-rag',
        )
        for ident in required:
            if "set('" + ident + "'" not in text:
                error(runtime, f"missing runtime registration: {ident}")


def check_migration_versions() -> None:
    """No two migrations may share a version prefix.

    supabase_migrations.schema_migrations has `version` as its primary key, so
    the CLI inserting a second file with the same prefix aborts the whole push:

        ERROR: duplicate key value violates unique constraint
        "schema_migrations_pkey" (SQLSTATE 23505)
        Key (version)=(0093) already exists.

    That is what the Supabase Preview check reported on ab57cf87, with four
    colliding pairs in the directory (0093, 0094, 0098, 0099). It is a deploy
    stopper rather than a style issue -- `supabase db push` cannot complete --
    and nothing caught it, because migration-consistency.py compares the flat
    bag against migrations/ and never looks for collisions within migrations/
    itself. Blocking here so a rename or a hand-numbered file cannot
    reintroduce it silently.
    """
    migrations = ROOT / "supabase" / "migrations"
    if not migrations.is_dir():
        return
    seen: dict[str, list[str]] = {}
    for path in sorted(migrations.glob("*.sql")):
        match = re.match(r"^(\d+)_", path.name)
        if match:
            seen.setdefault(match.group(1), []).append(path.name)
    for version, files in sorted(seen.items()):
        if len(files) > 1:
            error(
                migrations,
                "duplicate migration version "
                + version
                + ": "
                + ", ".join(files)
                + " -- schema_migrations.version is a primary key, so "
                "`supabase db push` aborts with SQLSTATE 23505",
            )


def main() -> int:
    check_pages()
    check_json()
    check_client_credentials()
    check_architecture_control_plane()
    check_migration_versions()
    if FAIL:
        print(f"\nPRODUCTION CONTRACT FAILED: {FAIL} finding(s)")
        return 1
    print("PRODUCTION CONTRACT PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
