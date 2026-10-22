-- Harden consent-event integrity without rewriting the already-applied foundation migration.
-- Preference changes remain the sole client-facing path for recording consent decisions.
BEGIN;

CREATE OR REPLACE FUNCTION omega_private.omega_personal_context_log_consent()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Authenticated callers may only create audit effects for their own preference row.
  -- Trusted server-side operations without a user JWT remain governed by database privileges.
  IF auth.uid() IS NOT NULL AND auth.uid() IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Consent audit actor does not match preference owner';
  END IF;

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

-- Trigger execution uses the narrowly scoped postgres-owned SECURITY DEFINER function above.
-- Clients may read their own history but cannot forge consent-event rows directly.
DROP POLICY IF EXISTS omega_personal_context_consent_events_insert_own
  ON public.omega_personal_context_consent_events;
REVOKE INSERT ON TABLE public.omega_personal_context_consent_events
  FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.omega_personal_context_consent_events TO authenticated;

REVOKE ALL ON FUNCTION omega_private.omega_personal_context_log_consent()
  FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
