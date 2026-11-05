-- PRODUCTION FACTS: one read-only query. Answers what the Supabase connector could not.
--
-- RUN IT in the SQL editor of the production project, after confirming by PROJECT ID
-- (Settings > General) that it reads ydqhzvvoyufiiqvzcjns and the region is Southeast Asia (Singapore).
-- Never trust the project NAME: a lookalike named "ydqhzvvoyufiiqvzcjns / sydomega" has a different ID.
-- NO SQL EDITOR NEEDED: Actions > "Supabase Production Facts (read-only)" > Run workflow (branch main) runs this
-- exact file on ydqhzvvoyufiiqvzcjns through the supabase-production environment and prints the JSON.
-- Paste the single JSON cell it returns back to the engineer (or into a file under docs/runtime/).
-- Read the "verdict" field first: it says STOP when the database has no owner account or fewer than 300
-- recorded migrations, which is what a lookalike or empty project looks like (measured 2026-11-05: a run on
-- the wrong project returned 83 migrations and 0 owner accounts).
--
-- WHAT IT READS: catalogue metadata (table and column names, types, nullability, foreign keys, trigger
-- names), migration versions, two flag values, and row COUNTS for ten tables. It reads NO row contents and
-- no member data, no secrets, no cron commands. It is one SELECT, so it changes nothing.
--
-- WHAT IT ANSWERS: (1) was migration 20261103230000 applied; (2) do the erasure objects exist and are the
-- flags still off; (3) the real columns and foreign keys of the ten tables that need anonymising, which the
-- schema snapshot (2026-10-06) cannot say; (4) which public tables hold member data NOW, to compare with
-- config/erasure-policy.json (a stale snapshot hides newer tables); (5) whether any erasure cron job exists.
-- Edge Function versions are not in SQL: read those from Edge Functions in the dashboard.

with
tgt(t) as (values
  ('billing_invoices'), ('payments'), ('subscriptions'), ('omega_service_orders'), ('sovereign_points_ledger'),
  ('commission_contracts'), ('consent_records'), ('sovereign_events'), ('platform_events'), ('threat_events')
),
tbl as (
  select tgt.t, c.oid as relid
  from tgt left join pg_class c on c.relname = tgt.t and c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p')
),
cols as (
  select tbl.t,
         jsonb_agg(jsonb_build_object('column', a.attname, 'type', format_type(a.atttypid, a.atttypmod), 'not_null', a.attnotnull)
                   order by a.attnum) as columns
  from tbl join pg_attribute a on a.attrelid = tbl.relid and a.attnum > 0 and not a.attisdropped
  group by tbl.t
),
fks as (
  select tbl.t,
         jsonb_agg(jsonb_build_object(
           'constraint', k.conname,
           'columns', (select jsonb_agg(att.attname order by u.ord)
                         from unnest(k.conkey) with ordinality as u(attnum, ord)
                         join pg_attribute att on att.attrelid = k.conrelid and att.attnum = u.attnum),
           'references', k.confrelid::regclass::text,
           'on_delete', case k.confdeltype when 'a' then 'NO ACTION' when 'r' then 'RESTRICT' when 'c' then 'CASCADE'
                                           when 'n' then 'SET NULL' when 'd' then 'SET DEFAULT' end
         ) order by k.conname) as fks
  from tbl join pg_constraint k on k.conrelid = tbl.relid and k.contype = 'f'
  group by tbl.t
),
trg as (
  select tbl.t, jsonb_agg(tg.tgname order by tg.tgname) as triggers
  from tbl join pg_trigger tg on tg.tgrelid = tbl.relid and not tg.tgisinternal
  group by tbl.t
),
cnt as (
  select tbl.t,
         case when tbl.relid is null then null
              else (xpath('/row/c/text()', query_to_xml(format('select count(*) as c from public.%I', tbl.t), false, true, '')))[1]::text::bigint
         end as row_count
  from tbl
),
member_cols as (
  select c.relname as t, array_agg(a.attname order by a.attname) as cols
  from pg_class c
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') and not c.relispartition
    and a.atttypid = 'uuid'::regtype and a.attname in ('user_id', 'profile_id', 'member_id') and c.relname <> 'profiles'
  group by c.relname
),
ref_cols as (
  select c.relname as t
  from pg_class c
  join pg_attribute a on a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped
  where c.relnamespace = 'public'::regnamespace and c.relkind in ('r', 'p') and not c.relispartition
    and a.atttypid = 'uuid'::regtype
    and a.attname in ('owner_id', 'author_id', 'actor_id', 'created_by', 'sender_id', 'recipient_id', 'granted_by')
    and c.relname <> 'profiles'
    and not exists (select 1 from member_cols m where m.t = c.relname)
  group by c.relname
),
cascades as (
  select distinct c.relname as t
  from pg_constraint k
  join pg_class c on c.oid = k.conrelid
  where k.contype = 'f' and k.confdeltype = 'c' and c.relnamespace = 'public'::regnamespace
    and k.confrelid in ('public.profiles'::regclass, 'auth.users'::regclass)
)
select jsonb_pretty(jsonb_build_object(
  'read_at', now(),
  'database', current_database(),
  'server_version', current_setting('server_version'),
  'owner_accounts_present', (select count(*) from auth.users where email in ('s.y.dagher@gmail.com', 'slmndghr@gmail.com')),
  'verdict', case
      when (select count(*) from auth.users where email in ('s.y.dagher@gmail.com', 'slmndghr@gmail.com')) = 0
        or (select count(*) from supabase_migrations.schema_migrations) < 300
      then 'STOP: this does not look like production (production has both owner accounts and about 413 recorded migrations). Check the dashboard URL ends in /project/ydqhzvvoyufiiqvzcjns and run again there. Do not use this output.'
      else 'OK: owner accounts present and migration history is production-sized. Still confirm the dashboard URL ends in /project/ydqhzvvoyufiiqvzcjns.'
    end,
  'migrations', jsonb_build_object(
    'recorded_count', (select count(*) from supabase_migrations.schema_migrations),
    'latest_five', (select jsonb_agg(version order by version desc)
                      from (select version from supabase_migrations.schema_migrations order by version desc limit 5) s),
    'erasure_engine_20261103230000_applied',
        exists (select 1 from supabase_migrations.schema_migrations where version = '20261103230000')
  ),
  'erasure_engine', jsonb_build_object(
    'policy_table_exists', to_regclass('private.erasure_policy') is not null,
    'log_table_exists', to_regclass('private.erasure_log') is not null,
    'purge_function_exists', to_regprocedure('private.purge_user_data(uuid)') is not null,
    'queue_function_exists', to_regprocedure('private.run_erasure_queue()') is not null,
    'policy_rows', case when to_regclass('private.erasure_policy') is null then null
                        else (xpath('/row/c/text()', query_to_xml('select count(*) as c from private.erasure_policy', false, true, '')))[1]::text::bigint end,
    'log_rows', case when to_regclass('private.erasure_log') is null then null
                     else (xpath('/row/c/text()', query_to_xml('select count(*) as c from private.erasure_log', false, true, '')))[1]::text::bigint end,
    'flags', (select coalesce(jsonb_object_agg(key, jsonb_build_object('bool_value', bool_value, 'text_value', text_value)), '{}'::jsonb)
                from public.platform_settings where key in ('erasure_worker_enabled', 'erasure_delay_days'))
  ),
  'cron', jsonb_build_object(
    'extension_installed', to_regclass('cron.job') is not null,
    'job_count', case when to_regclass('cron.job') is null then null
                      else (xpath('/row/c/text()', query_to_xml('select count(*) as c from cron.job', false, true, '')))[1]::text::bigint end,
    'jobs_mentioning_erasure', case when to_regclass('cron.job') is null then null
                      else (xpath('/row/c/text()', query_to_xml('select count(*) as c from cron.job where command ilike ''%erasure%''', false, true, '')))[1]::text::bigint end
  ),
  'anonymise_targets', (select jsonb_object_agg(tgt.t, jsonb_build_object(
        'exists', tbl.relid is not null,
        'row_count', cnt.row_count,
        'columns', coalesce(cols.columns, '[]'::jsonb),
        'foreign_keys', coalesce(fks.fks, '[]'::jsonb),
        'triggers', coalesce(trg.triggers, '[]'::jsonb)))
      from tgt join tbl on tbl.t = tgt.t join cnt on cnt.t = tgt.t
      left join cols on cols.t = tgt.t left join fks on fks.t = tgt.t left join trg on trg.t = tgt.t),
  'member_data_tables', jsonb_build_object(
    'count', (select count(*) from member_cols),
    'names', (select coalesce(jsonb_agg(t order by t), '[]'::jsonb) from member_cols),
    'with_cascade_fk_to_profiles_or_auth', (select coalesce(jsonb_agg(m.t order by m.t), '[]'::jsonb) from member_cols m join cascades c on c.t = m.t)
  ),
  'reference_only_tables', (select coalesce(jsonb_agg(t order by t), '[]'::jsonb) from ref_cols)
)) as production_facts;
