#!/usr/bin/env python3
"""Refuse migration drift between supabase/migrations/ and the live project.

WHY THIS EXISTS

`supabase db push` refuses to run with:

    Remote migration versions not found in local migrations directory.

That is not a Supabase bug. It happens whenever the remote migration history
contains a version `supabase/migrations/` does not -- which is every time a
migration is applied through the dashboard or the MCP `apply_migration` tool,
because those write a remote history row and no local file.

Measured on 2026-09-05, the drift ran BOTH ways and no existing gate saw either:

    remote-only (no local file)   9   creator_proposals, two RLS hardening
                                      migrations, four observability/FK ones,
                                      and two applied by this session
    local-only  (never applied)   4   0104 runtime_schema_alignment
                                      0105 creator_proposals (duplicate of the
                                           timestamped remote one)
                                      0106 commerce_flags (genuinely missing:
                                           ad_network_enabled and
                                           creator_earnings_enabled did not
                                           exist live)
                                      20260902 reset_migration_state -- itself a
                                           previous attempt to paper over this
                                           exact problem with a "no-op
                                           checkpoint", which cannot work because
                                           the CLI compares version lists

The local-only direction matters as much as the one the CLI reports: `db push`
would try to APPLY those files, and a file whose effects are already live by
other means is at best a no-op and at worst a surprise.

HOW IT SEES REMOTE STATE

`scripts/` has no database connection -- only an MCP session does. So this gate
reads `supabase/remote-migrations.json`, a committed snapshot, exactly as
`schema-dictionary.py` reads `supabase/live-schema.json`. **Regenerate that
snapshot in the same change that applies a migration live.** A stale snapshot
makes this gate lie in both directions (CLAUDE.md 8.1 class 2).

Usage:
  python3 scripts/migration-drift.py            # exit 1 on drift
  python3 scripts/migration-drift.py --help     # this text
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / 'supabase' / 'migrations'
SNAPSHOT = ROOT / 'supabase' / 'remote-migrations.json'
PENDING = ROOT / 'supabase' / 'pending-migrations.json'


def local_versions():
    """Version prefix of every migration file, per the Supabase CLI convention."""
    out = {}
    for p in sorted(MIGRATIONS.glob('*.sql')):
        m = re.match(r'^(\d+)_', p.name)
        out[m.group(1) if m else p.stem] = p.name
    return out


def main(argv):
    if '--help' in argv or '-h' in argv:
        print(__doc__)
        print('Additional mode: --source-only permits only explicitly registered pending migrations; it never claims they are live-applied.')
        return 0
    unknown = [arg for arg in argv if arg != '--source-only']
    if unknown:
        print('Usage: migration-drift.py [--source-only]')
        return 2
    source_only = '--source-only' in argv

    if not MIGRATIONS.is_dir():
        print('MIGRATION DRIFT: FAIL\n- supabase/migrations/ is missing')
        return 1
    try:
        snap = json.loads(SNAPSHOT.read_text(encoding='utf-8'))
        remote = set(snap['versions'])
        captured = snap.get('_captured', 'unknown')
    except Exception as exc:
        print('MIGRATION DRIFT: FAIL\n- cannot read %s: %s'
              % (SNAPSHOT.relative_to(ROOT), exc))
        return 1

    local = local_versions()
    remote_only = sorted(remote - set(local))
    local_only = sorted(set(local) - remote)
    try:
        pending_doc = json.loads(PENDING.read_text(encoding='utf-8')) if PENDING.is_file() else {'pending': []}
        pending_entries = pending_doc.get('pending', [])
        if not isinstance(pending_entries, list):
            raise ValueError("'pending' must be a list")
        pending = {}
        for entry in pending_entries:
            if not isinstance(entry, dict):
                raise ValueError('pending entries must be objects')
            version = str(entry.get('version', ''))
            filename = str(entry.get('file', ''))
            if not version or local.get(version) != filename:
                raise ValueError('pending version/file does not match a local migration: %r / %r' % (version, filename))
            if entry.get('status') != 'PENDING_REVIEW' or entry.get('liveStatus') != 'NOT_APPLIED':
                raise ValueError('%s must remain PENDING_REVIEW / NOT_APPLIED' % version)
            if entry.get('blocksProduction') is not True:
                raise ValueError('%s must explicitly block production' % version)
            if version in pending:
                raise ValueError('duplicate pending version: %s' % version)
            pending[version] = filename
    except Exception as exc:
        print('MIGRATION DRIFT: FAIL\n- invalid pending migration registry: %s' % exc)
        return 1

    overlap = sorted(remote.intersection(pending))
    pending_missing = sorted(set(pending) - set(local))
    unregistered_local = sorted(set(local_only) - set(pending))
    pending_local = sorted(set(local_only).intersection(pending))

    if remote_only or unregistered_local or pending_missing or overlap:
        print('MIGRATION DRIFT: FAIL  (snapshot captured %s)' % captured)
        for v in remote_only:
            print('- remote has %s with no file in supabase/migrations/ '
                  '— this is what `supabase db push` reports' % v)
        for v in unregistered_local:
            print('- %s (%s) has never been applied and is not registered pending'
                  % (v, local[v]))
        for v in pending_missing:
            print('- pending migration %s has no local file' % v)
        for v in overlap:
            print('- %s is incorrectly listed as both live-applied and pending' % v)
        return 1

    if pending_local and not source_only:
        print('MIGRATION DRIFT: BLOCKED  (snapshot captured %s)' % captured)
        for v in pending_local:
            print('- %s (%s) is registered PENDING_REVIEW / NOT_APPLIED; production release is blocked'
                  % (v, pending[v]))
        print('Do not add pending versions to remote-migrations.json without provider evidence.')
        return 1

    if pending_local:
        print('MIGRATION DRIFT: SOURCE PASS (%d live versions; %d explicitly pending; snapshot %s).'
              % (len(remote), len(pending_local), captured))
        print('Release state: BLOCKED until pending migrations pass review and are applied with provider evidence.')
        return 0

    print('MIGRATION DRIFT: PASS (%d versions, local and remote agree; '
          'snapshot %s)' % (len(remote), captured))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
