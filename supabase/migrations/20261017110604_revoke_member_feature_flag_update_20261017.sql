-- Ω SYD OMEGA 91717 — no client role may edit member_feature_flags
-- authenticated held UPDATE (20260911222734). Policy member_feature_flags_update
-- (USING is_platform_owner()) meant only the owner's updates ever touched a row
-- — measured live 2026-10-17 by impersonation: a member's update of their own
-- flag 0 rows, the owner's 1 row — so members could not edit flags. Owner
-- decision: remove the client write path entirely, so loosening that policy
-- later cannot open it. Flags are written by product-orchestrator through
-- service_role (20261017104020), which this does not touch; no page writes them.
--
-- The policy is kept, deliberately inert, and says so on itself: a policy
-- with no GRANT is the §8.1 class 6c shape, and the fix here is NOT to grant
-- UPDATE back.

begin;

revoke update on table public.member_feature_flags from anon, authenticated;

comment on policy member_feature_flags_update on public.member_feature_flags is
  'Inert by design since 20261017: authenticated has no UPDATE grant. Flags are written by service_role only (product-orchestrator). Do not re-grant UPDATE to make this policy run.';

commit;
