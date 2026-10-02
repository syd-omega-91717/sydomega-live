-- Remove duplicate owner-only SELECT policies discovered by Supabase Advisors.
-- Keep the original owner policies; both duplicates had identical predicates.
drop policy if exists "owner_sees_all_audit" on public.enterprise_audit;
drop policy if exists "owner_reads_all_telemetry" on public.telemetry_events;
