begin;

create table if not exists public.omega_module_runtime_actions (
  action_id text primary key,
  module_id text not null,
  action_name text not null,
  purpose text not null,
  lifecycle text not null check (lifecycle in ('CONCEPT','SPECIFIED','DESIGNED','BUILT','INTEGRATED','TESTED','DEPLOYED','VERIFIED','SIMULATION_ONLY','BLOCKED','DEPRECATED')),
  execution_mode text not null check (execution_mode in ('READ','WRITE','WORKFLOW','SIMULATION','EXTERNAL')),
  authz text not null,
  data_class text not null,
  endpoint text not null,
  executor text not null,
  idempotency_required boolean not null default false,
  evidence_required boolean not null default true,
  rollback text not null,
  metadata jsonb not null default '{}'::jsonb,
  unique(module_id,action_name)
);

create index if not exists omega_module_runtime_actions_module_idx
  on public.omega_module_runtime_actions(module_id,lifecycle);

alter table public.omega_module_runtime_actions enable row level security;
drop policy if exists omega_module_runtime_actions_authenticated_read on public.omega_module_runtime_actions;
create policy omega_module_runtime_actions_authenticated_read
  on public.omega_module_runtime_actions
  for select to authenticated using (true);

revoke all on public.omega_module_runtime_actions from anon;
grant select on public.omega_module_runtime_actions to authenticated;
grant all on public.omega_module_runtime_actions to service_role;

insert into public.omega_module_runtime_actions
(action_id,module_id,action_name,purpose,lifecycle,execution_mode,authz,data_class,endpoint,executor,idempotency_required,evidence_required,rollback)
values
('CORE.profile.read','CORE','profile.read','Read caller identity and platform profile state','INTEGRATED','READ','SELF','PRIVATE','/api/core/profile','public.profiles',false,false,'read-only'),
('CORE.catalog.read','CORE','catalog.read','Read governed capability/product/service catalog','INTEGRATED','READ','AUTHENTICATED','INTERNAL','/api/core/catalog','omega_capabilities+omega_services',false,true,'read-only'),
('CORE.search.read','CORE','search.read','Search indexed platform surfaces without exposing private member data','DESIGNED','READ','AUTHENTICATED','INTERNAL','/api/core/search','search adapter',false,true,'read-only'),
('CONSULTANCY.intake.create','CONSULTANCY','intake.create','Create a governed consultation intake request','DESIGNED','WRITE','AUTHENTICATED','PRIVATE','/api/consultancy/intake','consultancy adapter',true,true,'cancel pending intake'),
('CONSULTANCY.cases.read','CONSULTANCY','cases.read','Read caller-owned consultation cases','DESIGNED','READ','SELF','PRIVATE','/api/consultancy/cases','consultancy adapter',false,true,'read-only'),
('CONSULTANCY.deliverables.read','CONSULTANCY','deliverables.read','Read caller-owned consultation deliverables','DESIGNED','READ','SELF','PRIVATE','/api/consultancy/deliverables','consultancy adapter',false,true,'read-only'),
('GAMING.missions.read','GAMING','missions.read','Read governed mission state','INTEGRATED','READ','SELF','PRIVATE','/api/gaming/missions','mission state',false,true,'read-only'),
('GAMING.matrix.read','GAMING','matrix.read','Read progression matrix and caller progress','INTEGRATED','READ','SELF','PRIVATE','/api/gaming/matrix','matrix runtime',false,true,'read-only'),
('GAMING.leaderboard.read','GAMING','leaderboard.read','Read published leaderboard projections','INTEGRATED','READ','AUTHENTICATED','PUBLIC_PROJECTION','/api/gaming/leaderboard','leaderboard adapter',false,true,'read-only'),
('ACHIEVEMENTS.definitions.read','ACHIEVEMENTS','definitions.read','Read active achievement definitions','INTEGRATED','READ','AUTHENTICATED','INTERNAL','/api/achievements/definitions','omega_achievement_definitions',false,true,'read-only'),
('ACHIEVEMENTS.mine.read','ACHIEVEMENTS','mine.read','Read caller achievements and verification state','INTEGRATED','READ','SELF','PRIVATE','/api/achievements/mine','omega_user_achievements',false,true,'read-only'),
('ACHIEVEMENTS.certificate.read','ACHIEVEMENTS','certificate.read','Read caller-issued certificates','INTEGRATED','READ','SELF','PRIVATE','/api/achievements/certificates','omega_certificates',false,true,'read-only'),
('FAMILY.graph.read','FAMILY','graph.read','Read caller-authorized family graph','DESIGNED','READ','SELF','SENSITIVE','/api/family/graph','family graph adapter',false,true,'read-only'),
('FAMILY.heritage.read','FAMILY','heritage.read','Read caller-authorized heritage records','DESIGNED','READ','SELF','SENSITIVE','/api/family/heritage','heritage adapter',false,true,'read-only'),
('FAMILY.vault.read','FAMILY','vault.read','Read caller-authorized private legacy vault metadata','DESIGNED','READ','SELF','SENSITIVE','/api/family/vault','legacy vault adapter',false,true,'read-only'),
('MEDIA.library.read','MEDIA','library.read','Read governed media catalog','DESIGNED','READ','AUTHENTICATED','INTERNAL','/api/media/library','media adapter',false,true,'read-only'),
('MEDIA.jobs.read','MEDIA','jobs.read','Read caller-owned media generation jobs','DESIGNED','READ','SELF','PRIVATE','/api/media/jobs','media job adapter',false,true,'read-only'),
('MEDIA.publishing.read','MEDIA','publishing.read','Read caller-authorized publishing state','DESIGNED','READ','SELF','PRIVATE','/api/media/publishing','publishing adapter',false,true,'read-only'),
('BLOCKCHAIN_NFT.assets.read','BLOCKCHAIN_NFT','assets.read','Read internal asset registry','DESIGNED','READ','AUTHENTICATED','INTERNAL','/api/blockchain/assets','asset registry adapter',false,true,'read-only'),
('BLOCKCHAIN_NFT.ownership.verify','BLOCKCHAIN_NFT','ownership.verify','Verify externally confirmed ownership proof','DESIGNED','EXTERNAL','AUTHENTICATED','PUBLIC_PROOF','/api/blockchain/ownership/verify','external-chain verification gateway',true,true,'no state mutation without signed proof'),
('BLOCKCHAIN_NFT.marketplace.read','BLOCKCHAIN_NFT','marketplace.read','Read marketplace simulation/catalog state','DESIGNED','SIMULATION','AUTHENTICATED','PUBLIC_PROJECTION','/api/blockchain/marketplace','marketplace simulation adapter',false,true,'simulation-only'),
('COMMUNICATION.notifications.read','COMMUNICATION','notifications.read','Read caller notifications','INTEGRATED','READ','SELF','PRIVATE','/api/communication/notifications','omega_notifications',false,true,'read-only'),
('COMMUNICATION.presence.read','COMMUNICATION','presence.read','Read privacy-scoped member presence','INTEGRATED','READ','SELF_OR_POLICY','SENSITIVE','/api/communication/presence','member presence adapter',false,true,'read-only'),
('COMMUNICATION.events.read','COMMUNICATION','events.read','Read caller-visible platform events','INTEGRATED','READ','SELF_OR_POLICY','INTERNAL','/api/communication/events','event fabric',false,true,'read-only'),
('HOROSCOPE.profile.read','HOROSCOPE','profile.read','Read caller birth/cosmology inputs','DESIGNED','READ','SELF','SENSITIVE','/api/horoscope/profile','profile adapter',false,true,'read-only'),
('HOROSCOPE.reading.generate','HOROSCOPE','reading.generate','Generate deterministic interpretive reading with provenance labels','DESIGNED','SIMULATION','SELF','SENSITIVE','/api/horoscope/reading','interpretive runtime',true,true,'no persistent mutation'),
('HOROSCOPE.provenance.read','HOROSCOPE','provenance.read','Read source/method provenance for an interpretive reading','DESIGNED','READ','SELF','INTERNAL','/api/horoscope/provenance','provenance registry',false,true,'read-only'),
('NEWS.feed.read','NEWS','feed.read','Read cited public-source news feed','DESIGNED','READ','AUTHENTICATED','PUBLIC_SOURCE','/api/news/feed','news adapter',false,true,'read-only'),
('NEWS.topics.read','NEWS','topics.read','Read topic/category metadata','DESIGNED','READ','AUTHENTICATED','PUBLIC_SOURCE','/api/news/topics','news adapter',false,true,'read-only'),
('NEWS.provenance.read','NEWS','provenance.read','Read source/citation provenance','DESIGNED','READ','AUTHENTICATED','PUBLIC_SOURCE','/api/news/provenance','news provenance adapter',false,true,'read-only'),
('HERITAGE.timeline.read','HERITAGE','timeline.read','Read caller legacy timeline','DESIGNED','READ','SELF','SENSITIVE','/api/heritage/timeline','heritage adapter',false,true,'read-only'),
('HERITAGE.documents.read','HERITAGE','documents.read','Read caller-authorized heritage documents','DESIGNED','READ','SELF','SENSITIVE','/api/heritage/documents','heritage storage adapter',false,true,'read-only'),
('HERITAGE.access.read','HERITAGE','access.read','Read access policy for caller heritage records','DESIGNED','READ','SELF_OR_POLICY','SENSITIVE','/api/heritage/access','heritage policy adapter',false,true,'read-only'),
('PROGRESS.matrix.read','PROGRESS','matrix.read','Read caller matrix position and verified progress','INTEGRATED','READ','SELF','PRIVATE','/api/progress/matrix','matrix runtime',false,true,'read-only'),
('PROGRESS.tasks.read','PROGRESS','tasks.read','Read caller task/completion state','INTEGRATED','READ','SELF','PRIVATE','/api/progress/tasks','task runtime',false,true,'read-only'),
('PROGRESS.verification.read','PROGRESS','verification.read','Read evidence and verification state for caller progress','INTEGRATED','READ','SELF','PRIVATE','/api/progress/verification','evidence graph',false,true,'read-only'),
('CREDENTIALS.passport.read','CREDENTIALS','passport.read','Read caller credential/passport metadata','DESIGNED','READ','SELF','PRIVATE','/api/credentials/passport','credential adapter',false,true,'read-only'),
('CREDENTIALS.certificates.read','CREDENTIALS','certificates.read','Read caller certificates','INTEGRATED','READ','SELF','PRIVATE','/api/credentials/certificates','omega_certificates',false,true,'read-only'),
('CREDENTIALS.verify.read','CREDENTIALS','verify.read','Verify a published credential by proof identifier','DESIGNED','READ','PUBLIC_PROOF','PUBLIC_PROOF','/api/credentials/verify','credential verification adapter',false,true,'read-only'),
('LEGAL.terms.read','LEGAL','terms.read','Read current terms version','DESIGNED','READ','PUBLIC','PUBLIC','/api/legal/terms','legal content',false,true,'read-only'),
('LEGAL.privacy.read','LEGAL','privacy.read','Read current privacy version','DESIGNED','READ','PUBLIC','PUBLIC','/api/legal/privacy','legal content',false,true,'read-only'),
('LEGAL.consent.read','LEGAL','consent.read','Read caller consent state','DESIGNED','READ','SELF','SENSITIVE','/api/legal/consent','consent records',false,true,'read-only'),
('ELEMENTAL.cosmology.read','ELEMENTAL','cosmology.read','Read deterministic cosmology mapping','SIMULATION_ONLY','SIMULATION','AUTHENTICATED','INTERPRETIVE','/api/elemental/cosmology','cosmology runtime',false,true,'no external effect'),
('ELEMENTAL.simulation.run','ELEMENTAL','simulation.run','Run a bounded deterministic simulation','SIMULATION_ONLY','SIMULATION','AUTHENTICATED','SIMULATION','/api/elemental/simulation','simulation runtime',true,true,'discard simulation state'),
('ELEMENTAL.interpretation.read','ELEMENTAL','interpretation.read','Read interpretive elemental content','SIMULATION_ONLY','SIMULATION','AUTHENTICATED','INTERPRETIVE','/api/elemental/interpretation','interpretive runtime',false,true,'no external effect'),
('INVESTMENT.watchlist.read','INVESTMENT','watchlist.read','Read caller watchlist','DESIGNED','READ','SELF','PRIVATE','/api/investment/watchlist','investment adapter',false,true,'read-only'),
('INVESTMENT.research.read','INVESTMENT','research.read','Read cited market research','DESIGNED','READ','AUTHENTICATED','PUBLIC_SOURCE','/api/investment/research','research adapter',false,true,'read-only'),
('INVESTMENT.simulation.read','INVESTMENT','simulation.read','Read caller portfolio simulation state','DESIGNED','SIMULATION','SELF','SIMULATION','/api/investment/simulation','simulation adapter',false,true,'simulation-only'),
('INTELLIGENCE.evidence.read','INTELLIGENCE','evidence.read','Read caller evidence graph','INTEGRATED','READ','SELF','PRIVATE','/api/intelligence/evidence','graph_evidence',false,true,'read-only'),
('INTELLIGENCE.agents.read','INTELLIGENCE','agents.read','Read governed agent registry and policy metadata','INTEGRATED','READ','AUTHENTICATED','INTERNAL','/api/intelligence/agents','omega_agents',false,true,'read-only'),
('INTELLIGENCE.retrieval.read','INTELLIGENCE','retrieval.read','Read provenance-aware knowledge retrieval results','INTEGRATED','READ','AUTHENTICATED','INTERNAL','/api/intelligence/retrieval','retrieval adapter',false,true,'read-only'),
('HIERARCHY.roles.read','HIERARCHY','roles.read','Read caller role and entitlement projection','DESIGNED','READ','SELF','PRIVATE','/api/hierarchy/roles','role registry',false,true,'read-only'),
('HIERARCHY.entitlements.read','HIERARCHY','entitlements.read','Read caller active entitlements','DESIGNED','READ','SELF','PRIVATE','/api/hierarchy/entitlements', 'omega_entitlements',false,true,'read-only'),
('HIERARCHY.governance.read','HIERARCHY','governance.read','Read caller-visible governance decisions/audit metadata','DESIGNED','READ','POLICY','INTERNAL','/api/hierarchy/governance','governance audit',false,true,'read-only')
on conflict(module_id,action_name) do update set
  purpose=excluded.purpose,lifecycle=excluded.lifecycle,execution_mode=excluded.execution_mode,
  authz=excluded.authz,data_class=excluded.data_class,endpoint=excluded.endpoint,
  executor=excluded.executor,idempotency_required=excluded.idempotency_required,
  evidence_required=excluded.evidence_required,rollback=excluded.rollback,metadata=excluded.metadata;

create or replace function public.omega_runtime_manifest(p_module_id text default null)
returns jsonb language sql security invoker set search_path='' stable as $$
select jsonb_build_object('generated_at',pg_catalog.now(),'modules',coalesce((
 select jsonb_agg(jsonb_build_object('module_id',x.module_id,'actions',x.actions) order by x.module_id)
 from (
   select module_id,jsonb_agg(jsonb_build_object(
     'action_id',action_id,'action_name',action_name,'purpose',purpose,'lifecycle',lifecycle,
     'execution_mode',execution_mode,'authz',authz,'data_class',data_class,'endpoint',endpoint,
     'executor',executor,'idempotency_required',idempotency_required,'evidence_required',evidence_required,
     'rollback',rollback) order by action_name) actions
   from public.omega_module_runtime_actions
   where p_module_id is null or module_id=p_module_id
   group by module_id
 ) x
),'[]'::jsonb));
$$;
revoke all on function public.omega_runtime_manifest(text) from public,anon,authenticated;
grant execute on function public.omega_runtime_manifest(text) to service_role;

create or replace function public.omega_runtime_dispatch(p_actor_user_id uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_result jsonb; v_referral_code text; v_attribution_id uuid; v_task_id uuid; v_module text;
begin
 if p_actor_user_id is null then raise exception 'actor_required'; end if;
 case p_action
  when 'catalog' then v_result:=public.omega_runtime_manifest(null);
  when 'module_manifest' then
    v_module:=nullif(pg_catalog.trim(p_payload->>'module_id'),'');
    if v_module is null then raise exception 'module_required'; end if;
    v_result:=public.omega_runtime_manifest(v_module);
  when 'module_state' then
    v_module:=nullif(pg_catalog.trim(p_payload->>'module_id'),'');
    if v_module is null then raise exception 'module_required'; end if;
    v_result:=jsonb_build_object('module_id',v_module,'actions',coalesce((select jsonb_agg(to_jsonb(a) order by a.action_name) from public.omega_module_runtime_actions a where a.module_id=v_module),'[]'::jsonb));
  when 'issue_referral_code' then
    v_referral_code:=omega_private.issue_referral_code(p_actor_user_id,nullif(pg_catalog.trim(p_payload->>'requested_code'),''));
    v_result:=jsonb_build_object('referral_code',v_referral_code);
  when 'attribute_referral' then
    v_attribution_id:=omega_private.attribute_referral(p_payload->>'referral_code',p_actor_user_id,nullif(p_payload->>'source_click_id','')::uuid);
    v_result:=jsonb_build_object('attribution_id',v_attribution_id);
  when 'enqueue_agent_task' then
    v_task_id:=omega_private.enqueue_agent_task(p_actor_user_id,p_payload->>'agent_id',p_payload->>'task_type',coalesce(p_payload->'input','{}'::jsonb),p_payload->>'idempotency_key',coalesce((p_payload->>'approval_required')::boolean,true));
    v_result:=jsonb_build_object('task_id',v_task_id);
  else raise exception 'runtime_action_not_allowed';
 end case;
 perform omega_private.record_platform_event('action_completed',p_actor_user_id,'user','omega-runtime-gateway','runtime:'||p_action||':'||md5(coalesce(p_payload::text,'{}')),pg_catalog.gen_random_uuid(),'runtime_action',p_action,p_payload);
 return v_result;
end $$;
revoke all on function public.omega_runtime_dispatch(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.omega_runtime_dispatch(uuid,text,jsonb) to service_role;
commit;
