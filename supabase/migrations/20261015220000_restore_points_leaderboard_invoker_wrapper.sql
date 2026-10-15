-- Restore the public leaderboard RPC to SECURITY INVOKER.
-- The narrow SECURITY DEFINER projection already exists in private.get_points_leaderboard.
-- Keeping the exposed public RPC as an invoker wrapper avoids exposing a public-schema
-- SECURITY DEFINER endpoint while preserving the intended authenticated leaderboard.
CREATE OR REPLACE FUNCTION public.get_points_leaderboard(p_limit integer DEFAULT 10)
RETURNS TABLE(
  rank integer,
  display_name text,
  element text,
  sign text,
  level integer,
  lifetime_points integer,
  is_self boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $function$
  SELECT *
  FROM private.get_points_leaderboard($1);
$function$;

REVOKE ALL ON FUNCTION public.get_points_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_points_leaderboard(integer) TO authenticated;

-- Keep the internal projection callable by the invoker wrapper's authenticated caller.
REVOKE ALL ON FUNCTION private.get_points_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.get_points_leaderboard(integer) TO authenticated;
