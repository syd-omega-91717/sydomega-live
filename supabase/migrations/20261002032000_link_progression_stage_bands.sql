begin;
update public.omega_matrix_node_semantics
set reward_policy = case stage_band
  when 'SEEKER_FOUNDATION' then jsonb_build_object('achievement_id','omega.stage.initiate','requires_verified_progress',true,'no_auto_award',true)
  when 'INITIATE_AGENTIC_DELEGATION' then jsonb_build_object('achievement_id','omega.stage.architect','requires_verified_progress',true,'no_auto_award',true)
  when 'SOVEREIGN_TOTAL_CAPABILITY' then jsonb_build_object('achievement_id','omega.stage.prime','requires_verified_progress',true,'no_auto_award',true)
  else reward_policy
end,
source_refs = case
  when source_refs @> jsonb_build_array('999 Blueprint: 9-Stage Astrological Matrix') then source_refs
  else source_refs || jsonb_build_array('999 Blueprint: 9-Stage Astrological Matrix')
end
where stage_band in ('SEEKER_FOUNDATION','INITIATE_AGENTIC_DELEGATION','SOVEREIGN_TOTAL_CAPABILITY');
commit;