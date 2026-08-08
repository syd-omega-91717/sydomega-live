-- ============================================================================
-- SYD OMEGA 91717 — 0002_rls_closure.sql   (v2)
--
-- Closes finding F-1: tables in the `public` schema with no RLS. Supabase
-- exposes every public table through PostgREST and the publishable (anon) key
-- ships in bg.js by design, so RLS is the only access control on these tables.
--
-- ----------------------------------------------------------------------------
-- WHY v2
-- ----------------------------------------------------------------------------
-- v1 failed on production with:
--     ERROR: 42P01: relation "public.bodies" does not exist
--
-- Two causes, both fixed here:
--   1. v1 guarded Groups B/C/D for table existence but wrote Group A directly.
--      Every table is now guarded.
--   2. More importantly: the target list came from the 92 files in supabase/,
--      and those files do not describe your live database. 46 of 93 tables are
--      created in more than one file with differing columns. This is audit
--      finding F-2 arriving in practice rather than in theory.
--
-- v2 checks BOTH the table and the specific columns each policy depends on
-- before acting, skips what is absent with a NOTICE instead of aborting, and
-- prints a reconciliation report showing what was closed, skipped, and what is
-- STILL OPEN that the file-derived list never knew about.
--
-- ----------------------------------------------------------------------------
-- SAFETY
-- ----------------------------------------------------------------------------
--   * Idempotent. Safe to re-run.
--   * Creates no tables, alters no columns, deletes no data.
--   * Skips anything it cannot verify rather than failing the transaction.
--   * Enabling RLS with no matching policy denies anon and authenticated.
--     service_role bypasses RLS, so server-side jobs are unaffected.
--
-- Depends on public.is_platform_owner(), defined in access_gate.sql.
--
-- APPLY TO STAGING FIRST. Read the report at the end before running on prod.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Guard: fail loudly if the owner helper is absent, rather than creating
-- policies that silently evaluate to false for every user including you.
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'is_platform_owner'
  ) then
    raise exception
      'public.is_platform_owner() not found. Apply access_gate.sql first.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Helpers, session-scoped. Dropped automatically at disconnect.
-- ---------------------------------------------------------------------------
create or replace function pg_temp.tbl_exists(t text)
returns boolean language sql stable as $fn$
  select exists (
    select 1 from pg_tables where schemaname = 'public' and tablename = t
  );
$fn$;

create or replace function pg_temp.col_exists(t text, c text)
returns boolean language sql stable as $fn$
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = t and column_name = c
  );
$fn$;

create temporary table if not exists _rls_log (
  table_name text,
  outcome    text,
  detail     text
);
truncate _rls_log;


-- ===========================================================================
-- GROUP A1 — MEMBER-OWNED DATA, DIRECT OWNERSHIP
-- Owner reads and writes own rows; platform owners read all.
-- The ownership column is DISCOVERED, not assumed — schemas drifted across the
-- 92 source files and user_id is not universal.
-- ===========================================================================
do $$
declare
  t          text;
  owner_col  text;
  candidates text[] := array['user_id','owner_id','profile_id','member_id'];
  c          text;
begin
  foreach t in array array['conversations','bodies'] loop

    if not pg_temp.tbl_exists(t) then
      insert into _rls_log values (t,'SKIPPED','table does not exist');
      raise notice 'skip %: table not present', t;
      continue;
    end if;

    owner_col := null;
    foreach c in array candidates loop
      if pg_temp.col_exists(t,c) then owner_col := c; exit; end if;
    end loop;

    if owner_col is null then
      -- Deliberately do NOT enable RLS. With no ownership column any policy
      -- would either deny everyone or allow everyone. Report instead.
      insert into _rls_log values (t,'NEEDS REVIEW',
        'no ownership column (looked for user_id/owner_id/profile_id/member_id)');
      raise notice 'REVIEW %: no ownership column; left untouched', t;
      continue;
    end if;

    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t||'_owner_all', t);
    execute format(
      'create policy %I on public.%I for all '
      'using (auth.uid() = %I) with check (auth.uid() = %I)',
      t||'_owner_all', t, owner_col, owner_col);

    execute format('drop policy if exists %I on public.%I',
                   t||'_platform_owner_read', t);
    execute format(
      'create policy %I on public.%I for select using (public.is_platform_owner())',
      t||'_platform_owner_read', t);

    insert into _rls_log values (t,'CLOSED','owner column: '||owner_col);
  end loop;
end $$;


-- ===========================================================================
-- GROUP A2 — messages: ownership is INDIRECT, via conversation_id.
-- Requires both tables and both columns; skipped otherwise.
-- ===========================================================================
do $$
declare conv_owner text;
begin
  if not pg_temp.tbl_exists('messages') then
    insert into _rls_log values ('messages','SKIPPED','table does not exist');
    return;
  end if;
  if not pg_temp.tbl_exists('conversations') then
    insert into _rls_log values ('messages','NEEDS REVIEW',
      'conversations absent; cannot derive ownership');
    return;
  end if;
  if not pg_temp.col_exists('messages','conversation_id') then
    insert into _rls_log values ('messages','NEEDS REVIEW',
      'no conversation_id column; cannot derive ownership');
    return;
  end if;

  conv_owner := case
    when pg_temp.col_exists('conversations','user_id')    then 'user_id'
    when pg_temp.col_exists('conversations','owner_id')   then 'owner_id'
    when pg_temp.col_exists('conversations','profile_id') then 'profile_id'
    else null end;

  if conv_owner is null then
    insert into _rls_log values ('messages','NEEDS REVIEW',
      'conversations has no ownership column');
    return;
  end if;

  alter table public.messages enable row level security;

  drop policy if exists messages_owner_all on public.messages;
  execute format(
    'create policy messages_owner_all on public.messages for all '
    'using (exists (select 1 from public.conversations c '
    '  where c.id = messages.conversation_id and c.%I = auth.uid())) '
    'with check (exists (select 1 from public.conversations c '
    '  where c.id = messages.conversation_id and c.%I = auth.uid()))',
    conv_owner, conv_owner);

  drop policy if exists messages_platform_owner_read on public.messages;
  create policy messages_platform_owner_read on public.messages
    for select using (public.is_platform_owner());

  insert into _rls_log values ('messages','CLOSED','via conversations.'||conv_owner);
end $$;


-- ===========================================================================
-- GROUP B — CONTROL PLANE. Platform owners only.
-- These govern who can do what: write access for a member is privilege
-- escalation, and read access is a map of your defences.
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array[
    'security_policies','policy_rules','rate_limits','circuit_breakers'
  ] loop
    if not pg_temp.tbl_exists(t) then
      insert into _rls_log values (t,'SKIPPED','table does not exist'); continue;
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_owner_only', t);
    execute format(
      'create policy %I on public.%I for all '
      'using (public.is_platform_owner()) with check (public.is_platform_owner())',
      t||'_owner_only', t);
    insert into _rls_log values (t,'CLOSED','platform owner only');
  end loop;
end $$;


-- ===========================================================================
-- GROUP C — OBSERVABILITY. Written by service_role (bypasses RLS); read by
-- platform owners so analytics and observatory pages keep working.
-- No member access: SLO data is operational intelligence, not member content.
-- ===========================================================================
do $$
declare t text;
begin
  foreach t in array array['slo_metrics','error_budget_policy','data_lineage'] loop
    if not pg_temp.tbl_exists(t) then
      insert into _rls_log values (t,'SKIPPED','table does not exist'); continue;
    end if;
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t||'_owner_read', t);
    execute format(
      'create policy %I on public.%I for select using (public.is_platform_owner())',
      t||'_owner_read', t);
    -- no insert/update/delete policy: writes are service_role only
    insert into _rls_log values (t,'CLOSED','owner read; writes service_role');
  end loop;
end $$;


-- ===========================================================================
-- GROUP D — REFERENCE / CATALOGUE DATA.
-- Read for `authenticated` only — NOT anon. Writes restricted to owners.
-- If a PUBLIC page must show any of these to signed-out visitors, widen that
-- ONE table to `to anon, authenticated` and record it in DECISIONS.md.
-- Do not widen the group.
-- ===========================================================================
do $$
declare
  t          text;
  read_roles text;
begin
  -- Supabase always has the `authenticated` role. A self-hosted or local
  -- Postgres may not, and `TO authenticated` against a missing role aborts the
  -- ENTIRE transaction — which would silently undo Groups A/B/C above.
  -- Degrade to a restrictive auth.uid() check rather than fail the migration.
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    read_roles := 'to authenticated using (true)';
  else
    read_roles := 'using (auth.uid() is not null)';
    raise notice
      'role "authenticated" not found; using auth.uid() IS NOT NULL instead';
  end if;

  foreach t in array array[
    'knowledge_nodes','knowledge_edges','capability_registry',
    'content_versions','data_domains','data_entities'
  ] loop
    if not pg_temp.tbl_exists(t) then
      insert into _rls_log values (t,'SKIPPED','table does not exist'); continue;
    end if;
    execute format('alter table public.%I enable row level security', t);

    execute format('drop policy if exists %I on public.%I', t||'_auth_read', t);
    execute format(
      'create policy %I on public.%I for select ' || read_roles,
      t||'_auth_read', t);

    execute format('drop policy if exists %I on public.%I', t||'_owner_write', t);
    execute format(
      'create policy %I on public.%I for all '
      'using (public.is_platform_owner()) with check (public.is_platform_owner())',
      t||'_owner_write', t);

    insert into _rls_log values (t,'CLOSED','signed-in read; owner write');
  end loop;
end $$;


-- ===========================================================================
-- SWEEP — catch what the file-derived list never knew about.
-- REPORTS ONLY. It does not auto-close, because a table whose access model
-- nobody has decided should not have one invented by a migration script.
-- ===========================================================================
do $$
declare r record; n int := 0;
begin
  for r in
    select c.relname
    from pg_class c
    join pg_namespace ns on ns.oid = c.relnamespace
    where ns.nspname='public' and c.relkind='r' and c.relrowsecurity=false
    order by 1
  loop
    insert into _rls_log values (r.relname,'STILL OPEN',
      'not in the migration target list — needs an access model decision');
    n := n + 1;
  end loop;
  if n > 0 then
    raise notice '% table(s) remain unprotected. See the report below.', n;
  end if;
end $$;


-- ---------------------------------------------------------------------------
-- Supporting indexes. The messages policy resolves ownership through
-- conversation_id on every row read; without these it is a sequential scan.
-- ---------------------------------------------------------------------------
do $$
begin
  if pg_temp.tbl_exists('messages')
     and pg_temp.col_exists('messages','conversation_id') then
    create index if not exists messages_conversation_id_idx
      on public.messages (conversation_id);
  end if;
  if pg_temp.tbl_exists('conversations')
     and pg_temp.col_exists('conversations','user_id') then
    create index if not exists conversations_user_id_idx
      on public.conversations (user_id);
  end if;
end $$;

commit;


-- ===========================================================================
-- REPORT — run this immediately after the migration, same session.
-- ===========================================================================
select outcome, table_name, detail
from _rls_log
order by case outcome
           when 'STILL OPEN'   then 1
           when 'NEEDS REVIEW' then 2
           when 'CLOSED'       then 3
           when 'SKIPPED'      then 4
           else 5 end,
         table_name;


-- ============================================================================
-- POST-MIGRATION VERIFICATION — run separately.
-- ============================================================================

-- 1. Must return ZERO rows. Anything here is still world-accessible.
--
--    select c.relname as unprotected_table
--    from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname='public' and c.relkind='r' and c.relrowsecurity=false
--    order by 1;

-- 2. RLS on but NO policy = fully denied to anon and authenticated.
--    Intended for control-plane tables; a bug anywhere else.
--
--    select c.relname as rls_on_but_no_policy
--    from pg_class c join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname='public' and c.relkind='r' and c.relrowsecurity
--      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
--    order by 1;

-- 3. PERMISSIVE POLICY SWEEP — still open, still the highest remaining risk.
--    347 existing policies were counted by the audit but never evaluated.
--    USING (true) with no role restriction is equivalent to no protection.
--    You already have at least one: platform_owners_read ON public.platform_owners
--    FOR SELECT USING (true) publishes your owner list to anonymous visitors.
--
--    select c.relname as table_name, p.polname as policy_name,
--           p.polcmd as command,
--           coalesce(array_to_string(p.polroles::regrole[], ','), 'PUBLIC') as roles,
--           pg_get_expr(p.polqual, p.polrelid) as using_clause
--    from pg_policy p
--    join pg_class c on c.oid = p.polrelid
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and pg_get_expr(p.polqual, p.polrelid) ilike '%true%'
--    order by 1, 2;

-- 4. Reconcile files against reality. The 42P01 error that produced this v2 is
--    proof that supabase/*.sql no longer describes your database:
--
--        supabase db dump --schema public > db/prod_schema.sql
-- ============================================================================
