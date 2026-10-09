-- Ω SYD OMEGA 91717 — live/replay schema reconciliation
-- 2026-10-09
-- Reconciles production drift already verified against the canonical migration replay.
-- No synthetic data is inserted.

begin;

alter table public.omega_platform_evidence
  alter column capability_id set not null,
  alter column evidence_level set not null,
  alter column check_name set not null,
  alter column result set not null;

create table if not exists public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  title text,
  subject text,
  body text,
  channel text,
  created_at timestamptz default now()
);

alter table public.notification_templates enable row level security;
drop policy if exists omega_deny_by_default on public.notification_templates;
create policy omega_deny_by_default on public.notification_templates
  as restrictive for all to anon, authenticated
  using (false) with check (false);

alter table public.notification_queue enable row level security;
drop policy if exists omega_deny_by_default on public.notification_queue;
create policy omega_deny_by_default on public.notification_queue
  as restrictive for all to anon, authenticated
  using (false) with check (false);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'notification_queue_template_id_fkey'
      and conrelid = 'public.notification_queue'::regclass
  ) then
    alter table public.notification_queue
      add constraint notification_queue_template_id_fkey
      foreign key (template_id) references public.notification_templates(id);
  end if;
end $$;

alter table public.omega_knowledge_chunks enable row level security;
drop policy if exists omega_deny_by_default on public.omega_knowledge_chunks;
create policy omega_deny_by_default on public.omega_knowledge_chunks
  as restrictive for all to anon, authenticated
  using (false) with check (false);

drop policy if exists quest_completions_member_insert on public.quest_completions;
drop policy if exists quest_completions_member_update on public.quest_completions;
drop policy if exists domain_mastery_member_update on public.domain_mastery;
drop policy if exists leaderboard_member_update on public.leaderboard_entries;
drop policy if exists covenant_member_update on public.covenant_progress;

commit;
