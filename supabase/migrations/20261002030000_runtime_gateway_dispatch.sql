begin;

create or replace function public.omega_runtime_dispatch(
  p_actor_user_id uuid,
  p_action text,
  p_payload jsonb default '{}'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path=public,omega_private
as $$
declare
  v_result jsonb;
  v_referral_code text;
  v_attribution_id uuid;
  v_task_id uuid;
begin
  if p_actor_user_id is null then raise exception 'actor_required'; end if;

  case p_action
    when 'issue_referral_code' then
      v_referral_code := omega_private.issue_referral_code(
        p_actor_user_id,
        nullif(trim(p_payload->>'requested_code'),'')
      );
      v_result := jsonb_build_object('referral_code',v_referral_code);

    when 'attribute_referral' then
      v_attribution_id := omega_private.attribute_referral(
        p_payload->>'referral_code',
        p_actor_user_id,
        nullif(p_payload->>'source_click_id','')::uuid
      );
      v_result := jsonb_build_object('attribution_id',v_attribution_id);

    when 'enqueue_agent_task' then
      v_task_id := omega_private.enqueue_agent_task(
        p_actor_user_id,
        p_payload->>'agent_id',
        p_payload->>'task_type',
        coalesce(p_payload->'input','{}'::jsonb),
        p_payload->>'idempotency_key',
        coalesce((p_payload->>'approval_required')::boolean,true)
      );
      v_result := jsonb_build_object('task_id',v_task_id);

    else
      raise exception 'runtime_action_not_allowed';
  end case;

  perform omega_private.record_platform_event(
    case p_action
      when 'issue_referral_code' then 'action_completed'
      when 'attribute_referral' then 'action_completed'
      when 'enqueue_agent_task' then 'action_started'
      else 'action_completed'
    end,
    p_actor_user_id,
    'user',
    'omega-runtime-gateway',
    'runtime:'||p_action||':'||md5(coalesce(p_payload::text,'{}')),
    gen_random_uuid(),
    'runtime_action',
    p_action,
    p_payload
  );

  return v_result;
end $$;

revoke all on function public.omega_runtime_dispatch(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.omega_runtime_dispatch(uuid,text,jsonb) to service_role;

commit;