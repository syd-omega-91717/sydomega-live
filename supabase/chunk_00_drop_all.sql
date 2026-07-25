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
