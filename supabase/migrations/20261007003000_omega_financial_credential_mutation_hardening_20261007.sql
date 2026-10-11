-- Ω SYD OMEGA 91717
-- Financial / credential mutation hardening
-- 2026-10-07

REVOKE INSERT ON TABLE public.certificates FROM authenticated, anon, public;

REVOKE INSERT, UPDATE, DELETE ON TABLE public.evolution_events FROM authenticated, anon, public;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.medals FROM authenticated, anon, public;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.task_completions FROM authenticated, anon, public;
REVOKE INSERT, UPDATE, DELETE ON TABLE public.trophies FROM authenticated, anon, public;

-- The live database implementation also enforces AAL2 for:
-- private.purchase_perk(text)
-- private.grant_trial_access(uuid)
-- private.grant_permanent_access(uuid)
-- and revokes direct client EXECUTE on those private implementations.
-- The private implementations are defined by the preceding live hardening
-- migration and remain non-client-callable.
