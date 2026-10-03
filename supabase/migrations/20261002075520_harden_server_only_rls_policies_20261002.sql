-- SYD OMEGA 91717
-- Explicit fail-closed RLS policies for server-only primitives.
begin;
do $$
declare t text; policy_name text;
begin
  foreach t in array array[
    'omega_achievement_verifications','omega_agent_tool_grants','omega_fraud_signals',
    'omega_referral_clicks','omega_referral_conversions'
  ] loop
    policy_name := t || '_server_only_deny';
    execute format('drop policy if exists %I on public.%I', policy_name, t);
    execute format(
      'create policy %I on public.%I for all to anon, authenticated using (false) with check (false)',
      policy_name, t
    );
  end loop;
end $$;
commit;
