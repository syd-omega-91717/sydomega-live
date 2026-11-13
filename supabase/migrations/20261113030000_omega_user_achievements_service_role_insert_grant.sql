-- Reproduce the existing production service_role INSERT privilege for achievement writes.
-- Live ACL inspection confirms service_role already has INSERT; authenticated and anon do not.
begin;

grant insert on table public.omega_user_achievements to service_role;

do $$
begin
  if not has_table_privilege('service_role','public.omega_user_achievements','INSERT') then
    raise exception 'omega_user_achievements_service_role_insert_missing';
  end if;
  if has_table_privilege('anon','public.omega_user_achievements','INSERT') then
    raise exception 'omega_user_achievements_anon_insert_unexpected';
  end if;
  if has_table_privilege('authenticated','public.omega_user_achievements','INSERT') then
    raise exception 'omega_user_achievements_authenticated_insert_unexpected';
  end if;
end;
$$;

commit;
