-- ============================================================================
-- SYD OMEGA 91717 -- MARKETPLACE SCHEMA FIX
-- marketplace.html inserts title/kind/description/file_path, but the existing
-- marketplace_listings table lacks them -> 42703 "column does not exist".
-- This self-healing patch adds every column the page needs (idempotent, safe to
-- re-run). No value moves; listings are owner-visible records only.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid()
);
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS seller_id   uuid DEFAULT auth.uid();
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS kind        text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS price_omega numeric DEFAULT 0;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS file_path   text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS status      text DEFAULT 'active';
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- sellers manage their own listings; active listings are visible to members ---
DROP POLICY IF EXISTS ml_insert ON public.marketplace_listings;
CREATE POLICY ml_insert ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS ml_select ON public.marketplace_listings;
CREATE POLICY ml_select ON public.marketplace_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id OR public.is_platform_owner());
DROP POLICY IF EXISTS ml_update ON public.marketplace_listings;
CREATE POLICY ml_update ON public.marketplace_listings FOR UPDATE
  USING (auth.uid() = seller_id OR public.is_platform_owner()) WITH CHECK (auth.uid() = seller_id OR public.is_platform_owner());

GRANT SELECT, INSERT, UPDATE ON public.marketplace_listings TO authenticated;

COMMIT;
