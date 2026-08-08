-- ============================================================================
-- SYD OMEGA 91717 — DEDICATION TRACKING TABLE
-- Tracks each member's daily active time on the platform
-- Target: 9h 17m 17s = 33,437 seconds per day
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_dedication(
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date         date NOT NULL DEFAULT CURRENT_DATE,
  seconds_today int NOT NULL DEFAULT 0,
  target_seconds int NOT NULL DEFAULT 33437,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);
ALTER TABLE public.user_dedication ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own dedication" ON public.user_dedication;
CREATE POLICY "member sees own dedication"  ON public.user_dedication FOR SELECT USING (user_id=auth.uid());
DROP POLICY IF EXISTS "member upserts own dedication" ON public.user_dedication;
CREATE POLICY "member upserts own dedication" ON public.user_dedication FOR INSERT WITH CHECK (user_id=auth.uid());
DROP POLICY IF EXISTS "member updates own dedication" ON public.user_dedication;
CREATE POLICY "member updates own dedication" ON public.user_dedication FOR UPDATE USING (user_id=auth.uid());
DROP POLICY IF EXISTS "owner sees all dedication" ON public.user_dedication;
CREATE POLICY "owner sees all dedication"    ON public.user_dedication FOR SELECT USING (public.is_platform_owner());
