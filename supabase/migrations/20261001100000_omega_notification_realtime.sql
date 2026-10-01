-- Ω SYD OMEGA 91717
-- Live notification stream
-- Repository migration record. Live application to target project nvgedlxlkdzvcelimbvq is NOT verified here.

do $
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname='supabase_realtime' and schemaname='public' and tablename='notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$;
