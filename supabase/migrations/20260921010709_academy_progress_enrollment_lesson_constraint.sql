-- Omega SYD OMEGA 91717
-- academy_progress's only unique constraint was (user_id, node_id) -- a
-- different key shape, apparently for a generic achievement-node use this
-- table was originally built for (confirmed live via pg_constraint before
-- assuming otherwise). The lesson-progress flow in courses.html needs
-- (enrollment_id, lesson_id) as its real natural key; this file is that
-- constraint, applied as its own step while building that flow, ahead of
-- 20260921010951_academy_schema_capture.sql which backfills the rest of
-- this table's real source control.

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'academy_progress_enrollment_lesson_uk') then
    alter table public.academy_progress
      add constraint academy_progress_enrollment_lesson_uk unique (enrollment_id, lesson_id);
  end if;
end $$;
