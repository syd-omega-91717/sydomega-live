-- Reproduce the existing production server-only INSERT privilege for achievement assignments.
-- Member and anonymous INSERT remain denied; the owner-read RLS policy is unchanged.
begin;

grant insert on table public.omega_user_achievements to service_role;

do $$
begin
  if not has_table_privilege('service_role','public.omega_user_achievements','INSERT') then
    raise exception 'omega_user_achievements_service_role_insert_missing';
  end if;
  if has_table_privilege('authenticated','public.omega_user_achievements','INSERT')
     or has_table_privilege('anon','public.omega_user_achievements','INSERT') then
    raise exception 'omega_user_achievements_client_insert_unexpected';
  end if;
end;
$$;

commit;
