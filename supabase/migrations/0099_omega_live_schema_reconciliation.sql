-- ============================================================================
-- Ω LIVE SCHEMA RECONCILIATION -- declare what production already has
--
-- WHY THIS EXISTS
--
-- Four objects exist on the live database that no file in `supabase/` ever
-- declared. That divergence is not cosmetic: every source-only tool in this
-- repo builds its model from `supabase/*.sql`, so each one produced a wrong
-- answer about a correct system.
--
--   profiles.country       `scripts/schema-dictionary.py` reported
--                          "map.html reads profiles.country (column does not
--                          exist)". The column is `text` and live. The finding
--                          was a repo gap, not a client bug.
--   check_gate(text,numeric)
--                          `scripts/audit.py` warned ".rpc() function never
--                          CREATE FUNCTION'd anywhere in supabase/". It is
--                          live and called by omega-guardian.js.
--   digest_preferences     `scripts/audit.py` warned both were ".from() tables
--   weekly_digest_queue    never CREATE TABLE'd". Both are live and read by
--                          supabase/functions/weekly-digest.
--
-- WHAT THIS FILE DOES AND DOES NOT DO
--
-- It changes nothing on production. Every statement is a no-op against the
-- current live schema: `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT
-- EXISTS`, and a `CREATE OR REPLACE FUNCTION` whose body is the *verbatim*
-- live definition read back with `pg_get_functiondef`, not a reconstruction.
--
-- That last point is deliberate. Writing a plausible-looking body from the
-- function's name and signature would mean that anyone who later applied this
-- file would silently overwrite the real `check_gate` with a guess. The body
-- below is a copy, so applying it is idempotent.
--
-- Column types, nullability and defaults were read from
-- `information_schema.columns` on the live database rather than inferred.
--
-- NOTE ON RLS AND GRANTS
--
-- A first draft of this file deliberately omitted RLS and policies, reasoning
-- that re-declaring them from an incomplete reading risks *widening* access.
-- That was the wrong call and `scripts/audit.py` caught it as a CRITICAL: a
-- `CREATE TABLE` with no `ENABLE ROW LEVEL SECURITY` means anyone applying this
-- file to a fresh database gets two completely unprotected tables. Omitting
-- protection is not the safe default -- stating it accurately is.
--
-- So RLS and policies below are read from the live database
-- (`pg_class.relrowsecurity`, `pg_policies`) and reproduced exactly.
--
-- GRANTS are still not issued, and that is faithful rather than cautious:
-- live shows *no* SELECT/INSERT/UPDATE/DELETE grant to anon, authenticated or
-- service_role on either digest table. They are reached only by the
-- weekly-digest Edge Function under service_role, which bypasses RLS. Adding a
-- grant here would widen access beyond what production actually has.
--
-- `check_gate` keeps the anon revoke applied in migration 0096.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. profiles.country
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;

COMMENT ON COLUMN public.profiles.country IS
  'Member-declared country. Real and live; read by map.html. Note this is the '
  'only location-ish field on profiles -- there is no lat/lon, and this '
  'platform collects no coordinates.';

-- ---------------------------------------------------------------------------
-- 2. Weekly digest tables, read by supabase/functions/weekly-digest
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.digest_preferences (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  weekly_digest_enabled  boolean,
  digest_frequency       text,
  preferred_day_of_week  integer,
  preferred_hour         integer,
  last_digest_sent_at    timestamptz,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.weekly_digest_queue (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES auth.users(id) ON DELETE CASCADE,
  queued_at     timestamptz DEFAULT now(),
  processed_at  timestamptz,
  status        text,
  error_message text,
  digest_data   jsonb
);

-- RLS as it is live on both tables. Enabled with a policy is the protected
-- state; enabled with no policy would be total lockout, and disabled would be
-- open season -- so both lines matter.
ALTER TABLE public.digest_preferences  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_digest_queue ENABLE ROW LEVEL SECURITY;

-- A member manages only their own digest preferences.
DROP POLICY IF EXISTS "members manage own digest preferences" ON public.digest_preferences;
-- NOTE: `auth.uid()` is deliberately NOT wrapped as `(SELECT auth.uid())`
-- here, even though this repo standardised on the wrapped, per-statement form
-- in migration 20260818002535. Live carries the unwrapped form on these two
-- tables, and this file's whole contract is "declare what production already
-- has". Wrapping would be semantically identical but would make applying this
-- file a policy rewrite rather than a no-op -- verified: with the wrapped form
-- a BEGIN/ROLLBACK trial reported policy_definitions_identical = false.
-- Optimising these two policies is a separate, deliberate change.
CREATE POLICY "members manage own digest preferences" ON public.digest_preferences
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- The queue is operational, not member-facing: owner only.
DROP POLICY IF EXISTS "owner manages digest queue" ON public.weekly_digest_queue;
CREATE POLICY "owner manages digest queue" ON public.weekly_digest_queue
  FOR ALL
  USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());

-- ---------------------------------------------------------------------------
-- 3. check_gate -- verbatim live definition (pg_get_functiondef), not a rewrite
--
-- Called by omega-guardian.js. Note for whoever wires the guardian badge up:
-- this returns {passed, risk_score, threshold, action} and gates only
-- grant_permanent_access / revoke_member / extend_trial at a threshold of 85.
-- CLAUDE.md §8.2 records that OmegaGuardian.gate() is never called and the
-- threat_signal event is never emitted, so this function is currently
-- unreachable from the UI -- that is a separate, open product decision.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_gate(p_action text, p_risk_score numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  threshold numeric := 85;  -- Conservative threshold: 85/100 required to proceed
  passed boolean;
  result jsonb;
BEGIN
  -- List of actions that should be gated
  -- Currently: grant_permanent_access, revoke_member, extend_trial
  passed := CASE
    WHEN p_action IN ('grant_permanent_access', 'revoke_member', 'extend_trial')
      AND p_risk_score >= threshold THEN true
    ELSE false
  END;

  -- Log the evaluation (owner only, for audit trail)
  INSERT INTO public.gate_evaluations (user_id, action, risk_score, threshold, passed)
  VALUES (auth.uid(), p_action, p_risk_score, threshold, passed)
  ON CONFLICT DO NOTHING;

  result := jsonb_build_object(
    'passed', passed,
    'risk_score', p_risk_score,
    'threshold', threshold,
    'action', p_action
  );

  RETURN result;
END;
$function$;

-- CREATE OR REPLACE re-grants EXECUTE to PUBLIC (CLAUDE.md §8.2). Migration
-- 0096 revoked anon from this function; re-assert that here so applying this
-- file cannot quietly undo it.
REVOKE EXECUTE ON FUNCTION public.check_gate(text, numeric) FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.check_gate(text, numeric) TO authenticated;
