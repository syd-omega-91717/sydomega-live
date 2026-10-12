#!/usr/bin/env python3
"""Grant contract: every client database call must be one the live grants allow.

WHY THIS EXISTS

A GRANT is checked before row-level security, so a correct RLS policy on a
table with no matching privilege never runs: the call fails 42501 and the page
shows an error or an empty state (CLAUDE.md 8.1 class 6). Column-level grants
make it subtler. `profiles` lets members UPDATE 14 columns only, so a write
naming a 15th fails whole. On 2026-10-12 that blocked the sign-up birth-date
gate for every new member -- account.html upserted email/element/god/agent,
which no member may write -- while every existing gate passed (FIXES_LOG.md).

WHAT IT CHECKS

Every `.from('<table>').<op>(...)` in the root *.html / *.js files, against
supabase/live-grants.json (the `authenticated` role, captured live):

  select   table-level SELECT, or a literal column list inside the column grant
           (`select('*')`, an empty select or a non-literal list needs the
           table-level privilege -- Postgres rejects `*` on a column grant)
  insert   table-level INSERT, or literal payload keys inside the column grant
  update   table-level UPDATE, or literal payload keys inside the column grant
  upsert   both INSERT and UPDATE (it is INSERT ... ON CONFLICT DO UPDATE)
  delete   table-level DELETE

Tables missing from the snapshot are skipped (scripts/schema-dictionary.py owns
names that do not exist). Embedded resources in a select (`rel!inner(col)`) are
not checked here.

KNOWN is the list of findings already recorded open in GAP_ANALYSIS.md, each
with its reason. A KNOWN entry that no longer matches any call FAILS the run,
so the list cannot quietly outlive the bug it excuses.

REGENERATING THE SNAPSHOT (run against project ydqhzvvoyufiiqvzcjns, then
replace `relations` in supabase/live-grants.json; read-only):

  with rels as (select c.oid, c.relname from pg_class c
                join pg_namespace n on n.oid = c.relnamespace
                where n.nspname = 'public' and c.relkind in ('r','p','v','m')),
  tbl as (select relname, concat(
            case when has_table_privilege('authenticated',oid,'SELECT') then 'S' else '-' end,
            case when has_table_privilege('authenticated',oid,'INSERT') then 'I' else '-' end,
            case when has_table_privilege('authenticated',oid,'UPDATE') then 'U' else '-' end,
            case when has_table_privilege('authenticated',oid,'DELETE') then 'D' else '-' end) t
          from rels),
  cols as (select table_name, privilege_type, jsonb_agg(column_name order by column_name) c
           from information_schema.column_privileges
           where table_schema = 'public' and grantee = 'authenticated'
             and privilege_type in ('SELECT','INSERT','UPDATE') group by 1, 2)
  select jsonb_object_agg(tbl.relname, jsonb_strip_nulls(jsonb_build_object(
    'table', tbl.t,
    'columns', nullif((select jsonb_object_agg(cols.privilege_type, cols.c) from cols
      where cols.table_name = tbl.relname
        and ((cols.privilege_type = 'SELECT' and substr(tbl.t,1,1) = '-')
          or (cols.privilege_type = 'INSERT' and substr(tbl.t,2,1) = '-')
          or (cols.privilege_type = 'UPDATE' and substr(tbl.t,3,1) = '-'))), '{}'::jsonb))))
  from tbl;

  python3 scripts/grant-contract.py           check the repo
  python3 scripts/grant-contract.py --help    this text

Exit 0 = every call allowed.  Exit 1 = a finding, a stale KNOWN entry, or no snapshot.
"""
import json
import os
import re
import sys

if '--help' in sys.argv or '-h' in sys.argv:
    print(__doc__.strip())
    sys.exit(0)

ROOT = os.path.abspath(os.environ.get('OMEGA_ROOT') or os.path.join(os.path.dirname(__file__), '..'))
SNAPSHOT = os.path.join(ROOT, 'supabase', 'live-grants.json')

# (file, table, op) -> why it is open. Each must still match a call, or the run fails.
KNOWN = {
    ('profile.html', 'profiles', 'update'):
        "owner access panel writes access_approved/is_trial/trial_expires_at directly; "
        "approvals.html uses RPCs. GAP_ANALYSIS.md S, opened 2026-10-12",
    ('omega-graphify-integration.js', 'notifications', 'insert'):
        "fallback notification insert; server-side notify_member owns the table; logged, "
        "not silent. GAP_ANALYSIS.md S, opened 2026-10-12",
    ('bg.js', 'profiles', 'update'):
        "owner lifetime-access repair writes privileged columns; it fires only when the "
        "owner's flags are off (0 such owners live 2026-10-12) and trigger "
        "protect_owner_lifetime already enforces them; failure is recorded via __omegaWriteFail",
}

if os.environ.get('OMEGA_GRANT_KNOWN') == 'none':   # test fixtures: no repo files to excuse
    KNOWN = {}

NEED = {'select': 'S', 'insert': 'I', 'update': 'U', 'upsert': 'IU', 'delete': 'D'}
PRIV = {'S': 'SELECT', 'I': 'INSERT', 'U': 'UPDATE', 'D': 'DELETE'}
FROM = re.compile(r"""(?<![\w.])(?:\w+\s*\.\s*)?from\(\s*(['"`])([a-z_][a-z0-9_]*)\1\s*\)""")
OP = re.compile(r"\.\s*(select|insert|update|upsert|delete)\s*\(")


def matching(s, i, open_ch, close_ch):
    """Index just past the bracket that closes s[i] (== open_ch); string-aware."""
    depth, j, q = 0, i, None
    while j < len(s):
        c = s[j]
        if q:
            if c == '\\':
                j += 2
                continue
            if c == q:
                q = None
        elif c in '\'"`':
            q = c
        elif c in '([{':
            depth += 1
        elif c in ')]}':
            depth -= 1
            if depth == 0:
                return j + 1
        j += 1
    return len(s)


def split_top(s):
    parts, depth, cur, q = [], 0, '', None
    for c in s:
        if q:
            cur += c
            if c == q:
                q = None
            continue
        if c in '\'"`':
            q = c
        elif c in '([{':
            depth += 1
        elif c in ')]}':
            depth -= 1
        if c == ',' and depth == 0:
            parts.append(cur)
            cur = ''
        else:
            cur += c
    if cur.strip():
        parts.append(cur)
    return parts


def select_columns(arg):
    """Columns named by a select() argument; None if not statically known or '*'."""
    a = arg.strip()
    m = re.match(r"""^(['"])(.*?)\1""", a, re.S) or re.match(r"^`([^`$]*)`", a, re.S)
    if not a:
        return None                                   # select() == select('*')
    if not m:
        return None
    body = m.group(2) if m.re.groups == 2 else m.group(1)
    cols = set()
    for item in split_top(body):
        item = item.strip()
        if not item or '(' in item:                  # embedded resource: not this table's column
            continue
        if item == '*':
            return None
        item = item.split(':')[-1] if '::' not in item else item.split('::')[0].split(':')[-1]
        item = re.split(r'->>?', item)[0].strip()
        if re.fullmatch(r'[a-z_][a-z0-9_]*', item):
            cols.add(item)
    return cols


def payload_keys(arg):
    """Top-level keys of an object (or the first object in an array) literal; None if not literal."""
    a = arg.strip()
    if a.startswith('['):
        a = a[1:].lstrip()
    if not a.startswith('{'):
        return None
    body = a[1:matching(a, 0, '{', '}') - 1]
    keys = set()
    for item in split_top(body):
        item = item.strip()
        if not item:
            continue
        if item.startswith('...'):
            return None                               # spread: not statically known
        m = re.match(r"""^(['"]?)([A-Za-z_$][\w$]*)\1\s*(?::|$)""", item)
        if not m:
            return None
        keys.add(m.group(2))
    return keys


def in_comment(s, pos):
    if s.rfind('/*', 0, pos) > s.rfind('*/', 0, pos):
        return True
    line = s[s.rfind('\n', 0, pos) + 1:pos]
    return bool(re.search(r'(^|[^:\'"])//', line))


def check(root=ROOT):
    try:
        rel = json.load(open(SNAPSHOT if root == ROOT else os.path.join(root, 'supabase', 'live-grants.json')))['relations']
    except (OSError, ValueError, KeyError) as e:
        return [('supabase/live-grants.json', 0, '-', '-', 'snapshot missing or unreadable: %s' % e)], set(), 0
    findings, seen, calls = [], set(), 0
    files = sorted(f for f in os.listdir(root) if f.endswith(('.html', '.js')))
    for f in files:
        s = open(os.path.join(root, f), encoding='utf-8', errors='replace').read()
        for m in FROM.finditer(s):
            if 'storage' in s[max(0, m.start() - 12):m.start()] or in_comment(s, m.start()):
                continue
            table = m.group(2)
            if table not in rel:
                continue
            nxt = FROM.search(s, m.end())
            win_end = min(nxt.start() if nxt else len(s), m.end() + 800)
            o = OP.search(s, m.end(), win_end)
            if not o:
                continue
            op = o.group(1)
            arg_start = o.end() - 1
            args = split_top(s[arg_start + 1:matching(s, arg_start, '(', ')') - 1])
            first = args[0] if args else ''
            calls += 1
            g = rel[table].get('table', '----')
            colgrants = rel[table].get('columns', {})
            problems = []
            for need in NEED[op]:
                if need in g:
                    continue
                allowed = colgrants.get(PRIV[need])
                if not allowed:
                    problems.append('no %s grant' % PRIV[need])
                    continue
                cols = select_columns(first) if op == 'select' else payload_keys(first)
                if cols is None:
                    problems.append('%s is column-level only and the %s is not a literal list'
                                    % (PRIV[need], 'column list' if op == 'select' else 'payload'))
                    continue
                bad = sorted(cols - set(allowed))
                if bad:
                    problems.append('%s not granted on column(s): %s' % (PRIV[need], ', '.join(bad)))
            if problems:
                key = (f, table, op)
                line = s.count('\n', 0, m.start()) + 1
                if key in KNOWN:
                    seen.add(key)
                    continue
                findings.append((f, line, table, op, '; '.join(problems)))
    return findings, seen, calls


def main():
    findings, seen, calls = check()
    stale = sorted(set(KNOWN) - seen)
    print('GRANT CONTRACT  --  %d client call(s) checked against supabase/live-grants.json' % calls)
    for f, line, table, op, why in findings:
        print('  FAIL %s:%s  %s.%s  -- %s' % (f, line, table, op, why))
    for f, table, op in stale:
        print('  STALE KNOWN entry (no longer matches; delete it): %s %s.%s' % (f, table, op))
    if seen:
        print('  %d known open finding(s) excused (GAP_ANALYSIS.md S): %s' % (
            len(seen), ', '.join('%s %s.%s' % k for k in sorted(seen))))
    ok = not findings and not stale
    print('GRANT CONTRACT: ' + ('PASS' if ok else 'FAIL'))
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
