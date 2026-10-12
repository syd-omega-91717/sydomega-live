-- Ω SYD OMEGA 91717
-- Restore EXECUTE on the private implementations behind 12 client-called RPCs
-- 2026-10-12
--
-- WHY: every public.<fn> below is a SECURITY INVOKER SQL wrapper that runs
-- `select private.<fn>(...)` as the caller. Migrations 20261006193000,
-- 20261006201000, 20261007001000, 20261007002000 and 20261008032308 revoked
-- EXECUTE on the private.<fn> from authenticated while granting the public
-- wrapper to authenticated, and 20261007120000 re-granted only the wrappers.
-- An invoker wrapper cannot call what its caller may not execute, so every one
-- of these failed 42501 "permission denied for function" for every member and
-- for the owner -- measured live 2026-10-12 by impersonating the owner at aal2:
-- public.revoke_member(...) -> ERR 42501 permission denied for function revoke_member.
--
-- Broken surfaces: approvals.js (approve / grant permanent / revoke / KYC review /
-- KYC intake switch), settings.html (delete account), profile.html (KYC submit),
-- interface-omni.html (platform flag), omega-creation-studio.js (create project /
-- asset / provider job), omega-intel-fabric.js (hybrid knowledge search).
--
-- SAFETY: each private.<fn> is SECURITY DEFINER and authorizes the caller itself
-- (read live 2026-10-12): owner actions check is_platform_owner() AND aal2;
-- member actions scope every write to auth.uid() (delete_account, submit_kyc and
-- omega_submit_provider_job also require aal2). Granting EXECUTE to authenticated
-- is the repo's standard bridge (cf. private.reject_member, private.extend_trial,
-- 20261012014343) and adds no capability the wrappers do not already advertise.
-- anon stays denied.

grant execute on function private.approve_member(uuid) to authenticated;
grant execute on function private.grant_permanent_access(uuid) to authenticated;
grant execute on function private.revoke_member(uuid) to authenticated;
grant execute on function private.review_kyc(uuid, text) to authenticated;
grant execute on function private.owner_set_kyc_intake(boolean) to authenticated;
grant execute on function private.set_platform_flag(text, boolean) to authenticated;
grant execute on function private.delete_account() to authenticated;
grant execute on function private.submit_kyc(text, boolean) to authenticated;
grant execute on function private.omega_create_creative_project(text, text, text, jsonb) to authenticated;
grant execute on function private.omega_create_creative_asset(uuid, uuid, text, text, text, text, jsonb) to authenticated;
grant execute on function private.omega_submit_provider_job(text, text, uuid, jsonb) to authenticated;
grant execute on function private.omega_knowledge_hybrid_search(text, text, integer) to authenticated;
