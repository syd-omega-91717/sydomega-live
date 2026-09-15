-- SYD OMEGA 91717 — COMMERCE DORMANCY FLAGS
-- Materialized locally because the live Supabase migration history records
-- this application of the commerce flags under timestamp 20260915100009.
-- Keep the operation idempotent and the flags dormant by default.

INSERT INTO public.platform_settings(key, bool_value)
VALUES ('ad_network_enabled', false)
ON CONFLICT (key) DO NOTHING;

INSERT INTO public.platform_settings(key, bool_value)
VALUES ('creator_earnings_enabled', false)
ON CONFLICT (key) DO NOTHING;
