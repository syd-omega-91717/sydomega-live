-- ============================================================================
-- SYD OMEGA 91717 -- APPLY_SUBSCRIPTION OVERLOAD-AMBIGUITY FIX (CRITICAL)
--
-- Confirmed live via `select proname, pg_get_function_identity_arguments(oid),
-- pg_get_functiondef(oid) from pg_proc where proname='apply_subscription'`
-- (run against the production database on request): TWO overloads of
-- public.apply_subscription() coexist --
--   (p_uid,p_tier,p_status,p_period_end,p_customer)                          -- 5 args
--   (p_uid,p_tier,p_status,p_period_end,p_customer,p_period_start,p_tier_num) -- 7 args, last 2 DEFAULT NULL
-- supabase/functions/stripe-webhook/index.ts calls this RPC 4 times (checkout
-- completed, subscription updated, subscription deleted, payment failed),
-- always with exactly the 5 shared named parameters -- it never passes
-- p_period_start or p_tier_num.
--
-- Reproduced against a scratch PostgreSQL 16 instance (both overloads created
-- verbatim from the live pg_get_functiondef() output, then called exactly as
-- the webhook calls them):
--
--   select public.apply_subscription(p_uid := ..., p_tier := 'gold',
--     p_status := 'active', p_period_end := now(), p_customer := 'cus_test');
--   ERROR: function public.apply_subscription(...) is not unique
--   HINT: Could not choose a best candidate function.
--
-- This is not a theoretical risk -- it is the exact call shape the live
-- webhook uses, and it fails on every single invocation. Net effect on
-- production right now: EVERY Stripe webhook event errors out (the Edge
-- Function logs "apply_subscription failed" and returns 500, so Stripe
-- retries and eventually gives up) -- a member who successfully pays via
-- Stripe never gets subscription_status set to 'active'. Paying and getting
-- access has fully decoupled.
--
-- The obvious alternative fix (drop the 5-arg version, keep only the 7-arg
-- one, since it has DEFAULT NULL for the 2 extra params) does NOT work --
-- also reproduced in the scratch instance:
--
--   ERROR: COALESCE types integer and text cannot be matched
--   ...membership_tier = COALESCE(p_tier_num, membership_tier)...
--
-- public.profiles.membership_tier is `text` (see chunk_02a_migrations.sql /
-- omega_master_deploy.sql: `ADD COLUMN IF NOT EXISTS membership_tier text
-- DEFAULT 'INITIATE'`), but the 7-arg overload's p_tier_num is `integer` --
-- COALESCE(integer, text) fails to resolve a common type regardless of the
-- runtime value of p_tier_num (this is a static type error, not a null-
-- handling bug), so that overload is independently broken even in isolation
-- and nothing in the codebase ever calls it with p_period_start/p_tier_num
-- populated anyway (grepped: only supabase/functions/stripe-webhook/index.ts
-- calls apply_subscription, and only with the 5 shared params).
--
-- Fix: drop the 7-arg overload. The 5-arg version is correct as-is (matches
-- the webhook's only call shape, verified in the scratch instance to update
-- the row and return {"ok":true,...} cleanly) and is re-declared here via
-- CREATE OR REPLACE purely so this file is a complete, idempotent, re-
-- runnable record of the fix rather than a bare DROP.
--
-- Idempotent, safe to re-run. Not yet applied to the live database.
-- ============================================================================
BEGIN;

DROP FUNCTION IF EXISTS public.apply_subscription(
  uuid, text, text, timestamptz, text, timestamptz, integer
);

CREATE OR REPLACE FUNCTION public.apply_subscription(
  p_uid uuid, p_tier text, p_status text, p_period_end timestamptz, p_customer text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.profiles SET
    subscription_tier = p_tier,
    subscription_status = p_status,
    subscription_period_end = p_period_end,
    stripe_customer_id = COALESCE(p_customer, stripe_customer_id),
    membership_tier = CASE WHEN p_status IN ('active','trialing') THEN upper(p_tier) ELSE membership_tier END
  WHERE id = p_uid;

  RETURN jsonb_build_object('ok', true, 'uid', p_uid, 'tier', p_tier, 'status', p_status);
END;
$function$;

COMMIT;
