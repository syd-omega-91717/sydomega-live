-- Ω SYD OMEGA 91717
-- Erasure pipeline engine: DORMANT. docs/legal/ERASURE_PLAN.md, decisions D1 to D4 (2026-11-03).
--
-- This migration is source-pending. It ships the engine and nothing that uses it:
--   * erasure_worker_enabled is false and no cron job is created;
--   * private.erasure_policy is created EMPTY, and the purge refuses to touch a member while any
--     table holding their data is unclassified or not reviewed, so with no policy rows it can do
--     nothing at all;
--   * nothing here changes request_account_erasure() or delete_account() (plan phase 2);
--   * nothing is granted to any API role.
-- The policy rows are seeded by a later migration, after config/erasure-policy.json has been reviewed
-- table by table (scripts/erasure-policy-contract.py --gate). Do not enable the worker before that and
-- before docs/legal/ERASURE_PIPELINE_TEST.sql and docs/legal/ERASURE_ROLLBACK_TEST.sql have passed on
-- the production project (LEGAL_GAP_AUDIT.md row 20).
--
-- Design (each point answers a finding in ERASURE_PLAN.md):
--   fail closed        a table with a member column and no reviewed policy row blocks the purge (9, 1)
--   all or nothing     the whole purge runs in one sub-transaction; any failure rolls it ALL back (2)
--   log after success  an 'ok' log row is written inside that sub-transaction; a failure writes a
--                      separate 'failed' row afterwards (3)
--   no queue blocking  members that failed in the last 24 hours are skipped, and each member is
--                      handled on its own (4)
--   cascade check      a retained or anonymised table that would be deleted by the final auth.users
--                      cascade blocks the purge instead of being silently lost (8, audit row 19)
--   explicit grants    every function is revoked from PUBLIC, anon, authenticated, service_role (7)
-- Decisions: D1 financial tables are 'anonymise', never 'delete'. D2 consent and event records keep
-- a minimal record, never the member's id. D3 and D4 are policy for phase 2 and the scheduler:
-- 14-day cooling-off (erasure_delay_days), daily run, cancellable.

BEGIN;

CREATE SCHEMA IF NOT EXISTS private;

CREATE TABLE IF NOT EXISTS private.erasure_policy (
  table_name    text PRIMARY KEY,
  action        text NOT NULL CHECK (action IN ('delete', 'anonymise', 'retain')),
  -- For 'anonymise' only: the SET clause applied to the member's rows, for example
  -- 'user_id = NULL, email = NULL'. Required; without it the purge refuses (fail closed).
  anonymise_set text,
  reason        text NOT NULL CHECK (btrim(reason) <> ''),
  reviewed      boolean NOT NULL DEFAULT false,
  CHECK (action = 'anonymise' OR anonymise_set IS NULL)
);
ALTER TABLE private.erasure_policy ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.erasure_policy FROM PUBLIC, anon, authenticated, service_role;

CREATE TABLE IF NOT EXISTS private.erasure_log (
  id              bigserial PRIMARY KEY,
  member_hash     text NOT NULL,       -- sha256 of the member id: proves a purge ran, identifies no one
  run_at          timestamptz NOT NULL DEFAULT now(),
  status          text NOT NULL CHECK (status IN ('ok', 'failed')),
  detail          text,                -- failure class and table name only, never member data
  tables_touched  integer NOT NULL DEFAULT 0,
  rows_deleted    bigint NOT NULL DEFAULT 0,
  rows_anonymised bigint NOT NULL DEFAULT 0,
  retained        text[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS erasure_log_hash_status_idx ON private.erasure_log (member_hash, status, run_at DESC);
ALTER TABLE private.erasure_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE private.erasure_log FROM PUBLIC, anon, authenticated, service_role;

-- Both flags ship off / at the decided default. bool_value is the switch; text_value carries the delay.
INSERT INTO public.platform_settings (key, bool_value, text_value) VALUES
  ('erasure_worker_enabled', false, NULL),
  ('erasure_delay_days', false, '14')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION private.purge_user_data(p_uid uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $fn$
DECLARE
  r            record;
  pol          record;
  n            bigint;
  deleted      bigint := 0;
  anonymised   bigint := 0;
  touched      integer := 0;
  retained     text[] := '{}';
  unclassified text[];
  unreviewed   text[];
  hash         text;
  pass         integer;
  pending      text[];
  still        text[];
  item         text;
  tbl          text;
  col          text;
  all_cols     text[];
  has_rows     boolean;
BEGIN
  IF p_uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_member');
  END IF;
  hash := encode(sha256(convert_to(p_uid::text, 'utf8')), 'hex');
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_uid) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_member');
  END IF;
  IF COALESCE((SELECT is_owner FROM public.profiles WHERE id = p_uid), false) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'owner_protected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_uid AND erasure_requested_at IS NOT NULL) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'erasure_not_requested');
  END IF;

  -- Every column that can hold this member's id, found from the catalogue (never a hand-kept list).
  SELECT COALESCE(array_agg(c.relname || '.' || a.attname ORDER BY c.relname, a.attname), '{}')
    INTO pending
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid = a.attrelid
    JOIN pg_catalog.pg_namespace s ON s.oid = c.relnamespace
   WHERE s.nspname = 'public'
     AND c.relkind IN ('r', 'p')
     AND NOT c.relispartition
     AND a.attnum > 0 AND NOT a.attisdropped
     AND a.attname IN ('user_id', 'profile_id', 'member_id')
     AND a.atttypid = 'uuid'::regtype
     AND c.relname <> 'profiles';

  all_cols := pending;   -- the loop below consumes `pending`; the cascade check needs the full list

  -- Fail closed BEFORE changing anything.
  SELECT COALESCE(array_agg(DISTINCT split_part(x, '.', 1) ORDER BY split_part(x, '.', 1)), '{}')
    INTO unclassified
    FROM unnest(pending) x
   WHERE NOT EXISTS (SELECT 1 FROM private.erasure_policy p WHERE p.table_name = split_part(x, '.', 1));
  IF array_length(unclassified, 1) IS NOT NULL THEN
    INSERT INTO private.erasure_log (member_hash, status, detail)
    VALUES (hash, 'failed', 'unclassified_tables: ' || array_to_string(unclassified, ','));
    RETURN jsonb_build_object('ok', false, 'error', 'unclassified_tables', 'tables', to_jsonb(unclassified));
  END IF;
  SELECT COALESCE(array_agg(DISTINCT split_part(x, '.', 1) ORDER BY split_part(x, '.', 1)), '{}')
    INTO unreviewed
    FROM unnest(pending) x
    JOIN private.erasure_policy p ON p.table_name = split_part(x, '.', 1)
   WHERE NOT p.reviewed;
  IF array_length(unreviewed, 1) IS NOT NULL THEN
    INSERT INTO private.erasure_log (member_hash, status, detail)
    VALUES (hash, 'failed', 'unreviewed_tables: ' || array_to_string(unreviewed, ','));
    RETURN jsonb_build_object('ok', false, 'error', 'unreviewed_tables', 'tables', to_jsonb(unreviewed));
  END IF;

  -- Everything below is one sub-transaction: any exception undoes ALL of it.
  BEGIN
    -- retain: nothing to do, but report it.
    SELECT COALESCE(array_agg(DISTINCT p.table_name ORDER BY p.table_name), '{}')
      INTO retained
      FROM unnest(pending) x
      JOIN private.erasure_policy p ON p.table_name = split_part(x, '.', 1)
     WHERE p.action = 'retain';

    -- delete / anonymise, with up to three passes so a delete blocked by a foreign key can wait for
    -- its child table. Leftovers after the last pass abort the whole purge.
    pass := 0;
    still := pending;
    WHILE pass < 3 AND COALESCE(array_length(still, 1), 0) > 0 LOOP
      pass := pass + 1;
      pending := still;
      still := '{}';
      FOREACH item IN ARRAY pending LOOP
        tbl := split_part(item, '.', 1);
        col := split_part(item, '.', 2);
        SELECT * INTO pol FROM private.erasure_policy WHERE table_name = tbl;
        IF pol.action = 'retain' THEN
          CONTINUE;
        END IF;
        BEGIN
          IF pol.action = 'delete' THEN
            EXECUTE format('DELETE FROM public.%I WHERE %I = $1', tbl, col) USING p_uid;
            GET DIAGNOSTICS n = ROW_COUNT;
            IF n > 0 THEN deleted := deleted + n; touched := touched + 1; END IF;
          ELSE
            IF pol.anonymise_set IS NULL OR btrim(pol.anonymise_set) = '' THEN
              RAISE EXCEPTION 'anonymise_spec_missing: %', tbl USING ERRCODE = 'P0001';
            END IF;
            EXECUTE format('UPDATE public.%I SET %s WHERE %I = $1', tbl, pol.anonymise_set, col) USING p_uid;
            GET DIAGNOSTICS n = ROW_COUNT;
            IF n > 0 THEN anonymised := anonymised + n; touched := touched + 1; END IF;
          END IF;
        EXCEPTION WHEN foreign_key_violation THEN
          still := still || item;
        END;
      END LOOP;
    END LOOP;
    IF COALESCE(array_length(still, 1), 0) > 0 THEN
      RAISE EXCEPTION 'blocked_by_foreign_key: %', array_to_string(still, ',') USING ERRCODE = 'P0001';
    END IF;

    -- The final delete cascades from auth.users and profiles. A table that is meant to SURVIVE
    -- (retain, or anonymise) must not be one the cascade would delete, or the policy is a lie.
    -- Only a problem when THIS member still has rows there: anonymising that nulls the column leaves
    -- none, and a retained table with a cascading key and a row for this member is the case to stop.
    FOR r IN
      SELECT DISTINCT c.relname AS tbl, split_part(x, '.', 2) AS col
        FROM pg_catalog.pg_constraint k
        JOIN pg_catalog.pg_class c ON c.oid = k.conrelid
        JOIN pg_catalog.pg_namespace s ON s.oid = c.relnamespace
        JOIN private.erasure_policy p ON p.table_name = c.relname
        JOIN unnest(all_cols) x ON split_part(x, '.', 1) = c.relname
       WHERE s.nspname = 'public'
         AND k.contype = 'f' AND k.confdeltype = 'c'
         AND k.confrelid IN ('public.profiles'::regclass, 'auth.users'::regclass)
         AND p.action IN ('retain', 'anonymise')
    LOOP
      EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE %I = $1)', r.tbl, r.col) INTO has_rows USING p_uid;
      IF has_rows THEN
        RAISE EXCEPTION 'retention_defeated_by_cascade: %', r.tbl USING ERRCODE = 'P0001';
      END IF;
    END LOOP;

    DELETE FROM auth.users WHERE id = p_uid;   -- profiles goes with it

    INSERT INTO private.erasure_log (member_hash, status, tables_touched, rows_deleted, rows_anonymised, retained)
    VALUES (hash, 'ok', touched, deleted, anonymised, retained);
  EXCEPTION WHEN OTHERS THEN
    -- Everything in the block above has been rolled back. Record the class of failure only.
    INSERT INTO private.erasure_log (member_hash, status, detail)
    VALUES (hash, 'failed', left(SQLERRM, 200));
    RETURN jsonb_build_object('ok', false, 'error', 'rolled_back', 'detail', left(SQLERRM, 200));
  END;

  RETURN jsonb_build_object('ok', true, 'tables_touched', touched, 'rows_deleted', deleted,
                            'rows_anonymised', anonymised, 'retained', to_jsonb(retained));
END
$fn$;

CREATE OR REPLACE FUNCTION private.run_erasure_queue()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $fn$
DECLARE
  enabled boolean := COALESCE((SELECT bool_value FROM public.platform_settings WHERE key = 'erasure_worker_enabled'), false);
  delay   integer := COALESCE((SELECT NULLIF(text_value, '')::integer FROM public.platform_settings WHERE key = 'erasure_delay_days'), 14);
  r       record;
  done    integer := 0;
  failed  integer := 0;
  skipped integer := 0;
  res     jsonb;
BEGIN
  IF NOT enabled THEN
    RETURN jsonb_build_object('enabled', false);
  END IF;
  IF delay < 1 THEN delay := 14; END IF;
  FOR r IN
    SELECT p.id
      FROM public.profiles p
     WHERE p.erasure_requested_at IS NOT NULL
       AND p.erasure_requested_at < now() - make_interval(days => delay)
       AND NOT COALESCE(p.is_owner, false)
     ORDER BY p.erasure_requested_at
     LIMIT 25
  LOOP
    -- A member that failed in the last 24 hours is skipped, so one bad member cannot block the queue.
    IF EXISTS (SELECT 1 FROM private.erasure_log l
                WHERE l.member_hash = encode(sha256(convert_to(r.id::text, 'utf8')), 'hex')
                  AND l.status = 'failed' AND l.run_at > now() - interval '24 hours') THEN
      skipped := skipped + 1;
      CONTINUE;
    END IF;
    BEGIN
      res := private.purge_user_data(r.id);
      IF COALESCE((res ->> 'ok')::boolean, false) THEN done := done + 1; ELSE failed := failed + 1; END IF;
    EXCEPTION WHEN OTHERS THEN
      failed := failed + 1;
    END;
  END LOOP;
  RETURN jsonb_build_object('enabled', true, 'purged', done, 'failed', failed, 'skipped_recent_failure', skipped);
END
$fn$;

REVOKE ALL ON FUNCTION private.purge_user_data(uuid) FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON FUNCTION private.run_erasure_queue() FROM PUBLIC, anon, authenticated, service_role;

COMMIT;
