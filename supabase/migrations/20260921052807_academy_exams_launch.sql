-- Omega SYD OMEGA 91717
-- Activates the exam/quiz layer the courses migration deliberately left
-- dormant: academy_exams/academy_questions/academy_exam_results. Still
-- gated behind platform_settings.courses_enabled -- the same flag, no new
-- plumbing -- since an exam with no course to sit inside it is meaningless.
--
-- RLS mirrors the existing academy_modules/academy_lessons shape: visible
-- only through a published course. academy_questions gets one deliberate
-- deviation: the SELECT grant is COLUMN-RESTRICTED to exclude
-- correct_answer. A permissive "select using(true)" policy alone would let
-- any member read the answer key through the exact same query the app
-- uses to render the quiz -- the policy authorizes the row, but nothing
-- stops the response from carrying every column in it. Grading instead
-- happens inside submit_exam_attempt(), a SECURITY DEFINER function that
-- reads correct_answer with the function owner's privileges (bypassing the
-- column grant entirely) and returns only the score. Confirmed live: a
-- member session gets 42501 selecting correct_answer directly, and
-- submit_exam_attempt() scores a real mixed-answer attempt correctly
-- (3/4 correct -> 75.0, pass_score 70 -> passed = true).
--
-- academy_exam_results gets no INSERT/UPDATE/DELETE grant to authenticated
-- at all -- a member's only path to a result row is submit_exam_attempt().
-- Confirmed live: a direct insert attempt as a member gets 42501. Granting
-- direct INSERT would let a member write their own passing score.

-- ── academy_exams: visible only via a published course ─────────────────
drop policy if exists omega_deny_by_default on public.academy_exams;

create policy academy_exams_select on public.academy_exams
  for select using (
    private.is_platform_owner()
    or exists (
      select 1 from public.academy_courses c
      where c.id = academy_exams.course_id and c.published = true
    )
  );
create policy academy_exams_owner_insert on public.academy_exams
  for insert with check (private.is_platform_owner());
create policy academy_exams_owner_update on public.academy_exams
  for update using (private.is_platform_owner());
create policy academy_exams_owner_delete on public.academy_exams
  for delete using (private.is_platform_owner());

grant select on public.academy_exams to authenticated;
grant insert, update, delete on public.academy_exams to authenticated;

-- ── academy_questions: visible via a published course, answer key withheld ──
drop policy if exists omega_deny_by_default on public.academy_questions;

create policy academy_questions_select on public.academy_questions
  for select using (
    private.is_platform_owner()
    or exists (
      select 1 from public.academy_exams e
      join public.academy_courses c on c.id = e.course_id
      where e.id = academy_questions.exam_id and c.published = true
    )
  );
create policy academy_questions_owner_insert on public.academy_questions
  for insert with check (private.is_platform_owner());
create policy academy_questions_owner_update on public.academy_questions
  for update using (private.is_platform_owner());
create policy academy_questions_owner_delete on public.academy_questions
  for delete using (private.is_platform_owner());

-- Column-restricted: correct_answer is deliberately excluded so no client
-- query -- owner's own future admin UI included, since none exists yet and
-- content is managed via migration/SQL either way -- can read it over the
-- API. submit_exam_attempt() reads it directly as a SECURITY DEFINER
-- function, bypassing this grant by design.
grant select (id, exam_id, question, option_a, option_b, option_c, option_d, points)
  on public.academy_questions to authenticated;
grant insert, update, delete on public.academy_questions to authenticated;

-- ── academy_exam_results: a member sees only their own attempts ────────
drop policy if exists omega_deny_by_default on public.academy_exam_results;

create policy academy_exam_results_own_select on public.academy_exam_results
  for select using ((select auth.uid()) = profile_id or private.is_platform_owner());

grant select on public.academy_exam_results to authenticated;
-- Deliberately no insert/update/delete grant to authenticated -- see header.

-- ── Grading: the only path that ever reads correct_answer for a member ──
create or replace function public.submit_exam_attempt(p_exam_id uuid, p_answers jsonb)
returns table(score numeric, passed boolean, correct_count integer, total_count integer)
language plpgsql
security definer
set search_path = public
as $$
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

  select c.published, e.pass_score into v_published, v_pass_score
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
    if v_given is not null and lower(trim(v_given)) = lower(trim(coalesce(r.correct_answer, ''))) then
      v_earned := v_earned + r.points;
      v_correct_count := v_correct_count + 1;
    end if;
  end loop;

  if v_total_count = 0 then
    raise exception 'exam has no questions';
  end if;

  v_score := round((v_earned::numeric / v_total_points::numeric) * 100, 1);
  v_passed := v_score >= v_pass_score;

  insert into public.academy_exam_results (exam_id, profile_id, score, passed, completed_at)
  values (p_exam_id, v_profile_id, v_score, v_passed, now());

  return query select v_score, v_passed, v_correct_count, v_total_count;
end;
$$;

revoke all on function public.submit_exam_attempt(uuid, jsonb) from public;
grant execute on function public.submit_exam_attempt(uuid, jsonb) to authenticated;

-- ── Seed: one real exam on the existing "Financial Foundations" course,
-- questions drawn directly from its own four lesson articles (net worth,
-- savings rate, 50/30/20, written plan) -- not invented trivia.
do $$
declare
  v_course_id uuid;
  v_exam_id uuid;
begin
  select id into v_course_id from public.academy_courses where slug = 'financial-foundations';
  if v_course_id is null then
    raise exception 'financial-foundations course not found; run the courses launch migration first';
  end if;

  insert into public.academy_exams (course_id, title, pass_score, duration_minutes)
  select v_course_id, 'Financial Foundations: Final Check', 70, 10
  where not exists (
    select 1 from public.academy_exams where course_id = v_course_id
  )
  returning id into v_exam_id;

  if v_exam_id is null then
    select id into v_exam_id from public.academy_exams where course_id = v_course_id limit 1;
  end if;

  insert into public.academy_questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer, points)
  select v_exam_id,
    'What is the correct formula for net worth?',
    'Total Assets minus Total Liabilities',
    'Total Income minus Total Expenses',
    'Total Savings plus Total Investments',
    'Total Assets plus Total Liabilities',
    'a', 1
  where not exists (select 1 from public.academy_questions where exam_id = v_exam_id and question = 'What is the correct formula for net worth?');

  insert into public.academy_questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer, points)
  select v_exam_id,
    'What is the formula for savings rate?',
    'Expenses divided by Income, x100',
    '(Income minus Expenses) divided by Income, x100',
    'Income divided by Expenses, x100',
    'Savings divided by Net Worth, x100',
    'b', 1
  where not exists (select 1 from public.academy_questions where exam_id = v_exam_id and question = 'What is the formula for savings rate?');

  insert into public.academy_questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer, points)
  select v_exam_id,
    'In the 50/30/20 budget framework, which bucket is Savings and extra debt payoff?',
    'The 50% bucket',
    'The 30% bucket',
    'The 20% bucket',
    'It is not part of the framework',
    'c', 1
  where not exists (select 1 from public.academy_questions where exam_id = v_exam_id and question = 'In the 50/30/20 budget framework, which bucket is Savings and extra debt payoff?');

  insert into public.academy_questions (exam_id, question, option_a, option_b, option_c, option_d, correct_answer, points)
  select v_exam_id,
    'According to the course, what three things should you write down for each financial goal?',
    'The target number, the date, and the monthly amount required',
    'Only a target number',
    'A general hope with no numbers',
    'Only the monthly amount required',
    'a', 1
  where not exists (select 1 from public.academy_questions where exam_id = v_exam_id and question = 'According to the course, what three things should you write down for each financial goal?');
end $$;
