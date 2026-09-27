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
  9. JSON.parse() fallback literals that are not valid JSON       (CRITICAL)
     -- e.g. JSON.parse(localStorage.getItem(K) || '{pct:10}'). The
     fallback runs only on a member's FIRST visit, and at the top level
     of a <script type="module"> the throw aborts the whole module, so
     every function below it silently never exists

Checks 7 and 8 automate a pattern this project has repeatedly found by
hand across several audit sessions (see GAP_ANALYSIS.md sections 2.1 and
3.1) -- missing tables/RPCs and diverging duplicate function bodies. They
are heuristic, regex-based, and source-only (no live DB access), so like
check 4's RLS finding, treat them as indicative and verify against the
live schema before acting -- but they turn a manual, easy-to-forget sweep
into a permanent, automatic one.
"""

import sys as _sys
if "--help" in _sys.argv[1:] or "-h" in _sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import json
import os
import re
import sys
import collections
import hashlib

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

# Self-hosted third-party bundles live in vendor/, not the repo root, so they
# are tracked SEPARATELY from on_disk rather than folded into it.
#
# Both halves of that matter. A same-origin reference is flattened to its
# basename before it is resolved, so `.src = '/vendor/tsparticles-slim.js'`
# arrives here as "tsparticles-slim.js" and, against a root-only listing,
# reported CRITICAL "requested but MISSING on disk" for a file that is
# present. vendor/supabase-js.js never tripped this only because it is
# reached by an ESM `import`, which SRC_ASSIGN_RE does not match -- so the
# gap sat unexposed until the first vendored bundle was loaded by src.
#
# But merging these into on_disk would break the OTHER check that reads it:
# `unloaded = on_disk - reachable` would then report vendor/supabase-js.js as
# a module nothing loads, which is false for exactly the same reason. So
# vendored names satisfy the missing-file check and take no part in the
# dead-file check.
VENDOR_DIRS = ("vendor",)
vendored = {
    f
    for d in VENDOR_DIRS
    if os.path.isdir(d)
    for f in os.listdir(d)
    if f.endswith(".js")
}

SRC_ASSIGN_RE = re.compile(r"""\.src\s*=\s*['"]([^'"]+\.js)['"]""")
# A module-graph edge is a SAME-ORIGIN reference. Anything carrying a scheme or
# a protocol-relative "//" host is a third-party CDN load and resolves to no
# file in this repo -- omega-oss.js pulls dayjs's relativeTime.min.js from
# jsdelivr, and counting its basename as a local edge reported a CRITICAL
# "requested but MISSING on disk" for a file that was never meant to exist.
REMOTE_SRC_RE = re.compile(r"""^(?:[a-z][a-z0-9+.-]*:)?//""", re.I)


# An ESM `import` is a module-graph edge too, and this scan could not see one.
# The note above already records that SRC_ASSIGN_RE does not match `import`,
# and works around it for the MISSING-file check with a vendored-names
# exemption -- but the DEAD-file check kept the gap for root modules. Measured:
# omega-analytics.js and omega-speed-insights.js are each imported by a
# `-init.js` shim that ~180 pages load with a <script> tag, and both were
# reported as "on disk but never loaded". Two of five entries were false, and a
# list that is 40% false reads as noise -- which is how omega-bottom-stack.js,
# a genuine entry in the same list, sat inert for eight days (FIXES_LOG.md 160).
# Matches `import … from 'x.js'`, bare `import 'x.js'` and dynamic `import('x.js')`.
ESM_IMPORT_RE = re.compile(
    r"""(?:\bimport\s*\(\s*|\bimport\b[^;'"]*?\bfrom\s*|\bimport\s*)"""
    r"""['"]([^'"]+\.js)['"]""")


# A loader-helper call is an edge too. omega-sovereign-os.js reaches
# omega-content-progressive.js only through `loadScript('/x.js', guard)`, whose
# body assigns `s.src = url` -- a variable, invisible to SRC_ASSIGN_RE -- so a
# live module was reported "on disk but never loaded". Matched by helper NAME
# (loadScript / injectScript / loadModule) with a literal .js first argument,
# not any call carrying a .js string, so a dead module still cannot vouch.
LOADER_CALL_RE = re.compile(
    r"""\b(?:loadScript|injectScript|loadModule)\s*\(\s*['"]([^'"]+\.js)['"]""")


def js_injected_by(path):
    """Same-origin .js filenames a module pulls in -- by `x.src = '/y.js'`, by
    an ESM `import`, or by a named loader helper. Each is an edge."""
    src = read(path)
    return {
        m.split("/")[-1].split("?")[0]
        for m in (SRC_ASSIGN_RE.findall(src) + ESM_IMPORT_RE.findall(src)
                  + LOADER_CALL_RE.findall(src))
        if not REMOTE_SRC_RE.match(m)
    }


static_included = set()
for page in (f for f in os.listdir(".") if f.endswith(".html")):
    # Also match unquoted src (valid HTML5): a quoted-only pattern made every
    # script on a compactly-written page invisible to the module graph, so
    # the modules those pages load were reported as orphans.
    for a, b in re.findall(
            r"""<script[^>]+src=(?:["']([^"']+)["']|([^\s>"'=]+))""", read(page)):
        m = a or b
        static_included.add(m.split("/")[-1].split("?")[0])

# TRANSITIVE CLOSURE, not one hop. This scan used to read `.src =` out of
# LOADERS only, so a module injected by an already-reachable module was
# invisible and reported as an orphan. Measured: bg.js:849 injects
# omega-components.js, which injects /omega-page-character.js -- a live module
# this check called dead (FIXES_LOG.md 111). Check 2b below already documents
# exactly this trap for stylesheets; check 2 had it unfixed.
#
# The closure must start from the REAL ROOTS (the loaders, plus every module a
# page includes with a <script> tag) and expand only through modules already
# proven reachable. Scanning every .js on disk instead would let two dead
# modules that inject each other vouch for one another -- the orphan set would
# silently shrink to nothing and the check would stop finding anything.
roots = {f for f in LOADERS if os.path.exists(f)} | static_included
reachable = set(roots)
queue = [m for m in roots if os.path.exists(m) and m.endswith(".js")]
injected = set()
while queue:
    edges = js_injected_by(queue.pop())
    injected |= edges
    for dep in edges - reachable:
        reachable.add(dep)
        if os.path.exists(dep):
            queue.append(dep)
missing = sorted(reachable - on_disk - vendored)
# Exclude service workers: they are loaded via navigator.serviceWorker.register(),
# not via <script> tags or dynamic src injection.
unloaded = sorted((on_disk - reachable) - SERVICE_WORKER_FILES)

print(f"  on disk: {len(on_disk)}   injected by loader: {len(injected)}   "
      f"in <script> tags: {len(static_included)}")
if SERVICE_WORKER_FILES & on_disk:
    print(f"  service workers (exempt from load check): "
          f"{', '.join(sorted(SERVICE_WORKER_FILES & on_disk))}")

# ---------------------------------------------------------------- 2b
# STYLESHEET GRAPH. Check 2 catches a .js nothing loads; nothing caught a .css
# nothing loads, and two authored sheets had been dead for as long as they have
# existed (FIXES_LOG.md 109): omega-platform-visual.css is referenced by no
# page, no loader and no module -- and every rule in it is scoped to
# .omega-visual-platform, a class that appears nowhere in the repo, confirmed in
# a render.
#
# TWO FALSE-POSITIVE TRAPS, both hit while writing this (CLAUDE.md 8.4):
#
#   1. Most sheets are loaded by an omega-*.js module, NOT by bg.js/nav.js.
#      Scanning only LOADERS would report ~10 live sheets as orphans.
#   2. A bare filename in PROSE is not a reference. bg.js's own comment names
#      omega-platform-visual.css, so a substring scan would call the dead sheet
#      reachable -- the exact file this check exists to catch. So a reference
#      must be a QUOTED string or a real href attribute, never a mention.
#   3. A sheet referenced ONLY by a module nothing loads is not reachable
#      either. Scanning every .js on disk missed that: omega-interface-v2.js
#      is itself an orphan and injects 8 stylesheets, and counting its
#      references made all 8 look live (FIXES_LOG.md 111). The scan therefore
#      walks only files the module graph above proved reachable.
css_on_disk = {f for f in os.listdir(".") if f.endswith(".css")}
css_referenced = set()
css_sources = [f for f in os.listdir(".") if f.endswith(".html")]
css_sources += [f for f in sorted(reachable) if f.endswith(".js") and os.path.exists(f)]
for src_file in css_sources:
    body = read(src_file)
    # Quoted string ('/x.css', "x.css") or an href=/src= attribute value.
    for m in re.findall(r"""['"]([^'"\s>]+\.css)['"]""", body):
        css_referenced.add(m.split("/")[-1].split("?")[0])
    for a, b in re.findall(
            r"""(?:href|src)\s*=\s*(?:["']([^"']+\.css)["']|([^\s>"'=]+\.css))""", body):
        m = a or b
        css_referenced.add(m.split("/")[-1].split("?")[0])

css_unloaded = sorted(css_on_disk - css_referenced)
print(f"  stylesheets on disk: {len(css_on_disk)}   referenced: "
      f"{len(css_on_disk & css_referenced)}")
if css_unloaded:
    warnings += 1
    print(f"\n  WARNING — stylesheets on disk but never loaded "
          f"({len(css_unloaded)}):")
    print("    " + ", ".join(css_unloaded))

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

# `creates`/`views`/`funcs` above come from os.listdir(SQL_DIR), which is NOT
# recursive -- so the 171 files in supabase/migrations/ were invisible to it.
# That is exactly backwards from CLAUDE.md §5: migrations/ is the AUTHORITATIVE
# schema and the flat bag is reference material that never deploys. The result
# was five phantom warnings naming relations that are both declared in
# migrations/ and present in supabase/live-schema.json (agent_experiments,
# agent_performance_metrics, autonomous_decisions, autonomous_insights,
# member_feature_flags), plus apply_subscription_event -- the live Stripe
# webhook RPC, declared at 20260915150223_stripe_webhook_event_boundary.sql:25.
# Five phantoms around two honest findings is how a real one gets ignored.
#
# Scope note: this widening applies ONLY to the existence questions below
# ("is this declared anywhere?"). The divergence checks keep reading the flat
# bag alone, because those ask whether the BAG is internally consistent --
# migrations legitimately re-declare a relation as it evolves, so folding 171
# ordered files into a divergence set would report the schema's own history as
# drift.
def _declared_in_migrations():
    """Relation and function names declared under supabase/migrations/."""
    tables, functions = set(), set()
    mig_dir = os.path.join(SQL_DIR, "migrations")
    if not os.path.isdir(mig_dir):
        return tables, functions
    t_re = re.compile(
        r"create\s+(?:or\s+replace\s+)?(?:materialized\s+)?(?:table|view)"
        r"(?:\s+if\s+not\s+exists)?\s+(?:public\.)?[\"']?([a-z0-9_]+)",
        re.I)
    f_re = re.compile(
        r"create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?[\"']?([a-z0-9_]+)",
        re.I)
    for name in sorted(os.listdir(mig_dir)):
        if not name.endswith(".sql"):
            continue
        body = read(os.path.join(mig_dir, name))
        # Same stripping as the flat-bag scan above (line comments), plus block
        # comments and single-quoted literals. CLAUDE.md §8.4: evidence-audit.py
        # once captured a relation literally named `as` out of the string
        # "CREATE TABLE AS" inside a command_tag list. A name harvested from a
        # literal would silently EXCUSE a missing relation here, which is the
        # more expensive direction of that error.
        body = re.sub(r"--[^\n]*", "", body)
        body = re.sub(r"/\*.*?\*/", "", body, flags=re.S)
        body = re.sub(r"'(?:[^']|'')*'", "''", body)
        tables.update(m.group(1).lower() for m in t_re.finditer(body)
                      if m.group(1).lower() not in NOT_A_TABLE)
        functions.update(m.group(1).lower() for m in f_re.finditer(body))
    return tables, functions

mig_tables, mig_funcs = _declared_in_migrations()

known_tables = {t.lower() for t in creates} | views | mig_tables
known_funcs = {f.lower() for f in funcs} | mig_funcs
missing_tables = sorted(t for t in from_calls if t.lower() not in known_tables)
missing_funcs = sorted(f for f in rpc_calls if f.lower() not in known_funcs)

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
        # Group definitions by body content (SHA256 hash for grouping)
        body_groups = collections.defaultdict(list)
        for f, a, b in defs:
            body_hash = hashlib.sha256(b.encode()).hexdigest()[:16]
            body_groups[body_hash].append((f, a, b))
        diverging.append((name, defs, arg_variants, body_variants, body_groups))

if diverging:
    warnings += 1
    print(f"  WARNING — client-called RPCs with non-identical definitions "
          f"across {SQL_DIR}/*.sql ({len(diverging)}):")
    print("  CREATE OR REPLACE FUNCTION has no \"IF NOT EXISTS\" safety net — "
          "whichever file applied to the live DB last silently wins.")
    for name, defs, arg_variants, body_variants, body_groups in sorted(diverging):
        files = sorted({f for f, _a, _b in defs})
        shape = []
        if len(arg_variants) > 1:
            shape.append(f"{len(arg_variants)} distinct argument lists")
        if len(body_variants) > 1:
            shape.append(f"{len(body_variants)} distinct bodies")
        print(f"    - {name}: {', '.join(shape)} across {len(files)} files")

        # Check for canonical fix files across all definitions of this RPC
        canon_files = sorted([f for f in files if FIX_FILE_RE.search(f)])
        if canon_files:
            print(f"      likely-canonical: {', '.join(canon_files)}")

        # Show per-body grouping with recommendations
        for body_hash, group_defs in sorted(body_groups.items()):
            group_files = sorted({f for f, _a, _b in group_defs})
            # Extract arg signature from first file in group (all have same body)
            arg_sig = group_defs[0][1] if group_defs else "???"

            # Check if files in this group are single-purpose (define only this RPC)
            single_purpose = []
            for f in group_files:
                # Count functions defined in this file
                func_count = sum(1 for fname, _a, _b in defs if fname == f)
                if func_count == 1:
                    single_purpose.append(f)

            canon = sorted([f for f in group_files if FIX_FILE_RE.search(f)])
            recommendation = "KEEP" if canon else ("DELETE (single-purpose dup)" if len(group_files) > 1 else "KEEP")

            if len(group_files) == 1:
                continue  # Skip single-definition bodies

            print(f"      Body {body_hash}: {arg_sig}")
            print(f"        Files ({len(group_files)}): {', '.join(group_files[:3])}{', …' if len(group_files) > 3 else ''}")
            print(f"        Single-purpose: {', '.join(single_purpose) if single_purpose else 'none'}")
            print(f"        Recommendation: {recommendation}")
    print("    Source analysis only — confirm which version is actually live "
          "with a pg_proc query before deleting any file (see GAP_ANALYSIS.md §3.1).")
else:
    print("  OK — every client-called RPC has one consistent definition.")

# ---------------------------------------------------------------- 9
head("9 · JSON.parse FALLBACK LITERALS")

# A fallback like  JSON.parse(localStorage.getItem(K) || '{pct:10,income:0}')
# only runs when the key is ABSENT -- i.e. on a member's first visit -- and
# '{pct:10,income:0}' is not valid JSON, because JSON requires quoted keys. In a
# <script type="module"> the throw aborts the whole module, so every function
# and every window.<fn>= exposure below it silently never exists and the page's
# buttons do nothing. That shipped on contributions.html, notifications.html and
# treasury.html and was invisible to every other check here: the syntax is valid
# JavaScript, the column names are fine, and nothing errors until a real browser
# hits the first-visit path. Critical, not a warning -- it takes a whole page out.


def _balanced_arg(text, start):
    """Return the argument text of a call whose '(' was consumed at `start`."""
    depth, quote, i = 1, None, start
    while i < len(text):
        ch = text[i]
        if quote:
            if ch == "\\":
                i += 2
                continue
            if ch == quote:
                quote = None
        elif ch in "\"'`":
            quote = ch
        elif ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
            if depth == 0:
                return text[start:i]
        i += 1
    return None


FALLBACK_RE = re.compile(r"""\|\|\s*(['"])(.*?)\1\s*$""", re.S)

bad_json = []
for path in sorted(f for f in os.listdir(".") if f.endswith((".html", ".js"))):
    body = read(path)
    for m in re.finditer(r"JSON\.parse\(", body):
        arg = _balanced_arg(body, m.end())
        if arg is None:
            continue
        lit = FALLBACK_RE.search(arg.strip())
        if not lit:
            continue
        try:
            json.loads(lit.group(2))
        except ValueError as exc:
            bad_json.append((path, body[:m.start()].count("\n") + 1,
                             lit.group(2), str(exc).split(":")[0]))

print(f"  JSON.parse() calls with a string fallback checked across "
      f"{len([f for f in os.listdir('.') if f.endswith(('.html', '.js'))])} files")

if bad_json:
    critical += 1
    print(f"\n  CRITICAL — JSON.parse fallback literal is not valid JSON "
          f"({len(bad_json)}). This throws on a member's FIRST visit and, at "
          f"module top level, kills every function defined below it:")
    for path, line, lit, why in bad_json:
        shown = lit if len(lit) <= 60 else lit[:57] + "..."
        print(f"    {path}:{line}  {shown!r}  -> {why}")
    print("    Fix: quote the keys, e.g. '{\"pct\":10}' not '{pct:10}'.")
else:
    print("  OK — every JSON.parse fallback literal parses as JSON.")

# ---------------------------------------------------------------- summary
head("SUMMARY")
print(f"  critical: {critical}    warnings: {warnings}")
if critical:
    print("\n  FAILED — critical findings must be resolved.")
    sys.exit(1)
print("\n  PASSED")
sys.exit(0)
