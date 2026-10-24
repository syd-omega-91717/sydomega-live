-- Ω SYD OMEGA 91717 — restore a default for omega_platform_events.event_id
-- 20261002025000 and 20261002073936 added event_id as uuid NOT NULL (and a
-- unique index) but never gave it a default, so every insert that does not
-- name event_id fails 23502. Measured live 2026-10-16: column_default null;
-- 7 rows, newest 2026-09-29; 3 of the 10 database writers omit it
-- (private.omega_start_mission, private.omega_complete_mission,
-- public.omega_record_world_action). gen_random_uuid() is what both
-- migrations already used to backfill existing rows. Existing rows, the
-- NOT NULL constraint and the unique index are unchanged.

begin;

alter table public.omega_platform_events
  alter column event_id set default gen_random_uuid();

commit;
