-- Erasure pipeline engine test (supabase/migrations/20261103230000_erasure_pipeline_dormant.sql)
--
-- LOCAL ONLY. Builds a small synthetic schema, applies the migration, and asserts the engine's behaviour.
-- It CREATES AND DROPS TABLES, so it refuses to run anywhere except a database named erasure_pipeline_test.
-- Never run it against the production project.
--
--   createdb erasure_pipeline_test
--   psql -v ON_ERROR_STOP=1 -d erasure_pipeline_test -f scripts/tests/erasure_pipeline_test.sql
--
-- It proves the LOGIC against a synthetic schema. It does not prove the real triggers, grants and
-- foreign keys of the production project: that is the gate in docs/legal/LEGAL_GAP_AUDIT.md row 20.
-- Each check prints "PASS: ..." and a failed check aborts with "FAIL: ...".

\set ON_ERROR_STOP on

DO $$ BEGIN
  IF current_database() <> 'erasure_pipeline_test' THEN
    RAISE EXCEPTION 'REFUSING: this test only runs in a database named erasure_pipeline_test (this is %)', current_database();
  END IF;
END $$;

-- ---- synthetic Supabase-shaped schema --------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN CREATE ROLE anon NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN CREATE ROLE authenticated NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN CREATE ROLE service_role NOLOGIN; END IF;
END $$;

CREATE SCHEMA IF NOT EXISTS auth;
CREATE TABLE IF NOT EXISTS auth.users (id uuid PRIMARY KEY DEFAULT gen_random_uuid());
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_owner boolean NOT NULL DEFAULT false,
  erasure_requested_at timestamptz
);
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY, bool_value boolean, text_value text, updated_at timestamptz DEFAULT now()
);

-- member tables (names chosen so the sweep order exercises foreign-key retry)
CREATE TABLE public.notes    (id serial PRIMARY KEY, user_id uuid, body text);
CREATE TABLE public.journal  (id serial PRIMARY KEY, profile_id uuid, body text);          -- a different member column name
CREATE TABLE public.a_orders (id serial PRIMARY KEY, user_id uuid);
CREATE TABLE public.zz_items (id serial PRIMARY KEY, order_id int REFERENCES public.a_orders(id), user_id uuid);
CREATE TABLE public.payments (id serial PRIMARY KEY, user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
                              email text, amount numeric);
CREATE TABLE public.events   (id serial PRIMARY KEY, user_id uuid, kind text);

-- ---- apply the migration under test ----------------------------------------------------------
\i supabase/migrations/20261103230000_erasure_pipeline_dormant.sql

-- ---- helpers ---------------------------------------------------------------------------------
CREATE SCHEMA t;
CREATE FUNCTION t.ok(label text, cond boolean) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
  IF cond IS DISTINCT FROM true THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
  RAISE NOTICE 'PASS: %', label;
END $f$;

CREATE FUNCTION t.reset() RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
  TRUNCATE auth.users CASCADE;
  TRUNCATE public.notes, public.journal, public.zz_items, public.a_orders, public.payments, public.events;
  TRUNCATE private.erasure_log, private.erasure_policy;
  UPDATE public.platform_settings SET bool_value = false WHERE key = 'erasure_worker_enabled';
END $f$;

-- a member who has rows everywhere; requested_days_ago NULL means no erasure request
CREATE FUNCTION t.member(requested_days_ago int DEFAULT 20, owner boolean DEFAULT false) RETURNS uuid LANGUAGE plpgsql AS $f$
DECLARE u uuid := gen_random_uuid(); o int;
BEGIN
  INSERT INTO auth.users (id) VALUES (u);
  INSERT INTO public.profiles (id, is_owner, erasure_requested_at)
  VALUES (u, owner, CASE WHEN requested_days_ago IS NULL THEN NULL ELSE now() - make_interval(days => requested_days_ago) END);
  INSERT INTO public.notes (user_id, body) VALUES (u, 'private note');
  INSERT INTO public.journal (profile_id, body) VALUES (u, 'private journal');
  INSERT INTO public.a_orders (user_id) VALUES (u) RETURNING id INTO o;
  INSERT INTO public.zz_items (order_id, user_id) VALUES (o, u);
  INSERT INTO public.payments (user_id, email, amount) VALUES (u, 'a@example.test', 10);
  INSERT INTO public.events (user_id, kind) VALUES (u, 'login');
  RETURN u;
END $f$;

CREATE FUNCTION t.policy_full() RETURNS void LANGUAGE sql AS $f$
  INSERT INTO private.erasure_policy (table_name, action, anonymise_set, reason, reviewed) VALUES
    ('notes', 'delete', NULL, 'test', true), ('journal', 'delete', NULL, 'test', true),
    ('a_orders', 'delete', NULL, 'test', true), ('zz_items', 'delete', NULL, 'test', true),
    ('payments', 'anonymise', 'user_id = NULL, email = NULL', 'test', true),
    ('events', 'retain', NULL, 'test', true);
$f$;

CREATE FUNCTION t.intact(u uuid) RETURNS boolean LANGUAGE sql AS $f$
  SELECT EXISTS (SELECT 1 FROM auth.users WHERE id = u) AND EXISTS (SELECT 1 FROM public.profiles WHERE id = u)
     AND (SELECT count(*) FROM public.notes WHERE user_id = u) = 1
     AND (SELECT count(*) FROM public.journal WHERE profile_id = u) = 1
     AND (SELECT count(*) FROM public.zz_items WHERE user_id = u) = 1
     AND (SELECT count(*) FROM public.payments WHERE user_id = u AND email = 'a@example.test') = 1;
$f$;

-- ---- T0: dormant by construction -------------------------------------------------------------
DO $$ BEGIN
  PERFORM t.ok('T0 flag erasure_worker_enabled ships false',
    (SELECT bool_value FROM public.platform_settings WHERE key = 'erasure_worker_enabled') = false);
  PERFORM t.ok('T0 delay ships at 14 days (D4)', (SELECT text_value FROM public.platform_settings WHERE key = 'erasure_delay_days') = '14');
  PERFORM t.ok('T0 policy ships EMPTY', (SELECT count(*) FROM private.erasure_policy) = 0);
  PERFORM t.ok('T0 no API role can execute purge_user_data',
    NOT has_function_privilege('anon', 'private.purge_user_data(uuid)', 'execute')
    AND NOT has_function_privilege('authenticated', 'private.purge_user_data(uuid)', 'execute')
    AND NOT has_function_privilege('service_role', 'private.purge_user_data(uuid)', 'execute'));
  PERFORM t.ok('T0 no API role can execute run_erasure_queue',
    NOT has_function_privilege('anon', 'private.run_erasure_queue()', 'execute')
    AND NOT has_function_privilege('authenticated', 'private.run_erasure_queue()', 'execute')
    AND NOT has_function_privilege('service_role', 'private.run_erasure_queue()', 'execute'));
  PERFORM t.ok('T0 no API role can touch the policy or log tables',
    NOT has_table_privilege('authenticated', 'private.erasure_policy', 'select')
    AND NOT has_table_privilege('anon', 'private.erasure_log', 'select')
    AND NOT has_table_privilege('service_role', 'private.erasure_log', 'select'));
END $$;

-- ---- T1/T2: fail closed ----------------------------------------------------------------------
DO $$ DECLARE u uuid; r jsonb; BEGIN
  PERFORM t.reset(); u := t.member();
  r := private.purge_user_data(u);
  PERFORM t.ok('T1 empty policy: purge refuses (unclassified_tables)', r ->> 'error' = 'unclassified_tables');
  PERFORM t.ok('T1 ...and changes nothing', t.intact(u) AND (SELECT count(*) FROM public.events WHERE user_id = u) = 1);
  PERFORM t.ok('T1 ...and logs a failure, not a success',
    (SELECT count(*) FROM private.erasure_log WHERE status = 'failed') = 1 AND (SELECT count(*) FROM private.erasure_log WHERE status = 'ok') = 0);

  PERFORM t.reset(); u := t.member(); PERFORM t.policy_full();
  UPDATE private.erasure_policy SET reviewed = false WHERE table_name = 'notes';
  r := private.purge_user_data(u);
  PERFORM t.ok('T2 an unreviewed row blocks the purge', r ->> 'error' = 'unreviewed_tables' AND t.intact(u));

  -- a table added "next month" is not silently deleted or kept
  PERFORM t.reset(); u := t.member(); PERFORM t.policy_full();
  CREATE TABLE public.added_later (id serial, user_id uuid);
  INSERT INTO public.added_later (user_id) VALUES (u);
  r := private.purge_user_data(u);
  PERFORM t.ok('T1b a new unclassified table blocks the purge and its rows survive',
    r ->> 'error' = 'unclassified_tables' AND (r -> 'tables') ? 'added_later'
    AND (SELECT count(*) FROM public.added_later WHERE user_id = u) = 1 AND t.intact(u));
  DROP TABLE public.added_later;
END $$;

-- ---- T3: guards ------------------------------------------------------------------------------
DO $$ DECLARE u uuid; r jsonb; BEGIN
  PERFORM t.reset(); PERFORM t.policy_full();
  u := t.member(NULL);
  PERFORM t.ok('T3 a member who never requested erasure is not purged', private.purge_user_data(u) ->> 'error' = 'erasure_not_requested' AND t.intact(u));
  u := t.member(20, true);
  PERFORM t.ok('T3 an owner account is protected', private.purge_user_data(u) ->> 'error' = 'owner_protected' AND t.intact(u));
  PERFORM t.ok('T3 an unknown id is refused', private.purge_user_data(gen_random_uuid()) ->> 'error' = 'no_member');
  PERFORM t.ok('T3 null is refused', private.purge_user_data(NULL) ->> 'error' = 'no_member');
END $$;

-- ---- T4: the happy path ----------------------------------------------------------------------
DO $$ DECLARE u uuid; r jsonb; other uuid; BEGIN
  PERFORM t.reset(); PERFORM t.policy_full();
  u := t.member(); other := t.member();
  r := private.purge_user_data(u);
  PERFORM t.ok('T4 purge succeeds (a_orders needed a foreign-key retry pass)', (r ->> 'ok')::boolean);
  PERFORM t.ok('T4 delete tables are empty for the member',
    (SELECT count(*) FROM public.notes WHERE user_id = u) = 0 AND (SELECT count(*) FROM public.journal WHERE profile_id = u) = 0
    AND (SELECT count(*) FROM public.a_orders WHERE user_id = u) = 0 AND (SELECT count(*) FROM public.zz_items WHERE user_id = u) = 0);
  PERFORM t.ok('T4 anonymise keeps the payment row but not the person',
    (SELECT count(*) FROM public.payments WHERE user_id IS NULL AND email IS NULL AND amount = 10) = 1   -- the member's row, detached
    AND (SELECT count(*) FROM public.payments WHERE user_id = u) = 0
    AND (SELECT count(*) FROM public.payments WHERE user_id = other AND email = 'a@example.test') = 1);   -- the other member's, untouched
  PERFORM t.ok('T4 retain leaves the row untouched', (SELECT count(*) FROM public.events WHERE user_id = u) = 1);
  PERFORM t.ok('T4 the auth user and profile are gone',
    NOT EXISTS (SELECT 1 FROM auth.users WHERE id = u) AND NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = u));
  PERFORM t.ok('T4 another member is completely untouched', t.intact(other));
  PERFORM t.ok('T4 the log holds a hash and the counts, never the member id',
    (SELECT count(*) FROM private.erasure_log WHERE status = 'ok' AND member_hash = encode(sha256(convert_to(u::text, 'utf8')), 'hex')) = 1
    AND NOT EXISTS (SELECT 1 FROM private.erasure_log l WHERE l::text LIKE '%' || u::text || '%')
    AND r::text NOT LIKE '%' || u::text || '%');
  PERFORM t.ok('T4 the result reports what was retained', (r -> 'retained') ? 'events');
END $$;

-- ---- T5: all or nothing ----------------------------------------------------------------------
DO $$ DECLARE u uuid; r jsonb; BEGIN
  PERFORM t.reset(); PERFORM t.policy_full(); u := t.member();
  CREATE TABLE public.zz_trap (id serial, user_id uuid);
  INSERT INTO public.zz_trap (user_id) VALUES (u);
  CREATE FUNCTION public.zz_boom() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''boom''; END';
  CREATE TRIGGER zz_boom BEFORE DELETE ON public.zz_trap FOR EACH ROW EXECUTE FUNCTION public.zz_boom();
  INSERT INTO private.erasure_policy VALUES ('zz_trap', 'delete', NULL, 'test', true);
  r := private.purge_user_data(u);
  PERFORM t.ok('T5 a failure late in the sweep returns rolled_back', r ->> 'error' = 'rolled_back');
  PERFORM t.ok('T5 ...and EVERYTHING deleted earlier in the sweep is back', t.intact(u) AND (SELECT count(*) FROM public.zz_trap WHERE user_id = u) = 1);
  PERFORM t.ok('T5 ...logged as failed, with no success row',
    (SELECT count(*) FROM private.erasure_log WHERE status = 'failed') = 1 AND (SELECT count(*) FROM private.erasure_log WHERE status = 'ok') = 0);
  DROP TABLE public.zz_trap; DROP FUNCTION public.zz_boom();
END $$;

-- ---- T6/T7: anonymise cannot be faked --------------------------------------------------------
DO $$ DECLARE u uuid; r jsonb; BEGIN
  PERFORM t.reset(); PERFORM t.policy_full(); u := t.member();
  UPDATE private.erasure_policy SET anonymise_set = NULL WHERE table_name = 'payments';
  r := private.purge_user_data(u);
  PERFORM t.ok('T6 anonymise without a spec fails closed and rolls back',
    r ->> 'error' = 'rolled_back' AND r ->> 'detail' LIKE 'anonymise_spec_missing%' AND t.intact(u));

  PERFORM t.reset(); PERFORM t.policy_full(); u := t.member();
  CREATE TABLE public.receipts (id serial, user_id uuid NOT NULL);
  INSERT INTO public.receipts (user_id) VALUES (u);
  INSERT INTO private.erasure_policy VALUES ('receipts', 'anonymise', 'user_id = NULL', 'test', true);
  r := private.purge_user_data(u);
  PERFORM t.ok('T7 an anonymise that cannot null a NOT NULL column rolls back, not half-done',
    r ->> 'error' = 'rolled_back' AND t.intact(u) AND (SELECT count(*) FROM public.receipts WHERE user_id = u) = 1);
  DROP TABLE public.receipts;
END $$;

-- ---- T8: retention defeated by a cascade (audit row 19) --------------------------------------
DO $$ DECLARE u uuid; v uuid; r jsonb; BEGIN
  PERFORM t.reset(); PERFORM t.policy_full();
  CREATE TABLE public.consent_records (id serial, user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, kind text);
  INSERT INTO private.erasure_policy VALUES ('consent_records', 'retain', NULL, 'test: kept as proof of consent', true);
  u := t.member(); INSERT INTO public.consent_records (user_id, kind) VALUES (u, 'terms');
  v := t.member();                                   -- a member with NO consent row
  r := private.purge_user_data(u);
  PERFORM t.ok('T8 a retained row that the cascade would delete blocks the purge',
    r ->> 'error' = 'rolled_back' AND r ->> 'detail' LIKE 'retention_defeated_by_cascade%' AND t.intact(u)
    AND (SELECT count(*) FROM public.consent_records WHERE user_id = u) = 1);
  r := private.purge_user_data(v);
  PERFORM t.ok('T8 ...but it does not block a member who has no such row', (r ->> 'ok')::boolean);
  DROP TABLE public.consent_records;
END $$;

-- ---- T9: the queue ---------------------------------------------------------------------------
DO $$ DECLARE bad uuid; good uuid; fresh uuid; r jsonb; BEGIN
  PERFORM t.reset(); PERFORM t.policy_full();
  CREATE TABLE public.zz_trap (id serial, user_id uuid);
  CREATE FUNCTION public.zz_boom() RETURNS trigger LANGUAGE plpgsql AS 'BEGIN RAISE EXCEPTION ''boom''; END';
  CREATE TRIGGER zz_boom BEFORE DELETE ON public.zz_trap FOR EACH ROW EXECUTE FUNCTION public.zz_boom();
  INSERT INTO private.erasure_policy VALUES ('zz_trap', 'delete', NULL, 'test', true);
  bad := t.member(30); INSERT INTO public.zz_trap (user_id) VALUES (bad);   -- oldest request, will fail
  good := t.member(20);
  fresh := t.member(1);                                                      -- inside the cooling-off window

  r := private.run_erasure_queue();
  PERFORM t.ok('T9 flag off: the queue does nothing', r = '{"enabled": false}'::jsonb AND t.intact(bad) AND t.intact(good) AND t.intact(fresh));

  UPDATE public.platform_settings SET bool_value = true WHERE key = 'erasure_worker_enabled';
  r := private.run_erasure_queue();
  PERFORM t.ok('T9 a failing member (first in line) does not block the next one',
    (r ->> 'purged')::int = 1 AND (r ->> 'failed')::int = 1 AND NOT EXISTS (SELECT 1 FROM auth.users WHERE id = good));
  PERFORM t.ok('T9 a request inside the cooling-off window is left alone', t.intact(fresh));
  PERFORM t.ok('T9 the failed member is intact', t.intact(bad));

  r := private.run_erasure_queue();
  PERFORM t.ok('T9 a member that failed in the last 24h is skipped, not retried in a loop',
    (r ->> 'failed')::int = 0 AND (r ->> 'skipped_recent_failure')::int = 1);
  DROP TABLE public.zz_trap; DROP FUNCTION public.zz_boom();
END $$;

-- ---- T10: an API role cannot call it ---------------------------------------------------------
DO $$ DECLARE got text := 'no error'; BEGIN
  PERFORM t.reset();
  BEGIN
    SET LOCAL ROLE authenticated;
    PERFORM private.purge_user_data(gen_random_uuid());
  EXCEPTION WHEN insufficient_privilege THEN got := 'insufficient_privilege';
  END;
  RESET ROLE;
  PERFORM t.ok('T10 the authenticated role is denied (' || got || ')', got = 'insufficient_privilege');
END $$;

SELECT 'ALL ERASURE PIPELINE CHECKS PASSED' AS result;
