-- service_role held no privilege on any public table (default privileges were
-- revoked in 20260903015535, and nothing re-granted what server code needs).
-- Every service-key flag gate therefore failed its READ, and each one fails
-- closed, so "disabled" meant "could not read the flag": the three orchestrators
-- (platform_settings select) and checkout (get_platform_flag, an invoker
-- function that reads the same table) would stay shut even after the owner
-- turned their flag on.
-- Least privilege: read-only on the flag store, and the flag reader. No DML is
-- granted here. The orchestrators' writes (autonomous_decisions insert,
-- member_feature_flags upsert) stay ungranted until the owner decides to turn
-- autonomous_agents_enabled on; GAP_ANALYSIS.md records that step.
grant select on table public.platform_settings to service_role;
grant execute on function public.get_platform_flag(text) to service_role;
