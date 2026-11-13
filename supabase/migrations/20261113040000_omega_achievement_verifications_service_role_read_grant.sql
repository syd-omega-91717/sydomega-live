-- Reproduce the existing production service_role read privilege used by achievement verification probes.
-- The live provider grants SELECT to service_role; anon and authenticated have no table SELECT grant.
begin;

grant select on table public.omega_achievement_verifications to service_role;

do $$
begin
  if not has_table_privilege('service_role','public.omega_achievement_verifications','SELECT') then
    raise exception 'omega_achievement_verifications_service_role_select_missing';
  end if;
  if has_table_privilege('anon','public.omega_achievement_verifications','SELECT') then
    raise exception 'omega_achievement_verifications_anon_select_unexpected';
  end if;
  if has_table_privilege('authenticated','public.omega_achievement_verifications','SELECT') then
    raise exception 'omega_achievement_verifications_authenticated_select_unexpected';
  end if;
end;
$$;

commit;
