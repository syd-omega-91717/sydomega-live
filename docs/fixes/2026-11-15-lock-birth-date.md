# A member could change their date of birth, and with it their sign, element, god and agent (2026-11-15)

**Status: PROPOSAL. The SQL is in `docs/proposed-migrations/`, deliberately not in `supabase/migrations/` and not in `pending-migrations.json`. Merging this applies nothing.**

## Found
`derive_cosmology` (`0001_omega_master_deploy.sql`) makes the date of birth authoritative: on every update of `sign` or `birth_date` it recomputes sign, element, god and agent. `account.html` writes
`birth_date` with a column-level grant. Nothing stopped a second submission, so a member could re-enter another date and change their character. `grep` for any lock, immutability or `old.birth_date` check over
`supabase/migrations/` found none. (Read from source; the live database was not readable.)

## Drafted
`docs/proposed-migrations/20261115200000_omega_lock_birth_date_after_first_entry.sql`: a `BEFORE UPDATE OF birth_date` trigger, `WHEN old.birth_date IS NOT NULL AND new IS DISTINCT FROM old`, which refuses with SQLSTATE `42501` and
message `birth_date_locked` unless there is no JWT user (service role, SQL editor, migrations) or `is_platform_owner()` is true. It runs as the invoker, lives in `private`, and its execute right is revoked.
`account.html` now says "Your date of birth is already recorded and cannot be changed here. Ask the platform owner to correct it." instead of "Could not save (42501)".

## Proof, and its limit
Run on a **throwaway Postgres 16** (separate cluster, port 5544) with **stubbed** `auth.uid()`, `profiles` and `is_platform_owner()`, loading the real migration file, with real `SET LOCAL ROLE authenticated / service_role`:

| case | result |
|---|---|
| member sets a date the first time | allowed |
| member re-submits the same date | allowed |
| member changes a recorded date | refused, `birth_date_locked` |
| member clears a recorded date | refused, `birth_date_locked` |
| member updates another column | allowed |
| owner corrects a member's date | allowed |
| service role changes a date | allowed |
| member calls the trigger function directly | refused |
| refusal carries SQLSTATE 42501 | yes |

9 of 9. The migration is also re-runnable. **Discrimination check:** the same script against a copy whose function body does nothing fails exactly the three locking cases (change, clear, SQLSTATE), 6 of 9.
**Not proved:** anything on Supabase itself (real `auth.uid()`, real `is_platform_owner()`, the live `profiles` grants and RLS, the interaction with `derive_cosmology`). That needs a non-production copy and a real impersonation probe.
`scripts/tests/test_birth_date_lock_migration.py` keeps the migration's shape and the pending registration in CI (it fails on a weakened copy).
Gates run: `migration-drift --source-only` (source pass, release BLOCKED until the pending migration is reviewed and applied, as intended), `migration-replay-contract`, `schema-consolidation`, `schema-dictionary`, `rls-auditor`, `grant-contract`, `silent-failure-detector`.

## Trade-off for the owner
A member who mistypes their date the first time cannot correct it themselves; the owner can. Members whose date is already set are locked from the moment this applies. The page gives no "this cannot be changed" warning before the first save; adding one is a copy and i18n change not made here.

## Why it remains a proposal
This migration remains outside `supabase/migrations/` and `supabase/pending-migrations.json` because the owner/product decision on locking member birth dates is still open. The repository's pending-migration workflow now supports explicitly registered `PENDING_REVIEW / NOT_APPLIED` migrations and blocks production until they are applied with provider evidence. The separate 2026-11-18 reservation-security migration uses that controlled path; it does not approve this unrelated identity-policy change.

To apply this birth-date proposal, first obtain explicit owner approval for the trade-off, then register it as pending, replay it from zero, probe with real impersonation on a non-production copy, and use the controlled push. No birth-date lock is included in this PR.
## Not done
Not applied. Not run on Supabase. The throwaway cluster was removed after the run.
