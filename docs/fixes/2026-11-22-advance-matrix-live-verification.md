# Advance Matrix live privilege verification — 2026-11-22

## Finding

The live Supabase database exposes two callable paths that can increment a member's matrix axes without an event-backed progression check:

- `public.advance_matrix(integer,text)` is a SECURITY INVOKER wrapper.
- `private.advance_matrix(integer,text)` is SECURITY DEFINER and owned by `postgres`.

Live privilege checks returned:

| Principal | Private schema USAGE | Public function EXECUTE | Private function EXECUTE |
|---|---:|---:|---:|
| anon | yes | no | no |
| authenticated | yes | yes | yes |
| service_role | no | yes | no |
| postgres/function owner | owner | yes | yes |

The live `public.matrix_progress` table currently contains **0 rows**. This is evidence of no current progression data, not proof that the callable path is safe.

## Corrected remediation proposal

The proposal at `docs/proposed-migrations/20261115230000_omega_close_advance_matrix.sql` now revokes EXECUTE from `PUBLIC`, `anon`, `authenticated`, and `service_role` on both the public wrapper and private SECURITY DEFINER function. The postgres migration owner retains control. A future server-side SECURITY DEFINER wrapper owned by postgres can call the private function if a verified event-based progression workflow is later designed.

The proposal remains deliberately outside `supabase/migrations/` and `supabase/pending-migrations.json`. **No live migration was applied.** The user/owner must approve moving this security change into the controlled migration path. Applying it will intentionally disable manual matrix progression until a genuine event-verified progression workflow exists.

## Required follow-up

1. Owner approval for the two-function EXECUTE revocation.
2. Add the approved SQL to the canonical migration path and migration history.
3. Replay all migrations from zero.
4. Apply through the protected production migration workflow.
5. Verify live grants: authenticated/anon/service_role denied; postgres owner retained.
6. Build and test an event-verified progression workflow before re-enabling any member-facing progression API.
