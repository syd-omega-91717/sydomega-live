-- Read grants for four member-read tables shipped 2026-10-06 with SELECT
-- policies but no GRANT (CLAUDE.md §8.1 class 6c). Default table privileges
-- were revoked by 20260903015535_harden_future_defaults_and_rls, so each
-- policy was unreachable. Measured live 2026-10-06 as a member:
--   omega_member_mission_task_surface() -> 42501 permission denied for table
--   omega_member_mission_tasks
-- which breaks omega-mission-board.js for every member.
--
-- SELECT only, matching the policies: every write to the mission tables goes
-- through the security-definer private.omega_transition_mission_task, and
-- omega_knowledge_documents is written by governed ingestion, not clients.
begin;
grant select on public.omega_member_mission_tasks to authenticated;
grant select on public.omega_mission_tasks to authenticated;
grant select on public.omega_mission_task_transitions to authenticated;
grant select on public.omega_knowledge_documents to authenticated;
commit;
