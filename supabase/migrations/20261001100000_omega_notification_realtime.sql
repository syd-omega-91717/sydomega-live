-- Ω SYD OMEGA 91717
-- Live notification stream
-- Applied live on 2026-10-01.

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
