### Any member could mint sovereign points by calling advance_matrix in a loop; a revoke is proposed (2026-11-15)

**Status: PROPOSAL. The SQL is in `docs/proposed-migrations/`, deliberately not in `supabase/migrations/` and not in `pending-migrations.json`. Merging this applies nothing.**

**Found.** An open item in `GAP_ANALYSIS.md` said `advance_matrix` "appears to" let any member raise any sign's axes, "not verified live". Reading source and proving it:
- `0004_omega_nested_matrix.sql:73-92`: `advance_matrix(p_track int, p_axis text)` is `SECURITY DEFINER`, `GRANT EXECUTE ... TO authenticated`. It adds 1 to the named axis (capped at 9) of the caller's own `matrix_progress` row, checking no event. `20260818000551_...sql:118` revokes only `PUBLIC`. No later migration touches it (all three files that mention it are 0003's comment, 0004, and that revoke).
- `supabase/live-grants.json` (a generated snapshot of what `authenticated` may do, 2026-10-12) lists `advance_matrix` among 142 functions members may execute. Dated, not today's.
- `trg_award_matrix_points` (`0005_omega_sovereign_points.sql:208-222`) fires on every rise and awards **2 sovereign points**. So the function is a way to mint points and to fill the matrix by hand.

**Proof (throwaway Postgres 16, own cluster, stubbed `auth.uid()`; the real text of both functions extracted from the migration files).** A signed-in member looping over 12 tracks x 3 axes x 9 calls: **324 calls accepted, 576 sovereign points, 8,748 of 8,748 matrix nodes**. With the proposed revoke: **324 refusals (`permission denied for function advance_matrix`), 0 points, 0 nodes**; `anon` refused; the migration owner (the SQL editor) and `service_role` still allowed; a `SECURITY DEFINER` wrapper called by a member still works, so a future server-side feature that needs the function can have it. The original throwaway proof tested the public wrapper revoke only. It did not test the private function as a direct authenticated entry point; the corrected dual-revoke must be re-proven before application.

**Why closing it breaks nothing (each checked, and pinned by a test).**
- No client or Edge Function calls it: no `rpc('advance_matrix'` in any `.html`, `.js`, `.mjs` or `supabase/functions/**/*.ts`.
- The only mention in a page, `automation.html`, is an `<option value="advance_matrix">` that is stored as text in `automation_rules.action_key`; no file reads `action_key` and runs it.
- No SQL function calls it (`0003_omega_exams.sql` mentions it in a comment only).

**What this reveals, not fixed.** `advance_matrix` is the only code in the migration history that raises `matrix_progress` (the only `UPDATE`/`INSERT` on it are in `0004`: `my_matrix()` seeds default 1/1/1 rows, and the one `UPDATE` is inside `advance_matrix`). So there is **no legitimate, event-checked progression path at all**: for every member who did not call the function by hand, the matrix has never moved, and after the revoke it cannot move through the database. That is what an honest ledger shows, but the per-sign progress on the character roster is flat for everyone. Which real event (a task, an exam, a gate) should advance which axis of which track is a design decision for the owner; the trigger will award points on any future real `UPDATE`, so that path must check its event.

**Verified.**
- `scripts/tests/test_advance_matrix_closed.py` (7): the proposal's shape, that it stays out of the migration path, no page/script/function calls the function, `automation.html` only stores the name, no SQL function calls it, and **nothing else writes `matrix_progress`**. Five plants each fail it: a page that calls it, a new writer migration, a SQL function that calls it, the revoke weakened to `PUBLIC` only, and the proposal moved into `supabase/migrations/`. Clean tree passes with `-W error::ResourceWarning`.

**Not done / not verified.**
- **Not run on Supabase** (the connector refused every call this session): today's live grants and the live function body are unread. The owner's read-only check is in the gap item.
- The proof uses my stub tables. Real `matrix_progress` has later columns and triggers the stub lacks; `phase` was added for the trigger text to run, and if real rows exist for several phases of one track, one call could advance more rows and mint more than 576.
- Whether and when to move this into the production migration path remains an explicit owner approval through the controlled path. I cannot apply it.


### Live read-only verification (2026-11-22)

The Supabase connector is now available for read-only inspection. The live database confirms:

- `public.advance_matrix(integer,text)`: SECURITY INVOKER, owned by `postgres`; EXECUTE is granted to `authenticated` and `service_role`, not `anon`.
- `private.advance_matrix(integer,text)`: SECURITY DEFINER, owned by `postgres`, `search_path=public`; EXECUTE is granted to `authenticated`, not `anon` or `service_role`.
- The `private` schema grants USAGE to `anon` and `authenticated`; `service_role` has no USAGE.
- `public.matrix_progress` currently contains zero rows.

This means the original proposal's public-wrapper revoke alone is incomplete: the private function is also directly executable by authenticated SQL callers where the schema is exposed. The corrected proposal revokes both entry points and does not claim that service_role retains access. No production migration was applied; the proposal remains outside `supabase/migrations/` and requires owner approval through the controlled migration path.
