### members could write their own exam results and (on replay) forge certificates (2026-11-22)

**Why.** What was wrong, and the evidence (file:line, command output, query result).

**Fix.** What changed.

**Verified.** The exact command or render, and its actual output. Before and after where it is a bug.

**Not done / not verified.** Say it plainly. An unverified item stays unverified.

**Found by following a design question, not by a scan.** Designing an event-verified matrix progression needed to know which recorded events a member cannot write themselves. `exam_results` is one of the obvious sources (a passed exam should advance Knowledge, axis A), and reading its grants showed it is member-writable.

**Defect (source, then proved).** `0003_omega_exams.sql`: `GRANT SELECT, INSERT ON public.exam_results TO authenticated` behind a `FOR ALL` policy whose `WITH CHECK` only tests `auth.uid() = user_id`; `submit_exam_result(text,int,int,text)` is `SECURITY DEFINER`, `GRANT EXECUTE ... TO authenticated`, and trusts `p_score`, `p_total` and `p_cert_name` from the caller. A claimed 100/100 passes, inserts a result row, issues a certificate under any name the caller chose, and raises `profiles.axis_a` by 0.5 per new name up to 9. `0005_omega_sovereign_points.sql` `trg_award_exam_points` adds 25 points per `passed` row with no cap or deduplication.
Throwaway Postgres 16.15, member with no exam taken, 50 RPC calls + 50 direct inserts, real function/policy/grant/trigger text: **before 100/100 accepted, 50 forged certificates, axis 1 -> 9, 2,500 points; after the guarded revoke 0/100, 0, 1, 0**; the `postgres` owner still passes. `docs/proposed-migrations/20261122140000_close_exam_results_member_write.proof.sql` reproduces it.
(First run reported the direct-insert path as refused: that was my harness giving `id` a `bigserial` the real `uuid DEFAULT gen_random_uuid()` column does not have. Re-run on the real shape: accepted. Recorded because the first number was wrong.)

**What was read, not assumed.** `20261007001000_omega_sensitive_action_aal2` creates `private.submit_exam_result`, a stub that refuses with `legacy_exam_result_submission_disabled`, but no migration redirects the public function to it (public is defined once, in 0003), so on a fresh replay the RPC is open. The dated live-grant snapshot (2026-11-22, `authenticated`) does not list the RPC (probably closed live by a live-side change, like `advance_matrix`'s wrapper) and lists `exam_results` as `SI--`. `20260818000551` only revokes from `PUBLIC`, which does not remove a role-specific grant. A first version of the test's "no other writer" scan caught both neighbours; each was read before being allowed.

**Breaks nothing (each pinned).** No page, script or Edge Function calls the RPC or inserts into `exam_results`; the live exam path is `courses.html` -> `submit_exam_attempt` (server-graded) -> `academy_exam_results`, which members cannot write; `exam.html` is a flashcard/trivia page with no Supabase writes; `SELECT` stays and `my_exam_results()` is `SECURITY DEFINER`.

**Not done / not verified.** Not applied (no live access; and main's pinned tests require an empty pending registry, so it lives in `docs/proposed-migrations/` until the owner applies it, then moves into `supabase/migrations/` with its ledger entry). The live trigger, live function body and any certificates or points already minted were not read. Suggested owner reads are in the proposal's header.
`scripts/tests/test_exam_results_member_write_closed.py` (8 tests, contract-suite id `exam-results-member-write-closed`); the planted-caller check failed the test as intended.
