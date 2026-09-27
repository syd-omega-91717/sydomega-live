-- Ω SYD OMEGA 91717 — scope private/self-owned RLS to authenticated
BEGIN;

DROP POLICY IF EXISTS ai_memory_select ON public.ai_memory;
CREATE POLICY ai_memory_select ON public.ai_memory FOR SELECT TO authenticated
USING ((user_id = (SELECT auth.uid())) OR private.is_platform_owner());
DROP POLICY IF EXISTS ai_memory_self_delete ON public.ai_memory;
CREATE POLICY ai_memory_self_delete ON public.ai_memory FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS ai_memory_self_insert ON public.ai_memory;
CREATE POLICY ai_memory_self_insert ON public.ai_memory FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS ai_memory_self_update ON public.ai_memory;
CREATE POLICY ai_memory_self_update ON public.ai_memory FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS api_keys_select ON public.api_keys;
CREATE POLICY api_keys_select ON public.api_keys FOR SELECT TO authenticated
USING (private.is_platform_owner() OR owner_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS api_keys_owner_delete ON public.api_keys;
CREATE POLICY api_keys_owner_delete ON public.api_keys FOR DELETE TO authenticated USING (private.is_platform_owner());
DROP POLICY IF EXISTS api_keys_owner_insert ON public.api_keys;
CREATE POLICY api_keys_owner_insert ON public.api_keys FOR INSERT TO authenticated WITH CHECK (private.is_platform_owner());
DROP POLICY IF EXISTS api_keys_owner_update ON public.api_keys;
CREATE POLICY api_keys_owner_update ON public.api_keys FOR UPDATE TO authenticated
USING (private.is_platform_owner()) WITH CHECK (private.is_platform_owner());

DROP POLICY IF EXISTS conversations_select ON public.conversations;
CREATE POLICY conversations_select ON public.conversations FOR SELECT TO authenticated
USING ((user_id = (SELECT auth.uid())) OR private.is_platform_owner());
DROP POLICY IF EXISTS conversations_self_delete ON public.conversations;
CREATE POLICY conversations_self_delete ON public.conversations FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS conversations_self_insert ON public.conversations;
CREATE POLICY conversations_self_insert ON public.conversations FOR INSERT TO authenticated WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS conversations_self_update ON public.conversations;
CREATE POLICY conversations_self_update ON public.conversations FOR UPDATE TO authenticated
USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages FOR SELECT TO authenticated
USING ((EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = (SELECT auth.uid()))) OR private.is_platform_owner());
DROP POLICY IF EXISTS messages_self_delete ON public.messages;
CREATE POLICY messages_self_delete ON public.messages FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS messages_self_insert ON public.messages;
CREATE POLICY messages_self_insert ON public.messages FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = (SELECT auth.uid())));
DROP POLICY IF EXISTS messages_self_update ON public.messages;
CREATE POLICY messages_self_update ON public.messages FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = (SELECT auth.uid())))
WITH CHECK (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND c.user_id = (SELECT auth.uid())));

DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = (SELECT auth.uid()));
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = id OR private.is_platform_owner());
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
USING ((SELECT auth.uid()) = id OR private.is_platform_owner())
WITH CHECK ((SELECT auth.uid()) = id OR private.is_platform_owner());

DROP POLICY IF EXISTS "owner reads all telemetry" ON public.telemetry_events;
CREATE POLICY "owner reads all telemetry" ON public.telemetry_events FOR SELECT TO authenticated
USING (private.is_platform_owner());

DROP POLICY IF EXISTS threat_events_insert ON public.threat_events;
CREATE POLICY threat_events_insert ON public.threat_events FOR INSERT TO authenticated
WITH CHECK (private.is_platform_owner() OR user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS threat_events_owner_delete ON public.threat_events;
CREATE POLICY threat_events_owner_delete ON public.threat_events FOR DELETE TO authenticated USING (private.is_platform_owner());
DROP POLICY IF EXISTS threat_events_owner_update ON public.threat_events;
CREATE POLICY threat_events_owner_update ON public.threat_events FOR UPDATE TO authenticated
USING (private.is_platform_owner()) WITH CHECK (private.is_platform_owner());
DROP POLICY IF EXISTS threat_events_select ON public.threat_events;
CREATE POLICY threat_events_select ON public.threat_events FOR SELECT TO authenticated USING (private.is_platform_owner());

DROP POLICY IF EXISTS tb_read ON public.token_balances;
CREATE POLICY tb_read ON public.token_balances FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id OR private.is_platform_owner());

DROP POLICY IF EXISTS ua_select ON public.user_assets;
CREATE POLICY ua_select ON public.user_assets FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id OR private.is_platform_owner());

DROP POLICY IF EXISTS user_journeys_select_merged ON public.user_journeys;
CREATE POLICY user_journeys_select_merged ON public.user_journeys FOR SELECT TO authenticated
USING (user_id = (SELECT auth.uid()) OR private.is_platform_owner());

COMMIT;
