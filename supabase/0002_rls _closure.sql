-- ============================================================================
-- SYD OMEGA 91717 — 0002_rls_closure.sql
--
-- Closes finding F-1: 16 tables in the `public` schema have no RLS statement
-- in any repository SQL file. Supabase exposes every public table through
-- PostgREST, and the publishable (anon) key ships in bg.js by design — so RLS
-- is the only access control on these tables.
--
-- DESIGN RULE APPLIED THROUGHOUT: deny by default, then grant the narrowest
-- access that keeps the current UI working. Where the correct model was
-- genuinely ambiguous, this file chooses the RESTRICTIVE option and records the
-- question in RLS-REVIEW.md rather than guessing permissively. A page that
-- breaks is recoverable; a table that leaks is not.
--
-- Depends on public.is_platform_owner(), already defined in access_gate.sql:
--   SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid())
--
-- SAFETY:
--   * Idempotent. Safe to re-run.
--   * Creates no tables and alters no columns.
--   * Enabling RLS with no matching policy denies all access to anon and
--     authenticated roles. It does NOT affect the service_role key, which
--     bypasses RLS — server-side jobs continue to work.
--
-- APPLY TO STAGING FIRST. Run the verification block at the bottom before and
-- after. Expect some read failures in the UI: each one is a table that was
-- publicly readable a minute ago.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Guard: fail loudly if the owner helper is absent rather than creating
-- policies that silently evaluate to false for everyone.
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


-- ===========================================================================
-- GROUP A — MEMBER-OWNED DATA
-- Owner reads and writes their own rows. Platform owners read all. Nobody else.
-- ===========================================================================

-- conversations: has user_id uuid. Direct ownership.
alter table public.conversations enable row level security;

drop policy if exists conversations_owner_all on public.conversations;
create policy conversations_owner_all on public.conversations
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists conversations_platform_owner_read on public.conversations;
create policy conversations_platform_owner_read on public.conversations
  for select using (public.is_platform_owner());


-- messages: no user_id column. Ownership is derived through conversation_id.
-- The EXISTS subquery is evaluated per row; index conversation_id if this
-- table grows (see the index statement at the end of this file).
alter table public.messages enable row level security;

drop policy if exists messages_owner_all on public.messages;
create policy messages_owner_all on public.messages
  for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );

drop policy if exists messages_platform_owner_read on public.messages;
create policy messages_platform_owner_read on public.messages
  for select using (public.is_platform_owner());


-- bodies: has user_id uuid not null references auth.users(id).
alter table public.bodies enable row level security;

drop policy if exists bodies_owner_all on public.bodies;
create policy bodies_owner_all on public.bodies
  for all
  using      (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists bodies_platform_owner_read on public.bodies;
create policy bodies_platform_owner_read on public.bodies
  for select using (public.is_platform_owner());


-- ===========================================================================
-- GROUP B — CONTROL PLANE
-- Platform owners only. These tables govern who can do what; write access for
-- an ordinary member is a privilege-escalation path, and read access is a map
-- of your defences. No anon access, no authenticated access.
-- ===========================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'security_policies',
    'policy_rules',
    'rate_limits',
    'circuit_breakers'
  ]
  loop
    if exists (
      select 1 from pg_tables where schemaname = 'public' and tablename = t
    ) then
      execute format(
        'alter table public.%I enable row level security', t);
      execute format(
        'drop policy if exists %I on public.%I', t || '_owner_only', t);
      execute format(
        'create policy %I on public.%I for all '
        'using (public.is_platform_owner()) '
        'with check (public.is_platform_owner())',
        t || '_owner_only', t);
    else
      raise notice 'skipped %: table not present', t;
    end if;
  end loop;
end $$;


-- ===========================================================================
-- GROUP C — OBSERVABILITY
-- Written by service_role (which bypasses RLS). Readable by platform owners so
-- the analytics and observatory pages keep working for you. No member access:
-- SLO and error-budget data is operational intelligence, not member content.
-- ===========================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'slo_metrics',
    'error_budget_policy',
    'data_lineage'
  ]
  loop
    if exists (
      select 1 from pg_tables where schemaname = 'public' and tablename = t
    ) then
      execute format('alter table public.%I enable row level security', t);
      execute format('drop policy if exists %I on public.%I',
                     t || '_owner_read', t);
      execute format(
        'create policy %I on public.%I for select '
        'using (public.is_platform_owner())',
        t || '_owner_read', t);
      -- deliberately no INSERT/UPDATE/DELETE policy: writes are service_role only
    else
      raise notice 'skipped %: table not present', t;
    end if;
  end loop;
end $$;


-- ===========================================================================
-- GROUP D — REFERENCE / CATALOGUE DATA
-- Non-sensitive descriptive content the UI renders for signed-in members
-- (knowledge graph, capability registry, master-data catalogue). Read for
-- authenticated members only — NOT anon. Writes restricted to platform owners.
--
-- If any of these must render to signed-out visitors on a public page, change
-- `to authenticated` to `to anon, authenticated` for that table specifically,
-- and record the decision. Do not widen the whole group.
-- ===========================================================================

do $$
declare t text;
begin
  foreach t in array array[
    'knowledge_nodes',
    'knowledge_edges',
    'capability_registry',
    'content_versions',
    'data_domains',
    'data_entities'
  ]
  loop
    if exists (
      select 1 from pg_tables where schemaname = 'public' and tablename = t
    ) then
      execute format('alter table public.%I enable row level security', t);

      execute format('drop policy if exists %I on public.%I',
                     t || '_auth_read', t);
      execute format(
        'create policy %I on public.%I for select to authenticated '
        'using (true)',
        t || '_auth_read', t);

      execute format('drop policy if exists %I on public.%I',
                     t || '_owner_write', t);
      execute format(
        'create policy %I on public.%I for all '
        'using (public.is_platform_owner()) '
        'with check (public.is_platform_owner())',
        t || '_owner_write', t);
    else
      raise notice 'skipped %: table not present', t;
    end if;
  end loop;
end $$;


-- ---------------------------------------------------------------------------
-- Supporting index: messages RLS resolves ownership through conversation_id on
-- every row read. Without this index that becomes a sequential scan under load.
-- ---------------------------------------------------------------------------
create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id);

create index if not exists conversations_user_id_idx
  on public.conversations (user_id);

commit;


-- ============================================================================
-- VERIFICATION — run these separately, after COMMIT.
-- ============================================================================

-- 1. Must return ZERO rows. Anything listed is still world-accessible.
--
--    select c.relname as unprotected_table
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and c.relkind = 'r'
--      and c.relrowsecurity = false
--    order by 1;

-- 2. RLS enabled but NO policy = table is fully denied to anon+authenticated.
--    Review each result: intended for control-plane tables, a bug elsewhere.
--
--    select c.relname as rls_on_but_no_policy
--    from pg_class c
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
--      and not exists (select 1 from pg_policy p where p.polrelid = c.oid)
--    order by 1;

-- 3. PERMISSIVE POLICY SWEEP — the audit counted 347 existing policies but did
--    not evaluate them. A policy with USING (true) and no role restriction is
--    equivalent to no protection at all. This repository already contains at
--    least one: `platform_owners_read ON public.platform_owners FOR SELECT
--    USING (true)` in access_gate.sql, which publishes your owner list to
--    anonymous visitors. Run this and review every row:
--
--    select c.relname as table_name,
--           p.polname as policy_name,
--           p.polcmd  as command,
--           pg_get_expr(p.polqual, p.polrelid) as using_clause
--    from pg_policy p
--    join pg_class c on c.oid = p.polrelid
--    join pg_namespace n on n.oid = c.relnamespace
--    where n.nspname = 'public'
--      and pg_get_expr(p.polqual, p.polrelid) ilike '%true%'
--    order by 1, 2;
--
--    This sweep is not optional. Closing 16 tables while leaving a permissive
--    policy on a members table would be a false sense of security.
-- ============================================================================
