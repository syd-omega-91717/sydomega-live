-- ============================================================================
-- SYD OMEGA 91717 -- USER_ASSETS TABLE FIX
-- portfolio.html ("SOVEREIGN ASSETS" panel) and vault.html (NFT grid) both
-- query public.user_assets (portfolio.html:161, vault.html:498) and portfolio.
-- html's own on-page copy describes it as "the user_assets ledger... updated
-- by mission outcomes, trade, and sovereign grants" -- but no CREATE TABLE for
-- user_assets exists anywhere in supabase/*.sql. The Supabase JS client
-- doesn't throw on a missing-relation error, it just returns {data: null,
-- error}, and both pages fall back to their empty state (data||[] / a length
-- check) -- so this has been failing silently: every member's "Sovereign
-- Assets" list and NFT grid has always shown empty/zero, with no visible
-- error, regardless of what they actually hold.
--
-- Columns below are inferred directly from the two pages' own field reads:
--   portfolio.html:168-171  a.name, a.quantity, a.asset_type
--   vault.html:507-509      n.track_name, n.name, n.created_at
--   both                    .eq('user_id', ...), .eq('asset_type','nft'),
--                           .order('created_at')
--
-- Neither page ever calls .insert()/.update() on this table -- consistent
-- with portfolio.html's own description ("updated by mission outcomes,
-- trade, and sovereign grants"), i.e. rows are meant to be written
-- server-side (Edge Functions using service_role, which bypasses RLS), not
-- directly by the member's browser. RLS below is therefore read-only for
-- `authenticated`: members see their own rows, the owner sees all. No
-- INSERT/UPDATE/DELETE grant is given to `authenticated` -- add one
-- explicitly, with its own policy, if a future feature needs members to
-- write their own asset rows directly.
--
-- Idempotent, safe to re-run.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.user_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid()
);
ALTER TABLE public.user_assets ADD COLUMN IF NOT EXISTS user_id     uuid NOT NULL DEFAULT auth.uid();
ALTER TABLE public.user_assets ADD COLUMN IF NOT EXISTS name        text;
ALTER TABLE public.user_assets ADD COLUMN IF NOT EXISTS quantity    numeric DEFAULT 0;
ALTER TABLE public.user_assets ADD COLUMN IF NOT EXISTS asset_type  text;
ALTER TABLE public.user_assets ADD COLUMN IF NOT EXISTS track_name  text;
ALTER TABLE public.user_assets ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS user_assets_user_id_idx ON public.user_assets(user_id);
CREATE INDEX IF NOT EXISTS user_assets_asset_type_idx ON public.user_assets(asset_type);

ALTER TABLE public.user_assets ENABLE ROW LEVEL SECURITY;

-- members read only their own holdings; the owner reads all
DROP POLICY IF EXISTS ua_select ON public.user_assets;
CREATE POLICY ua_select ON public.user_assets FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

GRANT SELECT ON public.user_assets TO authenticated;

COMMIT;
-- ===== end omega_user_assets_fix.sql =====
