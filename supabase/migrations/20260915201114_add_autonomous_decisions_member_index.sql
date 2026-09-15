-- Recovered production migration recorded remotely as 20260915201114.
-- The dedicated member_id index is already present in production; IF NOT EXISTS
-- makes this safe for any environment where the index was independently restored.
CREATE INDEX IF NOT EXISTS idx_autonomous_decisions_member_id
  ON public.autonomous_decisions (member_id);
