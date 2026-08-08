-- ============================================================================
-- SYD OMEGA 91717 -- MEMBERSHIP & SUBSCRIPTION REPORT (owner only)
--
-- WHY THIS EXISTS
-- The owner could approve members one at a time but had no view of the whole:
-- how many members exist, which tiers they hold, how many are on trial, which
-- trials expire today, what renews this month, and whether any money is
-- actually recognised.
--
-- WHAT IT DOES *NOT* DO
-- It does not project, forecast, or annualise. There is no payments table in
-- this schema -- no invoices, no charges, no transaction history. The only
-- financial fact available is: which members currently carry
-- subscription_status = 'active'. While the economy is dormant that count is
-- zero, and this report will say zero rather than showing a hypothetical MRR
-- built from list prices and member counts. A number the owner cannot bank is
-- worse than no number.
--
-- Tier prices are supplied by the caller from omega-canon.json (the single
-- source of truth for pricing), so this function never carries a second,
-- drifting copy of the price list.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.membership_report(p_prices jsonb DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_total        int;
  v_owner        int;
  v_pending      int;
  v_approved     int;
  v_rejected     int;
  v_trial        int;
  v_trial_expiring int;
  v_paid_active  int;
  v_recognised   numeric := 0;
  v_by_tier      jsonb;
  v_renewals     jsonb;
  v_trials       jsonb;
BEGIN
  IF NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok', false, 'error', 'forbidden');
  END IF;

  SELECT
    count(*),
    count(*) FILTER (WHERE is_owner IS TRUE),
    count(*) FILTER (WHERE access_approved IS NOT TRUE AND is_rejected IS NOT TRUE AND is_owner IS NOT TRUE),
    count(*) FILTER (WHERE access_approved IS TRUE),
    count(*) FILTER (WHERE is_rejected IS TRUE),
    count(*) FILTER (WHERE is_trial IS TRUE),
    count(*) FILTER (WHERE is_trial IS TRUE AND trial_expires_at IS NOT NULL
                       AND trial_expires_at <= now() + interval '24 hours'),
    count(*) FILTER (WHERE subscription_status = 'active')
  INTO v_total, v_owner, v_pending, v_approved, v_rejected, v_trial, v_trial_expiring, v_paid_active
  FROM public.profiles;

  -- Members grouped by the integer tier rank they hold.
  SELECT COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.tier), '[]'::jsonb) INTO v_by_tier
  FROM (
    SELECT COALESCE(membership_tier, 1)      AS tier,
           count(*)                          AS members,
           count(*) FILTER (WHERE subscription_status = 'active') AS paid,
           count(*) FILTER (WHERE is_trial IS TRUE)               AS on_trial
      FROM public.profiles
     WHERE is_owner IS NOT TRUE
     GROUP BY COALESCE(membership_tier, 1)
  ) t;

  -- Recognised revenue: ONLY members whose subscription is genuinely active,
  -- priced from the caller-supplied canon price list. Nothing else counts.
  IF p_prices IS NOT NULL THEN
    SELECT COALESCE(sum(
             COALESCE((p_prices ->> COALESCE(p.membership_tier, 1)::text)::numeric, 0)
           ), 0)
      INTO v_recognised
      FROM public.profiles p
     WHERE p.subscription_status = 'active'
       AND p.is_owner IS NOT TRUE;
  END IF;

  -- Renewals due in the next 30 days.
  SELECT COALESCE(jsonb_agg(row_to_json(r) ORDER BY r.period_end), '[]'::jsonb) INTO v_renewals
  FROM (
    SELECT COALESCE(display_name, email, id::text) AS member,
           COALESCE(membership_tier, 1)            AS tier,
           subscription_status                     AS status,
           subscription_period_end                 AS period_end
      FROM public.profiles
     WHERE subscription_period_end IS NOT NULL
       AND subscription_period_end BETWEEN now() AND now() + interval '30 days'
     ORDER BY subscription_period_end
     LIMIT 50
  ) r;

  -- Trials still running, soonest to expire first.
  SELECT COALESCE(jsonb_agg(row_to_json(x) ORDER BY x.expires_at), '[]'::jsonb) INTO v_trials
  FROM (
    SELECT COALESCE(display_name, email, id::text) AS member,
           trial_expires_at                        AS expires_at
      FROM public.profiles
     WHERE is_trial IS TRUE AND trial_expires_at IS NOT NULL
     ORDER BY trial_expires_at
     LIMIT 50
  ) x;

  RETURN jsonb_build_object(
    'ok', true,
    'generated_at',     now(),
    'payments_enabled', public.get_platform_flag('payments_enabled'),
    'totals', jsonb_build_object(
      'members',         v_total,
      'owner',           v_owner,
      'pending',         v_pending,
      'approved',        v_approved,
      'rejected',        v_rejected,
      'on_trial',        v_trial,
      'trials_expiring', v_trial_expiring,
      'paid_active',     v_paid_active
    ),
    'recognised_monthly', v_recognised,
    'by_tier',            v_by_tier,
    'renewals_30d',       v_renewals,
    'trials',             v_trials
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.membership_report(jsonb) TO authenticated;

-- ============================================================================
-- VERIFY
-- ============================================================================
-- select public.membership_report();                     -- counts only
-- select public.membership_report('{"1":9.17,"2":19.17}'::jsonb);  -- with prices
