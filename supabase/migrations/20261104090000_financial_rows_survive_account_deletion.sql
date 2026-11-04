-- Ω SYD OMEGA 91717
-- Decision D1 (docs/legal/ERASURE_PLAN.md, accepted by the owner 2026-11-04): financial records are
-- ANONYMISED on account deletion, never deleted. Three tables did the opposite, found by replaying every
-- migration on a clean database and reading the real foreign keys:
--
--   commission_contracts     user_id nullable,  FK -> auth.users ON DELETE CASCADE   (rows deleted with the account)
--   sovereign_points_ledger  user_id NOT NULL,  FK -> auth.users ON DELETE CASCADE   (rows deleted with the account)
--   omega_service_orders     user_id NOT NULL,  FK -> auth.users ON DELETE RESTRICT  (a member with an order CANNOT be deleted)
--
-- After this migration each table keeps its rows when the member is deleted: user_id becomes NULL and the
-- row stays. That is also what the erasure engine's `anonymise` action expects (private.purge_user_data).
--
-- This migration is source-pending. It changes ONLY column nullability and one foreign key per table; it
-- reads and writes no row. It does not enable erasure (erasure_worker_enabled stays false, the policy
-- table stays empty). It DOES change what the existing private.delete_account() leaves behind for these
-- three tables: their rows are now kept (with user_id NULL) instead of cascade-deleted, and a member with a
-- service order can now be deleted instead of failing. Rows with a NULL user_id are invisible to members
-- under the existing user_id = auth.uid() policies and remain visible to the owner.
--
-- Drift-proof: the foreign keys are found in the catalogue and dropped by whatever name they have, so a
-- constraint renamed by hand in production is still replaced. A table that does not exist is skipped.
--
-- NOT covered here, on purpose (see docs/legal/ERASURE_PLAN.md):
--   * payments, billing_invoices, subscriptions: created by hand, absent from the migrations, so their real
--     columns and keys are unknown until docs/runtime/production-facts.sql is run on production;
--   * consent_records, omega_personal_context_consent_events and the event logs (decision D2): they also need
--     a member_hash column and counsel's answer on whether a hashed identifier is acceptable.

BEGIN;

DO $$
DECLARE
  t text;
  k record;
BEGIN
  FOREACH t IN ARRAY ARRAY['commission_contracts', 'sovereign_points_ledger', 'omega_service_orders'] LOOP
    IF to_regclass(format('public.%I', t)) IS NULL THEN
      RAISE NOTICE 'skipped public.% (does not exist)', t;
      CONTINUE;
    END IF;

    -- every single-column foreign key on user_id that points at auth.users or public.profiles
    FOR k IN
      SELECT con.conname
        FROM pg_constraint con
        JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY (con.conkey)
       WHERE con.conrelid = format('public.%I', t)::regclass
         AND con.contype = 'f'
         AND con.confrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
         AND array_length(con.conkey, 1) = 1
         AND a.attname = 'user_id'
    LOOP
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', t, k.conname);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN user_id DROP NOT NULL', t);
    EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE SET NULL',
                   t, t || '_user_id_fkey');
  END LOOP;
END
$$;

COMMIT;
