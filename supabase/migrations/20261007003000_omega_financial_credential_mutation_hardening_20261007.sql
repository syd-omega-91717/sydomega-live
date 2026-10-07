-- Ω SYD OMEGA 91717
-- Financial / credential mutation hardening
-- 2026-10-07

REVOKE INSERT ON TABLE public.certificates FROM authenticated, anon, public;

-- Live database implementation also enforces AAL2 for:
-- private.purchase_perk(text)
-- private.grant_trial_access(uuid)
-- private.grant_permanent_access(uuid)
-- and revokes direct client EXECUTE on those private implementations.
-- See docs/OMEGA_FINANCIAL_CREDENTIAL_HARDENING.md.
