-- End-to-end adapter probe for the canonical 18-module runtime.
-- Runs only on the isolated Supabase stack in CI and rolls back all fixtures.
begin;

insert into auth.users (
  id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values
  ('10000000-0000-4000-8000-000000000091','authenticated','authenticated','omega-runtime-adapter@probe.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000092','authenticated','authenticated','omega-runtime-adapter-2@probe.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now())
on conflict (id) do nothing;

insert into public.profiles(id,display_name,sign,birth_date)
values
 ('10000000-0000-4000-8000-000000000091','Runtime Adapter Probe','Aries',date '1990-03-21'),
 ('10000000-0000-4000-8000-000000000092','Runtime Adapter Probe 2','Taurus',date '1990-04-21')
on conflict (id) do update set display_name=excluded.display_name,sign=excluded.sign,birth_date=excluded.birth_date;

set local role service_role;

do $probe$
declare
  v_user uuid := '10000000-0000-4000-8000-000000000091';
  v_other_user uuid := '10000000-0000-4000-8000-000000000092';
  v_result jsonb;
  v_first jsonb;
  v_second jsonb;
  v_other jsonb;
  v_task_one uuid;
  v_task_two uuid;
  v_task_other uuid;
  v_task_system_one uuid;
  v_task_system_two uuid;
  v_notification_one uuid;
  v_notification_two uuid;
  v_notification_other uuid;
  v_platform_one uuid;
  v_platform_two uuid;
  v_platform_other uuid;
  v_platform_system_one uuid;
  v_platform_system_two uuid;
  v_achievement_one uuid;
  v_achievement_two uuid;
  v_verification_one uuid;
  v_verification_two uuid;
  v_verification_other uuid;
  i integer;
  v_count bigint;
  v_actions constant text[][] := array[
    array['CORE','profile.read'],
    array['CORE','catalog.read'],
    array['CORE','search.read'],
    array['CONSULTANCY','cases.read'],
    array['CONSULTANCY','deliverables.read'],
    array['GAMING','missions.read'],
    array['GAMING','matrix.read'],
    array['GAMING','leaderboard.read'],
    array['ACHIEVEMENTS','definitions.read'],
    array['ACHIEVEMENTS','mine.read'],
    array['ACHIEVEMENTS','certificate.read'],
    array['FAMILY','graph.read'],
    array['FAMILY','heritage.read'],
    array['FAMILY','vault.read'],
    array['MEDIA','library.read'],
    array['MEDIA','jobs.read'],
    array['MEDIA','publishing.read'],
    array['BLOCKCHAIN_NFT','assets.read'],
    array['BLOCKCHAIN_NFT','ownership.verify'],
    array['BLOCKCHAIN_NFT','marketplace.read'],
    array['COMMUNICATION','notifications.read'],
    array['COMMUNICATION','presence.read'],
    array['COMMUNICATION','events.read'],
    array['HOROSCOPE','profile.read'],
    array['HOROSCOPE','reading.generate'],
    array['HOROSCOPE','provenance.read'],
    array['NEWS','feed.read'],
    array['NEWS','topics.read'],
    array['NEWS','provenance.read'],
    array['HERITAGE','timeline.read'],
    array['HERITAGE','documents.read'],
    array['HERITAGE','access.read'],
    array['PROGRESS','matrix.read'],
    array['PROGRESS','tasks.read'],
    array['PROGRESS','verification.read'],
    array['CREDENTIALS','passport.read'],
    array['CREDENTIALS','certificates.read'],
    array['CREDENTIALS','verify.read'],
    array['LEGAL','terms.read'],
    array['LEGAL','privacy.read'],
    array['LEGAL','consent.read'],
    array['ELEMENTAL','cosmology.read'],
    array['ELEMENTAL','simulation.run'],
    array['ELEMENTAL','interpretation.read'],
    array['INVESTMENT','watchlist.read'],
    array['INVESTMENT','research.read'],
    array['INVESTMENT','simulation.read'],
    array['INTELLIGENCE','evidence.read'],
    array['INTELLIGENCE','agents.read'],
    array['INTELLIGENCE','retrieval.read'],
    array['HIERARCHY','roles.read'],
    array['HIERARCHY','entitlements.read'],
    array['HIERARCHY','governance.read']
  ];
begin
  perform set_config('request.jwt.claim.sub',v_user::text,true);
  perform set_config('request.jwt.claim.role','service_role',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','service_role')::text,true);
  for i in 1..array_length(v_actions,1) loop
    v_result:=public.omega_runtime_dispatch(
      v_user,
      'module_read',
      jsonb_build_object(
        'module_id',v_actions[i][1],
        'action_name',v_actions[i][2],
        'query','omega runtime adapter probe',
        'certificate_number','OMEGA-PROBE-NOT-ISSUED'
      )
    );
    if v_result->>'module_id' is distinct from v_actions[i][1]
       or v_result->>'action_name' is distinct from v_actions[i][2] then
      raise exception 'runtime action returned wrong identity: %.% -> %',v_actions[i][1],v_actions[i][2],v_result;
    end if;
    if v_result->'data'->>'implementation_status' in ('ADAPTER_REQUIRED','CONTRACT_ONLY') then
      raise exception 'runtime action still has no adapter: %.% -> %',v_actions[i][1],v_actions[i][2],v_result;
    end if;
    if v_result->'data' is null then
      raise exception 'runtime action returned no data envelope: %.%',v_actions[i][1],v_actions[i][2];
    end if;
  end loop;

  -- CONSULTANCY.intake.create is a dedicated authenticated write action.
  v_first:=public.omega_runtime_dispatch(v_user,'create_consult_intake',jsonb_build_object(
    'domain','runtime-adapter-probe',
    'message','Synthetic CI probe for the authenticated consultation intake adapter.',
    'idempotency_key','omega-runtime-probe-consult-0001',
    'urgency','normal',
    'preferred_time','',
    'confidentiality_accepted',true,
    'contact','probe@invalid.example'
  ));
  v_second:=public.omega_runtime_dispatch(v_user,'create_consult_intake',jsonb_build_object(
    'domain','runtime-adapter-probe',
    'message','Synthetic CI probe for the authenticated consultation intake adapter.',
    'idempotency_key','omega-runtime-probe-consult-0001',
    'urgency','normal',
    'preferred_time','',
    'confidentiality_accepted',true,
    'contact','probe@invalid.example'
  ));
  if v_first->>'request_id' is null or v_first->>'request_id' is distinct from v_second->>'request_id' then
    raise exception 'consultancy intake idempotency failed: first=% second=%',v_first,v_second;
  end if;
  select count(*) into v_count from public.consult_requests
   where user_id=v_user and runtime_idempotency_key='omega-runtime-probe-consult-0001';
  if v_count<>1 then raise exception 'consultancy intake idempotency created % rows',v_count; end if;
  v_other:=public.omega_runtime_dispatch(v_other_user,'create_consult_intake',jsonb_build_object(
    'domain','runtime-adapter-probe',
    'message','Synthetic CI probe for a second user using the same idempotency key.',
    'idempotency_key','omega-runtime-probe-consult-0001',
    'urgency','normal',
    'preferred_time','',
    'confidentiality_accepted',true,
    'contact','probe2@invalid.example'
  ));
  if v_other->>'request_id' is null or v_other->>'request_id' is not distinct from v_first->>'request_id' then
    raise exception 'consultancy idempotency key was not isolated by user: first=% other=%',v_first,v_other;
  end if;
  select count(*) into v_count from public.consult_requests
   where runtime_idempotency_key='omega-runtime-probe-consult-0001' and user_id in (v_user,v_other_user);
  if v_count<>2 then raise exception 'consultancy cross-user idempotency created % rows, expected 2',v_count; end if;

  -- Gateway write adapters remain idempotent and caller-scoped.
  v_first:=public.omega_runtime_dispatch(v_user,'create_media_job',jsonb_build_object(
    'job_type','probe','request','{}'::jsonb,'idempotency_key','omega-runtime-probe-media-0001','provider','external'
  ));
  v_second:=public.omega_runtime_dispatch(v_user,'create_media_job',jsonb_build_object(
    'job_type','probe','request','{}'::jsonb,'idempotency_key','omega-runtime-probe-media-0001','provider','external'
  ));
  if v_first->>'id' is null or v_first->>'id' is distinct from v_second->>'id' then
    raise exception 'media job idempotency failed: first=% second=%',v_first,v_second;
  end if;

  v_first:=public.omega_runtime_dispatch(v_user,'upsert_investment_watchlist',jsonb_build_object(
    'symbol','OMEGAPROBE','asset_class','equity','market','CI','notes','synthetic probe','alert_rules','{}'::jsonb
  ));
  v_second:=public.omega_runtime_dispatch(v_user,'upsert_investment_watchlist',jsonb_build_object(
    'symbol','OMEGAPROBE','asset_class','equity','market','CI','notes','synthetic probe','alert_rules','{}'::jsonb
  ));
  if v_first->>'id' is null or v_first->>'id' is distinct from v_second->>'id' then
    raise exception 'investment watchlist upsert idempotency failed: first=% second=%',v_first,v_second;
  end if;

  -- Service-order idempotency must be scoped by user and race-safe.
  v_first:=public.omega_runtime_dispatch(v_user,'create_service_order',jsonb_build_object(
    'service_id','progression-matrix','idempotency_key','omega-runtime-probe-service-0001','metadata','{}'::jsonb
  ));
  v_second:=public.omega_runtime_dispatch(v_user,'create_service_order',jsonb_build_object(
    'service_id','progression-matrix','idempotency_key','omega-runtime-probe-service-0001','metadata','{}'::jsonb
  ));
  v_other:=public.omega_runtime_dispatch(v_other_user,'create_service_order',jsonb_build_object(
    'service_id','progression-matrix','idempotency_key','omega-runtime-probe-service-0001','metadata','{}'::jsonb
  ));
  if v_first->>'order_id' is null or v_first->>'order_id' is distinct from v_second->>'order_id' then
    raise exception 'service order idempotency failed for same user: first=% second=%',v_first,v_second;
  end if;
  if v_other->>'order_id' is null or v_other->>'order_id' is not distinct from v_first->>'order_id' then
    raise exception 'service order idempotency key was not isolated by user: first=% other=%',v_first,v_other;
  end if;
  select count(*) into v_count from public.omega_service_orders
   where idempotency_key='omega-runtime-probe-service-0001' and user_id in (v_user,v_other_user);
  if v_count<>2 then raise exception 'service-order cross-user idempotency created % rows, expected 2',v_count; end if;

  -- Agent task idempotency is scoped by user and emits only one queued event.
  v_task_one:=omega_private.enqueue_agent_task(v_user,'sentinel','runtime_probe','{"probe":true}'::jsonb,'omega-runtime-probe-agent-0001',true);
  v_task_two:=omega_private.enqueue_agent_task(v_user,'sentinel','runtime_probe','{"probe":true}'::jsonb,'omega-runtime-probe-agent-0001',true);
  v_task_other:=omega_private.enqueue_agent_task(v_other_user,'sentinel','runtime_probe','{"probe":true}'::jsonb,'omega-runtime-probe-agent-0001',true);
  if v_task_one is null or v_task_one is distinct from v_task_two then
    raise exception 'agent task same-user idempotency failed';
  end if;
  if v_task_other is null or v_task_other is not distinct from v_task_one then
    raise exception 'agent task idempotency was not isolated by user';
  end if;
  select count(*) into v_count from public.omega_agent_tasks
   where idempotency_key='omega-runtime-probe-agent-0001' and user_id in (v_user,v_other_user);
  if v_count<>2 then raise exception 'agent task cross-user idempotency created % rows, expected 2',v_count; end if;
  select count(*) into v_count from public.omega_agent_task_events
   where task_id in (v_task_one,v_task_other) and event_type='task_queued';
  if v_count<>2 then raise exception 'agent task retry emitted % queue events, expected 2',v_count; end if;
  v_task_system_one:=omega_private.enqueue_agent_task(null,'sentinel','runtime_probe','{"probe":true}'::jsonb,'omega-runtime-probe-system-agent-0001',true);
  v_task_system_two:=omega_private.enqueue_agent_task(null,'sentinel','runtime_probe','{"probe":true}'::jsonb,'omega-runtime-probe-system-agent-0001',true);
  if v_task_system_one is null or v_task_system_one is distinct from v_task_system_two then
    raise exception 'system agent task global idempotency failed';
  end if;
  select count(*) into v_count from public.omega_agent_tasks
   where user_id is null and idempotency_key='omega-runtime-probe-system-agent-0001';
  if v_count<>1 then raise exception 'system agent task idempotency created % rows, expected 1',v_count; end if;
  select count(*) into v_count from public.omega_agent_tasks where task_id=v_task_system_one and requested_by='system';
  if v_count<>1 then raise exception 'system agent task requester classification missing'; end if;

  -- Notification idempotency is recipient-scoped.
  v_notification_one:=omega_private.enqueue_notification(v_user,'runtime_probe','Probe','Synthetic notification probe.','in_app','omega-runtime-probe-notification-0001','{}'::jsonb);
  v_notification_two:=omega_private.enqueue_notification(v_user,'runtime_probe','Probe','Synthetic notification probe.','in_app','omega-runtime-probe-notification-0001','{}'::jsonb);
  v_notification_other:=omega_private.enqueue_notification(v_other_user,'runtime_probe','Probe','Synthetic notification probe.','in_app','omega-runtime-probe-notification-0001','{}'::jsonb);
  if v_notification_one is null or v_notification_one is distinct from v_notification_two then
    raise exception 'notification same-user idempotency failed';
  end if;
  if v_notification_other is null or v_notification_other is not distinct from v_notification_one then
    raise exception 'notification idempotency was not isolated by recipient';
  end if;
  select count(*) into v_count from public.omega_notifications
   where idempotency_key='omega-runtime-probe-notification-0001' and user_id in (v_user,v_other_user);
  if v_count<>2 then raise exception 'notification cross-user idempotency created % rows, expected 2',v_count; end if;

  -- Platform event and audit idempotency are scoped by actor, while null-actor system keys remain global.
  v_platform_one:=omega_private.record_platform_event('route_view',v_user,'user','runtime-probe','omega-runtime-probe-platform-0001',null,'probe','member-1','{}'::jsonb);
  v_platform_two:=omega_private.record_platform_event('route_view',v_user,'user','runtime-probe','omega-runtime-probe-platform-0001',null,'probe','member-1','{}'::jsonb);
  v_platform_other:=omega_private.record_platform_event('route_view',v_other_user,'user','runtime-probe','omega-runtime-probe-platform-0001',null,'probe','member-2','{}'::jsonb);
  if v_platform_one is null or v_platform_one is distinct from v_platform_two then
    raise exception 'platform event same-actor idempotency failed';
  end if;
  if v_platform_other is null or v_platform_other is not distinct from v_platform_one then
    raise exception 'platform event idempotency was not isolated by actor';
  end if;
  select count(*) into v_count from public.omega_platform_events
   where idempotency_key='omega-runtime-probe-platform-0001' and actor_user_id in (v_user,v_other_user);
  if v_count<>2 then raise exception 'platform event cross-user idempotency created % rows, expected 2',v_count; end if;
  select count(*) into v_count from public.omega_audit_log
   where idempotency_key='audit:omega-runtime-probe-platform-0001' and actor_user_id in (v_user,v_other_user);
  if v_count<>2 then raise exception 'audit log cross-user idempotency created % rows, expected 2',v_count; end if;
  v_platform_system_one:=omega_private.record_platform_event('route_view',null,'system','runtime-probe','omega-runtime-probe-system-platform-0001',null,'probe','system','{}'::jsonb);
  v_platform_system_two:=omega_private.record_platform_event('route_view',null,'system','runtime-probe','omega-runtime-probe-system-platform-0001',null,'probe','system','{}'::jsonb);
  if v_platform_system_one is null or v_platform_system_one is distinct from v_platform_system_two then
    raise exception 'system platform event global idempotency failed';
  end if;
  select count(*) into v_count from public.omega_platform_events
   where actor_user_id is null and idempotency_key='omega-runtime-probe-system-platform-0001';
  if v_count<>1 then raise exception 'system platform event idempotency created % rows, expected 1',v_count; end if;
  select count(*) into v_count from public.omega_audit_log
   where actor_user_id is null and idempotency_key='audit:omega-runtime-probe-system-platform-0001';
  if v_count<>1 then raise exception 'system audit log idempotency created % rows, expected 1',v_count; end if;

  -- Achievement verification keys are scoped to the subject achievement assignment.
  insert into public.omega_user_achievements(user_id,achievement_id)
  values(v_user,'omega.stage.initiate'),(v_other_user,'omega.stage.initiate');
  select user_achievement_id into v_achievement_one from public.omega_user_achievements
   where user_id=v_user and achievement_id='omega.stage.initiate';
  select user_achievement_id into v_achievement_two from public.omega_user_achievements
   where user_id=v_other_user and achievement_id='omega.stage.initiate';
  v_verification_one:=omega_private.verify_achievement(v_achievement_one,'needs_review','runtime-probe','ci','{}'::jsonb,'omega-runtime-probe-achievement-0001');
  v_verification_two:=omega_private.verify_achievement(v_achievement_one,'needs_review','runtime-probe','ci','{}'::jsonb,'omega-runtime-probe-achievement-0001');
  v_verification_other:=omega_private.verify_achievement(v_achievement_two,'needs_review','runtime-probe','ci','{}'::jsonb,'omega-runtime-probe-achievement-0001');
  if v_verification_one is null or v_verification_one is distinct from v_verification_two then
    raise exception 'achievement verification same-subject idempotency failed';
  end if;
  if v_verification_other is null or v_verification_other is not distinct from v_verification_one then
    raise exception 'achievement verification idempotency was not isolated by subject';
  end if;
  select count(*) into v_count from public.omega_achievement_verifications
   where idempotency_key='omega-runtime-probe-achievement-0001' and user_achievement_id in (v_achievement_one,v_achievement_two);
  if v_count<>2 then raise exception 'achievement verification cross-subject idempotency created % rows, expected 2',v_count; end if;

end;
$probe$;

reset role;
set local role authenticated;
do $sovereign_probe$
declare
  v_user uuid := '10000000-0000-4000-8000-000000000091';
  v_other_user uuid := '10000000-0000-4000-8000-000000000092';
  v_first jsonb;
  v_second jsonb;
  v_other jsonb;
begin
  perform set_config('request.jwt.claim.sub',v_user::text,true);
  perform set_config('request.jwt.claim.role','authenticated',true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_user,'role','authenticated')::text,true);
  v_first:=private.record_sovereign_event('runtime_probe',jsonb_build_object('probe',true),jsonb_build_object('a',0.01,'b',0,'c',0),'omega-runtime-probe-sovereign-0001');
  v_second:=private.record_sovereign_event('runtime_probe',jsonb_build_object('probe',true),jsonb_build_object('a',0.01,'b',0,'c',0),'omega-runtime-probe-sovereign-0001');
  if v_first->>'ok'<>'true' or v_second->>'status'<>'duplicate' then
    raise exception 'sovereign event same-user idempotency failed: first=% second=%',v_first,v_second;
  end if;
  perform set_config('request.jwt.claim.sub',v_other_user::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_other_user,'role','authenticated')::text,true);
  v_other:=private.record_sovereign_event('runtime_probe',jsonb_build_object('probe',true),jsonb_build_object('a',0.01,'b',0,'c',0),'omega-runtime-probe-sovereign-0001');
  if v_other->>'ok'<>'true' or v_other->>'status'='duplicate' then
    raise exception 'sovereign event idempotency was not isolated by user: %',v_other;
  end if;
end;
$sovereign_probe$;

reset role;
set local role service_role;
do $sovereign_count$
declare v_count integer;
begin
  select count(*) into v_count from public.sovereign_events
   where idempotency_key='omega-runtime-probe-sovereign-0001'
     and user_id in ('10000000-0000-4000-8000-000000000091','10000000-0000-4000-8000-000000000092');
  if v_count<>2 then raise exception 'sovereign event cross-user idempotency created % rows, expected 2',v_count; end if;
end;
$sovereign_count$;

reset role;
rollback;
