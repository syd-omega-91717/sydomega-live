-- ============================================================================================
-- ERASURE PIPELINE: ROLLBACK TEST  (docs/legal/ERASURE_ROLLBACK_TEST.md explains how to run it)
--
-- Run this whole file ONCE in the Supabase SQL editor (project ydqhzvvoyufiiqvzcjns).
-- It creates the dormant erasure pipeline, builds two SYNTHETIC accounts (one ordinary, one owner, both on
-- @invalid.test addresses), runs the purge on them, and then ends with a deliberate error so the database
-- rolls everything back. The error message IS the result: it starts ERASURE_TEST_RESULT and carries a JSON
-- document. It touches no real member and not your real owner account.
--
-- The whole script is ONE statement (a single DO block), so Postgres applies it all or not at all, whichever way
-- the SQL editor submits it: the final error undoes every object, row and account it created.
-- It does NOT schedule the cron job (that stays in the migration, after the test passes).
-- ============================================================================================

-- Ω erasure pipeline (dormant). docs/legal/LEGAL_GAP_AUDIT.md findings 1-3.
--
-- WHY: request_account_erasure() only soft-deletes and promises permanent deletion within 30
-- days, delete_account() wipes six tables, and nothing is scheduled. Of 105 public tables with a
-- user_id column, at most one cascades on user delete (live, 2026-11-01).
--
-- WHAT THIS ADDS (nothing runs until the owner flips public.platform_settings erasure_worker_enabled):
--   private.erasure_policy   which tables are RETAINED instead of deleted, each with a reason
--   private.erasure_log      that a purge ran (hashed id, counts), never the data
--   private.purge_user_data  deletes every row whose user_id/profile_id/member_id is the member,
--                            driven by the catalogue so a new table is covered without editing a list
--   private.run_erasure_queue  the scheduled entry point; no-op while the flag is false
--   cron 'omega-erasure-worker' daily 03:17 UTC
--
-- NOT DONE HERE, on purpose (see docs/legal/ERASURE_GO_LIVE.md): storage objects (the avatars bucket
-- is PUBLIC; deleting storage.objects rows in SQL does not remove the file, the Storage API must),
-- columns that point at a member without being theirs (owner_id, author_id, actor_id, created_by,
-- sender_id), and the retention exceptions, which are a lawyer's decision.

do $t$
declare
  uid uuid := gen_random_uuid();
  owner_uid uuid := gen_random_uuid();
  res jsonb; res_owner jsonb; res_norequest jsonb; res_queue jsonb; out jsonb;
  c_family int; c_heritage int; c_state int; c_consent int; c_auth int; c_prof int; c_owner_prof int;
begin
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

  perform set_config('session_replication_role', 'replica', true);   -- no profile triggers/emails in the test
  insert into auth.users (id, aud, role, email) values (uid, 'authenticated', 'authenticated', 'erasure-test-' || uid || '@invalid.test');
  insert into public.profiles (id, email, display_name, erasure_requested_at) values (uid, 'erasure-test@invalid.test', 'ERASURE TEST', now() - interval '20 days');
  insert into auth.users (id, aud, role, email) values (owner_uid, 'authenticated', 'authenticated', 'erasure-test-owner-' || owner_uid || '@invalid.test');
  insert into public.profiles (id, email, display_name, is_owner, erasure_requested_at) values (owner_uid, 'erasure-test-owner@invalid.test', 'ERASURE TEST OWNER', true, now() - interval '20 days');
  insert into public.family_nodes (id, user_id, name, relation) values (990000001, uid, 'Test Relative', 'Son');
  insert into public.heritage_records (user_id, title) values (uid, 'test');
  insert into public.member_state (user_id, key, value) values (uid, 'omega_test', '{}'::jsonb);
  insert into public.consent_records (user_id, consent_type, granted) values (uid, 'analytics', true);
  perform set_config('session_replication_role', 'origin', true);

  res_queue := private.run_erasure_queue();                              -- flag is false: must be a no-op
  select count(*) into c_family from public.family_nodes where user_id = uid;  -- still 1 after the no-op queue
  res_owner := private.purge_user_data(owner_uid);                       -- must refuse
  res_norequest := private.purge_user_data(gen_random_uuid());           -- no such request: must refuse
  select count(*) into c_owner_prof from public.profiles where id = owner_uid;

  res := private.purge_user_data(uid);
  select count(*) into c_family   from public.family_nodes     where user_id = uid;
  select count(*) into c_heritage from public.heritage_records where user_id = uid;
  select count(*) into c_state    from public.member_state     where user_id = uid;
  select count(*) into c_consent  from public.consent_records  where user_id = uid;
  select count(*) into c_auth     from auth.users              where id = uid;
  select count(*) into c_prof     from public.profiles         where id = uid;

  out := jsonb_build_object('queue_when_flag_off', res_queue, 'owner', res_owner, 'no_request', res_norequest,
    'purge', res, 'after', jsonb_build_object('family', c_family, 'heritage', c_heritage, 'member_state', c_state,
    'consent_retained', c_consent, 'auth_users', c_auth, 'profiles', c_prof, 'owner_profile_intact', c_owner_prof),
    'log_rows', (select count(*) from private.erasure_log), 'log_has_uid', (select count(*) from private.erasure_log where member_hash = uid::text));
  raise exception 'ERASURE_TEST_RESULT %', out::text;
end
$t$;
