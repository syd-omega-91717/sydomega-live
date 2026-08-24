#!/usr/bin/env python3
"""Check every client .upsert() against the unique keys that actually exist.

WHY THIS EXISTS

An upsert only works if its conflict target matches a real unique index. Two
ways that goes wrong, and this repo has had both, in four separate places:

  42P10 -- onConflict names columns with no matching unique index, so Postgres
           refuses the statement outright.
             omega-memory.js        onConflict:'user_id,memory_key' against a
                                    table whose only unique index was the PK
             graphify integration   onConflict on four relationship columns
                                    that were never given a key

  23505 -- NO onConflict at all on a table that HAS a non-primary-key unique
           constraint. PostgREST then defaults the conflict target to the
           primary key; when the payload does not carry the PK it sends a plain
           insert, which succeeds once and then violates the unique constraint
           forever after.
             omega-chrono.js        user_dedication, UNIQUE(user_id, date)
             omega-metrics.js       platform_metrics,
             omega-finops.js        UNIQUE(metric_date, metric_name)

Every one of these failed silently, because the Supabase client resolves to
{data, error} rather than throwing, so the surrounding try/catch never fired.
Several were additionally masked by a missing table GRANT, which rejected the
request before Postgres ever looked at the conflict target.

Findings are advisory (exit 0) because the source of truth is the flat
supabase/*.sql bag, which does not always match the live database -- see
CLAUDE.md section 5. Treat a finding as a candidate to verify against live,
not a verdict.

WHAT THIS CANNOT CATCH, stated plainly: a constraint the SQL bag declares but
the live database does not actually have. ai_memory was exactly that -- the bag
declared UNIQUE(user_id, memory_key), live had only the primary key, so the
client's onConflict looked correct here and still raised 42P10 in production.
Only a live-schema check finds that class. Verified against this repo's own
history: run at the commit before each fix, this reports all three 42P10 cases
in the graphify integration and all three 23505 cases in chrono/metrics/finops
-- six of the seven real bugs found by hand; ai_memory is the seventh and the
one it structurally cannot see.

USAGE
    python3 scripts/upsert-conflict-check.py
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import importlib.util
import re
import sys
from pathlib import Path

_HERE = Path(__file__).resolve().parent
_ROOT = _HERE.parent


def _load_helpers():
    """Reuse schema-dictionary.py's parsers; its filename is not importable."""
    spec = importlib.util.spec_from_file_location(
        "schema_dictionary", _HERE / "schema-dictionary.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


H = _load_helpers()


def parse_unique_keys():
    """table -> {'pk': [cols], 'unique': [[cols], ...]} from supabase/*.sql."""
    keys = {}

    def slot(t):
        return keys.setdefault(t, {"pk": [], "unique": []})

    def cols(raw):
        return [c.strip().strip('"').lower()
                for c in raw.split(",") if c.strip()]

    for sql_file in sorted((_ROOT / "supabase").glob("*.sql")):
        sql = H._strip_sql_comments(
            sql_file.read_text(encoding="utf-8", errors="ignore"))

        # CREATE UNIQUE INDEX ... ON [public.]table (a, b)
        for m in re.finditer(
                r"CREATE\s+UNIQUE\s+INDEX(?:\s+CONCURRENTLY)?"
                r"(?:\s+IF\s+NOT\s+EXISTS)?\s+\w+\s+ON\s+(?:public\.)?(\w+)\s*\(([^)]+)\)",
                sql, re.I):
            slot(m.group(1).lower())["unique"].append(cols(m.group(2)))

        # CREATE TABLE bodies: table-level PRIMARY KEY / UNIQUE, and
        # column-level `col type PRIMARY KEY` / `col type UNIQUE`.
        for m in re.finditer(
                r"CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:public\.)?(\w+)\s*\(",
                sql, re.I):
            table = m.group(1).lower()
            body = H._object_body(sql, m.end() - 1) if hasattr(H, "_object_body") else None
            # _object_body is written for JS braces; slice parens by hand.
            depth, i = 0, m.end() - 1
            while i < len(sql):
                if sql[i] == "(":
                    depth += 1
                elif sql[i] == ")":
                    depth -= 1
                    if depth == 0:
                        break
                i += 1
            body = sql[m.end():i]

            for part in H._split_top_level(body):
                p = part.strip()
                if not p:
                    continue
                tm = re.match(r"PRIMARY\s+KEY\s*\(([^)]+)\)", p, re.I)
                if tm:
                    slot(table)["pk"] = cols(tm.group(1))
                    continue
                um = re.match(r"UNIQUE\s*\(([^)]+)\)", p, re.I)
                if um:
                    slot(table)["unique"].append(cols(um.group(1)))
                    continue
                if re.match(r"(CONSTRAINT|CHECK|FOREIGN\s+KEY|EXCLUDE)\b", p, re.I):
                    continue
                cm = re.match(r'"?(\w+)"?\s+\w', p)
                if not cm:
                    continue
                col = cm.group(1).lower()
                if re.search(r"\bPRIMARY\s+KEY\b", p, re.I):
                    slot(table)["pk"] = [col]
                elif re.search(r"\bUNIQUE\b", p, re.I):
                    slot(table)["unique"].append([col])
    # Several files in the flat bag declare the same constraint, so the same
    # key can be collected more than once. Dedupe for readable output.
    for t in keys:
        seen, uniq = set(), []
        for k in keys[t]["unique"]:
            sig = tuple(sorted(k))
            if sig not in seen:
                seen.add(sig)
                uniq.append(k)
        keys[t]["unique"] = uniq
    return keys


UPSERT_RE = re.compile(r"\.from\(\s*['\"](\w+)['\"]\s*\)\s*\.\s*upsert\s*\(", re.S)


def scan_clients(keys):
    findings = []
    files = sorted(list(_ROOT.glob("*.js")) + list(_ROOT.glob("*.html")))
    for path in files:
        src = path.read_text(encoding="utf-8", errors="ignore")
        for m in UPSERT_RE.finditer(src):
            table = m.group(1).lower()
            if table not in keys:
                continue          # not defined in the SQL bag; nothing to check
            line = src[:m.start()].count("\n") + 1

            # Window from the upsert's opening paren to a sensible cut-off:
            # far enough to catch a trailing options object, short enough not
            # to swallow the next statement.
            window = src[m.end() - 1: m.end() + 1500]
            oc = re.search(r"onConflict\s*:\s*['\"]([^'\"]+)['\"]", window)

            pk = keys[table]["pk"]
            uniques = keys[table]["unique"]
            all_keys = ([pk] if pk else []) + uniques

            if oc:
                target = [c.strip().lower() for c in oc.group(1).split(",")]
                if not any(sorted(target) == sorted(k) for k in all_keys):
                    findings.append((
                        path.name, line, table, "42P10",
                        "onConflict '%s' matches no unique key in supabase/*.sql%s"
                        % (oc.group(1),
                           (" (known keys: " +
                            "; ".join("(" + ",".join(k) + ")" for k in all_keys) + ")")
                           if all_keys else " (no unique key found at all)")))
                continue

            # No onConflict. Only a problem when a non-PK unique key exists and
            # the payload does not carry the primary key -- otherwise the
            # default PK target is the right one.
            if not uniques or not pk:
                continue
            # _object_body brace-matches from a `{`; m.end()-1 is the upsert's
            # `(`. Advance to the payload's opening brace, and bail out if the
            # first argument is not an object literal (e.g. a variable), since
            # then the payload keys are not statically knowable.
            brace = src.find("{", m.end() - 1, m.end() + 200)
            if brace == -1 or src[m.end():brace].strip() not in ("(", "", "("):
                continue
            body = H._object_body(src, brace)
            payload = set(k.lower() for k in H._top_level_keys(body or ""))
            if payload and not set(pk).issubset(payload):
                findings.append((
                    path.name, line, table, "23505",
                    "no onConflict; defaults to PK (%s) which the payload does "
                    "not set, so this inserts every time and will collide with "
                    "UNIQUE(%s)" % (",".join(pk),
                                    "), UNIQUE(".join(",".join(u) for u in uniques))))
    return findings


def main():
    keys = parse_unique_keys()
    findings = scan_clients(keys)

    print("=" * 70)
    print("UPSERT CONFLICT-TARGET CHECK")
    print("=" * 70)
    print("Parsed unique keys for %d tables from supabase/*.sql." % len(keys))

    if not findings:
        print("\n  No upsert conflict-target problems found.")
        print("=" * 70)
        return 0

    print("\nFOUND %d UPSERT(S) THAT CANNOT WRITE AS INTENDED:\n" % len(findings))
    for name, line, table, code, msg in findings:
        print("  %s:%d — %s [%s]" % (name, line, table, code))
        print("      %s" % msg)
    print("""
Advisory only: the flat supabase/*.sql bag is the source of truth here and does
not always match live (CLAUDE.md section 5). Verify a finding against the live
schema before changing code -- and remember the failure is silent, since the
Supabase client resolves to {data, error} rather than throwing.""")
    print("=" * 70)
    return 0


if __name__ == "__main__":
    sys.exit(main())
