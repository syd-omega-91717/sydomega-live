# Advance matrix privilege closure — 2026-11-22

**Status: CLOSED for API-role execution.** The progression feature remains unavailable until a genuine event-verified executor is designed and deployed.

## Finding before remediation

The live database contained two callable entry points:

- `public.advance_matrix(integer,text)`: SECURITY INVOKER wrapper.
- `private.advance_matrix(integer,text)`: SECURITY DEFINER implementation owned by `postgres`.

Before the fix, `authenticated` could execute both functions and `service_role` could execute the public wrapper. The private schema also granted authenticated schema usage. The trigger on `public.matrix_progress` calls `public.award_points(NEW.user_id, 2, 'matrix_advance', ...)` when an axis increases. Repeated calls therefore could advance axes and award points without a verified task, exam or other platform event.

Live checks before the fix found 0 rows in `matrix_progress`, 3 stored `automation_rules` rows, and no SQL function consumer of `advance_matrix`. Repository inspection found no client RPC call or Edge Function caller. The automation page offered the function name as a selectable action even though no executor consumed `automation_rules`.

## Remediation applied

Migration version **`20261122105012`** was applied to the live Supabase project. Provider migration name: `20261122110000_close_advance_matrix_member_execution`.

The migration is existence-guarded and revokes EXECUTE from `PUBLIC`, `anon`, `authenticated` and `service_role` on both the public wrapper and private implementation. It asserts the postcondition and preserves the `postgres` owner privilege. It changes privileges only; it does not modify matrix rows or award points.

## Live post-apply verification

| Function | anon | authenticated | service_role | postgres |
|---|---:|---:|---:|---:|
| `public.advance_matrix(integer,text)` | denied | denied | denied | allowed |
| `private.advance_matrix(integer,text)` | denied | denied | denied | allowed |

- Provider migration ledger: 441 applied versions; latest `20261122105012`.
- `public.matrix_progress`: 0 rows.
- `automation_rules`: 3 stored rows; no database function consumes this table.
- Authenticated-callable public functions snapshot: 145; `advance_matrix` is absent.
- No client, Edge Function or other SQL function caller was found.

## Product truth boundary

The automation page now states that rules are stored configuration only. It no longer offers `advance_matrix`, fabricates task-triggered axis changes, or seeds synthetic execution-log entries. The legacy 51.00% / 40.00% / 9.17% allocation proposal is marked not approved because it totals **100.17%**; payment, token and creator-earnings flags remain disabled.

**The privilege vulnerability is closed. Matrix progression is not live.** A future implementation must require an authenticated actor, verified event/evidence ID, allowlisted track/axis mapping, idempotency, authorization, and a separately audited points award. Do not regrant direct API execution.
