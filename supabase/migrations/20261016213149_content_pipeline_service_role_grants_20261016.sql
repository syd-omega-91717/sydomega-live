-- Ω SYD OMEGA 91717 — service_role grants for the content pipeline Edge Functions
-- content-ingest and content-delivery use the service-role client against two
-- tables that service_role holds no DML privilege on: 20260903015535 revoked the
-- schema's default table privileges from service_role, so every table created
-- after it starts without one. A GRANT is checked before row security, so both
-- functions failed 42501 on their first query and returned a generic 500
-- (measured live 2026-10-16: has_table_privilege('service_role', ...) false for
-- SELECT/INSERT/DELETE on both). Scope is exactly what the two functions call:
--   storage_files          select, insert (insert ... select), delete (rollback)
--   omega_platform_events  insert (audit event; id is an identity column)
-- No other role and no other table changes. RLS is unchanged.

begin;

grant select, insert, delete on table public.storage_files to service_role;
grant insert on table public.omega_platform_events to service_role;

commit;
