-- ============================================================================
-- SYD OMEGA 91717 -- INTEREST GRAPH (omega-recommend.js integration)
-- Creates the interest_signals table and record_interest_signal() RPC that
-- omega-recommend.js calls. Tracks engagement signals for content personalisation.
-- ============================================================================

-- ── TABLE ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.interest_signals (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type   text NOT NULL,           -- 'watch' | 'skip' | 'complete'
  content_id    text NOT NULL,           -- page slug or task name
  content_type  text NOT NULL DEFAULT 'page',  -- 'page' | 'task' | 'resource'
  axis_type     text,                    -- 'a' | 'b' | 'c' | null
  weight        numeric NOT NULL DEFAULT 1.0 CHECK (weight > 0),
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- Guarantee created_at exists even if public.interest_signals already exists
-- in the shape entreprise_schema_v2.sql defines (recorded_at instead of
-- created_at, different FK target and CHECK constraint list) -- confirmed
-- live via a Supabase Preview run reporting exactly this: CREATE TABLE
-- IF NOT EXISTS was a no-op against that shape, and this file's own
-- CREATE INDEX below failed on the missing column. Same defensive pattern
-- as omega_master_deploy.sql's "guarantee the ownership column exists
-- first" and 0059's ai_memory fix. Every other column this file needs
-- (user_id, signal_type, content_id, content_type, axis_type, weight)
-- is already present in both known shapes, so only created_at needs this.
ALTER TABLE public.interest_signals ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();

-- Index for per-user interest queries (recommendation feed)
CREATE INDEX IF NOT EXISTS interest_signals_user_idx
  ON public.interest_signals (user_id, signal_type, created_at DESC);

-- ── RLS ────────────────────────────────────────────────────────────────────
ALTER TABLE public.interest_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS interest_own_insert ON public.interest_signals;
CREATE POLICY interest_own_insert ON public.interest_signals
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS interest_own_select ON public.interest_signals;
CREATE POLICY interest_own_select ON public.interest_signals
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Owner sees all signals for analytics
DROP POLICY IF EXISTS interest_owner_select ON public.interest_signals;
CREATE POLICY interest_owner_select ON public.interest_signals
  FOR SELECT TO authenticated
  USING (public.is_platform_owner());

-- ── RPC: record_interest_signal ────────────────────────────────────────────
-- Called by omega-recommend.js. Returns silently on any error (best-effort).
DROP FUNCTION IF EXISTS public.record_interest_signal(text,text,text,text,numeric);
CREATE OR REPLACE FUNCTION public.record_interest_signal(
  p_signal_type  text,
  p_content_id   text,
  p_content_type text DEFAULT 'page',
  p_axis_type    text DEFAULT NULL,
  p_weight       numeric DEFAULT 1.0
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN; END IF;
  IF p_signal_type IS NULL OR p_content_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.interest_signals
    (user_id, signal_type, content_id, content_type, axis_type, weight)
  VALUES
    (uid, p_signal_type, p_content_id, COALESCE(p_content_type,'page'), p_axis_type, COALESCE(p_weight, 1.0));

EXCEPTION WHEN OTHERS THEN
  -- Swallow all errors; interest recording must never interrupt the member's journey
  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_interest_signal(text,text,text,text,numeric)
  TO authenticated, anon;

-- ── RPC: my_interest_profile ───────────────────────────────────────────────
-- Returns the member's top content_ids ranked by accumulated weight signal.
-- Used by future recommendation widgets.
CREATE OR REPLACE FUNCTION public.my_interest_profile(p_limit int DEFAULT 10)
RETURNS TABLE (
  content_id   text,
  content_type text,
  total_weight numeric,
  signal_count bigint
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT content_id, content_type,
         SUM(weight)  AS total_weight,
         COUNT(*)     AS signal_count
    FROM public.interest_signals
   WHERE user_id = auth.uid()
     AND signal_type = 'watch'
     AND created_at > now() - interval '30 days'
   GROUP BY content_id, content_type
   ORDER BY total_weight DESC
   LIMIT p_limit;
$$;

GRANT EXECUTE ON FUNCTION public.my_interest_profile(int)
  TO authenticated;
