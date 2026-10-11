-- Ω OMEGA — restore the authenticated RPC surface for owner actions.
-- Authorization remains enforced inside private.* functions; these grants only
-- restore the callable public wrappers needed by the owner approvals console.
-- anon remains denied.

grant execute on function public.approve_member(uuid) to authenticated;
grant execute on function public.grant_trial_access(uuid) to authenticated;
grant execute on function public.grant_permanent_access(uuid) to authenticated;
grant execute on function public.reject_member(uuid) to authenticated;
grant execute on function public.revoke_member(uuid) to authenticated;
grant execute on function public.extend_trial(uuid, integer) to authenticated;
grant execute on function public.set_platform_flag(text, boolean) to authenticated;

revoke execute on function public.approve_member(uuid) from anon;
revoke execute on function public.grant_trial_access(uuid) from anon;
revoke execute on function public.grant_permanent_access(uuid) from anon;
revoke execute on function public.reject_member(uuid) from anon;
revoke execute on function public.revoke_member(uuid) from anon;
revoke execute on function public.extend_trial(uuid, integer) from anon;
revoke execute on function public.set_platform_flag(text, boolean) from anon;
