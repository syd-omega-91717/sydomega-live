-- ============================================================================
-- Diagnostic follow-up on the two FAILs from verify_fixes.sql. Read-only.
-- ============================================================================

-- 1. What is complete_task's ACTUAL live signature, character for character?
select 'complete_task signature' as what, pg_get_function_identity_arguments(oid) as actual_value
from pg_proc where proname='complete_task' and pronamespace='public'::regnamespace;

-- 2. Which of the 5 member-status functions actually DO insert into notifications,
--    and which don't? (per-function breakdown, not just the aggregate count)
select
  proname as function_name,
  case when pg_get_functiondef(oid) ilike '%notifications%'
    then 'mentions notifications table'
    else 'NO mention of notifications at all' end as notifications_check,
  case when pg_get_functiondef(oid) ilike '%is_platform_owner%'
    then 'has owner-check guard'
    else 'NO owner-check guard' end as owner_guard_check
from pg_proc
where proname in ('approve_member','grant_permanent_access','reject_member','revoke_member','extend_trial')
  and pronamespace='public'::regnamespace
order by proname;
