-- Reproduce the existing production service_role read privilege for in-app notifications.
-- This is a narrowly scoped parity grant; authenticated member access and RLS are unchanged.
begin;

grant select on table public.omega_notifications to service_role;

do $$
begin
  if not has_table_privilege('service_role','public.omega_notifications','SELECT') then
    raise exception 'omega_notifications_service_role_select_missing';
  end if;
  if has_table_privilege('anon','public.omega_notifications','SELECT') then
    raise exception 'omega_notifications_anon_select_unexpected';
  end if;
end;
$$;

commit;
