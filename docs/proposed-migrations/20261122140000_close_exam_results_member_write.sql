-- Close member-controlled exam results: no API role may insert into public.exam_results or call the legacy client-scored RPC.
--
-- FOUND (read from supabase/migrations/0003_omega_exams.sql and 0005_omega_sovereign_points.sql; proved on a throwaway Postgres 16).
--   * public.submit_exam_result(p_exam_id text, p_score int, p_total int, p_cert_name text) is SECURITY DEFINER, GRANT EXECUTE TO authenticated, and takes the
--     SCORE, the TOTAL and the CERTIFICATE NAME from the caller. A member claiming 100/100 passes; the function then issues a certificate with any name the caller
--     chose (one per distinct name, so unlimited), raises the member's Knowledge axis (profiles.axis_a) by 0.5 per new name up to the cap of 9, and inserts an
--     exam_results row.
--   * That insert fires trg_award_exam_points (0005), which awards 25 sovereign points per passed row, uncapped and not deduplicated.
--   * public.exam_results also has GRANT INSERT TO authenticated (0003:27) behind a policy whose WITH CHECK only tests user_id, so a member can insert passed=true
--     rows directly through PostgREST and collect the same 25 points with no function involved.
--   Proof (docs/proposed-migrations/20261122140000_close_exam_results_member_write.proof.sql): a member with no exam taken, 50 RPC calls + 50 direct inserts:
--     BEFORE  100 of 100 accepted, 50 forged certificates, Knowledge axis 1 -> 9, 2,500 points.   AFTER  0 of 100 accepted, 0 certificates, axis 1, 0 points.
--     The postgres owner can still call the function afterwards.
--
-- NEIGHBOUR, READ NOT ASSUMED: 20261007001000_omega_sensitive_action_aal2 creates private.submit_exam_result, a stub that refuses with
-- 'legacy_exam_result_submission_disabled', but nothing in supabase/migrations/ redirects public.submit_exam_result to it: the public function is defined once (0003) and keeps
-- its client-scored body and its GRANT TO authenticated. So the RPC is open on any replay of this repository, and closed live only if a live-side change (a wrapper or revoke) was made.
--
-- LIVE STATE (dated, not a live read): supabase/live-grants.json (2026-11-22, role authenticated) lists exam_results as SI-- (select+insert) and does NOT list
-- submit_exam_result among the functions authenticated may execute, so the RPC may already be closed live while the table INSERT is open. A fresh replay of
-- supabase/migrations/ reopens both, so the migration is needed either way. Not checked live: the Supabase connector refused every call this session.
--
-- WHY IT BREAKS NOTHING (each checked in the repository, pinned by scripts/tests/test_exam_results_member_write_closed.py):
--   * no page, script or Edge Function calls submit_exam_result or inserts into exam_results; the live exam flow is courses.html -> submit_exam_attempt (server-graded)
--     -> academy_exam_results, which members already cannot write; exam.html is a flashcard/trivia page that never writes to Supabase;
--   * SELECT is kept, and my_exam_results() is SECURITY DEFINER, so reading history is unaffected;
--   * the postgres owner keeps every privilege, so a future SERVER-graded writer (as submit_exam_attempt is) can write exam_results.
--
-- GUARDED because the function and table exist in a fresh replay but a revoke on a missing object would abort it.
-- NOT CHECKED, owner action: any certificate or points already minted this way. Suggested read-only look once access exists:
--   select user_id, count(*) from public.certificates group by 1 order by 2 desc limit 20;   and   select user_id, sum(delta) from public.sovereign_points_ledger where reason='exam_pass' group by 1 order by 2 desc limit 20;
-- REVERSIBILITY: privileges only, no data touched. Undo = GRANT INSERT ON public.exam_results TO authenticated; GRANT EXECUTE ON FUNCTION public.submit_exam_result(text,integer,integer,text) TO authenticated;
--
-- Status: PROPOSAL. Deliberately NOT in supabase/migrations/ and NOT in supabase/pending-migrations.json: main's pinned tests require an empty pending registry, so it
-- moves into the migration path together with its remote-migrations.json entry, after the owner applies it live.

do $$
begin
  if to_regclass('public.exam_results') is not null then
    revoke insert, update, delete on public.exam_results from public, anon, authenticated;
  end if;
  if to_regprocedure('public.submit_exam_result(text,integer,integer,text)') is not null then
    revoke execute on function public.submit_exam_result(text, integer, integer, text) from public, anon, authenticated, service_role;
  end if;
end
$$;
