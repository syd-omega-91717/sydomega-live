-- Keep the public RPC available to authenticated members without exposing
-- SECURITY DEFINER privileges through the public API schema.
--
-- The privileged grading implementation lives in the private schema.
-- The public function remains SECURITY INVOKER and delegates to the
-- private implementation after Postgres checks the authenticated caller's
-- EXECUTE privilege.

create or replace function private.submit_exam_attempt_impl(
  p_exam_id uuid,
  p_answers jsonb
)
returns table(score numeric, passed boolean, correct_count integer, total_count integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
  v_profile_id uuid := (select auth.uid());
  v_published boolean;
  v_pass_score integer;
  v_earned integer := 0;
  v_total_points integer := 0;
  v_correct_count integer := 0;
  v_total_count integer := 0;
  v_score numeric;
  v_passed boolean;
  r record;
  v_given text;
begin
  if v_profile_id is null then
    raise exception 'authentication required';
  end if;

  select c.published, e.pass_score
    into v_published, v_pass_score
  from public.academy_exams e
  join public.academy_courses c on c.id = e.course_id
  where e.id = p_exam_id;

  if v_pass_score is null then
    raise exception 'exam not found';
  end if;

  if not v_published and not private.is_platform_owner() then
    raise exception 'exam not available';
  end if;

  for r in
    select q.id, q.correct_answer, coalesce(q.points, 1) as points
    from public.academy_questions q
    where q.exam_id = p_exam_id
  loop
    v_total_count := v_total_count + 1;
    v_total_points := v_total_points + r.points;
    v_given := p_answers ->> r.id::text;

    if v_given is not null
       and lower(trim(v_given)) = lower(trim(coalesce(r.correct_answer, ''))) then
      v_earned := v_earned + r.points;
      v_correct_count := v_correct_count + 1;
    end if;
  end loop;

  if v_total_count = 0 then
    raise exception 'exam has no questions';
  end if;

  v_score := round((v_earned::numeric / v_total_points::numeric) * 100, 1);
  v_passed := v_score >= v_pass_score;

  insert into public.academy_exam_results
    (exam_id, profile_id, score, passed, completed_at)
  values
    (p_exam_id, v_profile_id, v_score, v_passed, now());

  return query select v_score, v_passed, v_correct_count, v_total_count;
end;
$function$;

revoke execute on function private.submit_exam_attempt_impl(uuid, jsonb) from public, anon;
grant execute on function private.submit_exam_attempt_impl(uuid, jsonb) to authenticated;

create or replace function public.submit_exam_attempt(
  p_exam_id uuid,
  p_answers jsonb
)
returns table(score numeric, passed boolean, correct_count integer, total_count integer)
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
begin
  return query
    select *
    from private.submit_exam_attempt_impl(p_exam_id, p_answers);
end;
$function$;

revoke execute on function public.submit_exam_attempt(uuid, jsonb) from public, anon;
grant execute on function public.submit_exam_attempt(uuid, jsonb) to authenticated;
