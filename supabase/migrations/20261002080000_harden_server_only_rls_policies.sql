-- SYD OMEGA 91717
-- Explicit fail-closed RLS policies for server-only primitives.
-- These tables already denied member/anonymous access by virtue of RLS with
-- no policies. The explicit policies make that boundary machine-readable and
-- keep Supabase's security advisor from treating the absence of policy as an
-- undocumented configuration. service_role bypasses RLS and remains the
-- server-side execution boundary.

begin;

do $$
declare
  t text;
  policy_name text;
begin
  foreach t in array array[
    'omega_achievement_verifications',
    'omega_agent_tool_grants',
    'omega_fraud_signals',
    'omega_referral_clicks',
    'omega_referral_conversions'
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
