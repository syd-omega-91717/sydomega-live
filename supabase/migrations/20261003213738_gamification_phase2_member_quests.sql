-- Gamification Phase 2 (3/6): member_quests table. RLS on, no grants yet
-- (closed until 20261003214022 adds the grant and policies).

create table if not exists public.member_quests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text check (description is null or char_length(description) <= 1000),
  difficulty smallint not null default 1 check (difficulty between 1 and 5),
  element text check (element is null or element in ('fire','water','wind','metal','sand','soul','space','void')),
  status text not null default 'active' check (status in ('active','completed','archived')),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists member_quests_user_idx
  on public.member_quests(user_id, status, created_at desc);

alter table public.member_quests enable row level security;
revoke all on table public.member_quests from anon, authenticated;
