# Advance Matrix live privilege verification and remediation — 2026-11-22

## Finding before remediation

The live database contained two callable entry points:

- `public.advance_matrix(integer,text)`: SECURITY INVOKER wrapper.
- `private.advance_matrix(integer,text)`: SECURITY DEFINER implementation owned by `postgres`.

Before remediation, `authenticated` could execute both functions and `service_role` could execute the public wrapper. The trigger on `public.matrix_progress` calls `public.award_points(NEW.user_id, 2, 'matrix_advance', ...)` when an axis increases. This allowed axis changes and point awards without a verified task, exam or other platform event.

Before the fix, `matrix_progress` contained 0 rows and `automation_rules` contained 3 stored rows. No client RPC call, Edge Function caller or other SQL function caller was found. No live database function consumed `automation_rules`.

## Applied remediation

Migration version `20261122105012`, provider name `20261122110000_close_advance_matrix_member_execution`, was applied to the live Supabase project. It revokes EXECUTE from `PUBLIC`, `anon`, `authenticated` and `service_role` on both entry points. The migration asserts the postcondition and preserves the `postgres` owner privilege. It changes privileges only and does not modify matrix rows or award points.

## Live post-apply verification

| Function | anon | authenticated | service_role | postgres |
|---|---:|---:|---:|---:|
| `public.advance_matrix(integer,text)` | denied | denied | denied | allowed |
| `private.advance_matrix(integer,text)` | denied | denied | denied | allowed |

- Provider migration ledger: 441 applied versions; latest `20261122105012`.
- `public.matrix_progress`: 0 rows.
- `automation_rules`: 3 stored rows; no database function consumes this table.
- Authenticated-callable public function snapshot: 145; `advance_matrix` is absent.
- `config/omega-rpc-security-policy.json` no longer classifies `advance_matrix` as member-self.
- No client, Edge Function or other SQL function caller was found.

## Remaining feature work

The security exposure is closed; the matrix progression feature is not live. A future implementation must require an authenticated actor, verified event/evidence ID, allowlisted track/axis mapping, idempotency, authorization, and a separately audited points award. Do not regrant direct API execution.
