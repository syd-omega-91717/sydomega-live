-- ============================================================================
-- 0089_omega_user_assets_fix.sql
-- SYD OMEGA 91717 -- USER_ASSETS TABLE FIX
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

DROP POLICY IF EXISTS ua_select ON public.user_assets;
CREATE POLICY ua_select ON public.user_assets FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());

GRANT SELECT ON public.user_assets TO authenticated;

COMMIT;
