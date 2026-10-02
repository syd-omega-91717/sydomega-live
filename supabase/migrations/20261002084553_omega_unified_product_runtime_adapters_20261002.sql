begin;

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
    elsif v_module in ('GAMING','PROGRESS') and v_action_name='matrix.read' then
      select jsonb_build_object('nodes',(select count(*) from public.omega_matrix_nodes),'semantic_nodes',(select count(*) from public.omega_matrix_node_semantics),'current_profile',(select jsonb_build_object('axis_a',p.axis_a,'axis_b',p.axis_b,'axis_c',p.axis_c,'node_index',p.node_index,'matrix_phase',p.matrix_phase,'matrix_track',p.matrix_track) from public.profiles p where p.id=p_actor_user_id)) into v_result;
    elsif v_module='ACHIEVEMENTS' and v_action_name='definitions.read' then
      select coalesce(jsonb_agg(to_jsonb(d) order by d.achievement_id),'[]'::jsonb) into v_result from public.omega_achievement_definitions d where d.lifecycle='active';
    elsif v_module='ACHIEVEMENTS' and v_action_name='mine.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.achievement_id),'[]'::jsonb) into v_result from public.omega_user_achievements a where a.user_id=p_actor_user_id;
    elsif v_module='ACHIEVEMENTS' and v_action_name='certificate.read' then
      select coalesce(jsonb_agg(to_jsonb(c) order by c.issued_at desc),'[]'::jsonb) into v_result from public.omega_certificates c where c.user_id=p_actor_user_id;
    elsif v_module='COMMUNICATION' and v_action_name='notifications.read' then
      select coalesce(jsonb_agg(to_jsonb(n) order by n.created_at desc),'[]'::jsonb) into v_result from (select * from public.omega_notifications where user_id=p_actor_user_id order by created_at desc limit 100) n;
    elsif v_module='INTELLIGENCE' and v_action_name='agents.read' then
      select coalesce(jsonb_agg(to_jsonb(a) order by a.agent_id),'[]'::jsonb) into v_result from public.omega_agents a;
    elsif v_module='INTELLIGENCE' and v_action_name='evidence.read' then
      select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) into v_result from (select * from public.graph_evidence where user_id=p_actor_user_id order by created_at desc limit 100) e;
    elsif v_module='CREDENTIALS' and v_action_name='certificates.read' then
      select coalesce(jsonb_agg(to_jsonb(c) order by c.issued_at desc),'[]'::jsonb) into v_result from public.omega_certificates c where c.user_id=p_actor_user_id;
    elsif v_module='HIERARCHY' and v_action_name='entitlements.read' then
      select coalesce(jsonb_agg(to_jsonb(e) order by e.created_at desc),'[]'::jsonb) into v_result from public.omega_entitlements e where e.user_id=p_actor_user_id;
    elsif v_module='HOROSCOPE' and v_action_name='profile.read' then
      select jsonb_build_object('sign',p.sign,'element',p.element,'planet',p.planet,'god',p.god,'birth_date',p.birth_date,'country',p.country) into v_result from public.profiles p where p.id=p_actor_user_id;
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
