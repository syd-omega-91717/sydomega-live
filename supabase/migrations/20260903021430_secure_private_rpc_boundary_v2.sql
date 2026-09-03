BEGIN;
CREATE SCHEMA IF NOT EXISTS private;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO anon, authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname AS schema_name, c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity
      AND NOT EXISTS (SELECT 1 FROM pg_policy p WHERE p.polrelid=c.oid)
  LOOP
    EXECUTE format('CREATE POLICY %I ON %I.%I FOR ALL TO anon, authenticated USING (false) WITH CHECK (false)', 'omega_deny_by_default', r.schema_name, r.table_name);
  END LOOP;
END $$;

DO $$
DECLARE r record; v_call text := ''; v_sql text; v_i integer; v_vol text; v_roles text;
BEGIN
  FOR r IN
    SELECT p.oid, p.proname, pg_get_function_identity_arguments(p.oid) AS identity_args,
           pg_get_function_arguments(p.oid) AS args, pg_get_function_result(p.oid) AS result_clause,
           p.pronargs, p.provolatile,
           has_function_privilege('anon',p.oid,'EXECUTE') AS anon_exec,
           has_function_privilege('authenticated',p.oid,'EXECUTE') AS auth_exec
    FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef=true AND p.prorettype <> 'event_trigger'::regtype
      AND (has_function_privilege('anon',p.oid,'EXECUTE') OR has_function_privilege('authenticated',p.oid,'EXECUTE'))
  LOOP
    v_call := '';
    IF r.pronargs > 0 THEN
      FOR v_i IN 1..r.pronargs LOOP
        IF v_i > 1 THEN v_call := v_call || ', '; END IF;
        v_call := v_call || '$' || v_i;
      END LOOP;
    END IF;
    v_vol := CASE r.provolatile WHEN 'i' THEN 'IMMUTABLE' WHEN 's' THEN 'STABLE' ELSE 'VOLATILE' END;
    EXECUTE format('ALTER FUNCTION public.%I(%s) SET SCHEMA private', r.proname, r.identity_args);
    v_roles := CASE WHEN r.anon_exec AND r.auth_exec THEN 'anon, authenticated' WHEN r.anon_exec THEN 'anon' ELSE 'authenticated' END;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION private.%I(%s) FROM PUBLIC, anon, authenticated', r.proname, r.identity_args);
    EXECUTE format('GRANT EXECUTE ON FUNCTION private.%I(%s) TO %s', r.proname, r.identity_args, v_roles);
    IF r.result_clause LIKE 'TABLE(%' OR r.result_clause LIKE 'SETOF %' THEN
      v_sql := format('CREATE OR REPLACE FUNCTION public.%I(%s) RETURNS %s LANGUAGE sql SECURITY INVOKER %s SET search_path TO public, pg_temp AS $omega$ SELECT * FROM private.%I(%s) $omega$', r.proname, r.args, r.result_clause, v_vol, r.proname, v_call);
    ELSE
      v_sql := format('CREATE OR REPLACE FUNCTION public.%I(%s) RETURNS %s LANGUAGE sql SECURITY INVOKER %s SET search_path TO public, pg_temp AS $omega$ SELECT private.%I(%s) $omega$', r.proname, r.args, r.result_clause, v_vol, r.proname, v_call);
    END IF;
    EXECUTE v_sql;
    EXECUTE format('REVOKE EXECUTE ON FUNCTION public.%I(%s) FROM PUBLIC, anon, authenticated', r.proname, r.identity_args);
    IF r.anon_exec THEN EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO anon', r.proname, r.identity_args); END IF;
    IF r.auth_exec THEN EXECUTE format('GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated', r.proname, r.identity_args); END IF;
  END LOOP;
END $$;

REVOKE EXECUTE ON FUNCTION public.omega_auto_enable_rls() FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE USAGE, SELECT ON SEQUENCES FROM anon, authenticated;
COMMIT;
