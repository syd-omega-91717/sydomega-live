-- Four SECURITY DEFINER functions had EXECUTE revoked from every API role, but
-- live code still calls them, so each call failed with 42501 (CLAUDE.md 8.1
-- class 6c: a correct function no role may run).
--   submit_feedback  <- omega-feedback.js (the FEEDBACK button on every page)
--   update_consent   <- privacy.html (consent toggles; nothing was recorded)
--   upsert_graph_entity, add_graph_relationship <- graphify-ai-ingest (service key)
-- The first two act only on auth.uid() and refuse anonymous callers, so they go
-- to authenticated, never anon. The graph pair take p_user_id as an argument,
-- so they go to service_role only; the Edge Function derives that id from the
-- caller's verified JWT (requireCallerId), never from the request body.
revoke execute on function public.submit_feedback(text, integer, text) from public, anon;
revoke execute on function public.update_consent(text, boolean, text) from public, anon;
grant execute on function public.submit_feedback(text, integer, text) to authenticated;
grant execute on function public.update_consent(text, boolean, text) to authenticated;

revoke execute on function public.upsert_graph_entity(uuid, text, text, text, text, jsonb, numeric, text) from public, anon, authenticated;
revoke execute on function public.add_graph_relationship(uuid, uuid, uuid, text, numeric, numeric, text) from public, anon, authenticated;
grant execute on function public.upsert_graph_entity(uuid, text, text, text, text, jsonb, numeric, text) to service_role;
grant execute on function public.add_graph_relationship(uuid, uuid, uuid, text, numeric, numeric, text) to service_role;
