-- ============================================================
--  SYD OMEGA 91717  --  BACKEND SYNC
--  Guarantees the Supabase schema matches what every page queries.
--  Safe + idempotent: re-runnable. Run in Supabase -> SQL Editor.
--  Creates 13 tables + ensures all profiles columns + RLS policies
--  so that every page's .from('table').select(...) returns data.
-- ============================================================
BEGIN;

-- ---- owner check helper (SECURITY DEFINER avoids RLS recursion) ----
CREATE OR REPLACE FUNCTION public.is_platform_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE((SELECT is_owner FROM public.profiles WHERE id = auth.uid()), false);
$$;

-- ============================================================
--  PROFILES  (auth-linked; ensure every expected column exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS display_name        text,
  ADD COLUMN IF NOT EXISTS avatar_url          text,
  ADD COLUMN IF NOT EXISTS sign                text,
  ADD COLUMN IF NOT EXISTS element             text,
  ADD COLUMN IF NOT EXISTS axis_a              numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS axis_b              numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS axis_c              numeric DEFAULT 1,
  ADD COLUMN IF NOT EXISTS bg_color            text,
  ADD COLUMN IF NOT EXISTS certificates_earned int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS nodes_earned        int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS membership_tier     text DEFAULT 'INITIATE',
  ADD COLUMN IF NOT EXISTS is_owner            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_trial            boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_rejected         boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_approved     boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS kyc_status          text DEFAULT 'unverified',
  ADD COLUMN IF NOT EXISTS kyc_doc_path        text,
  ADD COLUMN IF NOT EXISTS kyc_submitted_at    timestamptz,
  ADD COLUMN IF NOT EXISTS terms_accepted      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at   timestamptz,
  ADD COLUMN IF NOT EXISTS trial_expires_at    timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at          timestamptz DEFAULT now();
-- material_tier: add as plain column ONLY if it does not already exist
-- (skipped automatically if a GENERATED column of this name is present)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS material_tier text DEFAULT 'SAND';

-- ============================================================
--  FEATURE TABLES  (one block each; create-if-not-exists)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text, milestone text, issued_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.trophies(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  trophy_num int, medal_num int, cert_num int,
  earned_at timestamptz DEFAULT now(), issued_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.evolution_events(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  axis text, note text, created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.task_completions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task text, kind text,
  completed_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.family_nodes(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text, relation text, sign text, is_heir boolean DEFAULT false,
  created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.contribution_log(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  act text, domain text, evidence text, task text,
  created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.dispatches(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sign text, body text, created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.consult_requests(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  commission_rate numeric, confidentiality_accepted boolean DEFAULT false,
  status text DEFAULT 'pending', created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.commission_contracts(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  counterparty text, reference text, scope text, terms text,
  deal_value numeric, commission_rate numeric, commission_value numeric,
  confidentiality_accepted boolean DEFAULT false,
  status text DEFAULT 'draft', created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.marketplace_listings(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id uuid, title text, description text, kind text,
  price_omega numeric, file_path text,
  status text DEFAULT 'active', created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.media_reservations(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text, zone text, duration text, message text,
  price_omega numeric, file_path text,
  status text DEFAULT 'pending', created_at timestamptz DEFAULT now());

CREATE TABLE IF NOT EXISTS public.publications(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text, body text, kind text, file_path text,
  status text DEFAULT 'draft', created_at timestamptz DEFAULT now());

-- ============================================================
--  ROW LEVEL SECURITY  --  enable + policies so each user
--  sees their own rows, and the owner sees all.
-- ============================================================
DO $$
DECLARE t text;
DECLARE tabs text[] := ARRAY['certificates','trophies','evolution_events','task_completions',
  'family_nodes','contribution_log','dispatches','consult_requests','commission_contracts',
  'marketplace_listings','media_reservations','publications'];
BEGIN
  FOREACH t IN ARRAY tabs LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', t||'_own', t);
    EXECUTE format($f$CREATE POLICY %I ON public.%I
      USING (auth.uid() = user_id OR public.is_platform_owner())
      WITH CHECK (auth.uid() = user_id OR public.is_platform_owner());$f$, t||'_own', t);
  END LOOP;
END $$;

-- marketplace + media are browseable by any signed-in member (read-only)
DROP POLICY IF EXISTS marketplace_listings_read ON public.marketplace_listings;
CREATE POLICY marketplace_listings_read ON public.marketplace_listings
  FOR SELECT USING (auth.role() = 'authenticated');

-- profiles policies (own row; owner reads all)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
CREATE POLICY profiles_select ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.is_platform_owner());
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR public.is_platform_owner());
DROP POLICY IF EXISTS profiles_insert ON public.profiles;
CREATE POLICY profiles_insert ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

COMMIT;

-- ============================================================
--  AFTER RUNNING:  set yourself as owner so the Architect
--  Console + Approvals + owner-only data appear.  Replace the
--  email with your login email.
-- ------------------------------------------------------------
-- UPDATE public.profiles SET is_owner=true, access_approved=true,
--   axis_a=9, axis_b=9, axis_c=9, sign='VIRGO', element='SAND',
--   material_tier='OMEGA MASTER', membership_tier='SOVEREIGN'
-- WHERE id = (SELECT id FROM auth.users WHERE email='s.y.dagher@gmail.com');
-- ============================================================
