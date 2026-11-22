-- Close advance_matrix(integer, text) to every API role.
--
-- WHY. Any signed-in member could call it in a loop: each call raises one axis of the caller's own
-- matrix_progress row with no event behind it, and trg_award_matrix_points (0005_omega_sovereign_points.sql)
-- awards 2 sovereign points per rise. Proven on a throwaway Postgres 16 with the live shape (SECURITY INVOKER
-- public wrapper over a SECURITY DEFINER private function, anon+authenticated USAGE on schema private):
-- 324 calls accepted on BOTH paths and 576 points minted; after this revoke, 0 of 324 accepted on both, 0 points.
-- The function owner (postgres) keeps EXECUTE, so a future event-verified SECURITY DEFINER wrapper can call it.
--
-- WHY IT BREAKS NOTHING. No client, Edge Function or SQL routine calls it (pinned by
-- scripts/tests/test_advance_matrix_closed.py). automation.html holds an <option value="advance_matrix"> that is
-- stored as text and never executed.
--
-- WHY GUARDED. A fresh replay of supabase/migrations/ defines only public.advance_matrix (0004); the private copy
-- and the wrapper exist on the live project only. An unconditional REVOKE on a missing function would abort the
-- replay, so each statement runs only where its function exists.
--
-- REVERSIBILITY. Purely a privilege change; no data touched. Undo = GRANT EXECUTE ... TO authenticated.

do $$
begin
  if to_regprocedure('public.advance_matrix(integer,text)') is not null then
    revoke execute on function public.advance_matrix(integer, text) from public, anon, authenticated, service_role;
  end if;
  if to_regprocedure('private.advance_matrix(integer,text)') is not null then
    revoke execute on function private.advance_matrix(integer, text) from public, anon, authenticated, service_role;
  end if;
end
$$;
