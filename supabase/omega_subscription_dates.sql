-- ============================================================================
-- SYD OMEGA 91717 -- SUBSCRIPTION PERIOD START (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Members can see which tier they hold and when it renews, but not when it
-- began. profiles carries subscription_period_end with no matching start, and
-- my_subscription() therefore cannot return one. "What did I choose, when did
-- it start, when does it end" is the minimum a paid member should be able to
-- answer about their own money.
--
-- Adds the column, backfills it from Stripe's record where one exists, and
-- teaches both RPCs about it.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_period_start timestamptz;

-- Backfill: any member who already has an active period but no recorded start
-- is assumed to have begun one standard month before their renewal date. This
-- is an estimate for pre-existing rows only; every subscription recorded from
-- now on carries a true start supplied by Stripe.
UPDATE public.profiles
   SET subscription_period_start = subscription_period_end - interval '1 month'
 WHERE subscription_period_end IS NOT NULL
   AND subscription_period_start IS NULL;

-- ---------------------------------------------------------- member read ---
CREATE OR REPLACE FUNCTION public.my_subscription()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'tier',             COALESCE(subscription_tier, 'none'),
    'status',           COALESCE(subscription_status, 'none'),
    -- membership_tier is an INTEGER tier rank (1-12), not a name. Two older
    -- migrations declare it `text DEFAULT 'INITIATE'`, but both use
    -- ADD COLUMN IF NOT EXISTS, which is a no-op because the integer column
    -- already existed -- so the database is integer and those lines never
    -- applied. Cast to text so this function is correct either way; the
    -- client does Number() on it (see OmegaCanon.tierUnlocks).
    'membership_tier',  COALESCE(membership_tier::text, '1'),
    'period_start',     subscription_period_start,
    'period_end',       subscription_period_end,
    'is_trial',         COALESCE(is_trial, false),
    'trial_expires_at', trial_expires_at,
    'payments_enabled', public.get_platform_flag('payments_enabled')
  ) FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_subscription() TO authenticated;

-- --------------------------------------------------- webhook write path ---
-- Extended with p_period_start. Defaulted so any existing caller that omits it
-- keeps working; Stripe supplies current_period_start when it fires.
-- p_tier_num is the INTEGER tier rank (1-12) that membership_tier stores.
-- p_tier remains the human-readable name for subscription_tier. Passing text
-- into the integer column is what produced:
--   ERROR: invalid input syntax for type integer: "INITIATE"
CREATE OR REPLACE FUNCTION public.apply_subscription(
  p_uid uuid, p_tier text, p_status text, p_period_end timestamptz,
  p_customer text, p_period_start timestamptz DEFAULT NULL,
  p_tier_num int DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  -- service role or owner only; never a normal member
  IF auth.uid() IS NOT NULL AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  UPDATE public.profiles
     SET subscription_tier         = p_tier,
         subscription_status       = p_status,
         subscription_period_end   = p_period_end,
         subscription_period_start = COALESCE(p_period_start, subscription_period_start, now()),
         stripe_customer_id        = COALESCE(p_customer, stripe_customer_id),
         membership_tier           = COALESCE(p_tier_num, membership_tier)
   WHERE id = p_uid;

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ============================================================================
-- VERIFY
-- ============================================================================
-- select column_name from information_schema.columns
--  where table_name='profiles' and column_name like 'subscription_period%';
-- select public.my_subscription();
