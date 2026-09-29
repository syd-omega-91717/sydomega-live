-- Historical migration: temporarily added member_presence to the Realtime publication.
-- The following privacy-preserving revert supersedes this exposure by using
-- Realtime Presence channels instead of row-level publication.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='member_presence'
  ) then
    alter publication supabase_realtime add table public.member_presence;
  end if;
end $$;
