-- Four public views ran with their owner's rights (postgres, BYPASSRLS). None is
-- granted to anon/authenticated/service_role today, so this is defence in depth:
-- a future GRANT can no longer silently expose every row past RLS. The only
-- consumer, private.get_pending_requests(), is SECURITY DEFINER owned by postgres,
-- so its result is unchanged (measured 9 = 9 under owner impersonation).
alter view public.conversion_funnel       set (security_invoker = true);
alter view public.pending_access_requests set (security_invoker = true);
alter view public.permanent_access_review set (security_invoker = true);
alter view public.workflow_analytics      set (security_invoker = true);
