-- Ω SYD OMEGA 91717 — minimum authenticated read columns
-- RLS remains the row boundary. No table-wide SELECT is granted.
-- Secret API-key material and consent forensic metadata stay inaccessible.

begin;
grant select (id, name, scopes, last_used_at, expires_at, active, created_at)
  on table public.api_keys to authenticated;
grant select (user_id, consent_type, granted, granted_at, revoked_at)
  on table public.consent_records to authenticated;
commit;
