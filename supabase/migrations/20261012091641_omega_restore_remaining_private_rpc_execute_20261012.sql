-- Ω SYD OMEGA 91717
-- Restore EXECUTE on 19 more private implementations behind public invoker wrappers
-- 2026-10-12
--
-- Same defect as 20261012064126 (see its header): each public.<fn> is a SECURITY
-- INVOKER wrapper granted to authenticated, calling a private.<fn> that authenticated
-- may not EXECUTE, so every call failed 42501. No client page calls these today; they
-- are the rest of surfaces already partly live -- the Creation Layer lifecycle
-- (update project/asset, experiences and runs), owner console actions, certificates
-- and knowledge search/ingest -- so the first page to call them works.
--
-- Each body was read live 2026-10-12 before granting:
--   owner + aal2:      grant_trial_access, revoke_permanent_access, set_consult_status,
--                      set_contract_status, set_dispatch_published, set_reservation_status,
--                      omega_issue_certificate, omega_revoke_certificate
--   owner only:        omega_knowledge_ingest_document (and source must be 'approved')
--   caller's own rows: omega_update_creative_project, omega_update_creative_asset,
--                      omega_create_experience, omega_update_experience,
--                      omega_publish_experience, omega_start_experience_run (published
--                      experiences only), omega_step_experience_run,
--                      omega_abandon_experience_run
--   authenticated read: omega_knowledge_search (approved sources), omega_verify_certificate
--                      (status by number, 8-char subject ref)
--
-- Deliberately NOT restored (GAP_ANALYSIS.md S): omega_transition_mission_task (a member
-- can move their own task to verified/completed -- evidence checking needs review
-- first), purchase_perk (spends points: a product decision), submit_exam_result
-- (disabled legacy path by design), is_app_owner (no caller).

grant execute on function private.grant_trial_access(p_uid uuid) to authenticated;
grant execute on function private.omega_abandon_experience_run(p_run_id uuid) to authenticated;
grant execute on function private.omega_create_experience(p_project_id uuid, p_slug text, p_name text, p_experience_type text, p_rules jsonb, p_content jsonb) to authenticated;
grant execute on function private.omega_issue_certificate(p_user_id uuid, p_achievement_id text, p_certificate_number text, p_metadata jsonb) to authenticated;
grant execute on function private.omega_knowledge_ingest_document(p_source_id uuid, p_title text, p_content text, p_provenance jsonb, p_chunk_chars integer) to authenticated;
grant execute on function private.omega_knowledge_search(p_query text, p_limit integer) to authenticated;
grant execute on function private.omega_publish_experience(p_experience_id uuid) to authenticated;
grant execute on function private.omega_revoke_certificate(p_certificate_id uuid, p_reason text) to authenticated;
grant execute on function private.omega_start_experience_run(p_experience_id uuid) to authenticated;
grant execute on function private.omega_step_experience_run(p_run_id uuid, p_state_patch jsonb) to authenticated;
grant execute on function private.omega_update_creative_asset(p_asset_id uuid, p_title text, p_prompt text, p_license text, p_metadata jsonb) to authenticated;
grant execute on function private.omega_update_creative_project(p_project_id uuid, p_name text, p_description text, p_project_type text, p_metadata jsonb) to authenticated;
grant execute on function private.omega_update_experience(p_experience_id uuid, p_name text, p_rules jsonb, p_content jsonb) to authenticated;
grant execute on function private.omega_verify_certificate(p_certificate_number text) to authenticated;
grant execute on function private.revoke_permanent_access(p_uid uuid) to authenticated;
grant execute on function private.set_consult_status(p_id uuid, p_status text) to authenticated;
grant execute on function private.set_contract_status(p_id uuid, p_status text) to authenticated;
grant execute on function private.set_dispatch_published(p_id bigint, p_pub boolean) to authenticated;
grant execute on function private.set_reservation_status(p_id uuid, p_status text) to authenticated;
