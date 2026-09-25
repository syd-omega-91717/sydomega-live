-- Defense in depth: these tables are owner/user scoped and have no anonymous SELECT policy.
-- Keep public catalog access unchanged; only remove the unnecessary anon table grants.
revoke select on table public.platform_settings, public.token_balances from anon;
