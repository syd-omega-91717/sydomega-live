-- Integration probe for the pending family-access migration.
-- Runs only against the isolated local Supabase stack in CI and rolls back all fixtures.
BEGIN;

INSERT INTO auth.users (
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) VALUES
  ('10000000-0000-4000-8000-000000000001','authenticated','authenticated','omega-family-owner@probe.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000002','authenticated','authenticated','omega-family-adult-no-dob@probe.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000003','authenticated','authenticated','omega-family-minor@probe.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000004','authenticated','authenticated','omega-family-adult-dob@probe.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000005','authenticated','authenticated','omega-family-nonowner@probe.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000006','authenticated','authenticated','omega-family-target@probe.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now()),
  ('10000000-0000-4000-8000-000000000007','authenticated','authenticated','omega-family-public-member@probe.invalid','',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{}'::jsonb,now(),now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (
  id, display_name, is_owner, access_approved, is_public, dob, birth_date
) VALUES
  ('10000000-0000-4000-8000-000000000001','Probe Family Owner',true,true,true,'1980-01-01','1980-01-01'),
  ('10000000-0000-4000-8000-000000000002','Probe Family Adult No DOB',false,false,true,null,null),
  ('10000000-0000-4000-8000-000000000003','Probe Family Minor',false,false,true,(current_date - interval '17 years')::date,null),
  ('10000000-0000-4000-8000-000000000004','Probe Family Adult DOB',false,false,true,'1990-01-01','1990-01-01'),
  ('10000000-0000-4000-8000-000000000005','Probe Family Nonowner',false,true,true,'1990-01-01','1990-01-01'),
  ('10000000-0000-4000-8000-000000000006','Probe Family Target',false,false,true,null,null),
  ('10000000-0000-4000-8000-000000000007','Probe Public Member',false,true,true,'1990-01-01','1990-01-01')
ON CONFLICT (id) DO UPDATE SET
  display_name=excluded.display_name,
  is_owner=excluded.is_owner,
  access_approved=excluded.access_approved,
  is_public=excluded.is_public,
  dob=excluded.dob,
  birth_date=excluded.birth_date;

-- enforce_access_defaults() intentionally resets access on INSERT. These two
-- fixtures model members already approved by the trusted access workflow.
UPDATE public.profiles
   SET access_approved = true, is_public = true
 WHERE id IN (
   '10000000-0000-4000-8000-000000000005',
   '10000000-0000-4000-8000-000000000007'
 );

INSERT INTO public.platform_owners(user_id)
VALUES ('10000000-0000-4000-8000-000000000001')
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.sovereign_points_ledger(user_id,delta,reason)
VALUES
  ('10000000-0000-4000-8000-000000000002',500,'family-access-privacy-probe'),
  ('10000000-0000-4000-8000-000000000007',300,'family-access-privacy-probe');

INSERT INTO public.activity_feed(user_id,activity_type,title,body,is_public)
VALUES (
  '10000000-0000-4000-8000-000000000002',
  'family_access_probe',
  'PROBE FAMILY ACTIVITY MUST BE HIDDEN',
  'Isolated migration test fixture',
  true
);

INSERT INTO public.leaderboard_snapshots(user_id,snapshot_date,authority)
VALUES ('10000000-0000-4000-8000-000000000002',current_date,123.0);

SET LOCAL ROLE authenticated;

DO $probe$
DECLARE
  v_result jsonb;
  v_rows jsonb;
  v_diag jsonb;
  owner_id constant uuid := '10000000-0000-4000-8000-000000000001';
  adult_no_dob constant uuid := '10000000-0000-4000-8000-000000000002';
  minor_id constant uuid := '10000000-0000-4000-8000-000000000003';
  adult_dob constant uuid := '10000000-0000-4000-8000-000000000004';
  nonowner_id constant uuid := '10000000-0000-4000-8000-000000000005';
  other_target constant uuid := '10000000-0000-4000-8000-000000000006';
BEGIN
  PERFORM set_config('request.jwt.claim.sub', owner_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated','aal','aal2')::text, true);

  v_result := public.grant_family_access(adult_no_dob, false);
  IF v_result->>'error' <> 'adult_attestation_required' THEN
    RAISE EXCEPTION 'missing-DOB grant without attestation was not refused: %', v_result;
  END IF;

  v_result := public.grant_family_access(adult_no_dob, true);
  IF coalesce((v_result->>'ok')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'explicit adult attestation did not grant access: %', v_result;
  END IF;

  v_result := public.grant_family_access(adult_dob, false);
  IF coalesce((v_result->>'ok')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'adult DOB grant unexpectedly failed: %', v_result;
  END IF;

  v_result := public.grant_family_access(minor_id, true);
  IF v_result->>'error' <> 'minor_by_dob' THEN
    RAISE EXCEPTION 'minor DOB was not refused even with attestation: %', v_result;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', nonowner_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',nonowner_id,'role','authenticated','aal','aal2')::text, true);
  v_result := public.grant_family_access(other_target, true);
  IF v_result->>'error' <> 'forbidden' THEN
    RAISE EXCEPTION 'non-owner family grant was not refused: %', v_result;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', owner_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated','aal','aal1')::text, true);
  v_result := public.grant_family_access(other_target, true);
  IF v_result->>'error' <> 'aal2_required' THEN
    RAISE EXCEPTION 'AAL1 family grant was not refused: %', v_result;
  END IF;

  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated','aal','aal2')::text, true);
  v_rows := public.public_leaderboard(50);
  IF v_rows::text ILIKE '%Probe Family Adult No DOB%' OR v_rows::text ILIKE '%Probe Family Adult DOB%' THEN
    RAISE EXCEPTION 'family name leaked through public leaderboard: %', v_rows;
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
    INTO v_rows
    FROM public.get_points_leaderboard(50) AS p;
  IF v_rows::text ILIKE '%Probe Family Adult No DOB%' OR v_rows::text ILIKE '%Probe Family Adult DOB%' THEN
    RAISE EXCEPTION 'family name leaked through points leaderboard: %', v_rows;
  END IF;
  IF v_rows::text NOT ILIKE '%Probe Public Member%' THEN
    v_diag := jsonb_build_object(
      'auth_uid', auth.uid(),
      'is_platform_owner', private.is_platform_owner(),
      'public_member_ledger_rows_visible', (
        SELECT count(*) FROM public.sovereign_points_ledger
        WHERE user_id = '10000000-0000-4000-8000-000000000007'
      ),
      'public_member_profile_rows_visible', (
        SELECT count(*) FROM public.profiles
        WHERE id = '10000000-0000-4000-8000-000000000007'
      ),
      'public_member_profile', (
        SELECT jsonb_build_object(
          'display_name', p.display_name,
          'is_public', p.is_public,
          'access_approved', p.access_approved,
          'is_owner', p.is_owner,
          'deactivated_at', p.deactivated_at,
          'family_of', p.family_of
        )
        FROM public.profiles p
        WHERE p.id = '10000000-0000-4000-8000-000000000007'
      ),
      'public_member_points', (
        SELECT jsonb_build_object(
          'rows', count(*),
          'sum', coalesce(sum(l.delta), 0),
          'positive_sum', coalesce(sum(l.delta) filter (where l.delta > 0), 0)
        )
        FROM public.sovereign_points_ledger l
        WHERE l.user_id = '10000000-0000-4000-8000-000000000007'
      ),
      'private_projection', (
        SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
        FROM private.get_points_leaderboard(50) AS p
      ),
      'private_projection_security_definer', (
        SELECT p.prosecdef
        FROM pg_proc p
        WHERE p.oid = to_regprocedure('private.get_points_leaderboard(integer)')
      ),
      'private_projection_owner', (
        SELECT pg_get_userbyid(p.proowner)
        FROM pg_proc p
        WHERE p.oid = to_regprocedure('private.get_points_leaderboard(integer)')
      )
    );
    RAISE EXCEPTION 'control public member missing from points leaderboard: rows=% diagnostics=%', v_rows, v_diag;
  END IF;

  SELECT coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
    INTO v_rows
    FROM public.get_activity_feed(50,0) AS f;
  IF v_rows::text ILIKE '%PROBE FAMILY ACTIVITY MUST BE HIDDEN%' THEN
    RAISE EXCEPTION 'family activity leaked through activity feed to the owner global feed: %', v_rows;
  END IF;

  -- A linked member may still see their own activity; other members cannot.
  PERFORM set_config('request.jwt.claim.sub', adult_no_dob::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',adult_no_dob,'role','authenticated','aal','aal1')::text, true);
  SELECT coalesce(jsonb_agg(to_jsonb(f)), '[]'::jsonb)
    INTO v_rows
    FROM public.get_activity_feed(50,0) AS f;
  IF v_rows::text NOT ILIKE '%PROBE FAMILY ACTIVITY MUST BE HIDDEN%' THEN
    RAISE EXCEPTION 'family member cannot see their own activity: %', v_rows;
  END IF;

  -- A normal approved member must see approved public leaderboard rows even
  -- though direct ledger reads remain RLS-scoped to self. This proves the
  -- authenticated-only private projection is required, not just its filter.
  PERFORM set_config('request.jwt.claim.sub', nonowner_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',nonowner_id,'role','authenticated','aal','aal1')::text, true);
  SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
    INTO v_rows
    FROM public.get_points_leaderboard(50) AS p;
  IF v_rows::text ILIKE '%Probe Family Adult No DOB%' OR v_rows::text ILIKE '%Probe Family Adult DOB%' THEN
    RAISE EXCEPTION 'member points leaderboard leaked linked family: %', v_rows;
  END IF;
  IF v_rows::text NOT ILIKE '%Probe Public Member%' THEN
    RAISE EXCEPTION 'approved member cannot see the public points leaderboard: %', v_rows;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', adult_no_dob::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',adult_no_dob,'role','authenticated','aal','aal1')::text, true);
  SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
    INTO v_rows
    FROM public.get_points_leaderboard(50) AS p;
  IF v_rows::text NOT ILIKE '%Probe Family Adult No DOB%' THEN
    RAISE EXCEPTION 'family member cannot see their own points row: %', v_rows;
  END IF;

  PERFORM set_config('request.jwt.claim.sub', owner_id::text, true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated','aal','aal2')::text, true);

  v_rows := public.get_all_members();
  IF v_rows::text NOT ILIKE '%10000000-0000-4000-8000-000000000002%' OR
     v_rows::text NOT ILIKE '%10000000-0000-4000-8000-000000000001%' THEN
    RAISE EXCEPTION 'owner member list does not expose the family link to the owner: %', v_rows;
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id=adult_no_dob AND family_of IS DISTINCT FROM owner_id) THEN
    RAISE EXCEPTION 'family link not persisted to owner';
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id=minor_id AND (family_of IS NOT NULL OR access_approved)) THEN
    RAISE EXCEPTION 'minor profile was changed by rejected grant';
  END IF;
END
$probe$;

RESET ROLE;

-- The owner grant must delete an old snapshot, and recomputation must not restore it.
SELECT public.compute_leaderboard_snapshot();
DO $snapshot$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.leaderboard_snapshots
    WHERE user_id IN (
      '10000000-0000-4000-8000-000000000002',
      '10000000-0000-4000-8000-000000000004'
    ) AND snapshot_date=current_date
  ) THEN
    RAISE EXCEPTION 'linked family profile was written to leaderboard snapshot';
  END IF;
END
$snapshot$;

SET LOCAL ROLE authenticated;
DO $unlink$
DECLARE
  v_result jsonb;
  owner_id constant uuid := '10000000-0000-4000-8000-000000000001';
  adult_id constant uuid := '10000000-0000-4000-8000-000000000002';
BEGIN
  PERFORM set_config('request.jwt.claim.sub', owner_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub',owner_id,'role','authenticated','aal','aal2')::text, true);
  v_result := public.revoke_family_link(adult_id);
  IF coalesce((v_result->>'ok')::boolean,false) IS NOT TRUE THEN
    RAISE EXCEPTION 'owner could not unlink family member: %', v_result;
  END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id=adult_id AND (family_of IS NOT NULL OR access_approved IS NOT TRUE)) THEN
    RAISE EXCEPTION 'unlink must clear the link without revoking access';
  END IF;
END
$unlink$;

RESET ROLE;
ROLLBACK;
