-- Reproducible throwaway proof for 20261122110000_close_advance_matrix.sql. Run on a DISPOSABLE Postgres 16 only (creates roles anon/authenticated/service_role).
-- psql -f this-file's SETUP block, then ATTACK, then the migration, then ATTACK again. Before: 324/324 accepted on both paths, 576 points. After: 0/324, 0.

-- ===== SETUP =====
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth; create schema private;
grant usage on schema public to anon, authenticated, service_role;
grant usage on schema private to anon, authenticated;   -- live shape per the proposal header
create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claims',true)::json->>'sub','')::uuid $$;
grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
create table public.matrix_progress(user_id uuid, track int, a int default 1, b int default 1, c int default 1, updated_at timestamptz, primary key(user_id,track));
create table public.sovereign_points(user_id uuid, pts int default 0);
create function public.award() returns trigger language plpgsql security definer as $$
begin
  if (new.a+new.b+new.c) > (old.a+old.b+old.c) then
    insert into public.sovereign_points(user_id,pts) values (new.user_id,2);
  end if; return new; end $$;
create trigger trg_award after update on public.matrix_progress for each row execute function public.award();
-- body as in 0004 (SECURITY DEFINER, search_path=public), living in private; public wrapper is SECURITY INVOKER (live shape)
create function private.advance_matrix(p_track int, p_axis text) returns jsonb language plpgsql security definer set search_path=public as $$
declare r public.matrix_progress;
begin
  if auth.uid() is null then return jsonb_build_object('ok',false,'error','not_authenticated'); end if;
  insert into public.matrix_progress(user_id,track) values (auth.uid(),p_track) on conflict (user_id,track) do nothing;
  update public.matrix_progress set
    a=case when lower(p_axis)='a' then least(9,a+1) else a end,
    b=case when lower(p_axis)='b' then least(9,b+1) else b end,
    c=case when lower(p_axis)='c' then least(9,c+1) else c end, updated_at=now()
  where user_id=auth.uid() and track=p_track returning * into r;
  return jsonb_build_object('ok',true,'a',r.a,'b',r.b,'c',r.c);
end $$;
create function public.advance_matrix(p_track int, p_axis text) returns jsonb language sql security invoker as $$ select private.advance_matrix(p_track,p_axis) $$;
revoke execute on function public.advance_matrix(int,text) from public; grant execute on function public.advance_matrix(int,text) to authenticated;
revoke execute on function private.advance_matrix(int,text) from public; grant execute on function private.advance_matrix(int,text) to authenticated;

-- ===== ATTACK (run before and after the migration) =====
\set ON_ERROR_STOP off
\o /dev/null
set role authenticated; set "request.jwt.claims"='{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
create temp table res(path text, ok int, refused int);
do $$ declare t int; ax text; i int; okp int:=0; refp int:=0; okv int:=0; refv int:=0; begin
 for t in 1..12 loop foreach ax in array array['a','b','c'] loop for i in 1..9 loop
   begin perform public.advance_matrix(t,ax); okp:=okp+1; exception when others then refp:=refp+1; end;
   begin perform private.advance_matrix(t,ax); okv:=okv+1; exception when others then refv:=refv+1; end;
 end loop; end loop; end loop;
 insert into res values ('public wrapper',okp,refp),('private direct',okv,refv); end $$;
\o
select * from res;
reset role;
select 'points minted' k, coalesce(sum(pts),0) from public.sovereign_points;
