begin;

insert into public.omega_achievement_definitions(
  achievement_id,version,title,description,achievement_type,verification_rule,reward_policy,lifecycle
) values
(
  'omega.stage.initiate',1,'Initiate / Seeker',
  'Digital progression credential for the governed 1–3 stage band described by the SYD OMEGA progression source.',
  'stage',
  jsonb_build_object('stage_min',1,'stage_max',3,'requires_verified_progress',true,'requires_evidence',true,'source_refs',jsonb_build_array('999 Blueprint: 9-Stage Astrological Matrix')),
  jsonb_build_object('digital_badge','Silver Nebula','certificate','Certificate of Orientation','physical_claim',false),
  'active'
),
(
  'omega.stage.architect',1,'Architect / Sovereign',
  'Digital progression credential for the governed 4–6 stage band described by the SYD OMEGA progression source.',
  'stage',
  jsonb_build_object('stage_min',4,'stage_max',6,'requires_verified_progress',true,'requires_evidence',true,'source_refs',jsonb_build_array('999 Blueprint: 9-Stage Astrological Matrix')),
  jsonb_build_object('digital_badge','Golden Zenith','certificate','Certificate of Sovereign Control','physical_claim',false),
  'active'
),
(
  'omega.stage.prime',1,'Omega Prime',
  'Digital progression credential for the governed 7–9 stage band described by the SYD OMEGA progression source.',
  'stage',
  jsonb_build_object('stage_min',7,'stage_max',9,'requires_verified_progress',true,'requires_evidence',true,'source_refs',jsonb_build_array('999 Blueprint: 9-Stage Astrological Matrix')),
  jsonb_build_object('digital_badge','Infinite Black Omega','certificate','Master Class 999 Certificate','physical_claim',false),
  'active'
)
on conflict (achievement_id) do update set
  version=excluded.version,title=excluded.title,description=excluded.description,
  verification_rule=excluded.verification_rule,reward_policy=excluded.reward_policy,
  lifecycle=excluded.lifecycle,updated_at=now();

update public.omega_matrix_node_semantics
set reward_policy = case stage_band
  when '1-3' then jsonb_build_object('achievement_id','omega.stage.initiate','requires_verified_progress',true,'no_auto_award',true)
  when '4-6' then jsonb_build_object('achievement_id','omega.stage.architect','requires_verified_progress',true,'no_auto_award',true)
  when '7-9' then jsonb_build_object('achievement_id','omega.stage.prime','requires_verified_progress',true,'no_auto_award',true)
  else reward_policy
end,
source_refs = source_refs || jsonb_build_array('999 Blueprint: 9-Stage Astrological Matrix')
where stage_band in ('1-3','4-6','7-9');

commit;