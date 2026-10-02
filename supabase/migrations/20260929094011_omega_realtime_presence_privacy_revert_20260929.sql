-- Keep member_presence out of the row-level Realtime publication.
-- World presence uses ephemeral Realtime Presence channels instead, preserving
-- the existing self-only member_presence RLS policy.
do $$
begin
  if exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='member_presence'
  ) then
    alter publication supabase_realtime drop table public.member_presence;
  end if;
end $$;
