-- Every notification writer in the database (approve_member, reject_member,
-- revoke_member, extend_trial, grant_permanent_access, five sites in
-- complete_task, notify_member, and the three profile triggers) inserts
-- (user_id, notification_type, message) and omits `title` and `type`, both
-- NOT NULL with no default. Each raised 23502 and rolled back the whole
-- statement -- approve_member included, so no member could be approved
-- (measured live: approve_member(p) -> 23502; notifications held 0 rows ever).
-- One BEFORE INSERT fill covers every writer; the client (omega-notify.js)
-- reads notification_type + message, which are unchanged.
-- Verified live, rolled back: approve_member(p) -> ok, notifications for the
-- member (access_approved, trial_start) and BOTH owner accounts.
create or replace function private.notifications_fill_required()
returns trigger language plpgsql set search_path = public, pg_temp
as $$
begin
  new.type := coalesce(nullif(new.type, ''), nullif(new.notification_type, ''), 'system');
  new.notification_type := coalesce(nullif(new.notification_type, ''), new.type);
  new.title := coalesce(nullif(new.title, ''), upper(replace(new.type, '_', ' ')));
  new.message := coalesce(new.message, '');
  return new;
end $$;
revoke execute on function private.notifications_fill_required() from public, anon, authenticated;

drop trigger if exists notifications_fill_required on public.notifications;
create trigger notifications_fill_required before insert on public.notifications
  for each row execute function private.notifications_fill_required();

-- Owner awareness goes to every owner account (platform_owners), not one
-- hard-coded address, and can never block the approval or revocation that
-- fired it.
create or replace function public._notify_owner_member_approved()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (old.access_approved = false and new.access_approved = true) then
    begin
      insert into public.notifications (user_id, notification_type, message, content)
      select po.user_id, 'member_approved',
             'Member approved: ' || coalesce(new.display_name, 'Unknown'),
             jsonb_build_object('member_id', new.id, 'approval_date', new.updated_at)
        from public.platform_owners po
       where po.user_id is distinct from new.id;
    exception when others then
      raise warning 'OMEGA_NOTIFY member_approved failed: % %', sqlstate, sqlerrm;
    end;
  end if;
  return new;
end $$;

create or replace function public._notify_owner_member_rejected()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if (old.access_approved = true and new.access_approved = false) then
    begin
      insert into public.notifications (user_id, notification_type, message, content)
      select po.user_id, 'member_revoked',
             'Member access revoked: ' || coalesce(new.display_name, 'Unknown'),
             jsonb_build_object('member_id', new.id)
        from public.platform_owners po
       where po.user_id is distinct from new.id;
    exception when others then
      raise warning 'OMEGA_NOTIFY member_revoked failed: % %', sqlstate, sqlerrm;
    end;
  end if;
  return new;
end $$;
