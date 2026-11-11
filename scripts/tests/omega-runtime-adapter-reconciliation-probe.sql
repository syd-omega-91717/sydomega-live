-- End-to-end adapter probe for the canonical 18-module runtime.
-- Runs only on the isolated Supabase stack in CI and rolls back all fixtures.
begin;

insert into auth.users (
  id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at
) values (
  '10000000-0000-4000-8000-000000000091',
  'authenticated','authenticated','omega-runtime-adapter@probe.invalid','',
  now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()
) on conflict (id) do nothing;

insert into public.profiles(id,display_name,sign,element,planet,god,birth_date,is_owner,access_approved,is_public)
values ('10000000-0000-4000-8000-000000000091','Runtime Adapter Probe','Aries','Fire','Mars','Probe',date '1990-03-21',false,true,true)
on conflict (id) do update set display_name=excluded.display_name,sign=excluded.sign,element=excluded.element,planet=excluded.planet,god=excluded.god,birth_date=excluded.birth_date;

set local role service_role;

do $probe$
declare
  v_user uuid := '10000000-0000-4000-8000-000000000091';
  v_result jsonb;
  v_first jsonb;
  v_second jsonb;
  v_request_id bigint;
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
  v_request_id:=(v_first->>'request_id')::bigint;
  select count(*) into v_count from public.consult_requests
   where user_id=v_user and runtime_idempotency_key='omega-runtime-probe-consult-0001';
  if v_count<>1 then raise exception 'consultancy intake idempotency created % rows',v_count; end if;

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

end
$probe$;

reset role;
rollback;
