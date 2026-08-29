#!/usr/bin/env python3
"""
Ω MASTER EVIDENCE AUDIT -- classify every deliverable by what the repo can prove.

WHY THIS EXISTS
---------------
This project's specifications have repeatedly advanced faster than its
implementation, so "module complete" has meant, at various times: a page
exists; a page exists and renders; a page exists, renders, and persists to
Postgres. Those are very different things, and prose audit docs cannot keep
them apart as the repo changes -- REPO_AUDIT.md's counts drifted stale exactly
this way (CLAUDE.md §9).

So this is a scanner, not a document. It re-derives every claim from the
current working tree on each run, and writes EVIDENCE_MATRIX.md as its report.
Re-run it instead of editing the report by hand.

WHAT IT CAN AND CANNOT PROVE
----------------------------
It reads the repository. That bounds it hard, and the bound is the point:

  provable here   -- a page exists; it calls .from()/.rpc()/an Edge Function;
                     the table or function it names is CREATEd somewhere in
                     supabase/; nav.js can reach it; it writes localStorage.
  NOT provable    -- that the live database actually has that table, with those
                     columns, with a GRANT that lets a member reach it, and a
                     policy that scopes the rows. Every one of those has been a
                     real production bug in this repo (CLAUDE.md §8.1).

Anything in the second class is reported as UNVERIFIED, never as BUILT. A page
that queries a table this repo defines is evidence the *client* is wired, and
nothing more. Live confirmation needs an authenticated Supabase session and the
member-impersonation method in CLAUDE.md §8.4.

Report-only by default (always exits 0, so it never gates CI on a judgement
call). --strict exits 1 if any BROKEN row is found.

  python3 scripts/evidence-audit.py             # rewrite EVIDENCE_MATRIX.md
  python3 scripts/evidence-audit.py --summary   # counts only, no file written
  python3 scripts/evidence-audit.py --strict    # non-zero exit on BROKEN
"""

import sys

# CI runs this on a self-hosted Windows runner with `shell: cmd`, where Python
# encodes stdout with the cp1252 code page. This module's own banner contains
# `Ω` (U+03A9), which cp1252 cannot encode, so `print()` raised
# UnicodeEncodeError on the first line of main(): the process exited 1 before
# doing any work and never wrote EVIDENCE_MATRIX.md. That is why all 7
# test_evidence_audit failures on main read `not found in ''` -- an empty
# stdout, not a misclassification. Reproduced on Linux with
# PYTHONIOENCODING=cp1252 before writing this.
#
# Degrade an unencodable character instead of aborting the run. This has to
# come before the --help block below, which prints the Ω-bearing docstring.
# Every read and write further down pins UTF-8 explicitly for the same
# underlying reason: the locale default is cp1252 on that runner, and this
# repository is UTF-8.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(errors='replace')
    except (AttributeError, ValueError):  # not a reconfigurable text stream
        pass

# Asking this script what it does must not make it do it. Without this, --help
# ran the full audit and rewrote EVIDENCE_MATRIX.md as a side effect -- the
# unrequested-write shape CLAUDE.md §8.4 records for the other writers in
# scripts/. This module was added after that sweep and never got the guard.
if '--help' in sys.argv[1:] or '-h' in sys.argv[1:]:
    print(__doc__.strip())
    raise SystemExit(0)

import os
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.chdir(ROOT)

# Pages that must render for a signed-out visitor, so their absence from
# nav.js is correct, not a reachability bug. Mirrors bg.js's public-page list
# (see CLAUDE.md §3) plus the error/offline shells the service worker serves.
PUBLIC_PAGES = {
    'index', 'enter', 'account', 'reset', 'terms', 'pending', '404', 'offline',
}

# Edge Functions that are invoked by Stripe, pg_cron, or the Supabase
# scheduler rather than by a browser. Zero client references is the correct
# state for these -- not a wiring gap.
SERVER_INVOKED_FUNCTIONS = {
    'stripe-webhook',        # called by Stripe's webhook delivery
    'snapshot-leaderboard',  # scheduled snapshot job
    'weekly-digest',         # scheduled digest job
    'notify-access',         # called from the access-request flow / triggers
}

CLASSES = [
    'BUILT', 'PARTIAL', 'LOCAL_ONLY', 'STATIC', 'BROKEN', 'UNREACHABLE',
]


# ---------------------------------------------------------------------------
# SQL surface -- what the repository declares to exist
# ---------------------------------------------------------------------------

def _strip_sql_comments(sql):
    """Drop -- line comments and /* */ blocks before any pattern matching.

    Not optional. Without it, prose inside comments matches the DDL patterns:
    an earlier run of this script reported 52 tables defined in more than one
    file, five of which were the words `above`, `alone`, `bodies`, `for` and
    `is` -- picked up from comments reading "create table ... for" and the
    like. scripts/audit.py strips comments and reports 47; that is the real
    number, and this function is why the two now agree.
    """
    sql = re.sub(r'/\*.*?\*/', ' ', sql, flags=re.S)
    sql = re.sub(r'--[^\n]*', ' ', sql)
    return sql


def sql_surface():
    """Return (tables_and_views, functions, per-table defining files).

    Views count as tables: a page reading `top_pages` is reading a real
    relation, and calling that "undefined" because it is not a CREATE TABLE
    would be a false positive. That exact mistake shaped an earlier pass of
    this audit before the view was noticed.
    """
    rels, fns = set(), set()
    defs = defaultdict(set)

    tbl_re = re.compile(
        r'create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)', re.I)
    view_re = re.compile(
        r'create\s+(?:or\s+replace\s+)?(?:materialized\s+)?view\s+'
        r'(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z0-9_]+)', re.I)
    fn_re = re.compile(
        r'create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?([a-z0-9_]+)', re.I)

    for path in sorted(Path('supabase').rglob('*.sql')):
        text = _strip_sql_comments(path.read_text(encoding='utf-8', errors='replace'))
        for m in tbl_re.finditer(text):
            name = m.group(1).lower()
            rels.add(name)
            # Only the flat bag at supabase/ counts toward duplicate-definition
            # reporting; supabase/migrations/ is a deliberate ordered copy of
            # that same content (CLAUDE.md §5), so counting it would report
            # every table as duplicated.
            if path.parent.name == 'supabase':
                defs[name].add(path.name)
        for m in view_re.finditer(text):
            rels.add(m.group(1).lower())
        for m in fn_re.finditer(text):
            fns.add(m.group(1).lower())
    return rels, fns, defs


# ---------------------------------------------------------------------------
# Client surface -- what the shipped pages actually reach for
# ---------------------------------------------------------------------------

FROM_RE = re.compile(r"""\.from\(\s*['"]([a-zA-Z0-9_]+)['"]""")
RPC_RE = re.compile(r"""\.rpc\(\s*['"]([a-zA-Z0-9_]+)['"]""")
EDGE_RE = re.compile(r"""functions/v1/([a-zA-Z0-9_-]+)|\.invoke\(\s*['"]([a-zA-Z0-9_-]+)['"]""")
LS_WRITE_RE = re.compile(r'localStorage\.setItem')
# Supabase Auth contact. Counted separately from .from()/.rpc(): authenticating
# a member is real backend contact, but it persists none of that member's data.
# Conflating the two labelled reset.html -- a page that is entirely an auth
# operation, and complete -- as having "no backend call" in an earlier run.
AUTH_RE = re.compile(
    r'\.auth\.(?:signIn[A-Za-z]*|signUp|signOut|getUser|getSession|'
    r'resetPasswordForEmail|updateUser|exchangeCodeForSession|'
    r'onAuthStateChange|verifyOtp|refreshSession)\b')
# omega-local-backup.js's export/import is the only mitigation a device-local
# page has: it does not sync anything, it just lets a member save a file
# before they lose the cache. Worth reporting because it splits LOCAL_ONLY
# into "recoverable by hand" and "one cache clear from gone".
BACKUP_RE = re.compile(r'OmegaLocalBackup')


def scan_client(path):
    text = path.read_text(encoding='utf-8', errors='replace')
    tables = set(FROM_RE.findall(text))
    rpcs = set(RPC_RE.findall(text))
    edges = {a or b for a, b in EDGE_RE.findall(text)}
    return {
        'tables': tables,
        'rpcs': rpcs,
        'edges': edges,
        'ls_writes': len(LS_WRITE_RE.findall(text)),
        'auth': len(AUTH_RE.findall(text)),
        'backup': bool(BACKUP_RE.search(text)),
        'lines': text.count('\n') + 1,
    }


def nav_slugs():
    """Slugs nav.js mentions at all.

    Deliberately a substring scan of every quoted token rather than a parse of
    the PS map: nav.js builds some hrefs by concatenation, and a parser that
    only read PS's literal keys would report reachable pages as orphans.
    """
    text = Path('nav.js').read_text(encoding='utf-8', errors='replace')
    return set(re.findall(r"['\"]([a-z0-9][a-z0-9-]{1,40})['\"]", text))


# ---------------------------------------------------------------------------
# Classification
# ---------------------------------------------------------------------------

def classify(page, info, rels, fns, nav, module_tables):
    """Assign one evidence class, and the evidence behind it.

    Order matters: BROKEN outranks everything (a page that names a relation
    nothing defines is a silent empty-state, not a working page), and
    UNREACHABLE is checked before the persistence classes because a page no
    navigation reaches is not delivered regardless of how well it is wired.
    """
    slug = page.stem
    missing_t = sorted(t for t in info['tables'] if t.lower() not in rels)
    missing_f = sorted(f for f in info['rpcs'] if f.lower() not in fns)

    if missing_t or missing_f:
        bits = []
        if missing_t:
            bits.append('undefined table/view: ' + ', '.join(missing_t))
        if missing_f:
            bits.append('undefined rpc: ' + ', '.join(missing_f))
        return 'BROKEN', '; '.join(bits)

    if slug not in nav and slug not in PUBLIC_PAGES:
        return 'UNREACHABLE', 'not referenced by nav.js and not a public page'

    # Classification runs on the DATA axis only -- does this page persist
    # anything to Postgres? Auth contact is reported as evidence but never
    # promotes a page out of LOCAL_ONLY: a page that signs a member in and then
    # keeps their data in localStorage is still keeping their data on one
    # device.
    auth_ev = ('%d auth call%s' % (info['auth'], '' if info['auth'] == 1 else 's')
               ) if info['auth'] else ''

    backend = info['tables'] | info['rpcs'] | info['edges']
    if backend:
        ev = []
        if info['tables']:
            ev.append('%d table%s' % (len(info['tables']),
                                      '' if len(info['tables']) == 1 else 's'))
        if info['rpcs']:
            ev.append('%d rpc' % len(info['rpcs']))
        if info['edges']:
            ev.append('%d edge fn' % len(info['edges']))
        detail = 'reads/writes ' + ', '.join(ev)
        if auth_ev:
            detail += '; ' + auth_ev
        # A page that talks to Postgres *and* keeps a parallel localStorage
        # copy is only partly delivered -- whichever data lives only in the
        # browser is lost with the cache.
        if info['ls_writes']:
            return 'PARTIAL', detail + '; also %d localStorage write%s' % (
                info['ls_writes'], '' if info['ls_writes'] == 1 else 's')
        return 'BUILT', detail

    if info['ls_writes']:
        detail = ('%d localStorage write%s, no table/rpc/edge call -- member '
                  'data is device-local' % (info['ls_writes'],
                                            '' if info['ls_writes'] == 1 else 's'))
        if auth_ev:
            detail += ' (signs the member in: %s)' % auth_ev
        detail += ('; has an OmegaLocalBackup export path'
                   if info['backup'] else '; **no export path**')
        return 'LOCAL_ONLY', detail

    return 'STATIC', ('no persisted state; ' + auth_ev + ' only') if auth_ev \
        else 'no backend call, no stored state'


def main():
    args = set(sys.argv[1:])
    summary_only = '--summary' in args
    strict = '--strict' in args

    rels, fns, defs = sql_surface()
    nav = nav_slugs()

    # Pages only. Edge Function *source* is scanned separately below for
    # wiring, not for schema references -- scripts/audit.py already covers
    # those (it is what flags weekly-digest's two undeclared tables), and
    # duplicating that check here would report the same finding twice.
    pages = sorted(Path('.').glob('*.html'))
    rows = []
    for page in pages:
        info = scan_client(page)
        cls, why = classify(page, info, rels, fns, nav, defs)
        rows.append((page.name, cls, why, info))

    by_class = defaultdict(list)
    for name, cls, why, info in rows:
        by_class[cls].append((name, why, info))

    # Edge Functions ---------------------------------------------------------
    client_edges = set()
    for path in list(Path('.').glob('*.html')) + list(Path('.').glob('*.js')):
        text = path.read_text(encoding='utf-8', errors='replace')
        for a, b in EDGE_RE.findall(text):
            client_edges.add(a or b)

    edge_rows = []
    for d in sorted(p for p in Path('supabase/functions').iterdir() if p.is_dir()):
        name = d.name
        if name in client_edges:
            edge_rows.append((name, 'WIRED', 'invoked from client code'))
        elif name in SERVER_INVOKED_FUNCTIONS:
            edge_rows.append((name, 'SERVER_INVOKED',
                              'no client call expected (webhook/scheduled)'))
        else:
            edge_rows.append((name, 'UNWIRED',
                              'deployed source, but nothing in this repo calls it'))

    dupes = {t: sorted(f) for t, f in defs.items() if len(f) > 1}

    # ---- output ------------------------------------------------------------
    print('Ω MASTER EVIDENCE AUDIT')
    print('=' * 68)
    for cls in CLASSES:
        n = len(by_class.get(cls, []))
        print('  %-12s %3d' % (cls, n))
    print('  %-12s %3d' % ('pages total', len(rows)))
    print()
    print('  edge functions: %d wired / %d server-invoked / %d unwired'
          % (sum(1 for r in edge_rows if r[1] == 'WIRED'),
             sum(1 for r in edge_rows if r[1] == 'SERVER_INVOKED'),
             sum(1 for r in edge_rows if r[1] == 'UNWIRED')))
    print('  tables/views declared in supabase/: %d' % len(rels))
    print('  functions declared in supabase/:    %d' % len(fns))
    print('  tables defined in >1 root SQL file: %d' % len(dupes))
    lo = by_class.get('LOCAL_ONLY', [])
    if lo:
        with_backup = sum(1 for _n, _w, i in lo if i['backup'])
        print('  device-local pages: %d with an export path, %d with none'
              % (with_backup, len(lo) - with_backup))
    print()
    print('  UNVERIFIED: every row above is repository evidence only. No live')
    print('  database was reached, so no table, column, GRANT or RLS policy is')
    print('  confirmed to exist in production by this run.')

    if summary_only:
        return 0

    write_report(rows, by_class, edge_rows, dupes, rels, fns)
    print()
    print('wrote EVIDENCE_MATRIX.md')

    if strict and by_class.get('BROKEN'):
        return 1
    return 0


def write_report(rows, by_class, edge_rows, dupes, rels, fns):
    out = []
    w = out.append

    w('# Ω MASTER EVIDENCE MATRIX')
    w('')
    w('**Generated by `scripts/evidence-audit.py` — do not edit by hand.**')
    w('Re-run the script; it re-derives every number below from the working tree.')
    w('')
    w('This answers one question per deliverable: *what can this repository')
    w('actually prove about it?* It deliberately does not answer "is it good",')
    w('"is it finished", or "is it live" — only what the code shows.')
    w('')
    w('## The bound on every claim here')
    w('')
    w('This scanner reads the repository. It has no database connection, so:')
    w('')
    w('- **`BUILT` means the client is wired**, not that the feature works in')
    w('  production. The page calls a relation or function that `supabase/`')
    w('  declares. Whether the live database has that relation, with those')
    w('  columns, with a `GRANT` reaching `authenticated`, under a policy that')
    w('  scopes rows correctly — none of that is checked here, and every one of')
    w('  those has been a real shipped bug in this repo (CLAUDE.md §8.1).')
    w('- **Nothing here is production evidence.** Confirming any row against')
    w('  the live database needs an authenticated Supabase session and the')
    w('  member-impersonation method in CLAUDE.md §8.4.')
    w('')
    w('## Classes')
    w('')
    w('| class | meaning |')
    w('|---|---|')
    w('| `BUILT` | Reaches the backend; every relation and function it names is declared in `supabase/`. |')
    w('| `PARTIAL` | Reaches the backend **and** writes `localStorage`. Whatever lives only in the browser is lost with the cache. |')
    w('| `LOCAL_ONLY` | Writes `localStorage`, makes no table/rpc/edge call. Member data is device-local — not synced, not visible to the owner, gone with the cache. Some pages sign the member in first; that gives them a session, not persistence. |')
    w('| `STATIC` | Persists nothing. Some of these are correct (display pages, and auth-only pages such as `reset.html`, whose evidence column says so); for anything meant to record something, it is a gap. |')
    w('| `BROKEN` | Names a table, view, or function that nothing in `supabase/` declares. Supabase resolves this to `{data:null,error}` — a silent empty state, not a crash. |')
    w('| `UNREACHABLE` | Deployed, but `nav.js` does not reference it and it is not a public page. |')
    w('')
    w('## Summary')
    w('')
    w('| class | pages |')
    w('|---|---:|')
    for cls in CLASSES:
        w('| `%s` | %d |' % (cls, len(by_class.get(cls, []))))
    w('| **total** | **%d** |' % len(rows))
    w('')

    for cls in CLASSES:
        entries = by_class.get(cls, [])
        if not entries:
            continue
        w('## %s (%d)' % (cls, len(entries)))
        w('')
        w('| page | evidence |')
        w('|---|---|')
        for name, why, _info in sorted(entries):
            w('| `%s` | %s |' % (name, why))
        w('')

    w('## Edge Functions')
    w('')
    w('| function | state | evidence |')
    w('|---|---|---|')
    for name, state, why in edge_rows:
        w('| `%s` | `%s` | %s |' % (name, state, why))
    w('')

    w('## Declared backend surface')
    w('')
    w('| | count |')
    w('|---|---:|')
    w('| tables + views declared in `supabase/` | %d |' % len(rels))
    w('| functions declared in `supabase/` | %d |' % len(fns))
    w('| tables defined in more than one root SQL file | %d |' % len(dupes))
    w('')
    w('Duplicate definitions are a source-of-truth hazard, not necessarily a')
    w('live defect: `scripts/audit.py` separates the byte-identical copies from')
    w('the ones with conflicting column lists. Consolidating needs a per-table')
    w('live-schema check, not a bulk sweep (CLAUDE.md §5).')
    w('')
    if dupes:
        w('<details><summary>Tables defined in more than one root SQL file</summary>')
        w('')
        w('| table | files |')
        w('|---|---|')
        for t, files in sorted(dupes.items()):
            shown = ', '.join('`%s`' % f for f in files[:4])
            if len(files) > 4:
                shown += ', … (%d total)' % len(files)
            w('| `%s` | %s |' % (t, shown))
        w('')
        w('</details>')
        w('')

    w('## UNVERIFIED — what no repository scan can settle')
    w('')
    w('These are not open questions because nobody looked. They are open')
    w('because the answer lives in the production database, and this scanner')
    w('has no connection to it. Each one has been a real shipped bug here:')
    w('')
    w('| question | why the repo cannot answer it |')
    w('|---|---|')
    w('| Does the live database have every table `supabase/` declares? | The SQL bag is applied by hand. `supabase/migrations/` is validated against a *blank* database only, and `task_completions` is a proven case where live and declared disagree (CLAUDE.md §5). |')
    w('| Do the columns match? | PostgREST rejects the whole query when one column name is unknown, emptying a page with no visible error (CLAUDE.md §8.1 class 2). |')
    w('| Can a member actually reach each table? | A `GRANT` is checked *before* row security, so a correct RLS policy on a table with no grant fails every query with `42501`. 60 tables were once in this state (CLAUDE.md §8.1 class 6). |')
    w('| Do the policies scope rows correctly? | Only reproducible by impersonating a real member in-database; a privileged `execute_sql` proves nothing (CLAUDE.md §8.4). |')
    w('| Which duplicate table definition is the live one? | Source analysis cannot tell. Needs a `pg_proc`/`information_schema` query per table. |')
    w('')
    w('Two committed documents currently disagree about the first row, and')
    w('this scan cannot break the tie: `MIGRATION_STATE.md` opens with "All')
    w('migrations synchronized. No pending conflicts.", while CLAUDE.md §8.2')
    w('records the migration sequence as validated against a blank database')
    w('only. Treat the live schema as unverified until a session with database')
    w('access settles it.')
    w('')

    Path('EVIDENCE_MATRIX.md').write_text('\n'.join(out) + '\n', encoding='utf-8')


if __name__ == '__main__':
    sys.exit(main())
