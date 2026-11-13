-- Reproduce the existing production service_role access needed by server-owned achievement workflows.
-- Member INSERT remains denied; verification rows remain unreadable to authenticated and anon.
begin;

grant select, insert on table public.omega_user_achievements to service_role;
grant select on table public.omega_achievement_verifications to service_role;

do $$
begin
  if not has_table_privilege('service_role','public.omega_user_achievements','SELECT')
     or not has_table_privilege('service_role','public.omega_user_achievements','INSERT') then
    raise exception 'omega_user_achievements_service_role_read_write_missing';
  end if;
  if not has_table_privilege('service_role','public.omega_achievement_verifications','SELECT') then
    raise exception 'omega_achievement_verifications_service_role_select_missing';
  end if;
  if has_table_privilege('authenticated','public.omega_user_achievements','INSERT')
     or has_table_privilege('anon','public.omega_user_achievements','INSERT') then
    raise exception 'omega_user_achievements_client_insert_unexpected';
  end if;
  if has_table_privilege('authenticated','public.omega_achievement_verifications','SELECT')
     or has_table_privilege('anon','public.omega_achievement_verifications','SELECT') then
    raise exception 'omega_achievement_verifications_client_select_unexpected';
  end if;
end;
$$;

commit;
