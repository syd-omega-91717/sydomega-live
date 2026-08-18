-- ============================================================================
-- Ω SYD OMEGA 91717 — REVOKE ANON EXECUTE + HARDEN search_path (70 + 32 functions)
--
-- Named with the exact version string Supabase's own `apply_migration` tool
-- recorded on the remote database's migration-tracking table when this fix
-- was applied directly (2026-08-18, via the Supabase MCP connector) — see
-- supabase/migrations/README.md's "Timestamp-versioned files" section for
-- why this breaks the directory's usual NNNN_<name>.sql convention.
--
-- Continuing the security-advisor triage started with the
-- pending_access_requests fix (20260817234540): after that ERROR-level
-- finding, `get_advisors(type='security')` still showed 212 WARN + 83 INFO
-- findings across 5 categories:
--   - anon_security_definer_function_executable (84)
--   - authenticated_security_definer_function_executable (95)
--   - rls_enabled_no_policy (83, INFO)
--   - function_search_path_mutable (32)
--   - auth_leaked_password_protection (1)
--
-- ----------------------------------------------------------------------------
-- PART 1 — REVOKE anon's PUBLIC-inherited EXECUTE on 70 functions
-- ----------------------------------------------------------------------------
-- Root cause: Postgres grants EXECUTE to PUBLIC automatically when a
-- function is CREATEd. Every one of these functions' own source file
-- (supabase/*.sql) already carries an explicit `GRANT EXECUTE ... TO
-- authenticated` (or, for 2 of them, `TO service_role` only) showing clear,
-- narrower intent — but none of those files ever REVOKE the default PUBLIC
-- grant first, so the explicit GRANT was redundant/decorative and `anon`
-- silently kept access via PUBLIC regardless. Same bug shape as
-- omega_advertisements_insert_fix.sql's finding ("a GRANT without a
-- matching restriction is toothless"), just the inverse: here a *narrowing*
-- GRANT was defeated by a *wider* grant nobody revoked, rather than an
-- INSERT policy being entirely absent.
--
-- Verified via repo-wide source-file scan (grep every supabase/*.sql for
-- `GRANT EXECUTE ON FUNCTION public.<fn>... TO <role>`) that each of these
-- 70 functions was NEVER granted to anon anywhere in this repo's history —
-- 59 were explicitly authenticated-only, 9 had no explicit grant anywhere
-- (trigger functions / internal helpers — auto_soc_alert, sync_platform_owner,
-- handle_new_user, etc. — none directly callable outside their trigger
-- context or an internal call chain), and 2
-- (compute_leaderboard_snapshot, record_health_metric) were explicitly
-- service_role-only, so those 2 also lose `authenticated` access here, not
-- just `anon` — no client, signed in or not, should ever call them directly.
--
-- Each function's actual body was checked before deciding this was safe to
-- do platform-wide: real client-facing functions that must stay callable by
-- signed-out visitors (order_stats — hall.html's public stats widget,
-- public_leaderboard, get_platform_flag, is_platform_owner, and several
-- owner-gated member-management RPCs that already internally check
-- is_platform_owner()/auth.uid() regardless of grant — approve_member,
-- grant_permanent_access, reject_member, revoke_member, complete_task,
-- log_evolution, record_interest_signal, report_client_error,
-- apply_subscription) were deliberately left untouched — they remain
-- anon-executable exactly as before. Two of the newly-restricted functions
-- were found to have a genuine real-world impact if left anon-callable:
-- `record_health_metric` (source: supabase/slo_monitoring.sql) writes
-- directly into slo_metrics/error_budget_policy with no caller-identity
-- check at all — an anonymous caller could have poisoned the owner's SRE
-- dashboard by spoofing arbitrary good/bad request counts for any surface;
-- `compute_leaderboard_snapshot` (source: supabase/entreprise_schema_v2.sql)
-- does a full table scan + upsert across every approved profile with no
-- guard — anon could have triggered it on demand as a minor resource-
-- exhaustion vector. Both were always meant to be service_role-only per
-- their own source file's GRANT statement.
--
-- Verified post-apply via has_function_privilege() for a sample (extend_trial,
-- get_capability_health, order_stats, approve_member, record_health_metric,
-- compute_leaderboard_snapshot): every real client call path (owner actions
-- in approvals.html, hall.html's public stats widget) still resolves
-- exactly as before; only the previously-open anon path is now closed.
-- get_advisors(type='security') re-run after applying confirmed
-- anon_security_definer_function_executable dropped 84 -> 14 (exactly the
-- 70 revoked here) and authenticated_security_definer_function_executable
-- dropped 95 -> 84 (exactly the 9 no-grant + 2 service-role-only functions
-- that had no separate direct authenticated grant either, only the PUBLIC
-- default).
--
-- ----------------------------------------------------------------------------
-- PART 2 — Harden search_path on 32 functions (function_search_path_mutable)
-- ----------------------------------------------------------------------------
-- A mutable search_path on a SECURITY DEFINER function is a real
-- privilege-escalation vector: a caller able to influence the session's
-- search_path could redirect an unqualified table/function reference
-- inside the function body to a same-named object they control. Pinning
-- `SET search_path = public` on each function closes this regardless of
-- caller-controlled session state. All 32 are functions this repo's own
-- history has already verified correct/live (approve_member, extend_trial,
-- complete_task's helpers, authority_score/compute_authority, etc.) — this
-- adds hardening on top, no behavior change.
--
-- Idempotent (REVOKE is a no-op if the privilege isn't held; ALTER FUNCTION
-- ... SET is a plain overwrite), safe to re-run.
-- Applied to the live database and verified — see CLAUDE.md §8.
--
-- Deliberately NOT addressed by this migration (see CLAUDE.md §8 for why):
--   - rls_enabled_no_policy (83 tables, INFO level) — confirmed via
--     repo-wide grep that 81 of the 83 table names appear NOWHERE in this
--     repo's supabase/*.sql source; they read as an unrelated generic
--     SaaS-template schema (academy/LMS, AI workspace, billing, marketplace,
--     project/task management, team/org, etc.) that exists live on
--     production but was never created by anything in this repo. Confirmed
--     empty (0 rows) on every table sampled except `news` (1 row). RLS
--     enabled with zero policies is already the SAFE state (total lockout
--     for every non-owner role) — no fix needed or attempted; inventing
--     policies for schema this repo doesn't know the purpose of would be
--     fabricating behavior, not fixing a bug.
--   - auth_leaked_password_protection (1, WARN) — an Auth-service config
--     toggle (HaveIBeenPwned check on signup/password-change), not a SQL
--     object; requires the Supabase dashboard or Management API, out of
--     reach of apply_migration/execute_sql.
-- ============================================================================

-- PART 1a — 59 functions: source intends authenticated-only
REVOKE EXECUTE ON FUNCTION public.academy_promote(uuid,integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.academy_subscribe() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.access_audit_log(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.advance_matrix(integer,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_token(uuid,text,numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_trial_status(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.claim_daily_points() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compute_data_quality() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deactivate_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.erase_ai_memory() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.error_summary(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.evaluate_policy(text,jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.export_my_data() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.extend_trial(uuid,integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_activity_feed(integer,integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_analytics_summary(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_capability_health() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_enterprise_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_governance_health() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_task_log(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_threat_summary(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_academy_access() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.has_active_access(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_app_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_workflow_execution(text,text,text,jsonb,integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.membership_report(jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_exam_results() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_feedback() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_interest_profile(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_lattice() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_matrix() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_points_balance() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_sovereign_summary() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_subscription() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_time_sovereign() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_token_balances() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.my_trial_status() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.ping_session() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.post_dispatch(text,text,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.propose_sim_trade(uuid,integer,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.published_dispatches(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.purchase_perk(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reactivate_account() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recall_ai_context(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_sovereign_event(text,jsonb,jsonb,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.request_account_erasure() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.resolve_sim_trade(uuid,boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_contracts() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.review_reservations() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_consult_status(uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_contract_status(uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_dispatch_published(uuid,boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_platform_flag(text,boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_profile_visibility(boolean) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_reservation_status(uuid,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_exam_result(text,integer,integer,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.submit_feedback(text,integer,text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.update_consent(text,boolean,text) FROM PUBLIC;

-- PART 1b — 9 functions: no explicit GRANT found anywhere in source (trigger functions / internal-only helpers)
REVOKE EXECUTE ON FUNCTION public.auto_soc_alert() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.guard_profile_privileges() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_access_decision() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.log_task_to_feed() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_platform_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_award_exam_points() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_award_matrix_points() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trg_award_task_points() FROM PUBLIC;

-- PART 1c — 2 functions: source intends service_role-ONLY (never any client, not even authenticated)
REVOKE EXECUTE ON FUNCTION public.compute_leaderboard_snapshot() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.compute_leaderboard_snapshot() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.record_health_metric(text,bigint,bigint,integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_health_metric(text,bigint,bigint,integer) FROM authenticated;

-- PART 2 — search_path hardening on 32 functions
ALTER FUNCTION public.access_audit_log(integer) SET search_path = public;
ALTER FUNCTION public.approve_member(uuid) SET search_path = public;
ALTER FUNCTION public.authority_score(numeric,numeric,numeric) SET search_path = public;
ALTER FUNCTION public.compute_authority(numeric,numeric,numeric,boolean) SET search_path = public;
ALTER FUNCTION public.derive_cosmology() SET search_path = public;
ALTER FUNCTION public.enforce_access_defaults() SET search_path = public;
ALTER FUNCTION public.engagement_day(timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.engagement_target() SET search_path = public;
ALTER FUNCTION public.error_summary(integer) SET search_path = public;
ALTER FUNCTION public.extend_trial(uuid,integer) SET search_path = public;
ALTER FUNCTION public.get_all_members() SET search_path = public;
ALTER FUNCTION public.grant_permanent_access(uuid) SET search_path = public;
ALTER FUNCTION public.lattice_node(integer,integer,numeric,numeric,numeric) SET search_path = public;
ALTER FUNCTION public.log_access_decision() SET search_path = public;
ALTER FUNCTION public.log_evolution(text,text) SET search_path = public;
ALTER FUNCTION public.matrix_node(integer,integer,integer) SET search_path = public;
ALTER FUNCTION public.milestones_for_axis(numeric) SET search_path = public;
ALTER FUNCTION public.my_interest_profile(integer) SET search_path = public;
ALTER FUNCTION public.my_lattice() SET search_path = public;
ALTER FUNCTION public.order_stats() SET search_path = public;
ALTER FUNCTION public.protect_owner_lifetime() SET search_path = public;
ALTER FUNCTION public.public_leaderboard(integer) SET search_path = public;
ALTER FUNCTION public.record_interest_signal(text,text,text,text,numeric) SET search_path = public;
ALTER FUNCTION public.reject_member(uuid) SET search_path = public;
ALTER FUNCTION public.report_client_error(text,text,text,integer,integer,text,text,text) SET search_path = public;
ALTER FUNCTION public.revoke_member(uuid) SET search_path = public;
ALTER FUNCTION public.seal_commission() SET search_path = public;
ALTER FUNCTION public.touch_ai_memory() SET search_path = public;
ALTER FUNCTION public.track_for_sign(text) SET search_path = public;
ALTER FUNCTION public.trial_duration() SET search_path = public;
ALTER FUNCTION public.trial_length() SET search_path = public;
ALTER FUNCTION public.zodiac_from_date(date) SET search_path = public;
