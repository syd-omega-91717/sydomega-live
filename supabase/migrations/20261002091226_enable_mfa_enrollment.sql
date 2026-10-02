begin;
insert into public.platform_settings(key,bool_value,updated_at) values ('mfa_enrolment_enabled',true,now())
on conflict(key) do update set bool_value=true,updated_at=now();
commit;