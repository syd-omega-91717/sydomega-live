-- Reproducible throwaway proof for 20261122140000_close_exam_results_member_write.sql. Run on a DISPOSABLE Postgres 16 only: it creates roles anon/authenticated/service_role and stub tables.
-- Order: SETUP, ATTACK (before), the migration, ATTACK again. Expected: before 100/100 accepted, 50 certificates, axis 9, 2500 points; after 0/100, 0, 1, 0.

-- ===== SETUP: throwaway Postgres 16 only. Shapes follow supabase/migrations 0003 (exams), 0005 (points trigger), 0027/live grants.
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; grant usage on schema auth, public to authenticated, anon;
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims',true)::json->>'sub','')::uuid $$;
grant execute on function auth.uid() to authenticated, anon;
create function public.is_platform_owner() returns boolean language sql stable as $$ select false $$;
create table public.profiles(id uuid primary key, axis_a numeric default 1);
create table public.certificates(id bigserial primary key, user_id uuid, title text, milestone text);
create table public.evolution_events(id bigserial primary key, user_id uuid, axis text, note text);
create table public.sovereign_points_ledger(id bigserial primary key, user_id uuid, delta int, reason text, note text);
create function public.award_points(p_user uuid,p_amount int,p_reason text,p_note text) returns void language plpgsql security definer set search_path=public as $$
begin insert into public.sovereign_points_ledger(user_id,delta,reason,note) values (p_user,p_amount,p_reason,p_note); end $$;
revoke execute on function public.award_points(uuid,int,text,text) from public, authenticated, anon;
create table public.exam_results(id uuid primary key default gen_random_uuid(), user_id uuid not null, exam_id text not null, score int not null, total int not null, pct numeric not null, passed boolean not null, cert_name text, taken_at timestamptz not null default now());
alter table public.exam_results enable row level security;
create policy exam_results_own on public.exam_results for all to authenticated using (auth.uid()=user_id or public.is_platform_owner()) with check (auth.uid()=user_id);
grant select, insert on public.exam_results to authenticated;
create function public.trg_award_exam_points() returns trigger language plpgsql security definer set search_path=public as $$
begin if new.passed then perform public.award_points(new.user_id,25,'exam_pass',coalesce(new.cert_name,'exam passed')); end if; return new; end $$;
create trigger award_points_on_exam after insert on public.exam_results for each row execute function public.trg_award_exam_points();
-- the real function text from 0003_omega_exams.sql:
CREATE OR REPLACE FUNCTION public.submit_exam_result(
  p_exam_id text, p_score int, p_total int, p_cert_name text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE
  uid uuid := auth.uid();
  v_pct numeric;
  v_pass boolean;
  v_already boolean;
BEGIN
  IF uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','not_authenticated'); END IF;
  IF p_total IS NULL OR p_total <= 0 THEN RETURN jsonb_build_object('ok',false,'error','bad_total'); END IF;

  v_pct := round((p_score::numeric / p_total::numeric) * 100, 1);
  v_pass := v_pct >= 72;

  INSERT INTO public.exam_results(user_id, exam_id, score, total, pct, passed, cert_name)
    VALUES (uid, p_exam_id, p_score, p_total, v_pct, v_pass, p_cert_name);

  IF NOT v_pass THEN
    RETURN jsonb_build_object('ok',true,'passed',false,'pct',v_pct);
  END IF;

  -- already holds this certificate? don't duplicate, but still record the re-take above
  SELECT EXISTS(SELECT 1 FROM public.certificates WHERE user_id = uid AND title = p_cert_name) INTO v_already;
  IF NOT v_already AND p_cert_name IS NOT NULL THEN
    INSERT INTO public.certificates(user_id, title, milestone) VALUES (uid, p_cert_name, p_exam_id);
  END IF;

  -- advance the real Knowledge axis (axis_a), capped at 9, only on first pass
  IF NOT v_already THEN
    UPDATE public.profiles SET axis_a = LEAST(9, COALESCE(axis_a,1) + 0.5) WHERE id = uid;
    INSERT INTO public.evolution_events(user_id, axis, note)
      VALUES (uid, 'A', 'Examination passed -- ' || COALESCE(p_cert_name, p_exam_id) || ' certificate earned (' || v_pct || '%)');
  END IF;

  RETURN jsonb_build_object('ok',true,'passed',true,'pct',v_pct,'cert_awarded', NOT v_already, 'cert_name', p_cert_name);
END;
$$;

grant execute on function public.submit_exam_result(text,int,int,text) to authenticated;
insert into public.profiles(id) values ('11111111-1111-1111-1111-111111111111');

-- ===== ATTACK: a signed-in member with no exam taken, claiming perfect scores. 50 RPC calls + 50 direct inserts.
\set ON_ERROR_STOP off
\o /dev/null
set role authenticated; set "request.jwt.claims"='{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
create temp table res(path text, ok int, refused int);
do $$ declare i int; okr int:=0; refr int:=0; okd int:=0; refd int:=0; begin
  for i in 1..50 loop
    begin perform public.submit_exam_result('forged-'||i, 100, 100, 'Forged Certificate '||i); okr:=okr+1; exception when others then refr:=refr+1; end;
    begin insert into public.exam_results(user_id,exam_id,score,total,pct,passed,cert_name) values (auth.uid(),'direct-'||i,100,100,100,true,'Direct '||i); okd:=okd+1; exception when others then refd:=refd+1; end;
  end loop;
  insert into res values ('RPC submit_exam_result',okr,refr),('direct INSERT exam_results',okd,refd); end $$;
\o
select * from res;
reset role;
select 'certificates forged' k, count(*)::text v from public.certificates
union all select 'knowledge axis (cap 9)', coalesce((select axis_a::text from public.profiles limit 1),'-')
union all select 'sovereign points minted', coalesce(sum(delta),0)::text from public.sovereign_points_ledger;
