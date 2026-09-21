-- Omega SYD OMEGA 91717
-- Activates the first real slice of the dormant academy_* course scaffold
-- (academy_categories/courses/modules/lessons/enrollments), which had
-- omega_deny_by_default policies and no client anywhere -- confirmed live
-- via pg_policies and a repo-wide grep before writing this. academy.html
-- is a separate, already-working feature (a knowledge-quiz tracker on
-- task_completions) and is untouched by this migration.
--
-- academy_exams/academy_exam_results/academy_questions stay deny-by-default
-- deliberately -- this is a first slice (browse, enroll, complete lessons),
-- not the whole scaffold; quizzes are a real, separate follow-up.
--
-- Gated dormant behind platform_settings.courses_enabled (CLAUDE.md 9's
-- rule for a new feature), read via the existing get_platform_flag() RPC
-- and omega-flags.js's data-omega-flag mechanism -- no new flag plumbing.
--
-- RLS pattern mirrors the existing governance_policies/platform_settings
-- shared-content shape exactly: one per-command policy, owner via
-- private.is_platform_owner(), auth.uid() wrapped in a select per the
-- rls_initplan optimization already applied platform-wide.

insert into public.platform_settings (key, bool_value)
values ('courses_enabled', false)
on conflict (key) do nothing;

-- ── academy_categories: published content, owner-managed ──────────────
drop policy if exists omega_deny_by_default on public.academy_categories;

create policy academy_categories_select on public.academy_categories
  for select using (true);
create policy academy_categories_owner_insert on public.academy_categories
  for insert with check (private.is_platform_owner());
create policy academy_categories_owner_update on public.academy_categories
  for update using (private.is_platform_owner());
create policy academy_categories_owner_delete on public.academy_categories
  for delete using (private.is_platform_owner());

grant select on public.academy_categories to authenticated;
grant insert, update, delete on public.academy_categories to authenticated;

-- ── academy_courses: only published courses are visible to members ────
drop policy if exists omega_deny_by_default on public.academy_courses;

create policy academy_courses_select on public.academy_courses
  for select using (published = true or private.is_platform_owner());
create policy academy_courses_owner_insert on public.academy_courses
  for insert with check (private.is_platform_owner());
create policy academy_courses_owner_update on public.academy_courses
  for update using (private.is_platform_owner());
create policy academy_courses_owner_delete on public.academy_courses
  for delete using (private.is_platform_owner());

grant select on public.academy_courses to authenticated;
grant insert, update, delete on public.academy_courses to authenticated;

-- ── academy_modules / academy_lessons: visible only via a published course ─
drop policy if exists omega_deny_by_default on public.academy_modules;

create policy academy_modules_select on public.academy_modules
  for select using (
    private.is_platform_owner()
    or exists (
      select 1 from public.academy_courses c
      where c.id = academy_modules.course_id and c.published = true
    )
  );
create policy academy_modules_owner_insert on public.academy_modules
  for insert with check (private.is_platform_owner());
create policy academy_modules_owner_update on public.academy_modules
  for update using (private.is_platform_owner());
create policy academy_modules_owner_delete on public.academy_modules
  for delete using (private.is_platform_owner());

grant select on public.academy_modules to authenticated;
grant insert, update, delete on public.academy_modules to authenticated;

drop policy if exists omega_deny_by_default on public.academy_lessons;

create policy academy_lessons_select on public.academy_lessons
  for select using (
    private.is_platform_owner()
    or exists (
      select 1 from public.academy_modules m
      join public.academy_courses c on c.id = m.course_id
      where m.id = academy_lessons.module_id and c.published = true
    )
  );
create policy academy_lessons_owner_insert on public.academy_lessons
  for insert with check (private.is_platform_owner());
create policy academy_lessons_owner_update on public.academy_lessons
  for update using (private.is_platform_owner());
create policy academy_lessons_owner_delete on public.academy_lessons
  for delete using (private.is_platform_owner());

grant select on public.academy_lessons to authenticated;
grant insert, update, delete on public.academy_lessons to authenticated;

-- ── academy_enrollments: a member owns their own enrollment row ───────
drop policy if exists omega_deny_by_default on public.academy_enrollments;

create policy academy_enrollments_own on public.academy_enrollments
  for all
  using ((select auth.uid()) = profile_id or private.is_platform_owner())
  with check ((select auth.uid()) = profile_id or private.is_platform_owner());

grant select, insert, update on public.academy_enrollments to authenticated;

-- academy_enrollments already carries a real unique constraint on
-- (course_id, profile_id) -- academy_enrollments_course_id_profile_id_key,
-- confirmed live via information_schema.table_constraints. The client's
-- upsert targets that constraint by name rather than a new index (CLAUDE.md
-- 8.1 class 7: an upsert needs a real unique index to target, and this one
-- already exists -- adding a second index over the same columns would be
-- the redundant-index pattern this repo's own audits already clean up).

-- Neither table had any unique key beyond its own id -- confirmed live via
-- information_schema.table_constraints, meaning a bare ON CONFLICT DO
-- NOTHING in the seed below would never actually match anything and would
-- duplicate rows on every re-run of this migration. Adding a real
-- constraint here is both correct data modelling (no two modules/lessons
-- at the same position in the same parent) and what makes the seed
-- idempotent.
-- Postgres has no `ADD CONSTRAINT IF NOT EXISTS`, so this is guarded by hand
-- rather than left to fail (and stop the whole migration) on a re-run.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'academy_modules_course_sort_uk') then
    alter table public.academy_modules
      add constraint academy_modules_course_sort_uk unique (course_id, sort_order);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'academy_lessons_module_sort_uk') then
    alter table public.academy_lessons
      add constraint academy_lessons_module_sort_uk unique (module_id, sort_order);
  end if;
  -- academy_progress already exists (migration 0015) with a real, correct
  -- policy (own-row) and grant, but its only unique constraint is
  -- (user_id, node_id) -- a different key shape, apparently for a generic
  -- achievement-node use this table was originally built for, confirmed
  -- live via pg_constraint before assuming otherwise. The lesson-progress
  -- flow here needs (enrollment_id, lesson_id) as its real natural key, so
  -- that constraint is added rather than force-fitting node_id.
  if not exists (select 1 from pg_constraint where conname = 'academy_progress_enrollment_lesson_uk') then
    alter table public.academy_progress
      add constraint academy_progress_enrollment_lesson_uk unique (enrollment_id, lesson_id);
  end if;
end $$;

-- ── Seed: one real course, not placeholder filler ──────────────────────
-- Content matches gates.html's own "Gate of Finance" domain description
-- ("Build a financial foundation: income, savings rate, net worth
-- tracking, and a written wealth plan") -- a real, already-established
-- theme on this platform, not an invented topic.
do $$
declare
  v_category_id uuid;
  v_course_id uuid;
  v_module1_id uuid;
  v_module2_id uuid;
begin
  insert into public.academy_categories (name, slug, description, icon, color)
  values ('Finance', 'finance', 'Build a real financial foundation.', '◆', '#C9A84C')
  on conflict (slug) do update set name = excluded.name
  returning id into v_category_id;

  insert into public.academy_courses
    (category_id, title, slug, description, difficulty, language, duration_minutes, xp_reward, published)
  values (
    v_category_id,
    'Financial Foundations: Building Your Wealth Plan',
    'financial-foundations',
    'A short, practical course on the four things a real wealth plan actually needs: knowing your net worth, knowing your savings rate, a budget framework that survives contact with a real paycheck, and a written plan you can actually follow.',
    'Beginner', 'English', 40, 150, true
  )
  on conflict (slug) do update set published = true
  returning id into v_course_id;

  insert into public.academy_modules (course_id, title, description, sort_order)
  values (v_course_id, 'Understanding Your Numbers', 'The two numbers that tell you where you actually stand.', 1)
  on conflict (course_id, sort_order) do nothing
  returning id into v_module1_id;
  if v_module1_id is null then
    select id into v_module1_id from public.academy_modules
      where course_id = v_course_id and sort_order = 1;
  end if;

  insert into public.academy_modules (course_id, title, description, sort_order)
  values (v_course_id, 'Building Your Plan', 'Turning the numbers into a plan you will actually keep.', 2)
  on conflict (course_id, sort_order) do nothing
  returning id into v_module2_id;
  if v_module2_id is null then
    select id into v_module2_id from public.academy_modules
      where course_id = v_course_id and sort_order = 2;
  end if;

  insert into public.academy_lessons (module_id, title, lesson_type, article, duration_minutes, xp_reward, sort_order)
  values (
    v_module1_id, 'Calculating Your Net Worth', 'article',
    'Net worth is the single number that tells you whether you are actually getting ahead: everything you own, minus everything you owe.' || chr(10) || chr(10) ||
    '**The formula:** Net Worth = Total Assets - Total Liabilities.' || chr(10) || chr(10) ||
    '**Assets** are anything with real resale or cash value: your bank balances, investment accounts, retirement accounts, and the market value of property you own outright or have equity in.' || chr(10) || chr(10) ||
    '**Liabilities** are what you owe: credit card balances, loans, and the remaining balance on any mortgage.' || chr(10) || chr(10) ||
    '**Why it matters more than income:** a high income with high liabilities can still be a negative net worth. Net worth is the actual scoreboard.' || chr(10) || chr(10) ||
    '**How often to check it:** once a month is enough. Checking daily just tracks market noise, not progress.',
    10, 25, 1
  )
  on conflict (module_id, sort_order) do nothing;

  insert into public.academy_lessons (module_id, title, lesson_type, article, duration_minutes, xp_reward, sort_order)
  values (
    v_module1_id, 'Your Savings Rate', 'article',
    'Your savings rate is the percentage of your income you keep, rather than spend -- and it is a better predictor of long-term financial security than your salary is.' || chr(10) || chr(10) ||
    '**The formula:** Savings Rate = (Income - Expenses) / Income x 100.' || chr(10) || chr(10) ||
    '**Rough benchmarks:** under 10% is a common starting point for many households; 20% is a widely-cited healthy target; 30%+ meaningfully accelerates any long-term goal (a house, retirement, financial independence).' || chr(10) || chr(10) ||
    '**The lever that actually moves it:** for most people, cutting the largest recurring expense category (usually housing or transport) moves the number more than any number of small daily cuts.' || chr(10) || chr(10) ||
    '**Track it the same way as net worth:** monthly, not daily.',
    10, 25, 2
  )
  on conflict (module_id, sort_order) do nothing;

  insert into public.academy_lessons (module_id, title, lesson_type, article, duration_minutes, xp_reward, sort_order)
  values (
    v_module2_id, 'The 50/30/20 Budget Framework', 'article',
    'A budget framework should be simple enough to actually follow. 50/30/20 splits after-tax income into three buckets.' || chr(10) || chr(10) ||
    '**50% Needs:** housing, utilities, groceries, minimum debt payments, transport to work -- the things that do not go away if you lose motivation.' || chr(10) || chr(10) ||
    '**30% Wants:** everything discretionary -- dining out, entertainment, subscriptions, hobbies. This bucket is where most people over-spend without noticing.' || chr(10) || chr(10) ||
    '**20% Savings and extra debt payoff:** this is what actually moves your net worth and savings rate from the previous two lessons.' || chr(10) || chr(10) ||
    '**It is a starting ratio, not a law:** if your needs genuinely exceed 50% (high cost-of-living area, dependents), the honest move is to shrink Wants further, not to pretend the ratio fits.',
    10, 25, 1
  )
  on conflict (module_id, sort_order) do nothing;

  insert into public.academy_lessons (module_id, title, lesson_type, article, duration_minutes, xp_reward, sort_order)
  values (
    v_module2_id, 'Setting a Written Wealth Plan', 'article',
    'A financial goal that only exists in your head is a wish. Writing it down, with numbers, is what turns it into a plan.' || chr(10) || chr(10) ||
    '**Write down three things for each goal:** the target number, the date, and the monthly amount required to hit it (target divided by months remaining).' || chr(10) || chr(10) ||
    '**Example:** "Emergency fund of $6,000 by month 12" means $500/month, checked against your 20% savings bucket from the previous lesson -- if it does not fit, the plan needs a bigger savings rate, not a later deadline.' || chr(10) || chr(10) ||
    '**Review on the same monthly cadence as your net worth and savings rate.** A plan that is never revisited is the same as no plan.' || chr(10) || chr(10) ||
    '**This is the end of the course:** you now have your net worth, your savings rate, a budget framework, and a written plan -- the same four things gates.html''s own "Gate of Finance" describes as its threshold.',
    10, 25, 2
  )
  on conflict (module_id, sort_order) do nothing;
end $$;
