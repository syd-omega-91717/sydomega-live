-- ============================================================================
-- Ω SYD OMEGA 91717 — WRAP auth.uid()/auth.role() IN RLS POLICIES (132 policies)
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- First half of the `get_advisors(type='performance')` RLS-policy follow-up
-- ("keep going on the RLS policy consolidation") deferred by the earlier
-- 20260818001352_drop_duplicate_indexes migration. Fixes `auth_rls_initplan`
-- (132 real findings, 66 tables, confirmed 0 of the 132 were on the
-- unrelated 83-table scaffold schema): Postgres re-evaluates a bare
-- `auth.uid()`/`auth.role()` call inside an RLS USING/WITH CHECK expression
-- once PER ROW instead of once per query. Wrapping it as
-- `(select auth.uid())` lets the planner treat it as a stable subquery,
-- evaluated once. Pure performance rewrite, zero access-control change —
-- confirmed on a sample before running this (e.g.
-- `academy_access.aa_read`'s `(auth.uid() = user_id) OR is_platform_owner()`
-- becomes `((select auth.uid()) = user_id) OR is_platform_owner()` —
-- `is_platform_owner()` is untouched since it's a repo helper function, not
-- an `auth.*` call, and the regex only ever matched `auth.uid()`/
-- `auth.role()` — no other `auth.<fn>()` calls exist anywhere in this
-- schema's policies, confirmed via a `regexp_matches` scan over every
-- policy's qual/with_check before writing this).
--
-- Applied as a DO block (not a hardcoded list of 132 ALTER POLICY
-- statements) so it is naturally idempotent and self-verifying: the WHERE
-- clause only selects policies that still have an unwrapped auth.<fn>()
-- call, so re-running this file is a no-op the second time. ALTER POLICY
-- only supplies USING when the policy actually has a qual, and only
-- supplies WITH CHECK when it actually has one — a SELECT-only policy has
-- no WITH CHECK and Postgres errors if one is supplied regardless.
--
-- Verified post-apply: 0 policies remaining with an unwrapped auth.<fn>()
-- call (re-ran the same detection query with a case-insensitive check for
-- the wrapped form, since Postgres re-pretty-prints `(select auth.uid())`
-- as `( SELECT auth.uid() AS uid)` on storage — the first case-sensitive
-- verification attempt against lowercase `select` produced a false "still
-- 132 remaining" until corrected to `!~*`, confirmed by spot-checking one
-- policy's actual stored definition directly).
--
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

DO $fix$
DECLARE
  r record;
  new_qual text;
  new_check text;
  stmt text;
BEGIN
  FOR r IN
    SELECT tablename, policyname, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND (
        (qual IS NOT NULL AND qual ~ 'auth\.\w+\(\)' AND qual !~* '\(\s*select\s+auth\.')
        OR (with_check IS NOT NULL AND with_check ~ 'auth\.\w+\(\)' AND with_check !~* '\(\s*select\s+auth\.')
      )
  LOOP
    new_qual := CASE WHEN r.qual IS NOT NULL
      THEN regexp_replace(r.qual, 'auth\.(\w+)\(\)', '(select auth.\1())', 'g')
      ELSE NULL END;
    new_check := CASE WHEN r.with_check IS NOT NULL
      THEN regexp_replace(r.with_check, 'auth\.(\w+)\(\)', '(select auth.\1())', 'g')
      ELSE NULL END;

    stmt := format('ALTER POLICY %I ON public.%I', r.policyname, r.tablename);
    IF new_qual IS NOT NULL THEN
      stmt := stmt || format(' USING (%s)', new_qual);
    END IF;
    IF new_check IS NOT NULL THEN
      stmt := stmt || format(' WITH CHECK (%s)', new_check);
    END IF;
    EXECUTE stmt;
  END LOOP;
END;
$fix$;
