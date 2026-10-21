-- Ω SYD OMEGA 91717 — private personal context graph foundation.
-- Additive only: no existing member data is moved or reinterpreted.
-- AI processing is opt-in at both the account and item level; no provider call
-- is made by this migration or by the initial UI.
BEGIN;

CREATE SCHEMA IF NOT EXISTS omega_private;
GRANT USAGE ON SCHEMA omega_private TO authenticated;

CREATE TABLE IF NOT EXISTS public.omega_personal_context_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ai_personalization_enabled boolean NOT NULL DEFAULT false,
  web_research_enabled boolean NOT NULL DEFAULT false,
  proactive_alerts_enabled boolean NOT NULL DEFAULT false,
  sensitive_data_processing_enabled boolean NOT NULL DEFAULT false,
  consent_version text NOT NULL DEFAULT '2026-10-22-v1',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  consent_updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.omega_personal_context_consent_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_key text NOT NULL CHECK (consent_key IN (
    'ai_personalization',
    'web_research',
    'proactive_alerts',
    'sensitive_data_processing'
  )),
  decision text NOT NULL CHECK (decision IN ('granted', 'revoked')),
  policy_version text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.omega_personal_context_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
  context_kind text NOT NULL CHECK (context_kind IN (
    'reflection', 'personality_self_description', 'value', 'goal', 'skill',
    'knowledge', 'relationship', 'family_context', 'friend_context',
    'work_context', 'learning', 'preference', 'idea', 'health_context',
    'financial_context', 'environment', 'other'
  )),
  content text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 200000),
  sensitivity text NOT NULL DEFAULT 'sensitive' CHECK (
    sensitivity IN ('standard', 'sensitive', 'highly_sensitive')
  ),
  source_kind text NOT NULL DEFAULT 'user_authored' CHECK (
    source_kind IN ('user_authored', 'file_import', 'connected_import', 'ai_suggestion')
  ),
  source_label text,
  tags text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (jsonb_typeof(metadata) = 'object'),
  ai_processing_allowed boolean NOT NULL DEFAULT false,
  ai_consent_at timestamptz,
  review_status text NOT NULL DEFAULT 'confirmed' CHECK (
    review_status IN ('pending_review', 'confirmed', 'rejected')
  ),
  user_confirmed boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT omega_personal_context_item_tags_limit CHECK (cardinality(tags) <= 20),
  CONSTRAINT omega_personal_context_item_ai_consent CHECK (
    (ai_processing_allowed = false AND ai_consent_at IS NULL)
    OR (ai_processing_allowed = true AND ai_consent_at IS NOT NULL)
  ),
  CONSTRAINT omega_personal_context_item_id_user_unique UNIQUE (id, user_id)
);

CREATE TABLE IF NOT EXISTS public.omega_personal_context_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_item_id uuid NOT NULL,
  to_item_id uuid NOT NULL,
  relation_kind text NOT NULL CHECK (relation_kind IN (
    'supports', 'contradicts', 'related_to', 'part_of', 'influences',
    'depends_on', 'goal_for', 'learned_from', 'relationship_to'
  )),
  source_kind text NOT NULL DEFAULT 'user_authored' CHECK (
    source_kind IN ('user_authored', 'ai_suggestion')
  ),
  user_confirmed boolean NOT NULL DEFAULT true,
  note text CHECK (note IS NULL OR char_length(note) <= 2000),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT omega_personal_context_links_not_self CHECK (from_item_id <> to_item_id),
  CONSTRAINT omega_personal_context_links_from_owner_fk
    FOREIGN KEY (from_item_id, user_id)
    REFERENCES public.omega_personal_context_items(id, user_id) ON DELETE CASCADE,
  CONSTRAINT omega_personal_context_links_to_owner_fk
    FOREIGN KEY (to_item_id, user_id)
    REFERENCES public.omega_personal_context_items(id, user_id) ON DELETE CASCADE,
  CONSTRAINT omega_personal_context_links_unique
    UNIQUE (user_id, from_item_id, to_item_id, relation_kind)
);

CREATE INDEX IF NOT EXISTS omega_personal_context_items_user_updated_idx
  ON public.omega_personal_context_items(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS omega_personal_context_items_user_kind_idx
  ON public.omega_personal_context_items(user_id, context_kind);
CREATE INDEX IF NOT EXISTS omega_personal_context_items_tags_gin_idx
  ON public.omega_personal_context_items USING gin(tags);
CREATE INDEX IF NOT EXISTS omega_personal_context_links_from_idx
  ON public.omega_personal_context_links(user_id, from_item_id);
CREATE INDEX IF NOT EXISTS omega_personal_context_links_to_idx
  ON public.omega_personal_context_links(user_id, to_item_id);
CREATE INDEX IF NOT EXISTS omega_personal_context_consent_events_user_created_idx
  ON public.omega_personal_context_consent_events(user_id, created_at DESC);

ALTER TABLE public.omega_personal_context_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omega_personal_context_consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omega_personal_context_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.omega_personal_context_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS omega_personal_context_preferences_select_own
  ON public.omega_personal_context_preferences;
CREATE POLICY omega_personal_context_preferences_select_own
  ON public.omega_personal_context_preferences FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_preferences_insert_own
  ON public.omega_personal_context_preferences;
CREATE POLICY omega_personal_context_preferences_insert_own
  ON public.omega_personal_context_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_preferences_update_own
  ON public.omega_personal_context_preferences;
CREATE POLICY omega_personal_context_preferences_update_own
  ON public.omega_personal_context_preferences FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_consent_events_select_own
  ON public.omega_personal_context_consent_events;
CREATE POLICY omega_personal_context_consent_events_select_own
  ON public.omega_personal_context_consent_events FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_consent_events_insert_own
  ON public.omega_personal_context_consent_events;
CREATE POLICY omega_personal_context_consent_events_insert_own
  ON public.omega_personal_context_consent_events FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS omega_personal_context_items_select_own
  ON public.omega_personal_context_items;
CREATE POLICY omega_personal_context_items_select_own
  ON public.omega_personal_context_items FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_items_insert_own
  ON public.omega_personal_context_items;
CREATE POLICY omega_personal_context_items_insert_own
  ON public.omega_personal_context_items FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_items_update_own
  ON public.omega_personal_context_items;
CREATE POLICY omega_personal_context_items_update_own
  ON public.omega_personal_context_items FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_items_delete_own
  ON public.omega_personal_context_items;
CREATE POLICY omega_personal_context_items_delete_own
  ON public.omega_personal_context_items FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS omega_personal_context_links_select_own
  ON public.omega_personal_context_links;
CREATE POLICY omega_personal_context_links_select_own
  ON public.omega_personal_context_links FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_links_insert_own
  ON public.omega_personal_context_links;
CREATE POLICY omega_personal_context_links_insert_own
  ON public.omega_personal_context_links FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_links_update_own
  ON public.omega_personal_context_links;
CREATE POLICY omega_personal_context_links_update_own
  ON public.omega_personal_context_links FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS omega_personal_context_links_delete_own
  ON public.omega_personal_context_links;
CREATE POLICY omega_personal_context_links_delete_own
  ON public.omega_personal_context_links FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON TABLE public.omega_personal_context_preferences FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.omega_personal_context_preferences TO authenticated;
REVOKE ALL ON TABLE public.omega_personal_context_consent_events FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT ON TABLE public.omega_personal_context_consent_events TO authenticated;
REVOKE ALL ON TABLE public.omega_personal_context_items FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.omega_personal_context_items TO authenticated;
REVOKE ALL ON TABLE public.omega_personal_context_links FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.omega_personal_context_links TO authenticated;

CREATE OR REPLACE FUNCTION omega_private.omega_personal_context_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at := pg_catalog.now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION omega_private.omega_personal_context_guard_item()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  v_ai_enabled boolean := false;
  v_sensitive_enabled boolean := false;
BEGIN
  IF NEW.user_id IS DISTINCT FROM (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'personal_context_owner_mismatch' USING ERRCODE = '42501';
  END IF;

  IF NEW.ai_processing_allowed THEN
    IF NEW.ai_consent_at IS NULL THEN
      RAISE EXCEPTION 'personal_context_ai_consent_timestamp_required' USING ERRCODE = '23514';
    END IF;

    SELECT p.ai_personalization_enabled, p.sensitive_data_processing_enabled
      INTO v_ai_enabled, v_sensitive_enabled
      FROM public.omega_personal_context_preferences AS p
      WHERE p.user_id = NEW.user_id;

    IF NOT COALESCE(v_ai_enabled, false) THEN
      RAISE EXCEPTION 'personal_context_ai_opt_in_required' USING ERRCODE = '42501';
    END IF;

    IF NEW.sensitivity = 'highly_sensitive' AND NOT COALESCE(v_sensitive_enabled, false) THEN
      RAISE EXCEPTION 'personal_context_sensitive_opt_in_required' USING ERRCODE = '42501';
    END IF;
  ELSE
    NEW.ai_consent_at := NULL;
  END IF;

  IF NEW.source_kind = 'ai_suggestion' AND NEW.review_status = 'confirmed' AND NOT NEW.user_confirmed THEN
    RAISE EXCEPTION 'ai_suggestion_requires_user_confirmation' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION omega_private.omega_personal_context_log_consent()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.ai_personalization_enabled THEN
      INSERT INTO public.omega_personal_context_consent_events(user_id, consent_key, decision, policy_version)
      VALUES (NEW.user_id, 'ai_personalization', 'granted', NEW.consent_version);
    END IF;
    IF NEW.web_research_enabled THEN
      INSERT INTO public.omega_personal_context_consent_events(user_id, consent_key, decision, policy_version)
      VALUES (NEW.user_id, 'web_research', 'granted', NEW.consent_version);
    END IF;
    IF NEW.proactive_alerts_enabled THEN
      INSERT INTO public.omega_personal_context_consent_events(user_id, consent_key, decision, policy_version)
      VALUES (NEW.user_id, 'proactive_alerts', 'granted', NEW.consent_version);
    END IF;
    IF NEW.sensitive_data_processing_enabled THEN
      INSERT INTO public.omega_personal_context_consent_events(user_id, consent_key, decision, policy_version)
      VALUES (NEW.user_id, 'sensitive_data_processing', 'granted', NEW.consent_version);
    END IF;
  ELSE
    IF NEW.ai_personalization_enabled IS DISTINCT FROM OLD.ai_personalization_enabled THEN
      INSERT INTO public.omega_personal_context_consent_events(user_id, consent_key, decision, policy_version)
      VALUES (NEW.user_id, 'ai_personalization',
        CASE WHEN NEW.ai_personalization_enabled THEN 'granted' ELSE 'revoked' END, NEW.consent_version);
    END IF;
    IF NEW.web_research_enabled IS DISTINCT FROM OLD.web_research_enabled THEN
      INSERT INTO public.omega_personal_context_consent_events(user_id, consent_key, decision, policy_version)
      VALUES (NEW.user_id, 'web_research',
        CASE WHEN NEW.web_research_enabled THEN 'granted' ELSE 'revoked' END, NEW.consent_version);
    END IF;
    IF NEW.proactive_alerts_enabled IS DISTINCT FROM OLD.proactive_alerts_enabled THEN
      INSERT INTO public.omega_personal_context_consent_events(user_id, consent_key, decision, policy_version)
      VALUES (NEW.user_id, 'proactive_alerts',
        CASE WHEN NEW.proactive_alerts_enabled THEN 'granted' ELSE 'revoked' END, NEW.consent_version);
    END IF;
    IF NEW.sensitive_data_processing_enabled IS DISTINCT FROM OLD.sensitive_data_processing_enabled THEN
      INSERT INTO public.omega_personal_context_consent_events(user_id, consent_key, decision, policy_version)
      VALUES (NEW.user_id, 'sensitive_data_processing',
        CASE WHEN NEW.sensitive_data_processing_enabled THEN 'granted' ELSE 'revoked' END, NEW.consent_version);
    END IF;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF OLD.ai_personalization_enabled AND NOT NEW.ai_personalization_enabled THEN
      -- Revocation is durable: disabling global AI use clears every item-level
      -- permission so a later re-enable never silently reactivates old consent.
      UPDATE public.omega_personal_context_items
         SET ai_processing_allowed = false, ai_consent_at = NULL
       WHERE user_id = NEW.user_id AND ai_processing_allowed = true;
    END IF;
    IF OLD.sensitive_data_processing_enabled AND NOT NEW.sensitive_data_processing_enabled THEN
      -- Revoking the additional sensitive-data permission clears consent only
      -- for highly sensitive items; a later re-enable requires item re-consent.
      UPDATE public.omega_personal_context_items
         SET ai_processing_allowed = false, ai_consent_at = NULL
       WHERE user_id = NEW.user_id
         AND ai_processing_allowed = true
         AND sensitivity = 'highly_sensitive';
    END IF;
  END IF;
  NEW.consent_updated_at := pg_catalog.now();
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS omega_personal_context_preferences_touch_updated_at
  ON public.omega_personal_context_preferences;
CREATE TRIGGER omega_personal_context_preferences_touch_updated_at
  BEFORE UPDATE ON public.omega_personal_context_preferences
  FOR EACH ROW EXECUTE FUNCTION omega_private.omega_personal_context_touch_updated_at();
DROP TRIGGER IF EXISTS omega_personal_context_preferences_log_consent
  ON public.omega_personal_context_preferences;
CREATE TRIGGER omega_personal_context_preferences_log_consent
  BEFORE INSERT OR UPDATE ON public.omega_personal_context_preferences
  FOR EACH ROW EXECUTE FUNCTION omega_private.omega_personal_context_log_consent();

DROP TRIGGER IF EXISTS omega_personal_context_items_touch_updated_at
  ON public.omega_personal_context_items;
CREATE TRIGGER omega_personal_context_items_touch_updated_at
  BEFORE UPDATE ON public.omega_personal_context_items
  FOR EACH ROW EXECUTE FUNCTION omega_private.omega_personal_context_touch_updated_at();
DROP TRIGGER IF EXISTS omega_personal_context_items_guard
  ON public.omega_personal_context_items;
CREATE TRIGGER omega_personal_context_items_guard
  BEFORE INSERT OR UPDATE ON public.omega_personal_context_items
  FOR EACH ROW EXECUTE FUNCTION omega_private.omega_personal_context_guard_item();

REVOKE ALL ON FUNCTION omega_private.omega_personal_context_touch_updated_at() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION omega_private.omega_personal_context_guard_item() FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION omega_private.omega_personal_context_log_consent() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
