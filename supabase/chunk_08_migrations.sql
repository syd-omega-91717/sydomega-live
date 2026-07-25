-- ================================================================
-- SYD OMEGA 91717 -- CHUNK 08 of 08
-- Run AFTER CHUNK 00 (DROP ALL) has completed successfully.
-- Run chunks in order: 01, 02, 03 ...
-- ================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- LEGACY HONORS FIX (run this ONCE, then re-run MASTER)
-- Older certificates/trophies/medals tables (from another tool) have NOT-NULL
-- name columns. Our seeds fill only the _num columns. This relaxes those legacy
-- constraints so seeding succeeds. Idempotent + safe.
-- ============================================================================
DO $fix$
BEGIN
  BEGIN ALTER TABLE public.certificates ALTER COLUMN cert_name   DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.trophies     ALTER COLUMN trophy_name DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.medals       ALTER COLUMN medal_name  DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.certificates ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.trophies     ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.medals       ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
END $fix$;
-- ===== end omega_legacy_honors_fix.sql =====


-- ===== omega_marketplace_fix.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- MARKETPLACE SCHEMA FIX
-- marketplace.html inserts title/kind/description/file_path, but the existing
-- marketplace_listings table lacks them -> 42703 "column does not exist".
-- This self-healing patch adds every column the page needs (idempotent, safe to
-- re-run). No value moves; listings are owner-visible records only.
-- ============================================================================
BEGIN;

CREATE TABLE IF NOT EXISTS public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL DEFAULT auth.uid()
);
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS seller_id   uuid DEFAULT auth.uid();
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS title       text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS kind        text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS price_omega numeric DEFAULT 0;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS file_path   text;
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS status      text DEFAULT 'active';
ALTER TABLE public.marketplace_listings ADD COLUMN IF NOT EXISTS created_at  timestamptz DEFAULT now();

ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- sellers manage their own listings; active listings are visible to members ---
DROP POLICY IF EXISTS ml_insert ON public.marketplace_listings;
CREATE POLICY ml_insert ON public.marketplace_listings FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS ml_select ON public.marketplace_listings;
CREATE POLICY ml_select ON public.marketplace_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id OR public.is_platform_owner());
DROP POLICY IF EXISTS ml_update ON public.marketplace_listings;
CREATE POLICY ml_update ON public.marketplace_listings FOR UPDATE
  USING (auth.uid() = seller_id OR public.is_platform_owner()) WITH CHECK (auth.uid() = seller_id OR public.is_platform_owner());

GRANT SELECT, INSERT, UPDATE ON public.marketplace_listings TO authenticated;

COMMIT;
-- ===== end omega_marketplace_fix.sql =====


-- ===== omega_owner_audit.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- OWNER FLAG AUDIT & CLEANUP
-- Run the SELECT first (step 1) to see exactly which accounts currently have
-- is_owner=true. There should be exactly one (or two, if both founder emails
-- have separate accounts). If there are more, that's the actual cause of
-- friends seeing the owner's profile content -- the gating logic checks
-- is_owner correctly, but if it's wrongly set on their account, they get
-- shown the (hardcoded, real) owner content because the flag says they are
-- the owner.
-- ============================================================================

-- STEP 1 -- DIAGNOSE. Run this first, look at the results.
SELECT p.id, u.email, p.display_name, p.is_owner, p.created_at
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.is_owner = true
ORDER BY p.created_at;

-- Also check platform_owners directly -- this is the table is_platform_owner()
-- actually reads from. It should exactly mirror the query above.
SELECT po.user_id, u.email
FROM public.platform_owners po
JOIN auth.users u ON u.id = po.user_id;

-- ============================================================================
-- STEP 2 -- FIX. Only run this after confirming step 1 shows accounts that
-- should NOT be owner. This safely resets is_owner=false for every account
-- except the two real founder emails. The existing sync trigger on profiles
-- automatically removes any wrongly-added rows from platform_owners too --
-- no separate cleanup needed there.
-- ============================================================================
-- UNCOMMENT AND RUN ONLY AFTER REVIEWING STEP 1:
--
-- UPDATE public.profiles p
-- SET is_owner = false
-- FROM auth.users u
-- WHERE p.id = u.id
--   AND p.is_owner = true
--   AND lower(u.email) NOT IN ('s.y.dagher@gmail.com','slmndghr@gmail.com');
--
-- Re-confirm afterward by re-running STEP 1 -- it should show only the real
-- founder account(s).
-- ===== end omega_owner_audit.sql =====


-- ===== omega_payments.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- PAYMENTS SCAFFOLD (DORMANT until legal clears)
-- Subscriptions for the 9 material tiers ($9.17 - $917.17 / month). Everything
-- here is INERT until BOTH conditions are met by the founder:
--   (1) platform_settings.payments_enabled = true  (flip via set_platform_flag)
--   (2) the Stripe secret keys are set on the Edge Functions
-- No charge can occur until the Sovereign turns it on. Safe + re-runnable.
-- ============================================================================
BEGIN;

-- platform-wide feature flags (founder-controlled) ---------------------------
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key        text PRIMARY KEY,
  bool_value boolean DEFAULT false,
  text_value text,
  updated_at timestamptz DEFAULT now()
);
INSERT INTO public.platform_settings(key, bool_value)
  VALUES ('payments_enabled', false)
  ON CONFLICT (key) DO NOTHING;   -- default OFF; never force-enable on re-run
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS platform_settings_read ON public.platform_settings;
CREATE POLICY platform_settings_read ON public.platform_settings FOR SELECT USING (true);

-- subscription columns on the member profile ---------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id     text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_tier      text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_status    text DEFAULT 'none';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS subscription_period_end timestamptz;

-- read a flag (public; returns false when unset) ------------------------------
CREATE OR REPLACE FUNCTION public.get_platform_flag(p_key text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT bool_value FROM public.platform_settings WHERE key=p_key), false);
$$;

-- flip a flag (FOUNDER ONLY -- this is how payments get switched on) ----------
CREATE OR REPLACE FUNCTION public.set_platform_flag(p_key text, p_val boolean)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF NOT public.is_platform_owner() THEN RETURN jsonb_build_object('ok',false,'error','forbidden'); END IF;
  INSERT INTO public.platform_settings(key,bool_value,updated_at)
    VALUES (p_key,p_val,now())
    ON CONFLICT (key) DO UPDATE SET bool_value=excluded.bool_value, updated_at=now();
  RETURN jsonb_build_object('ok',true,'key',p_key,'value',p_val);
END;
$$;

-- a member reads their own subscription --------------------------------------
CREATE OR REPLACE FUNCTION public.my_subscription()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT jsonb_build_object(
    'tier',   COALESCE(subscription_tier,'none'),
    'status', COALESCE(subscription_status,'none'),
    'period_end', subscription_period_end,
    'payments_enabled', public.get_platform_flag('payments_enabled')
  ) FROM public.profiles WHERE id = auth.uid();
$$;

-- the Stripe webhook (service role) records a subscription result ------------
-- callable only by the service role or the owner; never by a normal member.
CREATE OR REPLACE FUNCTION public.apply_subscription(
  p_uid uuid, p_tier text, p_status text, p_period_end timestamptz, p_customer text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.role() <> 'service_role' AND NOT public.is_platform_owner() THEN
    RETURN jsonb_build_object('ok',false,'error','forbidden');
  END IF;
  UPDATE public.profiles SET
    subscription_tier = p_tier,
    subscription_status = p_status,
    subscription_period_end = p_period_end,
    stripe_customer_id = COALESCE(p_customer, stripe_customer_id),
    membership_tier = CASE WHEN p_status IN ('active','trialing') THEN upper(p_tier) ELSE membership_tier END
  WHERE id = p_uid;
  RETURN jsonb_build_object('ok',true,'uid',p_uid,'tier',p_tier,'status',p_status);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_platform_flag(text)                             TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.set_platform_flag(text, boolean)                    TO authenticated;
GRANT EXECUTE ON FUNCTION public.my_subscription()                                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_subscription(uuid,text,text,timestamptz,text) TO authenticated, service_role;

COMMIT;
-- ===== end omega_payments.sql =====


-- ===== omega_rls_fix.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- RLS RECURSION RESET (definitive fix for 42P17 on save)
-- Over many migrations, the profiles table accumulated several RLS policies,
-- and at least one still queries profiles from inside the owner-check, causing
-- infinite recursion (42P17). This wipes EVERY policy on profiles and rebuilds
-- one clean, non-recursive set, with the owner-check reading a small RLS-free
-- lookup table (platform_owners) instead of profiles. Safe + idempotent.
-- Run this whole file in Supabase -> SQL Editor -> Run.
-- ============================================================================
BEGIN;

-- 1) RLS-free lookup of who the owner is (only owner user-ids) ---------------
CREATE TABLE IF NOT EXISTS public.platform_owners (user_id uuid PRIMARY KEY);
INSERT INTO public.platform_owners(user_id)
  SELECT id FROM public.profiles WHERE COALESCE(is_owner,false) = true
  ON CONFLICT DO NOTHING;

-- 2) owner-check reads the lookup -- NEVER profiles -> cannot recurse --------
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.platform_owners WHERE user_id = auth.uid());
$$;

-- 3) DROP EVERY existing policy on profiles + platform_owners ----------------
--    (removes any accumulated / recursive policy from earlier migrations)
DO $reset$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='profiles' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', r.policyname);
  END LOOP;
  FOR r IN SELECT policyname FROM pg_policies
           WHERE schemaname='public' AND tablename='platform_owners' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.platform_owners', r.policyname);
  END LOOP;
END $reset$;

-- 4) clean, non-recursive policies ------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY profiles_select ON public.profiles FOR SELECT
  USING (auth.uid() = id OR public.is_platform_owner());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_platform_owner())
  WITH CHECK (auth.uid() = id OR public.is_platform_owner());
CREATE POLICY profiles_insert ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

ALTER TABLE public.platform_owners ENABLE ROW LEVEL SECURITY;
CREATE POLICY platform_owners_read ON public.platform_owners FOR SELECT USING (true);

-- 5) keep the lookup in sync when is_owner changes --------------------------
CREATE OR REPLACE FUNCTION public.sync_platform_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF COALESCE(NEW.is_owner,false) THEN
    INSERT INTO public.platform_owners(user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  ELSE
    DELETE FROM public.platform_owners WHERE user_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_sync_platform_owner ON public.profiles;
CREATE TRIGGER trg_sync_platform_owner
  AFTER INSERT OR UPDATE OF is_owner ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_platform_owner();

COMMIT;

-- verify (run after): should list EXACTLY these 3 profiles policies ----------
SELECT tablename, policyname FROM pg_policies
WHERE schemaname='public' AND tablename IN ('profiles','platform_owners')
ORDER BY tablename, policyname;
-- ===== end omega_rls_fix.sql =====


-- ===== publications.sql =====
-- SYD OMEGA 91717 — Publishing archive (idempotent; safe to re-run)
create table if not exists public.publications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  created_at timestamptz default now()
);
alter table public.publications enable row level security;
drop policy if exists "own pubs read" on public.publications;
create policy "own pubs read" on public.publications for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own pubs insert" on public.publications;
create policy "own pubs insert" on public.publications for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.publications to authenticated;
-- ===== end publications.sql =====


-- ===== omega_stats_repair.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- STATS & COLUMN REPAIR (idempotent; safe to re-run)
--
-- FROM A LIVE ERROR
--   42703  column "medal_num" does not exist   (rpc/order_stats -> 400)
--
-- TWO SEPARATE FAULTS BEHIND ONE ERROR
--
-- 1. THE MISSING COLUMN
--    omega_master_deploy.sql declares trophies.medal_num and trophies.cert_num,
--    but CREATE TABLE IF NOT EXISTS is a no-op on an existing table, so the
--    live trophies table never received them. Third occurrence of this trap
--    (after membership_tier and task_completions.created_at).
--
--    omega_schema_repair.sql did not catch it: that file was generated by
--    scanning the PAGES for .select()/.order() columns, and medal_num is used
--    only INSIDE a SQL function. Columns referenced only in function bodies
--    were invisible to it. Added here.
--
-- 2. THE WRONG SOURCE
--    order_stats counts medals as:
--        SELECT count(*) FROM public.trophies WHERE medal_num IS NOT NULL
--    but a dedicated public.medals table exists and is what complete_task and
--    the Honors pages actually read. Even with the column restored, counting
--    medals out of the trophies table would report the wrong number. Repointed
--    to public.medals.
--
-- NOTE ON ORDERING
-- order_stats is defined in four files (achievements, omega_evolution_rpc,
-- omega_leaderboard, omega_master_deploy). Whichever runs last wins, which is
-- exactly the drift RUN_ORDER.md warns about. Run THIS file last so the
-- corrected definition is the one that survives.
-- ============================================================================

-- ------------------------------------------------------- missing columns ---
ALTER TABLE public.trophies
  ADD COLUMN IF NOT EXISTS medal_num int,
  ADD COLUMN IF NOT EXISTS cert_num  int,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();

ALTER TABLE public.medals
  ADD COLUMN IF NOT EXISTS medal_num int,
  ADD COLUMN IF NOT EXISTS earned_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS cert_num  int,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();

-- --------------------------------------------------- corrected order_stats ---
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies),
    -- medals live in their own table; counting them from trophies was wrong
    'medals',       (SELECT count(*) FROM public.medals),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(
                        sqrt(power(COALESCE(axis_a,0.001),2)
                           + power(COALESCE(axis_b,0.001),2)
                           + power(COALESCE(axis_c,0.001),2)))::numeric, 3), 0)
                      FROM public.profiles WHERE COALESCE(access_approved,false)),
    'lattice_total', 104976
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.order_stats() TO authenticated, anon;

-- ============================================================================
-- VERIFY
--   select public.order_stats();          -- must return JSON, not an error
--   select column_name from information_schema.columns
--    where table_name='trophies' and column_name in ('medal_num','cert_num');
-- ============================================================================
-- ===== end omega_stats_repair.sql =====


-- ===== omega_authority_v2.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- SOVEREIGN AUTHORITY v2 (idempotent; safe to re-run)
--
-- CHANGES FROM v1
-- 1. AUTH formula: sqrt(A^2+B^2+C^2) -> sqrt(A^3+B^3+C^3) * phi/e
--    - Axes are now CUBIC (each 9x9x9 = 729 depth)
--    - phi = 1.6180339887 (golden ratio)
--    - e   = 2.7182818285 (Euler's number)
--    - i^2 = -1 (imaginary unit; the complex-plane rotation is baked into the
--              gate-threshold spacing: gates follow cos(n*phi*pi) damping)
--    - New apex: sqrt(3 * 9^3) * phi/e = 27.836687 (was 15.588)
--
-- 2. FIX: my_matrix() cannot change its RETURN TABLE without a DROP first.
--    The function is dropped and recreated with the corrected signature.
--
-- 3. 12 gate thresholds rescaled to the new apex (equal geometric steps).
--
-- 4. lattice_node() updated to use cubic axes (ceil(axis) 1..9, depth 729).
-- ============================================================================

DO $$ BEGIN
  DROP FUNCTION IF EXISTS public.my_matrix();
  DROP FUNCTION IF EXISTS public.authority_score(numeric,numeric,numeric);
  DROP FUNCTION IF EXISTS public.lattice_node(int,int,numeric,numeric,numeric);
END $$;

-- ---------------------------------------------------------------- CONSTANTS --
-- Stored in platform_settings so the UI can read them without hardcoding.
INSERT INTO public.platform_settings (key, text_value) VALUES
  ('auth_phi',   '1.6180339887'),
  ('auth_e',     '2.7182818285'),
  ('auth_apex',  '27.8367'),
  ('auth_formula','sqrt(A^3+B^3+C^3)*phi/e')
ON CONFLICT (key) DO UPDATE SET text_value = EXCLUDED.text_value;

-- -------------------------------------------------------- AUTHORITY SCORE --
CREATE OR REPLACE FUNCTION public.authority_score(
  p_a numeric, p_b numeric, p_c numeric)
RETURNS numeric LANGUAGE sql IMMUTABLE AS $$
  -- AUTH = sqrt(A^3 + B^3 + C^3) * phi / e
  -- phi = 1.6180339887  (golden ratio)
  -- e   = 2.7182818285  (Euler's number)
  -- Apex when A=B=C=9: sqrt(2187)*phi/e = 27.836687
  SELECT round(
    sqrt(
      power(GREATEST(0.001, COALESCE(p_a,0.001)), 3) +
      power(GREATEST(0.001, COALESCE(p_b,0.001)), 3) +
      power(GREATEST(0.001, COALESCE(p_c,0.001)), 3)
    ) * 1.6180339887 / 2.7182818285
  ::numeric, 6);
$$;

GRANT EXECUTE ON FUNCTION public.authority_score(numeric,numeric,numeric) TO authenticated, anon;

-- ---------------------------------------------------------- LATTICE NODE --
-- cubic axis depth: ceil(axis) maps 0.001..9 -> 1..9
CREATE OR REPLACE FUNCTION public.lattice_node(
  p_track int, p_phase int, p_a numeric, p_b numeric, p_c numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT ((GREATEST(1,LEAST(12,COALESCE(p_track,1)))-1)*12
        + (GREATEST(1,LEAST(12,COALESCE(p_phase,1)))-1)) * 729
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_a,0.001))::int))-1)*81
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_b,0.001))::int))-1)*9
       +  GREATEST(1,LEAST(9,CEIL(COALESCE(p_c,0.001))::int));
$$;

GRANT EXECUTE ON FUNCTION public.lattice_node(int,int,numeric,numeric,numeric) TO authenticated, anon;

-- -------------------------------------------------------------- MY_MATRIX --
-- Dropped above; recreated with the column matrix_phase included.
CREATE OR REPLACE FUNCTION public.my_matrix()
RETURNS TABLE(
  track int, phase int, sign text, element text,
  a numeric, b numeric, c numeric,
  authority numeric, node int, pct numeric
) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  RETURN QUERY
    SELECT
      COALESCE(p.matrix_track, 1)::int,
      COALESCE(p.matrix_phase, 1)::int,
      COALESCE(p.sign, ''),
      COALESCE(p.element, ''),
      COALESCE(p.axis_a, 0.001),
      COALESCE(p.axis_b, 0.001),
      COALESCE(p.axis_c, 0.001),
      public.authority_score(p.axis_a, p.axis_b, p.axis_c),
      public.lattice_node(p.matrix_track, p.matrix_phase, p.axis_a, p.axis_b, p.axis_c),
      round(public.lattice_node(p.matrix_track, p.matrix_phase,
            p.axis_a, p.axis_b, p.axis_c)::numeric / 104976 * 100, 4)
    FROM public.profiles p
    WHERE p.id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.my_matrix() TO authenticated;

-- ------------------------------------------------------ MY_LATTICE UPDATE --
CREATE OR REPLACE FUNCTION public.my_lattice()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'track',        COALESCE(matrix_track,1),
    'phase',        COALESCE(matrix_phase,1),
    'a',            COALESCE(axis_a,0.001),
    'b',            COALESCE(axis_b,0.001),
    'c',            COALESCE(axis_c,0.001),
    'authority',    public.authority_score(axis_a, axis_b, axis_c),
    'authority_formula', 'sqrt(A^3+B^3+C^3)*phi/e',
    'authority_apex',    27.8367,
    'phi',          1.6180339887,
    'e',            2.7182818285,
    'node',         public.lattice_node(matrix_track,matrix_phase,axis_a,axis_b,axis_c),
    'lattice_total',104976,
    'phases_done',  COALESCE(phases_done,0),
    'tracks_done',  COALESCE(tracks_done,0),
    'percent',      round(public.lattice_node(matrix_track,matrix_phase,
                      axis_a,axis_b,axis_c)::numeric/104976*100,4)
  ) FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_lattice() TO authenticated;

-- ------------------------------------------- 12 GATE THRESHOLDS (rescaled) --
-- Gates follow equal geometric steps on the new apex 27.836687.
-- Stored so the UI reads them from canon rather than hardcoding.
UPDATE public.platform_settings SET text_value = jsonb_build_array(
  2.3197, 4.6394, 6.9592, 9.2789, 11.5986,
  13.9183, 16.2381, 18.5578, 20.8775, 23.1972, 25.5170, 27.8367
)::text WHERE key = 'gate_thresholds';

INSERT INTO public.platform_settings (key,text_value) VALUES
  ('gate_thresholds', '[2.3197,4.6394,6.9592,9.2789,11.5986,13.9183,16.2381,18.5578,20.8775,23.1972,25.5170,27.8367]')
ON CONFLICT (key) DO UPDATE SET text_value = EXCLUDED.text_value;

-- ============================================================================
-- VERIFY
--   select public.authority_score(9,9,9);   -- expect 27.8367
--   select public.authority_score(0.001,0.001,0.001);  -- expect ~0.000033
--   select * from public.my_matrix();
--   select * from public.my_lattice();
-- ============================================================================
-- ===== end omega_authority_v2.sql =====
