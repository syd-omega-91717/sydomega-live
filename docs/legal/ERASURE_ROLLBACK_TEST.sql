-- ============================================================================================
-- ERASURE PIPELINE: ROLLBACK TEST, v2   (docs/legal/ERASURE_ROLLBACK_TEST.md explains how to run it)
--
-- Run this whole file ONCE in the Supabase SQL editor of project ydqhzvvoyufiiqvzcjns.
--
-- WHAT CHANGED FROM v1, AND WHY. v1 stopped at "permission denied to set parameter session_replication_role": the
-- editor's postgres role is not a superuser. v1 also never ran against the real triggers; reading them showed it
-- could not have worked even with that privilege (handle_new_user() already creates the profile, so v1's own
-- profile insert would have been a duplicate key; enforce_access_defaults() forces is_owner=false on insert).
-- v2 needs NO special privilege: it inserts the synthetic accounts into auth.users, lets the real
-- handle_new_user() make their profiles, then UPDATEs them (the privilege guard lets SQL-editor sessions through
-- because auth.uid() is null there).
--
-- IT REFUSES TO RUN, before changing anything, if (a) the two owner accounts are not in this database (wrong
-- project), or (b) erasure_worker_enabled is already true (the queue would then act on real members).
--
-- IT STILL ENDS WITH A DELIBERATE ERROR so Postgres undoes everything: the whole file is ONE statement (a DO block).
-- The error text IS the result: it starts ERASURE_TEST_RESULT and carries a JSON document with a "checks" object.
-- The "new access request" email that profile creation triggers is queued in net.http_request_queue INSIDE the
-- transaction; a rolled-back insert is never seen by the pg_net worker, so nothing is sent. The result reports how
-- many such requests were queued during the test so you can see it happened and was discarded.
--
-- A NOTE ON WHAT IT PROVES. Every member table CASCADEs from auth.users / profiles, so "the rows are gone afterwards"
-- is true even if the purge deleted nothing. v2 therefore judges the purge by the counts the purge itself returns
-- (rows_deleted, tables_touched), taken before the final auth.users delete, and reports separately what the cascade
-- does to the retained consent_records row.
-- ============================================================================================

do $t$
declare
  uid uuid := gen_random_uuid();
  owner_uid uuid := gen_random_uuid();
  res jsonb; res_owner jsonb; res_norequest jsonb; res_queue jsonb; out jsonb; checks jsonb;
  b_prof int; b_family int; b_heritage int; b_state int; b_consent int; owner_flag boolean;
  c_family int; c_heritage int; c_state int; c_consent int; c_auth int; c_prof int; c_owner_prof int; c_owner_auth int;
  webhooks_queued int := 0; notifs_created int := 0;
begin
  -- 0. guards: stop before changing anything if this is the wrong database or the worker is already on
  if not exists (select 1 from auth.users where email in ('s.y.dagher@gmail.com', 'slmndghr@gmail.com')) then
    raise exception 'WRONG DATABASE: the Omega owner accounts are not in this database. Open project ydqhzvvoyufiiqvzcjns and run again. Nothing was changed.';
  end if;
  if exists (select 1 from public.platform_settings where key = 'erasure_worker_enabled' and bool_value is true) then
    raise exception 'erasure_worker_enabled is already TRUE: run_erasure_queue() would act on real members. Nothing was changed.';
  end if;

create schema if not exists private;

-- 1. policy: delete is the default; a table listed here as 'retain' is skipped and reported.
create table if not exists private.erasure_policy (
  table_name text primary key,
  action     text not null check (action in ('delete', 'retain')),
  reason     text not null
);
alter table private.erasure_policy enable row level security;
revoke all on private.erasure_policy from public, anon, authenticated;

insert into private.erasure_policy (table_name, action, reason) values
  ('consent_records', 'retain', 'Privacy page promises consent records are kept 10 years as proof. COUNSEL to decide whether to keep the row, or only a minimal evidence record, after erasure.'),
  ('sovereign_events', 'retain', 'Privacy page promises an event log is kept 5 years. COUNSEL to decide; event_data may hold personal data.')
on conflict (table_name) do nothing;

-- 2. log: proves a purge ran without keeping anything that identifies the member.
create table if not exists private.erasure_log (
  id             bigserial primary key,
  member_hash    text not null,
  run_at         timestamptz not null default now(),
  tables_touched integer not null,
  rows_deleted   bigint not null,
  retained       text[] not null default '{}',
  unhandled      text[] not null default '{}'
);
alter table private.erasure_log enable row level security;
revoke all on private.erasure_log from public, anon, authenticated;

-- 3. flags (both off / safe defaults). bool_value is the switch; text_value carries the delay.
insert into public.platform_settings (key, bool_value, text_value) values
  ('erasure_worker_enabled', false, null),
  ('erasure_delay_days', false, '14')
on conflict (key) do nothing;

-- 4. the purge.
create or replace function private.purge_user_data(p_uid uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $fn$
declare
  r         record;
  n         bigint;
  total     bigint := 0;
  touched   integer := 0;
  retained  text[] := '{}';
  unhandled text[] := '{}';
  pass      integer;
  pending   text[];
  still     text[];
begin
  if p_uid is null then
    return jsonb_build_object('ok', false, 'error', 'no_member');
  end if;
  if coalesce((select is_owner from public.profiles where id = p_uid), false) then
    return jsonb_build_object('ok', false, 'error', 'owner_protected');
  end if;
  -- Only a member who asked to be erased may be purged by this function.
  if not exists (select 1 from public.profiles where id = p_uid and erasure_requested_at is not null) then
    return jsonb_build_object('ok', false, 'error', 'erasure_not_requested');
  end if;

  -- Tables that hold the member's own rows. profiles is handled last (and by the auth cascade).
  select coalesce(array_agg(c.table_name || '.' || c.column_name order by c.table_name), '{}')
    into pending
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
   where c.table_schema = 'public'
     and c.column_name in ('user_id', 'profile_id', 'member_id')
     and c.data_type = 'uuid'
     and c.table_name <> 'profiles';

  -- Retention exceptions are reported, not deleted.
  select coalesce(array_agg(p.table_name), '{}') into retained
    from private.erasure_policy p where p.action = 'retain';
  pending := array(select x from unnest(pending) x
                    where split_part(x, '.', 1) <> all (retained));

  -- Up to three passes: a delete can be blocked by a foreign key until its child table is cleared.
  for pass in 1..3 loop
    still := '{}';
    for r in select split_part(x, '.', 1) as tbl, split_part(x, '.', 2) as col from unnest(pending) x loop
      begin
        execute format('delete from public.%I where %I = $1', r.tbl, r.col) using p_uid;
        get diagnostics n = row_count;
        if n > 0 then total := total + n; touched := touched + 1; end if;
      exception when foreign_key_violation then
        still := still || (r.tbl || '.' || r.col);
      end;
    end loop;
    exit when coalesce(array_length(still, 1), 0) = 0;
    pending := still;
  end loop;

  -- Columns that point at a member without being the member's own data: counted for a human, never
  -- deleted (an owner_id may be an organisation another person still uses).
  select coalesce(array_agg(c.table_name || '.' || c.column_name), '{}') into unhandled
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name and t.table_type = 'BASE TABLE'
   where c.table_schema = 'public'
     and c.column_name in ('owner_id', 'author_id', 'actor_id', 'created_by', 'sender_id', 'recipient_id', 'granted_by')
     and c.data_type = 'uuid';

  insert into private.erasure_log (member_hash, tables_touched, rows_deleted, retained, unhandled)
  values (encode(sha256(convert_to(p_uid::text, 'utf8')), 'hex'), touched, total, retained, unhandled);

  -- The profile row goes with the auth user (profiles.id cascades from auth.users); delete the auth
  -- user last. A failure is reported, never swallowed.
  begin
    delete from auth.users where id = p_uid;
  exception when others then
    return jsonb_build_object('ok', false, 'error', 'auth_delete_failed', 'rows_deleted', total,
                              'tables_touched', touched, 'blocked', coalesce(still, '{}'));
  end;

  return jsonb_build_object('ok', true, 'rows_deleted', total, 'tables_touched', touched,
                            'retained', retained, 'blocked', coalesce(still, '{}'));
end
$fn$;

-- 5. the scheduled entry point.
create or replace function private.run_erasure_queue()
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $fn$
declare
  enabled boolean := coalesce((select bool_value from public.platform_settings where key = 'erasure_worker_enabled'), false);
  delay   integer := coalesce((select nullif(text_value, '')::integer from public.platform_settings where key = 'erasure_delay_days'), 14);
  r       record;
  done    integer := 0;
  failed  integer := 0;
  res     jsonb;
begin
  if not enabled then
    return jsonb_build_object('enabled', false);
  end if;
  for r in
    select id from public.profiles
     where erasure_requested_at is not null
       and erasure_requested_at < now() - make_interval(days => delay)
       and not coalesce(is_owner, false)
     order by erasure_requested_at
     limit 25
  loop
    res := private.purge_user_data(r.id);
    if (res ->> 'ok')::boolean then done := done + 1; else failed := failed + 1; end if;
  end loop;
  return jsonb_build_object('enabled', true, 'purged', done, 'failed', failed);
end
$fn$;

-- Postgres grants EXECUTE to PUBLIC on every new function: revoke it, then grant nothing to the API
-- roles. Only the database owner (pg_cron) and service_role run these.
revoke all on function private.purge_user_data(uuid) from public, anon, authenticated;
revoke all on function private.run_erasure_queue() from public, anon, authenticated;

  -- 1. two synthetic accounts. The real handle_new_user() trigger creates each profile.
  insert into auth.users (id, aud, role, email) values (uid, 'authenticated', 'authenticated', 'erasure-test-' || uid || '@invalid.test');
  insert into auth.users (id, aud, role, email) values (owner_uid, 'authenticated', 'authenticated', 'erasure-test-owner-' || owner_uid || '@invalid.test');
  select count(*) into b_prof from public.profiles where id in (uid, owner_uid);
  if b_prof <> 2 then
    raise exception 'handle_new_user() did not create both profiles (found %): the test setup does not match this database. Nothing was changed.', b_prof;
  end if;

  -- what the profile triggers did inside this transaction (all of it is rolled back below)
  begin
    select count(*) into webhooks_queued from net.http_request_queue where convert_from(body, 'UTF8') like '%erasure-test%';
  exception when others then webhooks_queued := -1;     -- not readable by this role: reported as -1, not a failure
  end;
  select count(*) into notifs_created from public.notifications where content like '%' || uid::text || '%';

  -- 2. mark them as erasure-requested 20 days ago; the second one is an OWNER (inserts cannot make owners:
  --    enforce_access_defaults() forces is_owner=false, so it is set by UPDATE, which the editor session may do)
  update public.profiles set display_name = 'ERASURE TEST', erasure_requested_at = now() - interval '20 days' where id = uid;
  update public.profiles set display_name = 'ERASURE TEST OWNER', is_owner = true, erasure_requested_at = now() - interval '20 days' where id = owner_uid;
  select is_owner into owner_flag from public.profiles where id = owner_uid;

  -- 3. the member's own data, one row in each of four tables
  insert into public.family_nodes (id, user_id, name, relation) values (990000001, uid, 'Test Relative', 'Son');
  insert into public.heritage_records (user_id, title) values (uid, 'test');
  insert into public.member_state (user_id, key, value) values (uid, 'omega_test', '{}'::jsonb);
  insert into public.consent_records (user_id, consent_type, granted) values (uid, 'analytics', true);
  select count(*) into b_family   from public.family_nodes     where user_id = uid;
  select count(*) into b_heritage from public.heritage_records where user_id = uid;
  select count(*) into b_state    from public.member_state     where user_id = uid;
  select count(*) into b_consent  from public.consent_records  where user_id = uid;

  -- 4. the three refusals, then the real purge
  res_queue     := private.run_erasure_queue();                  -- flag is false: must be a no-op
  res_owner     := private.purge_user_data(owner_uid);           -- synthetic OWNER: must refuse
  res_norequest := private.purge_user_data(gen_random_uuid());   -- nobody asked to be erased: must refuse
  select count(*) into c_owner_prof from public.profiles where id = owner_uid;

  res := private.purge_user_data(uid);
  select count(*) into c_family   from public.family_nodes     where user_id = uid;
  select count(*) into c_heritage from public.heritage_records where user_id = uid;
  select count(*) into c_state    from public.member_state     where user_id = uid;
  select count(*) into c_consent  from public.consent_records  where user_id = uid;
  select count(*) into c_auth     from auth.users              where id = uid;
  select count(*) into c_prof     from public.profiles         where id = uid;
  select count(*) into c_owner_auth from auth.users            where id = owner_uid;

  checks := jsonb_build_object(
    'flag_off_is_noop',            res_queue = '{"enabled": false}'::jsonb,
    'owner_refused',               res_owner ->> 'error' = 'owner_protected',
    'no_request_refused',          res_norequest ->> 'error' = 'erasure_not_requested',
    'purge_ok',                    coalesce((res ->> 'ok')::boolean, false),
    'purge_deleted_3_rows_in_3_tables', (res ->> 'rows_deleted') = '3' and (res ->> 'tables_touched') = '3',
    'nothing_blocked',             res -> 'blocked' = '[]'::jsonb,
    'retained_tables_skipped',     coalesce(res -> 'retained', '[]'::jsonb) @> '["consent_records", "sovereign_events"]'::jsonb,
    'account_and_profile_gone',    c_auth = 0 and c_prof = 0,
    'owner_survived',              c_owner_prof = 1 and c_owner_auth = 1,
    'log_holds_a_hash_not_the_id', (select count(*) from private.erasure_log where member_hash = uid::text) = 0
                                   and (select count(*) from private.erasure_log) = 1,
    'setup_matched_expectations',  owner_flag is true and b_family = 1 and b_heritage = 1 and b_state = 1 and b_consent = 1);

  out := jsonb_build_object(
    'ALL_CHECKS_PASS', not exists (select 1 from jsonb_each(checks) where value <> 'true'::jsonb),
    'checks', checks,
    'queue_when_flag_off', res_queue, 'owner', res_owner, 'no_request', res_norequest, 'purge', res,
    'before_purge', jsonb_build_object('family', b_family, 'heritage', b_heritage, 'member_state', b_state, 'consent', b_consent),
    'after_purge', jsonb_build_object('family', c_family, 'heritage', c_heritage, 'member_state', c_state,
                   'consent_records_row_left', c_consent, 'auth_users', c_auth, 'profiles', c_prof),
    'FINDING_consent_cascade', case when c_consent = 0 then 'consent_records was skipped by the purge but its row is GONE: it cascades from profiles, so deleting the profile destroys the retained row' else 'consent_records row survived' end,
    'side_effects_inside_the_transaction_all_rolled_back', jsonb_build_object('webhook_requests_queued', webhooks_queued, 'owner_notifications_created', notifs_created),
    'log_rows', (select count(*) from private.erasure_log));
  raise exception 'ERASURE_TEST_RESULT %', out::text;
end
$t$;
