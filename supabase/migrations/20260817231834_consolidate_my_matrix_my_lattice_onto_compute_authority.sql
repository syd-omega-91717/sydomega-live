-- ============================================================================
-- Ω SYD OMEGA 91717 — CONSOLIDATE my_matrix()/my_lattice() ONTO compute_authority()
--
-- Byte-for-byte the same fix already applied live (2026-08-17, via the
-- Supabase MCP connector) — see CLAUDE.md §8 for the full writeup. This file
-- exists specifically to match the version string Supabase's own
-- `apply_migration` tool recorded on the remote database's migration-
-- tracking table when this fix was applied directly, so the "Supabase
-- Preview" CI check (which diffs the remote's tracked migration versions
-- against this directory) doesn't fail with "Remote migration versions not
-- found in local migrations directory" — see supabase/migrations/README.md's
-- "Timestamp-versioned files" section for why this breaks the directory's
-- usual NNNN_<name>.sql convention.
--
-- my_matrix()/my_lattice() called authority_score(a,b,c) -- the older
-- formula with no owner special-case -- while get_all_members()/
-- order_stats()/public_leaderboard() already called compute_authority(a,b,c,
-- is_owner), which returns exactly 27.8367 for the owner regardless of
-- literal axis values. No visible bug (the owner's axes are always pinned
-- at 9,9,9, and authority_score(9,9,9) already rounds to the identical
-- 27.8367), but two functions computing the platform's one "authority"
-- concept differently is a real inconsistency. Consolidated both onto the
-- newer, owner-aware function.
--
-- Idempotent (CREATE OR REPLACE FUNCTION), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.my_matrix()
 RETURNS TABLE(track integer, phase integer, sign text, element text, a numeric, b numeric, c numeric, authority numeric, node integer, pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT
      COALESCE(p.matrix_track, 1)::int,
      COALESCE(p.matrix_phase, 1)::int,
      COALESCE(p.sign, ''),
      COALESCE(p.element, ''),
      COALESCE(p.axis_a, 0.001),
      COALESCE(p.axis_b, 0.001),
      COALESCE(p.axis_c, 0.001),
      public.compute_authority(p.axis_a, p.axis_b, p.axis_c, p.is_owner),
      public.lattice_node(p.matrix_track, p.matrix_phase, p.axis_a, p.axis_b, p.axis_c),
      round(public.lattice_node(p.matrix_track, p.matrix_phase,
            p.axis_a, p.axis_b, p.axis_c)::numeric / 104976 * 100, 4)
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$function$;

CREATE OR REPLACE FUNCTION public.my_lattice()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT jsonb_build_object(
    'track',         COALESCE(matrix_track,1),
    'phase',         COALESCE(matrix_phase,1),
    'a',             COALESCE(axis_a,0.001),
    'b',             COALESCE(axis_b,0.001),
    'c',             COALESCE(axis_c,0.001),
    'authority',     public.compute_authority(axis_a, axis_b, axis_c, is_owner),
    'authority_apex',27.8367,
    'node',          public.lattice_node(matrix_track,matrix_phase,axis_a,axis_b,axis_c),
    'lattice_total', 104976,
    'phases_done',   COALESCE(phases_done,0),
    'tracks_done',   COALESCE(tracks_done,0),
    'percent',       round(public.lattice_node(matrix_track,matrix_phase,
                       axis_a,axis_b,axis_c)::numeric/104976*100,4)
  ) FROM public.profiles WHERE id = auth.uid();
$function$;
