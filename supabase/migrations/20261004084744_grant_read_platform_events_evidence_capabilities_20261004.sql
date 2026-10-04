-- These three tables carry correct SELECT policies but no table grant, so every
-- client read failed with 42501 before RLS ran (CLAUDE.md 8.1 class 6c).
-- Readers: omega-eternity-engine.js, omega-evidence-graph.js,
-- omega-mission-board.js, omega-temporal-replay.js.
-- Rows stay scoped by the existing policies (actor_user_id / owner_user_id = auth.uid()).
grant select on table public.omega_platform_events to authenticated;
grant select on table public.omega_platform_evidence to authenticated;
-- capability_registry: only the columns a member page reads; threat_model,
-- dependencies and other internal columns stay ungranted.
grant select (capability_id, capability_name, lifecycle_status, health_status, version)
  on table public.capability_registry to authenticated;
