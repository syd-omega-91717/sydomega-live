-- Graphify AI remains held until privacy, consent and per-member cost controls are approved.
-- Missing or false means no query/ingestion provider call is permitted.
begin;

insert into public.platform_settings(key,bool_value,text_value)
values(
  'graphify_ai_enabled',
  false,
  'Held: requires reviewed privacy controls, explicit AI personalization and sensitive-data consent, and per-member cost limits.'
)
on conflict (key) do nothing;

do $$
begin
  if not exists (
    select 1 from public.platform_settings
    where key='graphify_ai_enabled'
  ) then
    raise exception 'graphify_ai_safety_gate_setting_missing';
  end if;
end;
$$;

commit;
