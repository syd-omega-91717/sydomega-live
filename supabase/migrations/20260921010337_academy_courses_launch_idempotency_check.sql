-- Omega SYD OMEGA 91717
-- Not new schema: this version records a real, deliberate re-run of
-- 20260921010158_academy_courses_launch.sql's policy-and-seed body, done
-- to prove it is actually safe to re-apply (CLAUDE.md's own migration
-- guidance requires idempotency) before trusting that file. The specific
-- statements executed live at this version were a duplicate of that file's
-- policy drops/creates and its seed's ON CONFLICT branches -- confirmed
-- afterward that course/module/lesson counts were unchanged and the real
-- seeded article content was not overwritten by the re-run.
--
-- Left as a real, idempotent statement here (not a bare comment) so this
-- file is valid, re-runnable SQL in its own right, consistent with every
-- other file in this directory.
select 1 where exists (
  select 1 from public.academy_courses where slug = 'financial-foundations'
);
