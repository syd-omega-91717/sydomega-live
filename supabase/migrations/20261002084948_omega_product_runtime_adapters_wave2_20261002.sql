begin;

create index if not exists consult_requests_user_created_idx on public.consult_requests(user_id,created_at desc);
create index if not exists family_nodes_user_created_idx on public.family_nodes(user_id,created_at desc);
create index if not exists heritage_records_user_created_idx on public.heritage_records(user_id,created_at desc);
create index if not exists publications_user_created_idx on public.publications(user_id,created_at desc);
create index if not exists user_assets_user_created_idx on public.user_assets(user_id,created_at desc);
create index if not exists consent_records_user_idx on public.consent_records(user_id,granted_at desc);
create index if not exists research_hypotheses_user_created_idx on public.research_hypotheses(user_id,created_at desc);
create index if not exists search_index_owner_updated_idx on public.search_index(owner_id,updated_at desc);

update public.omega_module_runtime_actions
set lifecycle='INTEGRATED'
where (module_id,action_name) in (
 ('CONSULTANCY','cases.read'),('CONSULTANCY','deliverables.read'),
 ('FAMILY','graph.read'),('FAMILY','heritage.read'),('FAMILY','vault.read'),
 ('MEDIA','library.read'),('MEDIA','publishing.read'),
 ('BLOCKCHAIN_NFT','assets.read'),('BLOCKCHAIN_NFT','marketplace.read'),
 ('COMMUNICATION','presence.read'),('COMMUNICATION','events.read'),
 ('GAMING','leaderboard.read'),
 ('NEWS','feed.read'),('NEWS','topics.read'),('NEWS','provenance.read'),
 ('HERITAGE','timeline.read'),('HERITAGE','documents.read'),('HERITAGE','access.read'),
 ('LEGAL','consent.read'),('INVESTMENT','research.read'),('INVESTMENT','simulation.read'),
 ('HIERARCHY','roles.read')
);

create or replace function public.omega_runtime_dispatch(p_actor_user_id uuid,p_action text,p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
 v_result jsonb; v_referral_code text; v_attribution_id uuid; v_task_id uuid;
 v_module text; v_action_name text; v_lifecycle text;
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
  when 'module_read' then
    v_module:=nullif(pg_catalog.trim(p_payload->>'module_id'),'');
    v_action_name:=nullif(pg_catalog.trim(p_payload->>'action_name'),'');
    if v_module is null or v_action_name is null then raise exception 'module_and_action_required'; end if;
    select a.lifecycle into v_lifecycle from public.omega_module_runtime_actions a where a.module_id=v_module and a.action_name=v_action_name;
    if v_lifecycle is null then raise exception 'module_action_not_registered'; end if;

    if v_module='CORE' and v_action_name='profile.read' then
      select jsonb_build_object('id',p.id,'display_name',p.display_name,'sign',p.sign,'element',p.element,'membership_tier',p.membership_tier,'subscription_status',p.subscription_status,'axis_a',p.axis_a,'axis_b',p.axis_b,'axis_c',p.axis_c,'matrix_phase',p.matrix_phase,'matrix_track',p.matrix_track,'node_index',p.node_index,'is_owner',p.is_owner,'access_approved',p.access_approved) into v_result from public.profiles p where p.id=p_actor_user_id;
    elsif v_module='CORE' and v_action_name='catalog.read' then
      select jsonb_build_object('capabilities',count(*),'services',(select count(*) from public.omega_services),'active_services',(select count(*) from public.omega_services where status in ('INTEGRATED','TESTED','DEPLOYED','VERIFIED')),'runtime_actions',(select count(*) from public.omega_module_runtime_actions)) into v_result from public.omega_capabilities;
    elsif v_module='CORE' and v_action_name='search.read' then
      select coalesce(jsonb_agg(to_jsonb(s) order by s.updated_at desc),'[]'::jsonb) into v_result from (select entity_type,entity_id,title,body,keywords,updated_at from public.search_index where owner_id is null or owner_id=p_actor_user_id order by updated_at desc limit 50)s;
    elsif v_module in ('GAMING','PROGRESS') and v_action_name='matrix.read' then
      select jsonb_build_object('nodes',(select count(*) from public.omega_matrix_nodes),'semantic_nodes',(select count(*) from public.omega_matrix_node_semantics),'current_profile',(select jsonb_build_object('axis_a',p.axis_a,'axis_b',p.axis_b,'axis_c',p.axis_c,'node_index',p.node_index,'matrix_phase',p.matrix_phase,'matrix_track',p.matrix_track) from public.profiles p where p.id=p_actor_user_id)) into v_result;
    elsif v_module='GAMING' and v_action_name='leaderboard.read' then
      select coalesce(jsonb_agg(to_jsonb(l) order by l.rank_global nulls last),'[]'::jsonb) into v_result from (select snapshot_date,rank_global,rank_track,rank_element,authority,display_name,sign,tier,track_id,element,is_owner from public.leaderboard_snapshots order by snapshot_date desc,rank_global nulls last limit 100)l;
    elsif v_module='ACHIEVEMENTS' and v_action_name='definitions.read' then
      select coalesce(jsonb_agg(to_jsonb(d) order by d.achievement_id),'[]'::jsonb) into v_result from public.omega_achievement_definitions d where d.lifecycle='active';
    elsif v_module='ACHIEVEMENTS' and v_action_name='mine.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.achievement_id),'[]'::jsonb) into v_result from public.omega_user_achievements a where a.user_id=p_actor_user_id;
    elsif v_module='ACHIEVEMENTS' and v_action_name='certificate.read' then
      select coalesce(jsonb_agg(to_jsonb(c) order by c.issued_at desc),'[]'::jsonb) into v_result from public.omega_certificates c where c.user_id=p_actor_user_id;
    elsif v_module='CONSULTANCY' and v_action_name='cases.read' then
      select jsonb_build_object('requests',coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at desc) from (select id,domain,message,status,created_at,urgency,preferred_time from public.consult_requests where user_id=p_actor_user_id order by created_at desc limit 50)c),'[]'::jsonb),'bookings',coalesce((select jsonb_agg(to_jsonb(b) order by b.created_at desc) from (select id,domain,title,status,scheduled_at,duration_min,price_omega,created_at from public.expert_bookings where client_id=p_actor_user_id or expert_id=p_actor_user_id order by created_at desc limit 50)b),'[]'::jsonb)) into v_result;
    elsif v_module='CONSULTANCY' and v_action_name='deliverables.read' then
      select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc),'[]'::jsonb) into v_result from (select id,kind,title,created_at,file_path,status from public.publications where user_id=p_actor_user_id order by created_at desc limit 50)p;
    elsif v_module='FAMILY' and v_action_name='graph.read' then
      select coalesce(jsonb_agg(to_jsonb(f) order by f.created_at),'[]'::jsonb) into v_result from (select id,name,relation,sign,is_heir,created_at from public.family_nodes where user_id=p_actor_user_id order by created_at)f;
    elsif v_module='FAMILY' and v_action_name='heritage.read' then
      select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc),'[]'::jsonb) into v_result from (select id,title,body,era,category,created_at from public.heritage_records where user_id=p_actor_user_id order by created_at desc limit 100)h;
    elsif v_module='FAMILY' and v_action_name='vault.read' then
      select jsonb_build_object('heritage_record_count',count(*),'family_node_count',(select count(*) from public.family_nodes where user_id=p_actor_user_id),'privacy','caller_scoped') into v_result from public.heritage_records where user_id=p_actor_user_id;
    elsif v_module='MEDIA' and v_action_name='library.read' then
      select coalesce(jsonb_agg(to_jsonb(m) order by m.sort_order nulls last,m.created_at desc),'[]'::jsonb) into v_result from (select id,media_type,title,subtitle,description,olympian,track_id,element,duration_min,thumbnail_url,video_url,phase,sort_order from public.media_items where status='published' order by sort_order nulls last,created_at desc limit 100)m;
    elsif v_module='MEDIA' and v_action_name='publishing.read' then
      select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc),'[]'::jsonb) into v_result from (select id,kind,title,status,created_at,file_path from public.publications where user_id=p_actor_user_id order by created_at desc limit 100)p;
    elsif v_module='BLOCKCHAIN_NFT' and v_action_name='assets.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) into v_result from (select id,name,quantity,asset_type,track_name,created_at from public.user_assets where user_id=p_actor_user_id order by created_at desc limit 100)a;
    elsif v_module='BLOCKCHAIN_NFT' and v_action_name='marketplace.read' then
      select coalesce(jsonb_agg(to_jsonb(m) order by m.created_at desc),'[]'::jsonb) into v_result from (select id,title,kind,price_omega,description,status,created_at from public.marketplace_listings where status in ('published','active','available') order by created_at desc limit 100)m;
    elsif v_module='COMMUNICATION' and v_action_name='notifications.read' then
      select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc),'[]'::jsonb) into v_result from (select * from public.omega_notifications where user_id=p_actor_user_id order by created_at desc limit 100)n;
    elsif v_module='COMMUNICATION' and v_action_name='presence.read' then
      select coalesce(jsonb_agg(to_jsonb(p) order by p.last_seen_at desc),'[]'::jsonb) into v_result from (select * from public.member_presence where user_id=p_actor_user_id order by last_seen_at desc limit 20)p;
    elsif v_module='COMMUNICATION' and v_action_name='events.read' then
      select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) into v_result from (select * from public.omega_platform_events where user_id=p_actor_user_id order by created_at desc limit 100)e;
    elsif v_module='INTELLIGENCE' and v_action_name='agents.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.agent_id),'[]'::jsonb) into v_result from public.omega_agents a;
    elsif v_module='INTELLIGENCE' and v_action_name='evidence.read' then
      select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) into v_result from (select * from public.graph_evidence where user_id=p_actor_user_id order by created_at desc limit 100)e;
    elsif v_module='CREDENTIALS' and v_action_name='certificates.read' then
      select coalesce(jsonb_agg(to_jsonb(c) order by c.issued_at desc),'[]'::jsonb) into v_result from public.omega_certificates c where c.user_id=p_actor_user_id;
    elsif v_module='HIERARCHY' and v_action_name='roles.read' then
      select jsonb_build_object('membership_tier',p.membership_tier,'subscription_tier',p.subscription_tier,'subscription_status',p.subscription_status,'is_owner',p.is_owner,'access_approved',p.access_approved) into v_result from public.profiles p where p.id=p_actor_user_id;
    elsif v_module='HIERARCHY' and v_action_name='entitlements.read' then
      select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) into v_result from public.omega_entitlements e where e.user_id=p_actor_user_id;
    elsif v_module='HOROSCOPE' and v_action_name='profile.read' then
      select jsonb_build_object('sign',p.sign,'element',p.element,'planet',p.planet,'god',p.god,'birth_date',p.birth_date,'country',p.country) into v_result from public.profiles p where p.id=p_actor_user_id;
    elsif v_module='NEWS' and v_action_name='feed.read' then
      select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc),'[]'::jsonb) into v_result from (select id,title,body,category,created_at from public.news where is_published=true order by created_at desc limit 100)n;
    elsif v_module='NEWS' and v_action_name='topics.read' then
      select coalesce(jsonb_agg(jsonb_build_object('category',category,'count',count) order by category),'[]'::jsonb) into v_result from (select category,count(*) from public.news where is_published=true group by category)n(category,count);
    elsif v_module='NEWS' and v_action_name='provenance.read' then
      select coalesce(jsonb_agg(jsonb_build_object('id',id,'title',title,'category',category,'published',is_published,'created_at',created_at) order by created_at desc),'[]'::jsonb) into v_result from (select id,title,category,is_published,created_at from public.news order by created_at desc limit 100)n;
    elsif v_module='HERITAGE' and v_action_name='timeline.read' then
      select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc),'[]'::jsonb) into v_result from (select id,title,body,era,category,created_at from public.heritage_records where user_id=p_actor_user_id order by created_at desc limit 100)h;
    elsif v_module='HERITAGE' and v_action_name='documents.read' then
      select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc),'[]'::jsonb) into v_result from (select id,title,category,era,created_at from public.heritage_records where user_id=p_actor_user_id order by created_at desc limit 100)h;
    elsif v_module='HERITAGE' and v_action_name='access.read' then
      select jsonb_build_object('user_id',p_actor_user_id,'record_count',count(*),'access','caller_scoped') into v_result from public.heritage_records where user_id=p_actor_user_id;
    elsif v_module='LEGAL' and v_action_name='consent.read' then
      select coalesce(jsonb_agg(to_jsonb(c) order by c.granted_at desc),'[]'::jsonb) into v_result from public.consent_records c where c.user_id=p_actor_user_id;
    elsif v_module='INVESTMENT' and v_action_name='research.read' then
      select coalesce(jsonb_agg(to_jsonb(h) order by h.created_at desc),'[]'::jsonb) into v_result from (select id,domain,title,body,created_at from public.research_hypotheses where user_id=p_actor_user_id order by created_at desc limit 100)h;
    elsif v_module='INVESTMENT' and v_action_name='simulation.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.created_at desc),'[]'::jsonb) into v_result from (select id,name,quantity,asset_type,track_name,created_at from public.user_assets where user_id=p_actor_user_id and lower(coalesce(asset_type,'')) like '%simulation%' order by created_at desc limit 100)a;
    elsif v_module='ELEMENTAL' then
      select jsonb_build_object('mode','interpretive_simulation','element',p.element,'sign',p.sign,'planet',p.planet,'disclaimer','Interpretive/simulation content only; not verified prediction or physical-world fact.') into v_result from public.profiles p where p.id=p_actor_user_id;
    else
      v_result:=jsonb_build_object('implementation_status',case when v_lifecycle in ('INTEGRATED','TESTED','DEPLOYED','VERIFIED') then 'ADAPTER_REQUIRED' else 'CONTRACT_ONLY' end,'module_id',v_module,'action_name',v_action_name,'lifecycle',v_lifecycle,'message','The runtime contract is registered, but this module action has not been promoted to a server data adapter yet. No synthetic business data is returned.');
    end if;
    v_result:=jsonb_build_object('module_id',v_module,'action_name',v_action_name,'lifecycle',v_lifecycle,'data',coalesce(v_result,'{}'::jsonb));
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
