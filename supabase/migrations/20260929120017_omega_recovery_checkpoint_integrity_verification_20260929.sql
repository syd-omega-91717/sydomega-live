create or replace function private.omega_verify_recovery_checkpoint(p_checkpoint_id uuid)
returns jsonb language plpgsql security definer set search_path = ''
as $$
declare v_member uuid := (select auth.uid()); v_row public.omega_recovery_checkpoints; v_hash text;
begin
  if v_member is null then raise exception 'not_authenticated'; end if;
  select * into v_row from public.omega_recovery_checkpoints where id=p_checkpoint_id and member_id=v_member;
  if not found then raise exception 'checkpoint_not_found'; end if;
  v_hash := encode(extensions.digest(convert_to(v_row.snapshot::text,'utf8'),'sha256'),'hex');
  return jsonb_build_object('valid',v_hash=v_row.snapshot_sha256,'checkpoint_id',v_row.id,'verified_at',now());
end;
$$;
revoke all on function private.omega_verify_recovery_checkpoint(uuid) from public;
grant execute on function private.omega_verify_recovery_checkpoint(uuid) to authenticated;