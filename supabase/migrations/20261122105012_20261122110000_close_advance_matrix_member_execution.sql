-- Revoke member/API execution of the unverified matrix progression primitive.
-- The function increments matrix axes without validating an event and its trigger
-- awards sovereign points. No client, Edge Function or SQL routine calls it.
-- Keep the postgres owner privilege so a future event-verified SECURITY DEFINER
-- workflow can invoke it after that workflow is designed and reviewed.
-- The private copy exists in the live project but is absent from a fresh replay;
-- guard both paths so this migration is safe on both states.

BEGIN;

DO $$
BEGIN
  IF to_regprocedure('public.advance_matrix(integer,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION public.advance_matrix(integer, text)
      FROM PUBLIC, anon, authenticated, service_role;
  END IF;

  IF to_regprocedure('private.advance_matrix(integer,text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION private.advance_matrix(integer, text)
      FROM PUBLIC, anon, authenticated, service_role;
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regprocedure('public.advance_matrix(integer,text)') IS NOT NULL THEN
    IF has_function_privilege('anon', 'public.advance_matrix(integer,text)', 'EXECUTE')
       OR has_function_privilege('authenticated', 'public.advance_matrix(integer,text)', 'EXECUTE')
       OR has_function_privilege('service_role', 'public.advance_matrix(integer,text)', 'EXECUTE') THEN
      RAISE EXCEPTION 'public.advance_matrix remains executable by an API role';
    END IF;
    IF NOT has_function_privilege('postgres', 'public.advance_matrix(integer,text)', 'EXECUTE') THEN
      RAISE EXCEPTION 'postgres owner lost public.advance_matrix execution';
    END IF;
  END IF;

  IF to_regprocedure('private.advance_matrix(integer,text)') IS NOT NULL THEN
    IF has_function_privilege('anon', 'private.advance_matrix(integer,text)', 'EXECUTE')
       OR has_function_privilege('authenticated', 'private.advance_matrix(integer,text)', 'EXECUTE')
       OR has_function_privilege('service_role', 'private.advance_matrix(integer,text)', 'EXECUTE') THEN
      RAISE EXCEPTION 'private.advance_matrix remains executable by an API role';
    END IF;
    IF NOT has_function_privilege('postgres', 'private.advance_matrix(integer,text)', 'EXECUTE') THEN
      RAISE EXCEPTION 'postgres owner lost private.advance_matrix execution';
    END IF;
  END IF;
END
$$;

COMMIT;
