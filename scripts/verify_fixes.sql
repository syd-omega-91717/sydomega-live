-- ============================================================================
-- SYD OMEGA 91717 -- POST-DEPLOY VERIFICATION (read-only, changes nothing)
-- Paste this whole file into the Supabase SQL Editor and run it once.
-- Copy the entire result table back to Claude -- one row per check, PASS/FAIL.
-- ============================================================================

with checks as (

  -- 1. apply_subscription: exactly one version should exist (the 5-arg one)
  select 'apply_subscription: no duplicate overload' as check_name,
    case when count(*) = 1 then 'PASS' else 'FAIL' end as status,
    'found ' || count(*) || ' version(s); expected 1' as detail
  from pg_proc where proname = 'apply_subscription' and pronamespace = 'public'::regnamespace

  union all
  select 'apply_subscription: correct 5-arg signature',
    case when exists (
      select 1 from pg_proc where proname='apply_subscription' and pronamespace='public'::regnamespace
        and pg_get_function_identity_arguments(oid) = 'p_uid uuid, p_tier text, p_status text, p_period_end timestamp with time zone, p_customer text'
    ) then 'PASS' else 'FAIL' end,
    'checks the surviving version takes exactly the 5 params the webhook sends'

  -- 2. complete_task: correct signature + dedup logic present
  union all
  select 'complete_task: correct signature',
    case when exists (
      select 1 from pg_proc where proname='complete_task' and pronamespace='public'::regnamespace
        and pg_get_function_identity_arguments(oid) = 'p_task_name text, p_task_type text DEFAULT ''knowledge''::text, p_axis_type text DEFAULT ''a''::text, p_description text DEFAULT NULL::text, p_points numeric DEFAULT 0.001'
    ) then 'PASS' else 'FAIL' end,
    'checks the live function matches what every page calls'

  union all
  select 'complete_task: dedup guard present',
    case when exists (
      select 1 from pg_proc where proname='complete_task' and pronamespace='public'::regnamespace
        and pg_get_functiondef(oid) ilike '%WHERE user_id%task_name%'
    ) then 'PASS' else 'FAIL' end,
    'checks the "only once per task" protection is in the function body'

  -- 3. task_completions has the columns complete_task() needs
  union all
  select 'task_completions: has task_name/task_type/axis_type/points_earned columns',
    case when (
      select count(*) from information_schema.columns
      where table_schema='public' and table_name='task_completions'
        and column_name in ('task_name','task_type','axis_type','points_earned')
    ) = 4 then 'PASS' else 'FAIL' end,
    'checks the schema-mismatch fix landed'

  -- 4. trial_access.sql owner-check guard
  union all
  select 'trial_access: owner-approval-bypass guard present (grant_permanent_access)',
    case when exists (
      select 1 from pg_proc where proname='grant_permanent_access' and pronamespace='public'::regnamespace
        and pg_get_functiondef(oid) ilike '%is_platform_owner%'
    ) then 'PASS' else 'FAIL' end,
    'the most severe fix -- confirms self-approval is blocked'

  -- 5. consult_requests has the columns consultancy.html sends
  union all
  select 'consult_requests: has contact/preferred_time/brief columns',
    case when (
      select count(*) from information_schema.columns
      where table_schema='public' and table_name='consult_requests'
        and column_name in ('contact','preferred_time','brief')
    ) = 3 then 'PASS' else 'FAIL' end,
    'checks the booking form fix landed'

  -- 6. user_assets table exists
  union all
  select 'user_assets table exists',
    case when exists (
      select 1 from information_schema.tables where table_schema='public' and table_name='user_assets'
    ) then 'PASS' else 'FAIL' end,
    'portfolio.html / vault.html need this'

  -- 7. notifications table exists
  union all
  select 'notifications table exists',
    case when exists (
      select 1 from information_schema.tables where table_schema='public' and table_name='notifications'
    ) then 'PASS' else 'FAIL' end,
    'the notification badge/panel needs this'

  -- 8. extend_trial function exists
  union all
  select 'extend_trial RPC exists',
    case when exists (
      select 1 from pg_proc where proname='extend_trial' and pronamespace='public'::regnamespace
    ) then 'PASS' else 'FAIL' end,
    'approvals.html "extend" button needs this'

  -- 9. notify triggers wired up
  union all
  select 'notify triggers: member-status RPCs insert notifications',
    case when (
      select count(*) from pg_proc
      where proname in ('approve_member','grant_permanent_access','reject_member','revoke_member','extend_trial')
        and pronamespace='public'::regnamespace
        and pg_get_functiondef(oid) ilike '%insert into public.notifications%'
    ) = 5 then 'PASS' else 'FAIL' end,
    'checks all 5 member-status actions now notify the member'

)
select * from checks order by status desc, check_name;
