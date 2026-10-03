begin;
update public.omega_module_runtime_actions set lifecycle='INTEGRATED'
where (module_id,action_name) in (('HIERARCHY','entitlements.read'),('HOROSCOPE','profile.read'));
commit;
