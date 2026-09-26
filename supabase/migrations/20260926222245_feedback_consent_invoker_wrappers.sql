-- Security advisor 0029 (authenticated_security_definer_function_executable):
-- submit_feedback and update_consent were SECURITY DEFINER in the exposed
-- public schema. They move to private, behind public SECURITY INVOKER
-- wrappers with identical signatures and defaults -- the pattern the other
-- page-called RPCs already use (public.x invoker -> private.x definer), so
-- omega-feedback.js and privacy.html need no change. Both bodies act only on
-- auth.uid() and refuse anonymous callers; authenticated keeps EXECUTE on the
-- wrapper and on the private function it calls, anon on neither.
--
-- Verified live 2026-09-26: a non-owner approved member, impersonated with
-- SET LOCAL ROLE authenticated + request.jwt.claims, got {"ok":true} from both
-- wrappers (rolled back); anon holds EXECUTE on neither schema's copy; the
-- security advisor no longer lists either function.
alter function public.submit_feedback(text, integer, text) set schema private;
alter function public.update_consent(text, boolean, text) set schema private;
revoke execute on function private.submit_feedback(text, integer, text) from public, anon;
revoke execute on function private.update_consent(text, boolean, text) from public, anon;
grant execute on function private.submit_feedback(text, integer, text) to authenticated;
grant execute on function private.update_consent(text, boolean, text) to authenticated;

create or replace function public.submit_feedback(p_message text, p_rating integer default null, p_page text default null)
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.submit_feedback(p_message, p_rating, p_page) $$;

create or replace function public.update_consent(p_type text, p_granted boolean, p_version text default '1.0')
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.update_consent(p_type, p_granted, p_version) $$;

revoke execute on function public.submit_feedback(text, integer, text) from public, anon;
revoke execute on function public.update_consent(text, boolean, text) from public, anon;
grant execute on function public.submit_feedback(text, integer, text) to authenticated;
grant execute on function public.update_consent(text, boolean, text) to authenticated;
