#!/usr/bin/env python3
"""Refuse a migration that gives a table member policies and no GRANT.

WHY THIS EXISTS

`20260903015535_harden_future_defaults_and_rls` revoked default table
privileges from anon and authenticated. Since then every new table starts with
NO client privileges, and Postgres checks a GRANT *before* row security -- so a
correct `CREATE POLICY ... TO authenticated` on a table nobody granted never
runs. Every query fails `42501 permission denied`, and Supabase does not throw:
the client gets `{data:null,error}` and the page renders empty (CLAUDE.md 8.1
class 6c, class 1).

`rls-auditor.py` reads policy *text* only, so it passed all of this. Measured
live on 2026-10-06: eight tables shipped that day in this state, among them all
four Creation Layer tables and the mission-board's own read path
(`omega_member_mission_task_surface()` -> 42501 for every member).

WHAT IT CHECKS

For each table that a migration at or after the default-privilege revoke
creates and that some policy opens to a client role (`authenticated`, `anon`,
or PUBLIC when no `TO` clause is given), at least one client role must receive
a table- or column-level GRANT on it in some migration. Tables from before the revoke kept their
default grants and are out of scope; so are tables with no policies at all
(service-only by construction).

It proves a grant was *written*, not that it reached live -- regenerate
supabase/live-schema.json and impersonate a member for that (CLAUDE.md 8.4).

Usage:
  python3 scripts/migration-grant-contract.py          # exit 1 on a violation
  python3 scripts/migration-grant-contract.py --help   # this text
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / 'supabase' / 'migrations'
# The migration that revoked default table privileges from client roles.
REVOKE_VERSION = '20260903015535'
CLIENT_ROLES = ('anon', 'authenticated')

IDENT = r'(?:"?public"?\.)?"?([a-z_][a-z0-9_]*)"?'
CREATE_TABLE = re.compile(r'create\s+table\s+(?:if\s+not\s+exists\s+)?' + IDENT)
CREATE_POLICY = re.compile(
    r'create\s+policy\s+(?:"[^"]+"|\S+)\s+on\s+' + IDENT + r'(.*?);', re.S)
DROP_TABLE = re.compile(r'drop\s+table\s+(?:if\s+exists\s+)?' + IDENT + r'[^;]*;', re.S)
GRANT = re.compile(
    r'grant\s+(.*?)\s+on\s+(?:table\s+)?((?:(?:"?public"?\.)?"?[a-z_][a-z0-9_]*"?\s*,\s*)*'
    r'(?:"?public"?\.)?"?[a-z_][a-z0-9_]*"?)\s+to\s+([^;]*);', re.S)
TO_ROLES = re.compile(r'\bto\s+([a-z_,\s]+?)(?:\busing\b|\bwith\b|$)', re.S)

# Baseline measured live on 2026-10-06, each cross-checked with
# has_table_privilege(). A ratchet: a NEW table in this state fails, and an
# entry here that stops being a finding fails too, so the list only shrinks.
LOCKED_OUT = 'policies, no client grant live; read by no page -- GAP_ANALYSIS.md S'
GRANTED_BY_HAND = 'granted live by a statement no migration file holds'
KNOWN = {
    'ai_memory_embeddings': LOCKED_OUT,
    'omega_achievement_verifications': LOCKED_OUT,
    'omega_agent_tool_grants': LOCKED_OUT,
    'omega_audit_log': LOCKED_OUT,
    'omega_fraud_signals': LOCKED_OUT,
    'omega_payment_events': LOCKED_OUT,
    'omega_referral_attributions': LOCKED_OUT,
    'omega_referral_clicks': LOCKED_OUT,
    'omega_referral_codes': LOCKED_OUT,
    'omega_referral_conversions': LOCKED_OUT,
    'omega_referral_rewards': LOCKED_OUT,
    'stripe_webhook_events': LOCKED_OUT,
}


def strip_sql(text):
    """Lowercase, drop comments and string literals (CLAUDE.md 8.4)."""
    text = re.sub(r'--[^\n]*', '', text)
    text = re.sub(r'/\*.*?\*/', '', text, flags=re.S)
    text = re.sub(r"'(?:[^']|'')*'", "''", text)
    return text.lower()


def version_of(path):
    m = re.match(r'^(\d+)_', path.name)
    return m.group(1) if m else ''


def policy_roles(tail):
    m = TO_ROLES.search(tail)
    if not m:
        return set(CLIENT_ROLES)          # no TO clause means PUBLIC
    roles = {r.strip() for r in m.group(1).split(',') if r.strip()}
    if 'public' in roles:
        return set(CLIENT_ROLES)
    return roles & set(CLIENT_ROLES)


def scan(migrations_dir):
    created = {}      # table -> (version, file) that created it after the revoke
    dropped = {}      # table -> latest version that explicitly dropped it
    needs = {}        # table -> roles some policy names
    granted = {}      # table -> roles granted anything
    for path in sorted(migrations_dir.glob('*.sql')):
        sql = strip_sql(path.read_text(encoding='utf-8', errors='replace'))
        if version_of(path) >= REVOKE_VERSION:
            version = version_of(path)
            for t in CREATE_TABLE.findall(sql):
                created[t] = (version, path.name)
            for t in DROP_TABLE.findall(sql):
                dropped[t] = version
        for t, tail in CREATE_POLICY.findall(sql):
            needs.setdefault(t, set()).update(policy_roles(tail))
        for _privs, tables, roles in GRANT.findall(sql):
            role_set = {r.strip() for r in roles.split(',')}
            for t in re.findall(IDENT, tables):
                granted.setdefault(t, set()).update(role_set & set(CLIENT_ROLES))
    findings = []
    for t, (created_version, where) in sorted(created.items()):
        # A table that was explicitly retired after its creation is not a live
        # client surface. Do not turn historical create/policy statements into
        # a false grant finding (e.g. omega_agent_action_proposals).
        if t in dropped and dropped[t] > created_version:
            continue
        # A table some policy opens to a client role, on which NO client role
        # holds any privilege: no policy on it can ever run. A PUBLIC policy
        # with only `authenticated` granted is the normal member-table shape,
        # not a defect, so a per-role mismatch is not reported.
        if needs.get(t) and not granted.get(t):
            findings.append((t, where, sorted(needs[t])))
    return findings


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        return 0
    if not MIGRATIONS.is_dir():
        print('MIGRATION GRANT CONTRACT: FAIL\n- supabase/migrations/ is missing')
        return 1
    findings = scan(MIGRATIONS)
    found = {t for t, _w, _r in findings}
    new = [f for f in findings if f[0] not in KNOWN]
    stale = sorted(set(KNOWN) - found)
    if new or stale:
        print('MIGRATION GRANT CONTRACT: FAIL')
        for t, where, roles in new:
            print('- public.%s (created in %s) has policies for %s and no client '
                  'role holds any GRANT on it -- every client query fails 42501'
                  % (t, where, ', '.join(roles)))
        for t in stale:
            print('- public.%s is no longer a finding; remove it from KNOWN' % t)
        if new:
            print('\nAdd the narrowest GRANT the policies imply, in a new migration.')
        return 1
    print('MIGRATION GRANT CONTRACT: PASS (no new table has client policies '
          'without a GRANT; %d known, see KNOWN)' % len(KNOWN))
    return 0

if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
