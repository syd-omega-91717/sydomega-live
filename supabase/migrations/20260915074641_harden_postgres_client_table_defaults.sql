-- Prevent future tables created by the postgres role in public from inheriting
-- non-DML table privileges that browser/API roles do not need.
--
-- The Supabase-managed supabase_admin default ACL is platform-controlled and
-- cannot be changed by this project role; this migration therefore hardens
-- the postgres-owned default path used by project migrations.

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE TRUNCATE, TRIGGER, REFERENCES ON TABLES FROM anon, authenticated;
