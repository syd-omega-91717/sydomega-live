#!/usr/bin/env python3
"""
SYD OMEGA 91717 — repository integrity audit.

Run from the repository root:   python3 scripts/audit.py
Exit code 1 on any CRITICAL finding, so it can gate CI.

Checks:
  1. Modules requested by bg.js/nav.js that do not exist on disk  (CRITICAL)
  2. .js files on disk that nothing loads                          (warning)
  3. Tables created in more than one SQL file                      (warning)
  4. Tables with no ENABLE ROW LEVEL SECURITY anywhere             (CRITICAL)
  5. Files that vercel.json redirects away but still ship          (warning)
  6. Oversized assets in the deploy root                           (warning)
  7. .from()/.rpc() calls (pages + Edge Functions) referencing a   (warning)
     table/view/function absent from every supabase/*.sql file
  8. Client-called RPC functions whose supabase/*.sql definitions  (warning)
     diverge (argument list or body) across files -- CREATE OR
     REPLACE silently lets whichever file applied last win, so a
     divergence here is a live-behavior risk, not just duplication

Checks 7 and 8 automate a pattern this project has repeatedly found by
hand across several audit sessions (see GAP_ANALYSIS.md sections 2.1 and
3.1) -- missing tables/RPCs and diverging duplicate function bodies. They
are heuristic, regex-based, and source-only (no live DB access), so like
check 4's RLS finding, treat them as indicative and verify against the
live schema before acting -- but they turn a manual, easy-to-forget sweep
into a permanent, automatic one.
"""

import os
import re
import sys
import collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

LOADERS = ["bg.js", "nav.js"]
SQL_DIR = "supabase"
MAX_ASSET_BYTES = 1_000_000
REDIRECTED_EXT = (".ts", ".py", ".sol", ".sql", ".docx")

# sw.js is a service worker registered via navigator.serviceWorker.register()
# in omega-sw-register.js, which bg.js injects. It does not appear in <script>
# tags and is not injected via .src assignment, so the module-graph scan below
# would wrongly flag it as "never loaded". Exempt it explicitly.
SERVICE_WORKER_FILES = {"sw.js"}

# Regex table extraction picks up stray keywords from multi-line DDL and
# SQL comments (-- …). Anything here is not a real table name.
NOT_A_TABLE = {
    "above", "alone", "is", "as", "if", "not", "exists", "the", "and", "or",
    "this", "that", "with", "on", "in", "to", "for", "select", "insert",
    "update", "delete", "where", "from", "table", "temp", "temporary",
    # "bodies" appears after CREATE TABLE in comment lines such as:
    # "-- CREATE TABLE bodies and ALTER ... ADD COLUMN statements."
    # It is not a real table; the comment refers to function bodies in SQL.
    "bodies",
}

critical = 0
warnings = 0


def head(title):
    print(f"\n{'=' * 68}\n{title}\n{'=' * 68}")


def read(path):
    with open(path, encoding="utf-8", errors="ignore") as fh:
        return fh.read()


# ---------------------------------------------------------------- 1 & 2
head("1/2 · MODULE GRAPH")

on_disk = {f for f in os.listdir(".") if f.endswith(".js")}

loader_src = "".join(read(f) for f in LOADERS if os.path.exists(f))
injected = {
    m.split("/")[-1]
    for m in re.findall(r"""\.src\s*=\s*['"](/[^'"]+\.js)['"]""", loader_src)
}

static_included = set()
for page in (f for f in os.listdir(".") if f.endswith(".html")):
    for m in re.findall(r"""<script[^>]+src=["']([^"']+)""", read(page)):
        static_included.add(m.split("/")[-1].split("?")[0])

reachable = injected | static_included
missing = sorted(reachable - on_disk)
# Exclude service workers: they are loaded via navigator.serviceWorker.register(),
# not via <script> tags or dynamic src injection.
unloaded = sorted((on_disk - reachable) - SERVICE_WORKER_FILES)

print(f"  on disk: {len(on_disk)}   injected by loader: {len(injected)}   "
      f"in <script> tags: {len(static_included)}")
if SERVICE_WORKER_FILES & on_disk:
    print(f"  service workers (exempt from load check): "
          f"{', '.join(sorted(SERVICE_WORKER_FILES & on_disk))}")

if missing:
    critical += 1
    print(f"\n  CRITICAL — requested but MISSING on disk ({len(missing)}):")
    for m in missing:
        stem = m[:-3]
        near = [d for d in on_disk if d[:-3].startswith(stem[:-1])]
        hint = f"   (did you mean {near[0]}?)" if near else ""
        print(f"    - {m}{hint}")
else:
    print("\n  OK — every requested module exists.")

if unloaded:
    warnings += 1
    print(f"\n  WARNING — on disk but never loaded ({len(unloaded)}):")
    print("    " + ", ".join(unloaded))

# ---------------------------------------------------------------- 3 & 4
head("3/4 · SQL SCHEMA INTEGRITY")

# Function bodies use Postgres dollar-quoting ($$ ... $$, $tag$ ... $tag$);
# \3 backreferences whichever tag opened the body so mismatched tags across
# different functions in the same file don't cross-match.
FUNC_RE = re.compile(
    r"""create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)\s*"""
    r"""\(([^)]*)\).*?\$(\w*)\$(.*?)\$\3\$""",
    re.I | re.S,
)

# Captures the full column-list body of a CREATE TABLE statement (up to the
# first ");" — naive w.r.t. nested parens in constraints, but good enough to
# tell "byte-identical copy-paste across files" (zero live-behavior risk)
# apart from "genuinely different column lists" (a real conflict) without a
# live DB round-trip. Heuristic, like the rest of this file.
TABLE_BODY_RE = re.compile(
    r"""create\s+table\s+(?:if\s+not\s+exists\s+)?([`"\w\.]+)\s*\((.*?)\)\s*;""",
    re.I | re.S,
)

# A file is a "canonical fix" for a given RPC's divergence if it follows this
# repo's own established naming convention for a verified, applied
# correction (see CLAUDE.md §8 — omega_*_fix.sql, trial_fix.sql, or a
# numbered supabase/migrations/NNNN_*.sql file). Not proof by itself — still
# needs a live pg_proc check per function — but it turns "11 undifferentiated
# names" into "here's where to look first" for anyone triaging the warning.
FIX_FILE_RE = re.compile(r"(_fix\.sql$|^\d{4}_)", re.I)

if not os.path.isdir(SQL_DIR):
    print(f"  {SQL_DIR}/ not found — skipping (expected after Session 2).")
    creates, views, funcs = {}, set(), {}
else:
    sql_files = sorted(f for f in os.listdir(SQL_DIR) if f.endswith(".sql"))
    creates = collections.defaultdict(list)
    table_bodies = collections.defaultdict(list)  # table -> [(file, body_norm)]
    views = set()
    funcs = collections.defaultdict(list)  # name.lower() -> [(file, args_norm, body_norm)]
    rls_on = set()
    policies = 0
    destructive = []
    destructive_guarded = []

    for name in sql_files:
        raw = read(os.path.join(SQL_DIR, name))
        # Strip single-line SQL comments before scanning so that lines like
        # "-- CREATE TABLE bodies …" do not produce false table-name matches.
        src = re.sub(r'--[^\n]*', '', raw)
        for t in re.findall(
            r"""create\s+table\s+(?:if\s+not\s+exists\s+)?([`"\w\.]+)""", src, re.I
        ):
            clean = t.replace("public.", "").strip('"`')
            if clean.lower() in NOT_A_TABLE:
                continue
            creates[clean].append(name)
        for t, body in TABLE_BODY_RE.findall(src):
            clean = t.replace("public.", "").strip('"`')
            if clean.lower() in NOT_A_TABLE:
                continue
            table_bodies[clean].append((name, re.sub(r"\s+", " ", body).strip().lower()))
        for t in re.findall(
            r"""create\s+(?:or\s+replace\s+)?view\s+([`"\w\.]+)""", src, re.I
        ):
            views.add(t.replace("public.", "").strip('"`').lower())
        for t in re.findall(
            r"""alter\s+table\s+([`"\w\.]+)\s+enable\s+row\s+level""", src, re.I
        ):
            rls_on.add(t.replace("public.", "").strip('"`'))
        policies += len(re.findall(r"create\s+policy", src, re.I))
        # Raw (unstripped) source, so a DROP that immediately follows an
        # "OPTIONAL"/"ONLY IF" guard comment can still be seen alongside it.
        for m in re.finditer(r"drop\s+(?:table|schema)", raw, re.I):
            window = raw[max(0, m.start() - 400):m.start()]
            if re.search(r"optional|only\s+if|manual|not\s+run\s+automatically", window, re.I):
                destructive_guarded.append(name)
            else:
                destructive.append(name)
        for fname, args, _tag, body in FUNC_RE.findall(src):
            funcs[fname.lower()].append((
                name,
                re.sub(r"\s+", " ", args).strip().lower(),
                re.sub(r"\s+", " ", body).strip(),
            ))

    destructive = sorted(set(destructive))
    destructive_guarded = sorted(set(destructive_guarded) - set(destructive))
    dupes = {t: v for t, v in creates.items() if len(v) > 1}
    no_rls = sorted(set(creates) - rls_on)

    print(f"  files: {len(sql_files)}   tables: {len(creates)}   "
          f"policies: {policies}")
    print(f"  ordered (numeric-prefixed) files: "
          f"{sum(1 for f in sql_files if f[0].isdigit())}/{len(sql_files)}")

    if no_rls:
        critical += 1
        print(f"\n  CRITICAL — no ENABLE ROW LEVEL SECURITY found ({len(no_rls)}):")
        for t in no_rls:
            print(f"    - {t}  (created in: {', '.join(creates[t][:3])})")
        print("    Verify against the live DB — file analysis is indicative only.")

    if dupes:
        # Split by whether every CREATE TABLE body for this name normalizes
        # identically (harmless copy-paste, zero live-behavior risk since
        # CREATE TABLE IF NOT EXISTS makes re-running a no-op) vs genuinely
        # differing column lists (a real risk — whichever file happened to
        # run first on the live DB silently wins, and the others are dead
        # weight that could mislead a future reader into thinking they're
        # live).
        conflicting = {}
        identical = {}
        for t in dupes:
            bodies = {b for _f, b in table_bodies.get(t, [])}
            if len(bodies) <= 1:
                identical[t] = dupes[t]
            else:
                conflicting[t] = dupes[t]
        warnings += 1
        print(f"\n  WARNING — tables created in multiple files ({len(dupes)}: "
              f"{len(conflicting)} with conflicting column lists, "
              f"{len(identical)} byte-identical copy-paste, zero live-behavior risk):")
        if conflicting:
            print(f"    CONFLICTING ({len(conflicting)}) — needs a live-schema check "
                  f"per table before consolidating, see CLAUDE.md §5:")
            for t, v in sorted(conflicting.items(), key=lambda kv: -len(kv[1])):
                print(f"      - {t}: {len(v)} files, {len(table_bodies[t])} "
                      f"distinct definitions — {', '.join(sorted(set(v))[:4])}"
                      f"{', …' if len(set(v)) > 4 else ''}")
        if identical:
            print(f"    identical ({len(identical)}, no action needed): "
                  + ", ".join(sorted(identical)))

    if destructive:
        warnings += 1
        print(f"\n  WARNING — contains DROP TABLE/SCHEMA with no visible "
              f"guard comment: {', '.join(destructive)}")
    if destructive_guarded:
        print(f"\n  note — contains DROP TABLE/SCHEMA, but guarded by an "
              f"'OPTIONAL'/'ONLY IF' comment documenting it as a manual, "
              f"conditional utility, not part of any automatic apply path: "
              f"{', '.join(destructive_guarded)}")

# ---------------------------------------------------------------- 5 & 6
head("5/6 · DEPLOY HYGIENE")

import fnmatch

vercelignore_patterns = []
if os.path.isfile(".vercelignore"):
    for line in read(".vercelignore").splitlines():
        line = line.strip()
        if line and not line.startswith("#"):
            vercelignore_patterns.append(line.rstrip("/"))


def ignored_by_vercel(fname):
    return any(
        fnmatch.fnmatch(fname, pat) or fnmatch.fnmatch(fname, "*/" + pat)
        for pat in vercelignore_patterns
    )


shipped = [
    f for f in os.listdir(".")
    if f.endswith(REDIRECTED_EXT) and os.path.isfile(f)
]
if shipped:
    excluded = sorted(f for f in shipped if ignored_by_vercel(f))
    not_excluded = sorted(f for f in shipped if f not in excluded)
    warnings += 1
    print(f"  WARNING — unreachable but deployed ({len(shipped)}):")
    print("    " + ", ".join(sorted(shipped)))
    if excluded:
        print(f"    of which already excluded from the actual Vercel deploy "
              f"via .vercelignore (committed to git, but never publicly "
              f"served): {', '.join(excluded)}")
    if not_excluded:
        print(f"    NOT covered by any .vercelignore pattern — these are "
              f"actually reachable on the live site: {', '.join(not_excluded)}")

big = [
    (f, os.path.getsize(f)) for f in os.listdir(".")
    if os.path.isfile(f) and os.path.getsize(f) > MAX_ASSET_BYTES
]
if big:
    warnings += 1
    print(f"\n  WARNING — assets over {MAX_ASSET_BYTES // 1000} KB in deploy root:")
    for f, s in sorted(big, key=lambda x: -x[1]):
        print(f"    - {f}  ({s / 1_000_000:.1f} MB)")

if os.path.isdir("__pycache__"):
    warnings += 1
    print("\n  WARNING — __pycache__/ is committed; extend .gitignore")

# ---------------------------------------------------------------- 7
head("7 · CLIENT-REACHABLE SCHEMA REFERENCES")

CALL_RE = re.compile(r"""\.(from|rpc)\(\s*['"]([a-zA-Z_][a-zA-Z0-9_]*)['"]""")

call_sites = [f for f in os.listdir(".") if f.endswith(".html") or f.endswith(".js")]
for dirpath, _dirs, files in os.walk(os.path.join(SQL_DIR, "functions")):
    call_sites += [os.path.join(dirpath, f) for f in files if f.endswith(".ts")]

from_calls = collections.defaultdict(list)
rpc_calls = collections.defaultdict(list)
for path in call_sites:
    for kind, name in CALL_RE.findall(read(path)):
        (from_calls if kind == "from" else rpc_calls)[name].append(path)

known_tables = {t.lower() for t in creates} | views
missing_tables = sorted(t for t in from_calls if t.lower() not in known_tables)
missing_funcs = sorted(f for f in rpc_calls if f.lower() not in funcs)

print(f"  .from() tables/views referenced: {len(from_calls)}   "
      f".rpc() functions referenced: {len(rpc_calls)}")

if missing_tables:
    warnings += 1
    print(f"\n  WARNING — .from() table/view never CREATE TABLE'd/VIEW'd "
          f"anywhere in {SQL_DIR}/ ({len(missing_tables)}):")
    for t in missing_tables:
        callers = ", ".join(sorted(set(from_calls[t]))[:3])
        print(f"    - {t}  (queried in: {callers})")
    print("    Supabase resolves this to {data:null,error}, not a thrown "
          "error — a silent empty-state, not a crash. Verify against the "
          "live DB; may be a deliberately dormant feature (see GAP_ANALYSIS.md §2.1).")

if missing_funcs:
    warnings += 1
    print(f"\n  WARNING — .rpc() function never CREATE FUNCTION'd "
          f"anywhere in {SQL_DIR}/ ({len(missing_funcs)}):")
    for f in missing_funcs:
        callers = ", ".join(sorted(set(rpc_calls[f]))[:3])
        print(f"    - {f}  (called in: {callers})")

# ---------------------------------------------------------------- 8
head("8 · DIVERGING CLIENT-CALLED RPC DEFINITIONS")

diverging = []
for name in rpc_calls:
    defs = funcs.get(name.lower())
    if not defs or len(defs) < 2:
        continue
    arg_variants = {a for _f, a, _b in defs}
    body_variants = {b for _f, _a, b in defs}
    if len(arg_variants) > 1 or len(body_variants) > 1:
        diverging.append((name, defs, arg_variants, body_variants))

if diverging:
    warnings += 1
    print(f"  WARNING — client-called RPCs with non-identical definitions "
          f"across {SQL_DIR}/*.sql ({len(diverging)}):")
    print("  CREATE OR REPLACE FUNCTION has no \"IF NOT EXISTS\" safety net — "
          "whichever file applied to the live DB last silently wins.")
    for name, defs, arg_variants, body_variants in sorted(diverging):
        files = sorted({f for f, _a, _b in defs})
        shape = []
        if len(arg_variants) > 1:
            shape.append(f"{len(arg_variants)} distinct argument lists")
        if len(body_variants) > 1:
            shape.append(f"{len(body_variants)} distinct bodies")
        canon = sorted(f for f in files if FIX_FILE_RE.search(f))
        canon_note = (
            f" — likely-canonical per this repo's own fix-file naming "
            f"convention: {', '.join(canon)} (still confirm live before "
            f"touching the others)"
            if canon else ""
        )
        print(f"    - {name}: {', '.join(shape)} across {len(files)} files "
              f"({', '.join(files[:4])}{', …' if len(files) > 4 else ''})"
              f"{canon_note}")
    print("    Source analysis only — confirm which version is actually live "
          "with a pg_proc query before deleting any file (see GAP_ANALYSIS.md §3.1).")
else:
    print("  OK — every client-called RPC has one consistent definition.")

# ---------------------------------------------------------------- summary
head("SUMMARY")
print(f"  critical: {critical}    warnings: {warnings}")
if critical:
    print("\n  FAILED — critical findings must be resolved.")
    sys.exit(1)
print("\n  PASSED")
sys.exit(0)
