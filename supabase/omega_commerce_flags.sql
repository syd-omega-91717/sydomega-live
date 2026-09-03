-- ============================================================================
-- SYD OMEGA 91717 -- COMMERCE DORMANCY FLAGS
--
-- CLAUDE.md section 9: a monetizable or legally-sensitive feature ships dormant
-- behind public.platform_settings, with user-facing copy in future tense until
-- the flag is actually on. `tokens_enabled` and `payments_enabled` already
-- follow this. The advertising network and the creator earnings path did not:
-- ad-network.html rendered "TOTAL REVENUE $0.10 / CREATOR SHARE $0.07" and the
-- present-tense claim "Creators earn 70% revenue share" to every approved
-- member, for money that does not exist and a payout that has never run.
--
-- These two flags close that gap. Both default FALSE and must stay false until
-- there is (a) a real advertiser agreement, (b) a payout mechanism that can
-- actually pay, and (c) published terms stating the share and the payment
-- schedule. Flipping either one is a legal and commercial decision for the
-- platform owner, made through set_platform_flag(), never a code change.
--
-- Idempotent, like the rest of the bag: ON CONFLICT DO NOTHING so re-running
-- never overwrites a flag the owner has since turned on.
-- ============================================================================

-- The advertising network: campaigns, impressions, and any revenue figure
-- derived from them. While false, ad-network.html shows the specification and
-- the sample creative only -- no monetary amounts of any kind.
INSERT INTO public.platform_settings(key, bool_value)
VALUES ('ad_network_enabled', false)
ON CONFLICT (key) DO NOTHING;

-- The creator earnings path: revenue share, payouts, and any statement that a
-- member earns from their contributions. Deliberately SEPARATE from
-- ad_network_enabled -- advertising could run as platform-only revenue long
-- before any member payout obligation exists, and conflating the two would
-- make turning on the first silently promise the second.
INSERT INTO public.platform_settings(key, bool_value)
VALUES ('creator_earnings_enabled', false)
ON CONFLICT (key) DO NOTHING;

-- No new grants or policies are needed: platform_settings is read through
-- public.get_platform_flag(text), which is SECURITY DEFINER and already granted
-- to authenticated and anon, and written only through set_platform_flag(),
-- which refuses anyone who is not is_platform_owner().
