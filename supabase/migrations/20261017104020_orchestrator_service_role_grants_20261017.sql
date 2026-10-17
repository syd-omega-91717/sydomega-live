-- Ω SYD OMEGA 91717 — the three orchestrators can write what they already try to write
-- concierge-, growth- and product-orchestrator use a service-role client
-- (secretKey()) and write:
--   autonomous_decisions  INSERT ... RETURNING id   (all three)
--   member_feature_flags  upsert on (member_id, feature_id)  (product)
-- service_role held no privilege on either table (20260903015535 revoked its
-- defaults; measured live 2026-10-17), so each call would fail 42501. RLS is
-- bypassed for service_role; the GRANT is the whole gate (§8.1 class 6).
-- Dormant today: all three return 503 until
-- platform_settings.autonomous_agents_enabled is true (it is false), and both
-- tables hold 0 rows.
--
-- Exactly what the code needs, no more:
--   SELECT on autonomous_decisions — `.insert().select("id")` returns the row.
--   SELECT on member_feature_flags — ON CONFLICT DO UPDATE reads the conflict
--   target columns.
-- No DELETE, no TRUNCATE, nothing to anon/authenticated.

begin;

grant select, insert on table public.autonomous_decisions to service_role;
grant select, insert, update on table public.member_feature_flags to service_role;

commit;
