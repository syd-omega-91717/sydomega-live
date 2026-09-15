-- Revoke table privileges that are not required by browser/API clients.
--
-- RLS controls row access for DML, but PostgreSQL TRUNCATE, TRIGGER and
-- REFERENCES privileges are separate table-level capabilities. They should
-- never be exposed to the public PostgREST roles. This migration removes
-- those capabilities without changing SELECT/INSERT/UPDATE/DELETE grants or
-- RLS policies.
--
-- Applied live to production project ydqhzvvoyufiiqvzcjns as migration
-- 20260915074219_revoke_client_non_dml_privileges.

REVOKE TRUNCATE, TRIGGER, REFERENCES
  ON ALL TABLES IN SCHEMA public
  FROM anon, authenticated;
