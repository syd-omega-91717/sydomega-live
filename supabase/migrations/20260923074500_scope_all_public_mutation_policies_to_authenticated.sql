-- Ω SYD OMEGA 91717 — mutation policy role boundary
-- Every public-schema mutation policy is explicitly bound to authenticated users.
-- Anonymous writes remain available only where an explicit table grant/policy supports them
-- (for example, dedicated public intake tables), rather than through inherited PUBLIC RLS policies.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname='public'
      AND roles='{public}'
      AND cmd IN ('INSERT','UPDATE','DELETE','ALL')
  LOOP
    EXECUTE format(
      'ALTER POLICY %I ON %I.%I TO authenticated',
      r.policyname, r.schemaname, r.tablename
    );
  END LOOP;
END $$;
