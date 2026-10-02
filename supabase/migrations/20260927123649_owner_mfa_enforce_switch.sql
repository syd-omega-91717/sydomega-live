-- Owner two-factor enforcement switch that cannot lock the owner out.
-- docs/decisions/owner-mfa/PLAN.md, D4 + success criterion 3.
--
-- owner_mfa_required makes private.is_platform_owner() demand an aal2 JWT.
-- Turning it on while any owner account holds no verified TOTP factor would
-- strip that account of every owner power at its next sign-in -- the lock-out
-- the plan names as its main risk. Until now the only way to flip it was the
-- SQL editor, with the pre-flight query run by hand.
--
-- owner_set_mfa_required(p_on) makes the pre-flight the switch itself:
--   on  -> refused unless the CALLER is at aal2 (proves the sign-in step-up,
--          omega-mfa-gate.js, works for them) AND every platform owner holds
--          at least one verified factor (criterion 3 returns 0 rows);
--   off -> any owner (who, with enforcement on, is by definition at aal2).
-- Break-glass stays the SQL editor (plan D5), deliberately outside the app.
-- Shape as 20260926223027: private definer body, public invoker wrapper.
--
-- Applied live 2026-09-27 as 20260927123649. Verified in one block ending in
-- RAISE (all rolled back; two verified factors inserted inside it only):
--   member -> forbidden; owner at aal1 -> step_up_first; owner at aal2 with 0
--   of 2 owners enrolled -> owners_not_enrolled (missing 2); both enrolled but
--   caller aal1 -> step_up_first; both enrolled, aal2 -> ok, on. With it on:
--   owner at aal2 -> is_platform_owner true, same owner at aal1 -> false, the
--   OTHER owner account alone at aal2 -> true. Off -> ok, and aal1 is owner
--   again. anon EXECUTE -> 0.

create or replace function private.owner_set_mfa_required(p_on boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp
as $$
declare missing int;
begin
  if not private.is_platform_owner() then
    return jsonb_build_object('ok', false, 'error', 'forbidden');
  end if;
  if p_on is null then return jsonb_build_object('ok', false, 'error', 'bad_value'); end if;
  if p_on then
    if coalesce(auth.jwt()->>'aal', 'aal1') <> 'aal2' then
      return jsonb_build_object('ok', false, 'error', 'step_up_first');
    end if;
    select count(*) into missing from public.platform_owners po
     where not exists (select 1 from auth.mfa_factors f
                        where f.user_id = po.user_id and f.status = 'verified');
    if missing > 0 then
      return jsonb_build_object('ok', false, 'error', 'owners_not_enrolled', 'missing', missing);
    end if;
  end if;
  insert into public.platform_settings(key, bool_value, updated_at)
  values ('owner_mfa_required', p_on, now())
  on conflict (key) do update set bool_value = excluded.bool_value, updated_at = now();
  raise log 'OMEGA_MFA owner_mfa_required=% by %', p_on, auth.uid();
  return jsonb_build_object('ok', true, 'owner_mfa_required', p_on);
end $$;

create or replace function public.owner_set_mfa_required(p_on boolean)
returns jsonb language sql security invoker set search_path = public, pg_temp
as $$ select private.owner_set_mfa_required(p_on) $$;

revoke execute on function private.owner_set_mfa_required(boolean) from public, anon;
revoke execute on function public.owner_set_mfa_required(boolean) from public, anon;
grant execute on function private.owner_set_mfa_required(boolean) to authenticated;
grant execute on function public.owner_set_mfa_required(boolean) to authenticated;
