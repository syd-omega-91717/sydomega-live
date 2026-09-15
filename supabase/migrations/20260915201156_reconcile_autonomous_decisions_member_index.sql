-- Recovered production migration recorded remotely as 20260915201156.
-- Idempotent reconciliation of the FK-supporting member index.
CREATE INDEX IF NOT EXISTS idx_autonomous_decisions_member_id
  ON public.autonomous_decisions (member_id);
