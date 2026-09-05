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
        return 0

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

    if remote_only or local_only:
        print('MIGRATION DRIFT: FAIL  (snapshot captured %s)' % captured)
        for v in remote_only:
            print('- remote has %s with no file in supabase/migrations/ '
                  '— this is what `supabase db push` reports' % v)
        for v in local_only:
            print('- %s (%s) has never been applied — `db push` would run it'
                  % (v, local[v]))
        print('\nTo resolve: materialise the missing file from the recorded '
              'statements, or register the applied version, then regenerate '
              'supabase/remote-migrations.json in the same change.')
        return 1

    print('MIGRATION DRIFT: PASS (%d versions, local and remote agree; '
          'snapshot %s)' % (len(remote), captured))
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
