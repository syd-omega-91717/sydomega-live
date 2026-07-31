-- ============================================================================
-- Ω SYD OMEGA 91717 — 0008_rls_missing_tables.sql
--
-- Closes the 14 tables that audit finding F-1 (0002_rls_closure.sql) marked
-- as still open because it could not verify them at file-analysis time.
--
-- TABLES COVERED (by category):
--   Infrastructure / SRE (owner-only write, restricted read):
--     capability_registry, circuit_breakers, rate_limits, security_policies,
--     data_domains, data_entities, data_lineage, error_budget_policy,
--     slo_metrics, policy_rules, content_versions
--   Knowledge graph (authenticated read, owner write):
--     knowledge_nodes, knowledge_edges
--   AI conversation log (member owns, owner reads all):
--     conversations, messages
--
-- SAFETY:
--   * Idempotent — safe to re-run (IF NOT EXISTS / DROP POLICY IF EXISTS).
--   * Never creates tables or alters columns.
--   * Enabling RLS with the policies below means:
--       anon          → blocked (correct: all tables are member/owner only)
--       authenticated → blocked unless a policy grants access (secure default)
--       service_role  → bypasses RLS (Supabase Edge Functions unaffected)
--   * Tables that don't exist in the live DB are silently skipped.
--
-- PREREQUISITES:
--   access_gate.sql applied (defines public.is_platform_owner()).
--   Run on staging first; read the NOTICE output.
-- ============================================================================

DO $$
DECLARE
  _exists boolean;
BEGIN

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. CAPABILITY REGISTRY — platform capability catalogue (owner only)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='capability_registry'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.capability_registry ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages capability_registry"     ON public.capability_registry;
  DROP POLICY IF EXISTS "authenticated reads capability_registry" ON public.capability_registry;

  CREATE POLICY "owner manages capability_registry"
    ON public.capability_registry FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  -- Authenticated members can read the catalogue (used by lab.html + agents.html)
  CREATE POLICY "authenticated reads capability_registry"
    ON public.capability_registry FOR SELECT
    USING (auth.uid() IS NOT NULL);

  RAISE NOTICE 'capability_registry: RLS closed.';
ELSE
  RAISE NOTICE 'capability_registry: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. CIRCUIT BREAKERS — SRE circuit-breaker state (server-managed)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='circuit_breakers'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.circuit_breakers ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages circuit_breakers" ON public.circuit_breakers;

  -- Only the owner (or service_role via Edge Functions) can read/write.
  -- SECURITY DEFINER functions bypass RLS entirely; this policy covers
  -- direct PostgREST calls with the publishable key.
  CREATE POLICY "owner manages circuit_breakers"
    ON public.circuit_breakers FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  RAISE NOTICE 'circuit_breakers: RLS closed.';
ELSE
  RAISE NOTICE 'circuit_breakers: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. RATE LIMITS — token-bucket rate-limit counters (server-managed)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='rate_limits'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages rate_limits" ON public.rate_limits;

  -- Written only by SECURITY DEFINER RPCs. No direct client access.
  CREATE POLICY "owner manages rate_limits"
    ON public.rate_limits FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  RAISE NOTICE 'rate_limits: RLS closed.';
ELSE
  RAISE NOTICE 'rate_limits: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 4. SECURITY POLICIES — platform security policy rules (owner only)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='security_policies'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages security_policies" ON public.security_policies;

  CREATE POLICY "owner manages security_policies"
    ON public.security_policies FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  RAISE NOTICE 'security_policies: RLS closed.';
ELSE
  RAISE NOTICE 'security_policies: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. DATA DOMAINS — master data catalogue (owner manages, auth reads)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='data_domains'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.data_domains ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages data_domains"     ON public.data_domains;
  DROP POLICY IF EXISTS "authenticated reads data_domains" ON public.data_domains;

  CREATE POLICY "owner manages data_domains"
    ON public.data_domains FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  CREATE POLICY "authenticated reads data_domains"
    ON public.data_domains FOR SELECT
    USING (auth.uid() IS NOT NULL);

  RAISE NOTICE 'data_domains: RLS closed.';
ELSE
  RAISE NOTICE 'data_domains: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 6. DATA ENTITIES — master data entity registry
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='data_entities'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.data_entities ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages data_entities"     ON public.data_entities;
  DROP POLICY IF EXISTS "authenticated reads data_entities" ON public.data_entities;

  CREATE POLICY "owner manages data_entities"
    ON public.data_entities FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  CREATE POLICY "authenticated reads data_entities"
    ON public.data_entities FOR SELECT
    USING (auth.uid() IS NOT NULL);

  RAISE NOTICE 'data_entities: RLS closed.';
ELSE
  RAISE NOTICE 'data_entities: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 7. DATA LINEAGE — data provenance graph
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='data_lineage'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.data_lineage ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages data_lineage" ON public.data_lineage;

  CREATE POLICY "owner manages data_lineage"
    ON public.data_lineage FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  RAISE NOTICE 'data_lineage: RLS closed.';
ELSE
  RAISE NOTICE 'data_lineage: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 8. ERROR BUDGET POLICY — SRE error budget thresholds (owner only)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='error_budget_policy'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.error_budget_policy ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages error_budget_policy" ON public.error_budget_policy;

  CREATE POLICY "owner manages error_budget_policy"
    ON public.error_budget_policy FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  RAISE NOTICE 'error_budget_policy: RLS closed.';
ELSE
  RAISE NOTICE 'error_budget_policy: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 9. SLO METRICS — service-level objective time series
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='slo_metrics'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.slo_metrics ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages slo_metrics"     ON public.slo_metrics;
  DROP POLICY IF EXISTS "rpc inserts slo_metrics"       ON public.slo_metrics;

  CREATE POLICY "owner manages slo_metrics"
    ON public.slo_metrics FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  -- record_health_metric() is SECURITY DEFINER so it bypasses RLS.
  -- This policy is a belt-and-suspenders guard for direct PostgREST calls.
  RAISE NOTICE 'slo_metrics: RLS closed.';
ELSE
  RAISE NOTICE 'slo_metrics: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 10. POLICY RULES — business / compliance / AI guardrails
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='policy_rules'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.policy_rules ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages policy_rules"       ON public.policy_rules;
  DROP POLICY IF EXISTS "authenticated reads policy_rules" ON public.policy_rules;

  CREATE POLICY "owner manages policy_rules"
    ON public.policy_rules FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  -- Clients read policy rules to enforce guardrails client-side (AI concierge)
  CREATE POLICY "authenticated reads policy_rules"
    ON public.policy_rules FOR SELECT
    USING (auth.uid() IS NOT NULL);

  RAISE NOTICE 'policy_rules: RLS closed.';
ELSE
  RAISE NOTICE 'policy_rules: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 11. CONTENT VERSIONS — immutable content version log (owner manages)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='content_versions'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.content_versions ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages content_versions"     ON public.content_versions;
  DROP POLICY IF EXISTS "author reads own content_versions"  ON public.content_versions;

  CREATE POLICY "owner manages content_versions"
    ON public.content_versions FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  -- Authors can read the versions of their own content
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='content_versions' AND column_name='author_id'
  ) INTO _exists;
  IF _exists THEN
    CREATE POLICY "author reads own content_versions"
      ON public.content_versions FOR SELECT
      USING (author_id = auth.uid());
  END IF;

  RAISE NOTICE 'content_versions: RLS closed.';
ELSE
  RAISE NOTICE 'content_versions: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 12. KNOWLEDGE NODES — platform concept graph (read by all auth, owner writes)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='knowledge_nodes'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.knowledge_nodes ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages knowledge_nodes"      ON public.knowledge_nodes;
  DROP POLICY IF EXISTS "authenticated reads knowledge_nodes" ON public.knowledge_nodes;

  CREATE POLICY "owner manages knowledge_nodes"
    ON public.knowledge_nodes FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  -- Knowledge graph is a read-only reference for all members (AI concierge + search)
  CREATE POLICY "authenticated reads knowledge_nodes"
    ON public.knowledge_nodes FOR SELECT
    USING (auth.uid() IS NOT NULL);

  RAISE NOTICE 'knowledge_nodes: RLS closed.';
ELSE
  RAISE NOTICE 'knowledge_nodes: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 13. KNOWLEDGE EDGES — concept graph relationships
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='knowledge_edges'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.knowledge_edges ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "owner manages knowledge_edges"      ON public.knowledge_edges;
  DROP POLICY IF EXISTS "authenticated reads knowledge_edges" ON public.knowledge_edges;

  CREATE POLICY "owner manages knowledge_edges"
    ON public.knowledge_edges FOR ALL
    USING (public.is_platform_owner())
    WITH CHECK (public.is_platform_owner());

  CREATE POLICY "authenticated reads knowledge_edges"
    ON public.knowledge_edges FOR SELECT
    USING (auth.uid() IS NOT NULL);

  RAISE NOTICE 'knowledge_edges: RLS closed.';
ELSE
  RAISE NOTICE 'knowledge_edges: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 14. CONVERSATIONS — AI concierge session headers (member owns, owner reads all)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='conversations'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "member manages own conversations" ON public.conversations;
  DROP POLICY IF EXISTS "owner reads all conversations"   ON public.conversations;

  -- Check which user column exists (conversations.sql uses user_id)
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conversations' AND column_name='user_id'
  ) INTO _exists;

  IF _exists THEN
    CREATE POLICY "member manages own conversations"
      ON public.conversations FOR ALL
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  CREATE POLICY "owner reads all conversations"
    ON public.conversations FOR SELECT
    USING (public.is_platform_owner());

  RAISE NOTICE 'conversations: RLS closed.';
ELSE
  RAISE NOTICE 'conversations: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- 15. MESSAGES — AI concierge message log (member owns via conversation)
-- ═══════════════════════════════════════════════════════════════════════════
SELECT EXISTS(
  SELECT 1 FROM information_schema.tables
  WHERE table_schema='public' AND table_name='messages'
) INTO _exists;

IF _exists THEN
  ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "member manages own messages" ON public.messages;
  DROP POLICY IF EXISTS "owner reads all messages"   ON public.messages;

  -- Members access messages through their conversation (conversation_id FK)
  SELECT EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='messages' AND column_name='conversation_id'
  ) INTO _exists;

  IF _exists AND EXISTS(
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='conversations' AND column_name='user_id'
  ) THEN
    CREATE POLICY "member manages own messages"
      ON public.messages FOR ALL
      USING (
        EXISTS(
          SELECT 1 FROM public.conversations c
          WHERE c.id = messages.conversation_id
            AND c.user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS(
          SELECT 1 FROM public.conversations c
          WHERE c.id = messages.conversation_id
            AND c.user_id = auth.uid()
        )
      );
  END IF;

  CREATE POLICY "owner reads all messages"
    ON public.messages FOR SELECT
    USING (public.is_platform_owner());

  RAISE NOTICE 'messages: RLS closed.';
ELSE
  RAISE NOTICE 'messages: table not found — skipped.';
END IF;

-- ═══════════════════════════════════════════════════════════════════════════
-- REPORT
-- ═══════════════════════════════════════════════════════════════════════════
RAISE NOTICE '=== 0008_rls_missing_tables.sql complete ===';
RAISE NOTICE 'Apply scripts/audit.py after running this on staging to confirm';
RAISE NOTICE 'the CRITICAL RLS finding is resolved.';

END $$;
