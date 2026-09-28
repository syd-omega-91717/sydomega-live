-- Ω SYD OMEGA 91717 — mission-state foreign-key indexes
-- Covers Supabase performance advisor findings for the mission-state foundation.

create index if not exists omega_member_mission_state_mission_id_idx
  on public.omega_member_mission_state (mission_id);

create index if not exists omega_member_quest_state_current_mission_id_idx
  on public.omega_member_quest_state (current_mission_id);

create index if not exists omega_member_quest_state_quest_id_idx
  on public.omega_member_quest_state (quest_id);

create index if not exists omega_mission_transitions_event_id_idx
  on public.omega_mission_transitions (event_id);

create index if not exists omega_mission_transitions_member_mission_id_idx
  on public.omega_mission_transitions (member_mission_id);

create index if not exists omega_quest_missions_mission_id_idx
  on public.omega_quest_missions (mission_id);
