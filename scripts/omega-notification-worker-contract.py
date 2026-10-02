#!/usr/bin/env python3
"""Contract for the governed notification worker and delivery boundary."""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MIGRATION = ROOT / 'supabase/migrations/20261002080219_notification_worker_claim_boundary_20261002.sql'
WORKER = ROOT / 'supabase/functions/omega-notification-worker/index.ts'
CONFIG = ROOT / 'supabase/config.toml'
REMOTE = ROOT / 'supabase/remote-migrations.json'

def main() -> int:
    errors = []
    for path in (MIGRATION, WORKER, CONFIG, REMOTE):
        if not path.is_file():
            errors.append(f'missing: {path.relative_to(ROOT)}')
    if errors:
        print('OMEGA NOTIFICATION WORKER CONTRACT: FAIL')
        for error in errors: print(' -', error)
        return 1
    sql = MIGRATION.read_text(encoding='utf-8')
    worker = WORKER.read_text(encoding='utf-8')
    config = CONFIG.read_text(encoding='utf-8')
    remote = REMOTE.read_text(encoding='utf-8')
    checks = [
        ('security definer', sql),
        ("set search_path=''", sql),
        ('for update skip locked', sql),
        ("status='sent'", sql),
        ('revoke all on function omega_private.claim_notifications', sql),
        ('grant execute on function omega_private.claim_notifications', sql),
        ("withSupabase({ auth: 'secret' }", worker),
        ("p_channels: ['in_app']", worker),
        ('not_claimed_until_provider_adapter_is_configured', worker),
        ('[functions.omega-notification-worker]', config),
        ('verify_jwt = false', config),
        ('20261002080219', remote),
    ]
    for needle, source in checks:
        if needle not in source:
            errors.append(f'missing contract marker: {needle}')
    if errors:
        print('OMEGA NOTIFICATION WORKER CONTRACT: FAIL')
        for error in errors: print(' -', error)
        return 1
    print('OMEGA NOTIFICATION WORKER CONTRACT: PASS')
    print('claim=server_only_skip_locked')
    print('channel=in_app_only_until_provider_adapter')
    print('auth=secret')
    return 0

if __name__ == '__main__':
    raise SystemExit(main())