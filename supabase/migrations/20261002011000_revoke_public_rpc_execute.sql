-- Ω SYD OMEGA 91717
-- Close the PUBLIC privilege inheritance loophole left by the initial anon
-- revoke. Keep the existing authenticated/server application surface intact,
-- while making anonymous RPC execution explicitly opt-in.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS function_identity
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC', r.function_identity);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated', r.function_identity);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', r.function_identity);
  END LOOP;
END
$$;
