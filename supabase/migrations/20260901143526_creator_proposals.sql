-- SYD OMEGA 91717: creator proposal foundation
create table if not exists public.creator_proposals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 180),
  summary text not null check (char_length(trim(summary)) between 10 and 2000),
  category text not null default 'general' check (category in ('general','product','media','game','education','community','marketplace','technology')),
  status text not null default 'draft' check (status in ('draft','submitted','review','approved','rejected','archived')),
  review_note text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists creator_proposals_owner_idx on public.creator_proposals(owner_id, updated_at desc);
create index if not exists creator_proposals_status_idx on public.creator_proposals(status, updated_at desc);
alter table public.creator_proposals enable row level security;
drop policy if exists creator_proposals_select_own on public.creator_proposals;
create policy creator_proposals_select_own on public.creator_proposals for select to authenticated using (owner_id = auth.uid());
drop policy if exists creator_proposals_insert_own on public.creator_proposals;
create policy creator_proposals_insert_own on public.creator_proposals for insert to authenticated with check (owner_id = auth.uid());
drop policy if exists creator_proposals_update_own_draft on public.creator_proposals;
create policy creator_proposals_update_own_draft on public.creator_proposals for update to authenticated using (owner_id = auth.uid() and status in ('draft','rejected')) with check (owner_id = auth.uid());
drop policy if exists creator_proposals_delete_own_draft on public.creator_proposals;
create policy creator_proposals_delete_own_draft on public.creator_proposals for delete to authenticated using (owner_id = auth.uid() and status = 'draft');
create or replace function public.touch_creator_proposal_updated_at()
returns trigger language plpgsql security invoker set search_path = public
as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists creator_proposals_touch_updated_at on public.creator_proposals;
create trigger creator_proposals_touch_updated_at before update on public.creator_proposals for each row execute function public.touch_creator_proposal_updated_at();
comment on table public.creator_proposals is 'User-created platform ideas; draft/review workflow. No investment or securities rights are implied.';
