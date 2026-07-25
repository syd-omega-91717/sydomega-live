-- ================================================================
-- SYD OMEGA 91717 -- CHUNK 06 of 08
-- Run AFTER CHUNK 00 (DROP ALL) has completed successfully.
-- Run chunks in order: 01, 02, 03 ...
-- ================================================================
-- ============================================================================
-- SYD OMEGA 91717 -- LATTICE ENGINE (idempotent; safe to re-run)
--
-- WHY THIS EXISTS
-- Canon declares a lattice of 12 tracks x 12 phases x 9 x 9 x 9 = 104,976
-- nodes. The engine stored three numbers -- axis_a, axis_b, axis_c -- each
-- capped at 9. That expresses 729 positions: ONE cube. 0.69% of the declared
-- lattice. Track and phase existed in canon, in omega-canon.json, and all over
-- the interface, but not in the engine, so no member could ever occupy a node
-- outside the first cube. The spine was decorative.
--
-- WHAT THIS ADDS
--   matrix_track  1-12  which sign-track the member walks (from their sign)
--   matrix_phase  1-12  which phase within that track
--   node_index    1-104,976  absolute position in the lattice
--
-- HOW A MEMBER MOVES
-- Filling the 9x9x9 cube (all three axes reaching 9) completes a PHASE. The
-- phase advances and the axes reset to the canonical 0.001 start, so the next
-- cube begins. Completing phase 12 completes the TRACK. Twelve tracks is the
-- whole lattice.
--
-- WHY THE AXES RESET
-- They are coordinates INSIDE the current cube, not a lifetime score. Lifetime
-- work is preserved in task_completions, evolution_events, certificates,
-- trophies and medals -- none of which are touched here. Authority is still
-- sqrt(a^2+b^2+c^2) within the cube; total progress is node_index.
--
-- BASELINE CORRECTION
-- complete_task set missing axes to 1. omega_zero_start.sql sets the column
-- default to 0.001 and every page now falls back to 0.001. The engine was the
-- last place still claiming 1; corrected here.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS matrix_track int  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS matrix_phase int  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS node_index   int  DEFAULT 1,
  ADD COLUMN IF NOT EXISTS phases_done  int  DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tracks_done  int  DEFAULT 0;

-- Track is deterministic from the member's sign (canon: one track per sign).
CREATE OR REPLACE FUNCTION public.track_for_sign(p_sign text)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT COALESCE(
    CASE lower(coalesce(p_sign,''))
      WHEN 'aries' THEN 1  WHEN 'taurus' THEN 2  WHEN 'gemini' THEN 3
      WHEN 'cancer' THEN 4 WHEN 'leo' THEN 5     WHEN 'virgo' THEN 6
      WHEN 'libra' THEN 7  WHEN 'scorpio' THEN 8 WHEN 'sagittarius' THEN 9
      WHEN 'capricorn' THEN 10 WHEN 'aquarius' THEN 11 WHEN 'pisces' THEN 12
    END, 1);
$$;

-- Absolute position in the 104,976-node lattice.
--   node = ((track-1)*12 + (phase-1)) * 729
--        + (ca-1)*81 + (cb-1)*9 + cc      where ca/cb/cc are ceil(axis) in 1..9
CREATE OR REPLACE FUNCTION public.lattice_node(
  p_track int, p_phase int, p_a numeric, p_b numeric, p_c numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT ((GREATEST(1,LEAST(12,COALESCE(p_track,1))) - 1) * 12
        + (GREATEST(1,LEAST(12,COALESCE(p_phase,1))) - 1)) * 729
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_a,0.001))::int)) - 1) * 81
       + (GREATEST(1,LEAST(9,CEIL(COALESCE(p_b,0.001))::int)) - 1) * 9
       +  GREATEST(1,LEAST(9,CEIL(COALESCE(p_c,0.001))::int));
$$;

GRANT EXECUTE ON FUNCTION public.track_for_sign(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.lattice_node(int,int,numeric,numeric,numeric) TO authenticated, anon;

-- Backfill existing members onto the lattice.
UPDATE public.profiles
   SET matrix_track = public.track_for_sign(sign),
       matrix_phase = COALESCE(matrix_phase, 1)
 WHERE matrix_track IS NULL OR matrix_track = 1;

UPDATE public.profiles
   SET node_index = public.lattice_node(matrix_track, matrix_phase, axis_a, axis_b, axis_c);

-- ---------------------------------------------------------------------------
-- The engine. Same signature and same return contract as before, so every
-- existing caller keeps working; the body now advances the full lattice.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.complete_task(
  p_kind text, p_task text, p_axis text DEFAULT 'a',
  p_title text DEFAULT NULL, p_weight numeric DEFAULT 0.25)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
  ax  text := lower(coalesce(p_axis,'a'));
  w   numeric := coalesce(p_weight, 0.25);
  a numeric; b numeric; c numeric;
  tr int; ph int;
  old_v numeric; new_v numeric;
  crossed boolean := false;
  phase_done boolean := false;
  track_done boolean := false;
  unlocked jsonb := '[]'::jsonb;
  auth_v numeric; node int;
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('applied', false, 'error', 'not authenticated');
  END IF;
  IF ax NOT IN ('a','b','c') THEN ax := 'a'; END IF;

  INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT (id) DO NOTHING;

  -- canonical start is 0.001, not 1 (omega_zero_start.sql)
  UPDATE public.profiles
     SET axis_a = COALESCE(axis_a, 0.001),
         axis_b = COALESCE(axis_b, 0.001),
         axis_c = COALESCE(axis_c, 0.001),
         matrix_track = COALESCE(matrix_track, public.track_for_sign(sign)),
         matrix_phase = COALESCE(matrix_phase, 1)
   WHERE id = uid;

  -- already banked -> report position, change nothing
  IF EXISTS (SELECT 1 FROM public.task_completions WHERE user_id = uid AND task = p_task) THEN
    SELECT axis_a,axis_b,axis_c,matrix_track,matrix_phase INTO a,b,c,tr,ph
      FROM public.profiles WHERE id = uid;
    auth_v := round(sqrt(a*a+b*b+c*c)::numeric, 3);
    RETURN jsonb_build_object('applied', false, 'axis', ax,
      'value', CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END,
      'a',a,'b',b,'c',c,'authority',auth_v,
      'track',tr,'phase',ph,
      'node', public.lattice_node(tr,ph,a,b,c),
      'lattice_total', 104976, 'unlocked', unlocked);
  END IF;

  INSERT INTO public.task_completions (user_id, task, kind) VALUES (uid, p_task, p_kind);

  SELECT axis_a,axis_b,axis_c,matrix_track,matrix_phase INTO a,b,c,tr,ph
    FROM public.profiles WHERE id = uid;

  old_v := CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END;
  new_v := LEAST(9, old_v + w);
  crossed := floor(new_v) > floor(old_v);
  IF ax='a' THEN a := new_v; ELSIF ax='b' THEN b := new_v; ELSE c := new_v; END IF;

  -- credential on an integer crossing (unchanged behaviour)
  IF crossed THEN
    IF ax='a' THEN
      INSERT INTO public.certificates (user_id,title,milestone)
        VALUES (uid, COALESCE(p_title,'Knowledge Node'), 'Knowledge '||floor(new_v)::text);
      unlocked := unlocked || jsonb_build_object('type','certificate','at',floor(new_v));
    ELSIF ax='b' THEN
      INSERT INTO public.trophies (user_id,trophy_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','trophy','at',floor(new_v));
    ELSE
      INSERT INTO public.trophies (user_id,medal_num) VALUES (uid, floor(new_v)::int);
      unlocked := unlocked || jsonb_build_object('type','medal','at',floor(new_v));
    END IF;
  END IF;

  -- CUBE COMPLETE -> advance the phase, reset the coordinates, begin the next cube
  -- CUBE COMPLETE -> advance. The apex (track 12, phase 12, cube full) is
  -- TERMINAL: without this the member wrapped back to phase 1 forever and
  -- node_index went DOWN -- progress appearing to reverse at the summit.
  IF a >= 9 AND b >= 9 AND c >= 9 THEN
    IF tr >= 12 AND ph >= 12 THEN
      -- apex reached: hold position, award once, never wrap
      a := 9; b := 9; c := 9;
      IF NOT EXISTS (SELECT 1 FROM public.task_completions
                      WHERE user_id = uid AND task = '__lattice_apex__') THEN
        INSERT INTO public.task_completions (user_id, task, kind)
          VALUES (uid, '__lattice_apex__', 'lattice');
        unlocked := unlocked || jsonb_build_object('type','apex','at',104976);
      END IF;
    ELSE
      phase_done := true;
      IF ph >= 12 THEN
        track_done := true;
        ph := 1;
        tr := tr + 1;
        UPDATE public.profiles SET tracks_done = COALESCE(tracks_done,0) + 1 WHERE id = uid;
        unlocked := unlocked || jsonb_build_object('type','track','at',tr);
      ELSE
        ph := ph + 1;
        unlocked := unlocked || jsonb_build_object('type','phase','at',ph);
      END IF;
      UPDATE public.profiles SET phases_done = COALESCE(phases_done,0) + 1 WHERE id = uid;
      a := 0.001; b := 0.001; c := 0.001;
    END IF;
  END IF;

  auth_v := round(sqrt(a*a+b*b+c*c)::numeric, 3);
  node := public.lattice_node(tr, ph, a, b, c);

  INSERT INTO public.evolution_events (user_id, axis, note)
    VALUES (uid, ax, COALESCE(p_title, p_kind||' / '||p_task));

  UPDATE public.profiles
     SET axis_a=a, axis_b=b, axis_c=c,
         matrix_track=tr, matrix_phase=ph, node_index=node
   WHERE id = uid;

  RETURN jsonb_build_object('applied', true, 'axis', ax, 'value', new_v,
    'a',a,'b',b,'c',c,'authority',auth_v,
    'track',tr,'phase',ph,'node',node,'lattice_total',104976,
    'phase_completed',phase_done,'track_completed',track_done,
    'unlocked', unlocked);
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;

-- Member's own lattice standing.
CREATE OR REPLACE FUNCTION public.my_lattice()
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT jsonb_build_object(
    'track', COALESCE(matrix_track,1), 'phase', COALESCE(matrix_phase,1),
    'a', COALESCE(axis_a,0.001), 'b', COALESCE(axis_b,0.001), 'c', COALESCE(axis_c,0.001),
    'authority', round(sqrt(COALESCE(axis_a,0.001)^2 + COALESCE(axis_b,0.001)^2 + COALESCE(axis_c,0.001)^2)::numeric,3),
    'node', public.lattice_node(matrix_track, matrix_phase, axis_a, axis_b, axis_c),
    'lattice_total', 104976,
    'phases_done', COALESCE(phases_done,0), 'tracks_done', COALESCE(tracks_done,0),
    'percent', round((public.lattice_node(matrix_track,matrix_phase,axis_a,axis_b,axis_c)::numeric / 104976) * 100, 4)
  ) FROM public.profiles WHERE id = auth.uid();
$$;

GRANT EXECUTE ON FUNCTION public.my_lattice() TO authenticated;

CREATE INDEX IF NOT EXISTS profiles_lattice_idx ON public.profiles (matrix_track, matrix_phase, node_index);

-- ============================================================================
-- VERIFY
--   select public.lattice_node(1,1,0.001,0.001,0.001);   -- expect 1
--   select public.lattice_node(12,12,9,9,9);             -- expect 104976
--   select public.my_lattice();
-- ============================================================================
-- ===== end omega_lattice_engine.sql =====


-- ===== omega_schema_repair.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- LIVE SCHEMA REPAIR (idempotent; safe to re-run)
--
-- Built from three real production errors in the Supabase logs:
--   42501  permission denied for table medals                 -> 403 every read
--   42703  column profiles.demo_watched_at does not exist     -> 400
--   42703  column task_completions.created_at does not exist  -> 400
--
-- ROOT CAUSE
-- CREATE TABLE IF NOT EXISTS is a NO-OP on an existing table. Both
-- omega_master_deploy.sql and omega_backend_sync.sql declare
-- task_completions.created_at, but the live table predates that declaration,
-- so it never applied. The file is not evidence of what is deployed -- the
-- same trap that produced the membership_tier integer/text mismatch.
--
-- medals has RLS and two policies but NO GRANT. Postgres checks table
-- privileges BEFORE row policies, so reads failed with a hard 403 instead of
-- returning no rows. RLS without a GRANT is a locked door.
--
-- HOW THIS WAS BUILT
-- Every .select() and .order() column in the shipped pages AND shared scripts
-- was collected, then each column's type resolved from its real declaration in
-- CREATE TABLE bodies and ALTER ... ADD COLUMN statements. Two earlier drafts
-- were wrong and discarded: the first guessed types and would have created
-- axis_a as text and access_approved as text; the second scanned only .html
-- and therefore missed demo_watched_at, which is queried from
-- omega-demo-video.js. Nothing below is inferred -- any column whose declared
-- type could not be found was omitted rather than invented.
-- ============================================================================

-- ---------------------------------------------------------------- GRANTS ---
GRANT SELECT, INSERT ON public.medals TO authenticated;
REVOKE ALL ON public.medals FROM anon;

-- profiles carries no explicit grant anywhere in the migration set. It works
-- today on Supabase default privileges, but `medals` proved those defaults are
-- not universal -- and profiles is the one table that, if it ever loses access,
-- takes down sign-in, onboarding, the access gate and the whole matrix with it.
-- Stated explicitly rather than assumed. RLS still restricts rows to the owner.
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- ------------------------------------------------ COLUMNS THE APP QUERIES ---
ALTER TABLE public.automation_rules
  ADD COLUMN IF NOT EXISTS is_on boolean,
  ADD COLUMN IF NOT EXISTS trigger_key text;

ALTER TABLE public.bloodline_nodes
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS cert_num int,
  ADD COLUMN IF NOT EXISTS issued_at timestamptz,
  ADD COLUMN IF NOT EXISTS milestone text,
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.character_records
  ADD COLUMN IF NOT EXISTS dominant_trait text,
  ADD COLUMN IF NOT EXISTS inheritance_mode text,
  ADD COLUMN IF NOT EXISTS legacy_statement text,
  ADD COLUMN IF NOT EXISTS name text;

ALTER TABLE public.commission_contracts
  ADD COLUMN IF NOT EXISTS commission_rate numeric,
  ADD COLUMN IF NOT EXISTS commission_value numeric,
  ADD COLUMN IF NOT EXISTS counterparty text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS deal_value numeric,
  ADD COLUMN IF NOT EXISTS reference text,
  ADD COLUMN IF NOT EXISTS scope text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS terms text;

ALTER TABLE public.consult_requests
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- ===== dispatches.sql =====
-- SYD OMEGA 91717 — The Wire (shared member dispatch feed; idempotent)
create table if not exists public.dispatches (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  sign text,
  body text not null,
  created_at timestamptz default now()
);
alter table public.dispatches enable row level security;
drop policy if exists "wire read" on public.dispatches;
create policy "wire read" on public.dispatches for select to authenticated using (true);
drop policy if exists "wire insert" on public.dispatches;
create policy "wire insert" on public.dispatches for insert to authenticated with check (auth.uid() = user_id);
grant select, insert on public.dispatches to authenticated;
-- ===== end dispatches.sql =====
ALTER TABLE public.dispatches
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS sign text;

ALTER TABLE public.event_rsvps
  ADD COLUMN IF NOT EXISTS event_ref text;

ALTER TABLE public.evolution_events
  ADD COLUMN IF NOT EXISTS axis text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS note text;

ALTER TABLE public.family_nodes
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.health_logs
  ADD COLUMN IF NOT EXISTS body numeric,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS energy numeric,
  ADD COLUMN IF NOT EXISTS heart numeric,
  ADD COLUMN IF NOT EXISTS mind numeric,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS soul numeric,
  ADD COLUMN IF NOT EXISTS total numeric;

ALTER TABLE public.heritage_records
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS era text,
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.marketplace_listings
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

ALTER TABLE public.medals
  ADD COLUMN IF NOT EXISTS earned_at timestamptz,
  ADD COLUMN IF NOT EXISTS medal_num int;

ALTER TABLE public.media_reservations
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS duration text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS price_omega numeric,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS zone text;

ALTER TABLE public.member_perks
  ADD COLUMN IF NOT EXISTS perk_id text;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_approved boolean,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS axis_a numeric,
  ADD COLUMN IF NOT EXISTS axis_b numeric,
  ADD COLUMN IF NOT EXISTS axis_c numeric,
  ADD COLUMN IF NOT EXISTS bg_color text,
  ADD COLUMN IF NOT EXISTS certificates_earned int,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS demo_watched_at timestamptz,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS element text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS is_owner boolean,
  ADD COLUMN IF NOT EXISTS is_public boolean,
  ADD COLUMN IF NOT EXISTS is_trial boolean,
  ADD COLUMN IF NOT EXISTS kyc_status text,
  ADD COLUMN IF NOT EXISTS medals_earned int,
  ADD COLUMN IF NOT EXISTS membership_tier text,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS sign text,
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS terms_accepted boolean,
  ADD COLUMN IF NOT EXISTS trial_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS trophies_earned int;

ALTER TABLE public.publications
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS title text;

ALTER TABLE public.sim_trades
  ADD COLUMN IF NOT EXISTS amount int,
  ADD COLUMN IF NOT EXISTS from_user uuid,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS to_user uuid;

ALTER TABLE public.social_broadcasts
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS networks text;

ALTER TABLE public.social_connections
  ADD COLUMN IF NOT EXISTS handle text,
  ADD COLUMN IF NOT EXISTS platform text;

ALTER TABLE public.sovereign_points_ledger
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS delta int,
  ADD COLUMN IF NOT EXISTS note text,
  ADD COLUMN IF NOT EXISTS reason text;

ALTER TABLE public.task_completions
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS kind text,
  ADD COLUMN IF NOT EXISTS task text;

ALTER TABLE public.travel_journeys
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS destination text,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS purpose text;

ALTER TABLE public.trophies
  ADD COLUMN IF NOT EXISTS earned_at timestamptz,
  ADD COLUMN IF NOT EXISTS trophy_num int;

-- ============================================================================
-- VERIFY -- each should return zero rows
-- ============================================================================
-- select 'medals grant missing' where not exists (
--   select 1 from information_schema.role_table_grants
--    where table_schema='public' and table_name='medals' and grantee='authenticated');
-- select 'task_completions.created_at missing' where not exists (
--   select 1 from information_schema.columns
--    where table_schema='public' and table_name='task_completions' and column_name='created_at');
-- select 'profiles.demo_watched_at missing' where not exists (
--   select 1 from information_schema.columns
--    where table_schema='public' and table_name='profiles' and column_name='demo_watched_at');

-- ── ADVERTISEMENTS TABLE ───────────────────────────────────────────────────
-- Clients pay to place ads; subscribers can hide them.
CREATE TABLE IF NOT EXISTS public.advertisements (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company         text NOT NULL,
  contact_email   text NOT NULL,
  title           text NOT NULL,
  description     text,
  url             text,
  category        text,
  rate_tier       text DEFAULT 'weekly',
  status          text DEFAULT 'pending',  -- pending | approved | rejected
  submitted_by    uuid REFERENCES public.profiles(id),
  approved_by     uuid REFERENCES public.profiles(id),
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "owner_manage_ads" ON public.advertisements;
CREATE POLICY "owner_manage_ads" ON public.advertisements
  FOR ALL USING (public.is_platform_owner())
  WITH CHECK (public.is_platform_owner());
DROP POLICY IF EXISTS "read_approved_ads" ON public.advertisements;
CREATE POLICY "read_approved_ads" ON public.advertisements
  FOR SELECT USING (status = 'approved' OR submitted_by = auth.uid());
GRANT SELECT, INSERT ON public.advertisements TO authenticated;
GRANT SELECT ON public.advertisements TO anon;
-- ===== end omega_schema_repair.sql =====


-- ===== achievements.sql =====
-- ============================================================================
-- SYD OMEGA 91717 -- ACHIEVEMENT ALIGNMENT
-- Audit fix: the live pages expect a structure the engine did not produce.
--   trophies.html reads  .from('medals')            -> table did not exist
--   trophies.html reads  certificates.cert_num      -> column did not exist
--   honors.html  reads   profiles.nodes_earned      -> engine wrote nodes_cleared
--   pages show 12 curated trophies/medals/certificates, engine only made ~8
-- This aligns the schema + engine to the live pages. The 12 are a journey:
-- as each axis climbs 1 -> 9, that track lights its 12 milestones in order
-- (all 12 at the apex). Knowledge -> Certificates, Mastery -> Trophies,
-- Contribution -> Medals. Run AFTER the other SQL. Safe + re-runnable. ASCII.
-- ============================================================================
BEGIN;

-- 1) the medals table (mirrors trophies) ------------------------------------
-- NOTE: a medals table may already exist from an earlier step with a different
-- shape, so CREATE IF NOT EXISTS alone is not enough -- we also guarantee every
-- column the engine/pages need, whether the table is new or pre-existing.
CREATE TABLE IF NOT EXISTS public.medals (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  medal_num  int,
  earned_at  timestamptz DEFAULT now(),
  issued_at  timestamptz DEFAULT now()
);
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS user_id   uuid;
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS medal_num int;
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS earned_at timestamptz DEFAULT now();
ALTER TABLE public.medals ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();
-- if an id column pre-exists without a default, give it one so inserts succeed
DO $idfix$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='medals' AND column_name='id') THEN
    BEGIN ALTER TABLE public.medals ALTER COLUMN id SET DEFAULT gen_random_uuid();
    EXCEPTION WHEN others THEN NULL; END;
  END IF;
END $idfix$;
ALTER TABLE public.medals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS medals_select_own ON public.medals;
CREATE POLICY medals_select_own ON public.medals FOR SELECT
  USING (auth.uid() = user_id OR public.is_platform_owner());
CREATE UNIQUE INDEX IF NOT EXISTS medals_user_num_uniq ON public.medals(user_id, medal_num);

-- 2) guarantee every column the engine + pages touch (any pre-existing shape)-
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS user_id   uuid;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS title     text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS milestone text;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS cert_num  int;
ALTER TABLE public.certificates ADD COLUMN IF NOT EXISTS issued_at timestamptz DEFAULT now();
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS user_id    uuid;
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS trophy_num int;
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS earned_at  timestamptz DEFAULT now();
ALTER TABLE public.trophies     ADD COLUMN IF NOT EXISTS issued_at  timestamptz DEFAULT now();
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS nodes_earned        int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS nodes_cleared       int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS certificates_earned int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS trophies_earned     int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS medals_earned       int     DEFAULT 0;
ALTER TABLE public.profiles     ADD COLUMN IF NOT EXISTS authority           numeric DEFAULT 0;

-- now the uniqueness guards (columns above are guaranteed to exist)
CREATE UNIQUE INDEX IF NOT EXISTS certificates_user_num_uniq
  ON public.certificates(user_id, cert_num) WHERE cert_num IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS trophies_user_num_uniq
  ON public.trophies(user_id, trophy_num) WHERE trophy_num IS NOT NULL;

-- 3) migrate any medals previously stored on trophies.medal_num -------------
-- Only runs if that column actually exists (older engines stored medals there;
-- many schemas never had it). Guarded so it cannot error on either shape.
DO $migrate$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='trophies' AND column_name='medal_num') THEN
    INSERT INTO public.medals (user_id, medal_num, earned_at)
      SELECT user_id, medal_num, COALESCE(earned_at, now())
      FROM public.trophies WHERE medal_num IS NOT NULL
      ON CONFLICT (user_id, medal_num) DO NOTHING;
    DELETE FROM public.trophies WHERE medal_num IS NOT NULL AND trophy_num IS NULL;
  END IF;
END $migrate$;

-- backfill cert_num from milestone text, only if a milestone column exists
DO $certbf$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_schema='public' AND table_name='certificates' AND column_name='milestone') THEN
    UPDATE public.certificates
      SET cert_num = NULLIF(regexp_replace(COALESCE(milestone::text,''),'\D','','g'),'')::int
      WHERE cert_num IS NULL AND milestone::text ~ '\d';
  END IF;
END $certbf$;

-- 4) the award model: how many of a track's 12 milestones an axis has lit ----
CREATE OR REPLACE FUNCTION public.milestones_for_axis(v numeric)
RETURNS int LANGUAGE sql IMMUTABLE AS $$
  SELECT GREATEST(0, LEAST(12, floor((COALESCE(v,1) - 1) / 8.0 * 12)::int));
$$;

-- 5) complete_task -- now lights the 12 curated milestones per track ---------
CREATE OR REPLACE FUNCTION public.complete_task(
  p_kind text, p_task text, p_axis text DEFAULT 'a',
  p_title text DEFAULT NULL, p_weight numeric DEFAULT 0.25
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  uid uuid := auth.uid();
  ax text := lower(coalesce(p_axis,'a'));
  w numeric := coalesce(p_weight,0.25);
  a numeric; b numeric; c numeric;
  old_v numeric; new_v numeric;
  old_m int; new_m int; k int;
  unlocked jsonb := '[]'::jsonb;
  auth_v numeric;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('applied',false,'error','not authenticated'); END IF;
  IF ax NOT IN ('a','b','c') THEN ax := 'a'; END IF;

  INSERT INTO public.profiles (id) VALUES (uid) ON CONFLICT (id) DO NOTHING;
  UPDATE public.profiles SET axis_a=COALESCE(axis_a,1), axis_b=COALESCE(axis_b,1), axis_c=COALESCE(axis_c,1) WHERE id=uid;

  IF EXISTS (SELECT 1 FROM public.task_completions WHERE user_id=uid AND task=p_task) THEN
    SELECT axis_a,axis_b,axis_c INTO a,b,c FROM public.profiles WHERE id=uid;
    auth_v := round(sqrt(a*a+b*b+c*c)::numeric,3);
    RETURN jsonb_build_object('applied',false,'axis',ax,
      'value',CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END,
      'a',a,'b',b,'c',c,'authority',auth_v,'unlocked',unlocked);
  END IF;

  INSERT INTO public.task_completions (user_id,task,kind) VALUES (uid,p_task,p_kind);

  SELECT axis_a,axis_b,axis_c INTO a,b,c FROM public.profiles WHERE id=uid;
  old_v := CASE ax WHEN 'a' THEN a WHEN 'b' THEN b ELSE c END;
  new_v := LEAST(9, old_v + w);
  IF ax='a' THEN a:=new_v; ELSIF ax='b' THEN b:=new_v; ELSE c:=new_v; END IF;
  auth_v := round(sqrt(a*a+b*b+c*c)::numeric,3);

  INSERT INTO public.evolution_events (user_id,axis,note)
    VALUES (uid,ax,COALESCE(p_title,p_kind||' / '||p_task));

  -- light any newly reached milestones on this track (curated 1..12)
  old_m := public.milestones_for_axis(old_v);
  new_m := public.milestones_for_axis(new_v);
  IF new_m > old_m THEN
    FOR k IN (old_m+1)..new_m LOOP
      IF ax='a' THEN
        INSERT INTO public.certificates (user_id,title,milestone,cert_num)
          SELECT uid, COALESCE(p_title,'Sovereign Certificate '||k), k, k
          WHERE NOT EXISTS (SELECT 1 FROM public.certificates WHERE user_id=uid AND cert_num=k);
        unlocked := unlocked || jsonb_build_object('type','certificate','n',k);
      ELSIF ax='b' THEN
        INSERT INTO public.trophies (user_id,trophy_num)
          SELECT uid,k WHERE NOT EXISTS (SELECT 1 FROM public.trophies WHERE user_id=uid AND trophy_num=k);
        unlocked := unlocked || jsonb_build_object('type','trophy','n',k);
      ELSE
        INSERT INTO public.medals (user_id,medal_num)
          SELECT uid,k WHERE NOT EXISTS (SELECT 1 FROM public.medals WHERE user_id=uid AND medal_num=k);
        unlocked := unlocked || jsonb_build_object('type','medal','n',k);
      END IF;
    END LOOP;
  END IF;

  -- composite gate at (3,3,3)/(6,6,6)/(9,9,9)
  IF floor(a)=floor(b) AND floor(b)=floor(c) AND floor(new_v) IN (3,6,9)
     AND floor(new_v) > floor(old_v) THEN
    unlocked := unlocked || jsonb_build_object('type','gate','at',floor(new_v));
  END IF;

  UPDATE public.profiles SET
    axis_a=a, axis_b=b, axis_c=c, authority=auth_v,
    nodes_earned        = (SELECT count(*) FROM public.task_completions WHERE user_id=uid),
    nodes_cleared       = (SELECT count(*) FROM public.task_completions WHERE user_id=uid),
    certificates_earned = (SELECT count(*) FROM public.certificates WHERE user_id=uid),
    trophies_earned     = (SELECT count(*) FROM public.trophies WHERE user_id=uid AND trophy_num IS NOT NULL),
    medals_earned       = (SELECT count(*) FROM public.medals WHERE user_id=uid)
  WHERE id=uid;

  RETURN jsonb_build_object('applied',true,'axis',ax,'value',new_v,
    'a',a,'b',b,'c',c,'authority',auth_v,'unlocked',unlocked);
END;
$$;

-- 6) order_stats -- medals now come from the medals table --------------------
CREATE OR REPLACE FUNCTION public.order_stats()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE r jsonb;
BEGIN
  SELECT jsonb_build_object(
    'members',      (SELECT count(*) FROM public.profiles),
    'approved',     (SELECT count(*) FROM public.profiles WHERE COALESCE(access_approved,false)),
    'certificates', (SELECT count(*) FROM public.certificates),
    'trophies',     (SELECT count(*) FROM public.trophies WHERE trophy_num IS NOT NULL),
    'medals',       (SELECT count(*) FROM public.medals),
    'nodes',        (SELECT count(*) FROM public.task_completions),
    'events',       (SELECT count(*) FROM public.evolution_events),
    'avg_authority',(SELECT COALESCE(round(avg(sqrt(power(COALESCE(axis_a,1),2)+power(COALESCE(axis_b,1),2)+power(COALESCE(axis_c,1),2)))::numeric,3),0) FROM public.profiles),
    'elements',     COALESCE((SELECT jsonb_object_agg(el,cnt) FROM (
                       SELECT initcap(element) el, count(*) cnt FROM public.profiles
                       WHERE element IS NOT NULL AND btrim(element)<>'' GROUP BY initcap(element)) e),'{}'::jsonb)
  ) INTO r; RETURN r;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_task(text,text,text,text,numeric) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.order_stats()             TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.milestones_for_axis(numeric) TO authenticated, anon;

COMMIT;

-- ============================================================================
-- ===== end achievements.sql =====


-- ===== conversations.sql =====
CREATE TABLE IF NOT EXISTS conversations (
 id UUID PRIMARY KEY,
 user_id UUID,
 created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
 id UUID PRIMARY KEY,
 conversation_id UUID,
 role TEXT,
 content TEXT,
 created_at TIMESTAMP DEFAULT NOW()
);
-- ===== end conversations.sql =====




-- ===== family_nodes.sql =====
-- SYD OMEGA 91717 — Family / Heritage tree (idempotent; safe to re-run)
create table if not exists public.family_nodes (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  relation text not null,
  sign text,
  is_heir boolean not null default false,
  created_at timestamptz default now()
);
alter table public.family_nodes enable row level security;
drop policy if exists "own family read" on public.family_nodes;
create policy "own family read" on public.family_nodes for select to authenticated using (auth.uid() = user_id);
drop policy if exists "own family insert" on public.family_nodes;
create policy "own family insert" on public.family_nodes for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "own family update" on public.family_nodes;
create policy "own family update" on public.family_nodes for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "own family delete" on public.family_nodes;
create policy "own family delete" on public.family_nodes for delete to authenticated using (auth.uid() = user_id);
grant select, insert, update, delete on public.family_nodes to authenticated;
-- ===== end family_nodes.sql =====


-- ===== lifetime_access.sql =====
BEGIN;

UPDATE profiles SET
  is_owner        = TRUE,
  access_approved = TRUE,
  is_trial        = FALSE,
  trial_expires_at = NULL,
  axis_a          = 9.000,
  axis_b          = 9.000,
  axis_c          = 9.000,
  material_tier   = 'OMEGA MASTER',
  membership_tier = 9,
  display_name    = 'Major Sleiman Youssef Dagher',
  sign            = 'Aries',
  element         = 'Fire'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email IN ('s.y.dagher@gmail.com', 'slmndghr@gmail.com')
);

CREATE OR REPLACE FUNCTION protect_owner_lifetime()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_owner = TRUE THEN
    NEW.access_approved  := TRUE;
    NEW.is_trial         := FALSE;
    NEW.trial_expires_at := NULL;
    NEW.axis_a           := 9.000;
    NEW.axis_b           := 9.000;
    NEW.axis_c           := 9.000;
    NEW.material_tier    := 'OMEGA MASTER';
    NEW.membership_tier  := 9;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS owner_lifetime_guard ON profiles;
CREATE TRIGGER owner_lifetime_guard
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION protect_owner_lifetime();

COMMIT;
-- ===== end lifetime_access.sql =====


-- ===== marketplace_listings.sql =====
-- SYD OMEGA 91717 — Marketplace listings (idempotent, safe to re-run)
create table if not exists public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  kind text not null default 'work',
  price_omega numeric not null default 0,
  description text,
  file_path text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);
alter table public.marketplace_listings enable row level security;
do $$ begin
  create policy ml_read on public.marketplace_listings for select to authenticated
    using (status = 'active' or seller_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy ml_insert on public.marketplace_listings for insert to authenticated
    with check (seller_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy ml_update on public.marketplace_listings for update to authenticated
    using (seller_id = auth.uid());
exception when duplicate_object then null; end $$;
-- ===== end marketplace_listings.sql =====


-- ===== omega_access_control.sql =====
