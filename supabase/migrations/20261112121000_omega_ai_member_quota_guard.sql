-- Profile-weighted per-member AI request quotas using the existing rate_limits token buckets.
-- This is a request-budget control, not a monetary cost estimate.
begin;

create or replace function private.consume_rate_limit_bucket(
  p_key text,
  p_capacity integer,
  p_refill_seconds integer,
  p_cost integer
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_tokens integer;
  v_last_refill timestamptz;
  v_elapsed numeric;
  v_refill integer;
  v_retry integer;
begin
  if p_key is null or pg_catalog.length(p_key)>240
     or p_capacity<1 or p_refill_seconds<1 or p_cost<1 or p_cost>p_capacity then
    raise exception 'ai_quota_parameters_invalid';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_key,0));
  insert into public.rate_limits(key,tokens,last_refill,updated_at)
  values(p_key,p_capacity,v_now,v_now)
  on conflict (key) do nothing;

  select tokens,last_refill into v_tokens,v_last_refill
  from public.rate_limits where key=p_key for update;

  v_elapsed:=greatest(0,extract(epoch from (v_now-v_last_refill)));
  v_refill:=pg_catalog.floor(v_elapsed/p_refill_seconds)::integer;
  if v_refill>0 then
    v_tokens:=least(p_capacity,v_tokens+v_refill);
    v_last_refill:=v_last_refill+pg_catalog.make_interval(secs=>v_refill*p_refill_seconds);
  end if;

  if v_tokens<p_cost then
    v_retry:=greatest(1,p_refill_seconds-pg_catalog.floor(extract(epoch from (v_now-v_last_refill)))::integer);
    update public.rate_limits set tokens=v_tokens,last_refill=v_last_refill,updated_at=v_now where key=p_key;
    return pg_catalog.jsonb_build_object('allowed',false,'remaining',v_tokens,'retry_after_seconds',v_retry);
  end if;

  v_tokens:=v_tokens-p_cost;
  update public.rate_limits set tokens=v_tokens,last_refill=v_last_refill,updated_at=v_now where key=p_key;
  return pg_catalog.jsonb_build_object('allowed',true,'remaining',v_tokens,'retry_after_seconds',0);
end;
$function$;

create or replace function public.omega_consume_ai_request_quota(
  p_user_id uuid,
  p_profile text
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $function$
declare
  v_weight integer;
  v_minute jsonb;
  v_day jsonb;
begin
  if p_user_id is null then
    return pg_catalog.jsonb_build_object('allowed',false,'reason','ai_quota_user_required');
  end if;
  v_weight:=case p_profile when 'fast' then 1 when 'balanced' then 2 when 'reasoning' then 4 else null end;
  if v_weight is null then
    return pg_catalog.jsonb_build_object('allowed',false,'reason','ai_quota_profile_invalid');
  end if;

  v_minute:=private.consume_rate_limit_bucket('omega-ai-minute:'||p_user_id::text,12,5,v_weight);
  if v_minute->>'allowed'<>'true' then
    return pg_catalog.jsonb_build_object('allowed',false,'reason','ai_rate_limit_exceeded','scope','rolling_minute','retry_after_seconds',v_minute->'retry_after_seconds');
  end if;

  v_day:=private.consume_rate_limit_bucket('omega-ai-day:'||p_user_id::text,120,720,v_weight);
  if v_day->>'allowed'<>'true' then
    return pg_catalog.jsonb_build_object('allowed',false,'reason','ai_daily_quota_exceeded','scope','rolling_day','retry_after_seconds',v_day->'retry_after_seconds');
  end if;

  return pg_catalog.jsonb_build_object(
    'allowed',true,
    'profile_weight',v_weight,
    'remaining_minute_units',v_minute->'remaining',
    'remaining_daily_units',v_day->'remaining'
  );
end;
$function$;

revoke all on function private.consume_rate_limit_bucket(text,integer,integer,integer) from public,anon,authenticated,service_role;
revoke all on function public.omega_consume_ai_request_quota(uuid,text) from public,anon,authenticated;
grant execute on function public.omega_consume_ai_request_quota(uuid,text) to service_role;

do $$
begin
  if not has_function_privilege('service_role','public.omega_consume_ai_request_quota(uuid,text)','EXECUTE')
     or has_function_privilege('anon','public.omega_consume_ai_request_quota(uuid,text)','EXECUTE')
     or has_function_privilege('authenticated','public.omega_consume_ai_request_quota(uuid,text)','EXECUTE') then
    raise exception 'ai_member_quota_rpc_acl_invalid';
  end if;
  if has_function_privilege('service_role','private.consume_rate_limit_bucket(text,integer,integer,integer)','EXECUTE')
     or has_function_privilege('authenticated','private.consume_rate_limit_bucket(text,integer,integer,integer)','EXECUTE') then
    raise exception 'ai_member_quota_bucket_helper_acl_invalid';
  end if;
end;
$$;

commit;
