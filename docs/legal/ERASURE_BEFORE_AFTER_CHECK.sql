-- Read-only. Run BEFORE and AFTER docs/legal/ERASURE_ROLLBACK_TEST.sql; the two outputs must be identical.
-- Works on any Supabase project: pg_cron is looked up only if it exists (query_to_xml defers the table reference).
select
  current_database()                                                   as db,
  (select count(*) from auth.users)                                    as auth_users,
  (select count(*) from public.profiles)                               as profiles,
  (select count(*) from public.platform_owners)                        as platform_owners,
  (select count(*) from public.consent_records)                        as consent_records,
  (select count(*) from public.family_nodes)                           as family_nodes,
  (select count(*) from public.heritage_records)                       as heritage_records,
  (select count(*) from public.member_state)                           as member_state,
  (select count(*) from auth.users where email ilike '%erasure-test%') as synthetic_users_left,
  (select bool_value::text from public.platform_settings where key = 'erasure_worker_enabled') as erasure_flag,
  case when to_regclass('cron.job') is null then null
       else (xpath('/row/c/text()', query_to_xml(
              $q$select count(*) c from cron.job where jobname = 'omega-erasure-worker'$q$, false, true, '')))[1]::text
  end                                                                  as erasure_cron_jobs;
