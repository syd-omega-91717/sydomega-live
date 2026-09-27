-- Ω SYD OMEGA 91717 — harden exam submission RPC execution privileges.
-- This history entry was applied to the live project as 20260922150056.
-- The later secure_exam_submission_rpc migration moves privileged grading into
-- private and reasserts the same public execution boundary. Keep this earlier
-- history entry reproducible for fresh environments.
REVOKE EXECUTE ON FUNCTION public.submit_exam_attempt(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_exam_attempt(uuid, jsonb) TO authenticated;
