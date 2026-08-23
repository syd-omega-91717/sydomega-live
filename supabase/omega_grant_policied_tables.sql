-- ============================================================================
-- omega_grant_policied_tables.sql
--
-- THE BUG: 60 tables on the live database have Row Level Security enabled AND
-- carefully written RLS policies -- and `authenticated` held only
-- REFERENCES, TRIGGER, TRUNCATE on every one of them. No SELECT, no INSERT,
-- no UPDATE, no DELETE.
--
-- A table-level GRANT is checked BEFORE row security. With no grant, Postgres
-- rejects the statement outright:
--
--     ERROR: 42501: permission denied for table graph_events
--     HINT:  GRANT SELECT ON public.graph_events TO authenticated;
--
-- so the policy never runs and every query from every page fails. The policies
-- were dead code. This is the inverse of the GRANT/REVOKE class already in
-- CLAUDE.md 8.1: there, a narrowing `GRANT ... TO authenticated` was
-- decorative because PUBLIC already had EXECUTE by default; here a correct,
-- reviewed policy is decorative because no GRANT was ever made at all.
--
-- 22 of the 60 are queried by client code in this repo -- 22 live features
-- broken for this single reason, among them the bottom-bar activity ticker
-- (activity_feed), the dedication widget (user_dedication), member presence,
-- the AI memory store, and the whole knowledge-graph feature (graph_*, handled
-- in omega_graph_verified_fix.sql alongside this).
--
-- HOW THE PRIVILEGE SET WAS CHOSEN: derived from the policies themselves, not
-- picked by hand. A command is granted only where a policy for that command
-- already exists, and only where that policy's WITH CHECK is not `true`.
-- Granting therefore restores exactly the access the policy author already
-- specified and reviewed. It widens nothing.
--
-- DELIBERATELY NOT GRANTED (pre-existing policy weaknesses, not introduced
-- here, and not fixed here either):
--   platform_events  INSERT -- WITH CHECK(true) on a table that has user_id
--   platform_metrics INSERT -- WITH CHECK(true) on a table that has user_id
-- Both are the spoofing shape CLAUDE.md 8.1 names: any member could insert
-- rows attributed to anyone. Granting INSERT would make that reachable for the
-- first time, so it is withheld until the policy itself is decided on.
--
-- anon is granted nothing here. Every table below sits behind the approval
-- gate and is meant for signed-in members only.
--
-- VERIFIED AFTER APPLYING, by impersonating a real non-owner member
-- (set_config('role','authenticated') + request.jwt.claims) and counting rows
-- against the privileged count. Only 4 of the 26 tables hold any data:
--   error_budget_policy    5 rows -> non-owner sees 0   (owner-only, correct)
--   risk_register          6 rows -> non-owner sees 0   (owner-only, correct)
--   feature_flags          7 rows -> non-owner sees 7   (policy is USING(true))
--   governance_policies   10 rows -> non-owner sees 10  (policy is
--                                    `is_platform_owner() OR status='active'`;
--                                    all 10 are status='active', no drafts)
-- The last two are pre-existing policy decisions, both defensible -- published
-- governance policies and feature flags are meant to be member-readable -- but
-- they are the only places where granting made previously-unreachable rows
-- reachable, so they are called out rather than passed over.
--
-- STATUS: APPLIED TO THE LIVE DATABASE (project ydqhzvvoyufiiqvzcjns) as
-- migration `grant_policied_tables_to_authenticated`.
--
-- Idempotent: re-granting an existing privilege is a no-op in Postgres.
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_feed         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memory             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.consent_records       TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.council_deliberations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enterprise_accounts   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.error_budget_policy   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_flags         TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.governance_policies   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.incidents             TO authenticated;
GRANT SELECT, INSERT                 ON public.interest_signals      TO authenticated;
GRANT SELECT                         ON public.leaderboard_snapshots TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_posts          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.member_presence       TO authenticated;
GRANT SELECT                         ON public.platform_events       TO authenticated;
GRANT SELECT,         UPDATE, DELETE ON public.platform_metrics      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.risk_register         TO authenticated;
GRANT SELECT                         ON public.sovereign_events      TO authenticated;
GRANT SELECT, INSERT                 ON public.telemetry_events      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.threat_events         TO authenticated;
GRANT SELECT, INSERT, UPDATE         ON public.user_dedication       TO authenticated;
GRANT SELECT, INSERT                 ON public.workflow_executions   TO authenticated;

-- The knowledge-graph tables, same root cause. Privileges match demonstrated
-- client usage: entities and relationships are selected, upserted
-- (omega-graphify-integration.js) and deleted (graph-admin.html); graph_events
-- is read and appended to by logGraphEvent(); graph_evidence is read-only.
-- (graph_events INSERT was missed on the first pass -- see the correction
-- immediately below.)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.graph_entities      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.graph_relationships TO authenticated;
GRANT SELECT, INSERT                 ON public.graph_events        TO authenticated;
GRANT SELECT                         ON public.graph_evidence      TO authenticated;

-- CORRECTION, applied as migration `graph_events_insert_and_relationship_natural_key`:
-- graph_events was first granted SELECT only, on the strength of a grep that
-- matched only methods chained directly onto .from(). That missed
-- omega-graphify-integration.js:249, `sb.from('graph_events').insert([...])`
-- inside logGraphEvent(), which runs after every entity and relationship
-- ingestion -- so every audit write would have failed 42501, the same class
-- the grant was meant to fix. graph_evidence genuinely has no client writes
-- (re-checked across every .html and .js) and stays SELECT-only.

-- graph_relationships had no natural key, so its upsert could never run:
--   onConflict: 'user_id,source_entity_id,target_entity_id,relationship_type'
-- against a table whose only unique index was the primary key raises
--   42P10: there is no unique or exclusion constraint matching the ON CONFLICT
-- graph_entities already has its equivalent (UNIQUE(user_id, entity_type,
-- canonical_name), omega_graphify_schema.sql:26); relationships was never
-- given one. This is the single place here where intent is inferred from the
-- client rather than read from the schema: the four columns are a genuine
-- natural key for a graph edge, the client already encodes that assumption,
-- and the table is empty (0 rows, verified) so nothing can conflict.
CREATE UNIQUE INDEX IF NOT EXISTS graph_relationships_natural_key
  ON public.graph_relationships (user_id, source_entity_id, target_entity_id, relationship_type);

-- ----------------------------------------------------------------------------
-- STILL OPEN, deliberately: 38 further tables have policies and no grant but
-- are NOT referenced by any client code in this repo. Most are the ~83-table
-- generic SaaS scaffold documented in CLAUDE.md 8.2, whose purpose is unknown
-- and whose correct exposure is a human decision, not one to guess at. They
-- are left locked out -- the safe state -- rather than granted on the
-- assumption that a policy's existence implies it should be reachable.
-- ----------------------------------------------------------------------------

-- ----------------------------------------------------------------------------
-- FOLLOW-UP: two more natural keys the clients already assumed.
--
-- Applied as migration `ai_memory_natural_key`. Same shape as
-- graph_relationships above: omega-memory.js:37-40 upserts with
-- onConflict:'user_id,memory_key' against a table whose only unique index was
-- the primary key, so Postgres raised 42P10 and every memory write was
-- discarded -- silently, since the call sits in a try/catch that cannot fire.
-- Verified 0 rows before creating the index.
CREATE UNIQUE INDEX IF NOT EXISTS ai_memory_user_key
  ON public.ai_memory (user_id, memory_key);

-- platform_metrics needed no schema change -- it already has
-- UNIQUE(metric_date, metric_name). The bug was client-side: omega-metrics.js
-- and omega-finops.js upserted with NO conflict target, which defaults to the
-- primary key (id), a column neither payload carries. PostgREST therefore sent
-- a plain insert and every write after the day's first for a given metric_name
-- raised 23505. Fixed in both files with onConflict:'metric_date,metric_name'
-- plus a real .error check. Note INSERT on platform_metrics is still NOT
-- granted here (see the WITH CHECK(true) exclusion above), so these writes
-- remain blocked at the permission layer until that policy is decided on --
-- the fix is correct regardless and costs nothing.
-- ----------------------------------------------------------------------------
