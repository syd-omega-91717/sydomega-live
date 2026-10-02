begin;

alter table public.consult_requests
  add column if not exists runtime_idempotency_key text;

create unique index if not exists consult_requests_runtime_idempotency_uidx
  on public.consult_requests(runtime_idempotency_key)
  where runtime_idempotency_key is not null;

create or replace function omega_private.create_consult_intake(
  p_user_id uuid,p_domain text,p_message text,p_idempotency_key text,
  p_urgency text default 'normal',p_preferred_time text default null,
  p_confidentiality_accepted boolean default false,p_contact text default null
) returns bigint language plpgsql security definer set search_path='' as $$
declare v_id bigint;
begin
 if p_user_id is null then raise exception 'user_required'; end if;
 if p_domain is null or pg_catalog.length(pg_catalog.trim(p_domain)) < 2 then raise exception 'domain_required'; end if;
 if p_message is null or pg_catalog.length(pg_catalog.trim(p_message)) < 10 then raise exception 'message_too_short'; end if;
 if p_idempotency_key is null or pg_catalog.length(pg_catalog.trim(p_idempotency_key)) < 8 then raise exception 'idempotency_key_required'; end if;
 if not p_confidentiality_accepted then raise exception 'confidentiality_acceptance_required'; end if;
 select id into v_id from public.consult_requests where runtime_idempotency_key=p_idempotency_key for update;
 if v_id is not null then return v_id; end if;
 insert into public.consult_requests(user_id,domain,message,status,created_at,urgency,contact,preferred_time,confidentiality_accepted,runtime_idempotency_key)
 values(p_user_id,pg_catalog.left(pg_catalog.trim(p_domain),120),pg_catalog.left(pg_catalog.trim(p_message),10000),'pending',pg_catalog.now(),pg_catalog.left(coalesce(pg_catalog.trim(p_urgency),'normal'),40),pg_catalog.left(p_contact,240),pg_catalog.left(p_preferred_time,240),true,p_idempotency_key)
 returning id into v_id;
 return v_id;
end; $$;

revoke all on function omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text) from public,anon,authenticated;
grant execute on function omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text) to service_role;

update public.omega_module_runtime_actions set lifecycle='INTEGRATED'
where (module_id,action_name) in (('CORE','search.read'),('CONSULTANCY','intake.create'));

commit;
