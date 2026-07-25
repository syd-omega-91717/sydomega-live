-- ================================================================
-- SYD OMEGA 91717 -- CHUNK 00: DROP ALL FUNCTIONS
-- Run this FIRST. Uses pg_catalog so it knows the EXACT current
-- signatures -- no guessing, no 42P13 errors possible afterwards.
-- Only ~30 lines. Paste alone, click Run, wait for success.
-- ================================================================
DO $drop_all$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.proname,
           pg_get_function_identity_arguments(p.oid) AS args
    FROM   pg_proc p
    JOIN   pg_namespace n ON n.oid = p.pronamespace
    WHERE  n.nspname = 'public'
  LOOP
    BEGIN
      EXECUTE 'DROP FUNCTION IF EXISTS public.'
           || quote_ident(r.proname)
           || '(' || r.args || ') CASCADE';
    EXCEPTION WHEN OTHERS THEN
      NULL; -- already gone or dependency handled by CASCADE
    END;
  END LOOP;
END;
$drop_all$;

-- Verify: should return 0 rows
SELECT proname FROM pg_proc p
JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname='public';

-- ================================================================
-- PREREQUISITE FUNCTIONS (created immediately after DROP ALL so
-- any migration that calls them can rely on them existing)
-- ================================================================

DROP FUNCTION IF EXISTS public.milestones_for_axis(numeric) CASCADE;
CREATE OR REPLACE FUNCTION public.milestones_for_axis(v numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0, LEAST(12, floor((COALESCE(v,1) - 1) / 8.0 * 12)::int));
$$;
GRANT EXECUTE ON FUNCTION public.milestones_for_axis(numeric) TO authenticated, anon;

DROP FUNCTION IF EXISTS public.get_platform_flag(text) CASCADE;
CREATE OR REPLACE FUNCTION public.get_platform_flag(p_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT bool_value FROM public.platform_settings WHERE key=p_key), false);
$$;
GRANT EXECUTE ON FUNCTION public.get_platform_flag(text) TO authenticated, anon;

-- ================================================================
-- MIGRATIONS FOLLOW IN NUMBERED CHUNKS
-- ================================================================
