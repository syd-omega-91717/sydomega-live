-- SYD OMEGA 91717
-- Referral, achievement verification, governed agent tasks, and notification primitives.
-- Production contract: no client-side reward posting, no client-side agent execution, no fabricated achievements.

begin;

create table if not exists public.omega_referral_codes (
  referral_code text primary key,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','paused','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists omega_referral_codes_owner_uidx on public.omega_referral_codes(owner_user_id);

create table if not exists public.omega_referral_clicks (
  click_id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.omega_referral_codes(referral_code),
  visitor_key text,
  landing_path text,
  user_agent_hash text,
  ip_hash text,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists omega_referral_clicks_code_idx on public.omega_referral_clicks(referral_code, occurred_at desc);

create table if not exists public.omega_referral_attributions (
  attribution_id uuid primary key default gen_random_uuid(),
  referral_code text not null references public.omega_referral_codes(referral_code),
  referred_user_id uuid not null unique references auth.users(id) on delete cascade,
  attributed_at timestamptz not null default now(),
  source_click_id uuid references public.omega_referral_clicks(click_id),
  status text not null default 'pending' check (status in ('pending','qualified','rejected','reversed')),
  rejection_reason text
);

create table if not exists public.omega_referral_conversions (
  conversion_id uuid primary key default gen_random_uuid(),
  attribution_id uuid not null unique references public.omega_referral_attributions(attribution_id) on delete cascade,
  qualifying_event text not null,
  provider_reference text,
  amount numeric(20,8),
  currency text,
  converted_at timestamptz not null default now(),
  idempotency_key text not null unique,
  status text not null default 'pending' check (status in ('pending','confirmed','reversed','rejected')),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.omega_referral_rewards (
  reward_id uuid primary key default gen_random_uuid(),
  conversion_id uuid not null unique references public.omega_referral_conversions(conversion_id) on delete cascade,
  referrer_user_id uuid not null references auth.users(id) on delete cascade,
  referred_user_id uuid not null references auth.users(id) on delete cascade,
  reward_type text not null,
  reward_value numeric(20,8) not null check (reward_value >= 0),
  currency text,
  ledger_transaction_id uuid references public.omega_ledger_transactions(transaction_id),
  status text not null default 'pending' check (status in ('pending','approved','posted','reversed','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.omega_fraud_signals (
  signal_id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  referral_code text references public.omega_referral_codes(referral_code),
  signal_type text not null,
  severity text not null default 'medium' check (severity in ('low','medium','high','critical')),
  score numeric(8,4),
  status text not null default 'open' check (status in ('open','reviewed','dismissed','confirmed')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
create index if not exists omega_referral_fraud_user_idx on public.omega_fraud_signals(user_id, created_at desc);

create table if not exists public.omega_achievement_definitions (
  achievement_id text primary key,
  version integer not null default 1,
  title text not null,
  description text not null,
  achievement_type text not null check (achievement_type in ('node','stage','mission','certificate','contribution','service','governance','custom')),
  verification_rule jsonb not null default '{}'::jsonb,
  reward_policy jsonb not null default '{}'::jsonb,
  lifecycle text not null default 'active' check (lifecycle in ('draft','active','retired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.omega_user_achievements (
  user_achievement_id uuid primary key default gen_random_uuid(),
  achievement_id text not null references public.omega_achievement_definitions(achievement_id),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','verified','revoked')),
  evidence_ref text,
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  unique (achievement_id, user_id)
);

create table if not exists public.omega_achievement_verifications (
  verification_id uuid primary key default gen_random_uuid(),
  user_achievement_id uuid not null references public.omega_user_achievements(user_achievement_id) on delete cascade,
  verification_type text not null,
  verifier text not null,
  evidence jsonb not null default '{}'::jsonb,
  decision text not null check (decision in ('approved','rejected','needs_review')),
  decided_at timestamptz not null default now(),
  idempotency_key text not null unique
);

create table if not exists public.omega_certificates (
  certificate_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_id text not null references public.omega_achievement_definitions(achievement_id),
  certificate_number text not null unique,
  status text not null default 'issued' check (status in ('draft','issued','revoked')),
  issued_at timestamptz not null default now(),
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists public.omega_agent_tasks (
  task_id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  agent_id text not null references public.omega_agents(agent_id),
  task_type text not null,
  status text not null default 'queued' check (status in ('queued','approved','running','succeeded','failed','cancelled','needs_review')),
  requested_by text not null default 'user',
  input jsonb not null default '{}'::jsonb,
  output jsonb,
  tool_plan jsonb not null default '[]'::jsonb,
  budget numeric(20,8) not null default 0 check (budget >= 0),
  approval_required boolean not null default true,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  error_message text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.omega_agent_task_events (
  event_id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.omega_agent_tasks(task_id) on delete cascade,
  event_type text not null,
  actor text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.omega_agent_tool_grants (
  grant_id uuid primary key default gen_random_uuid(),
  agent_id text not null references public.omega_agents(agent_id) on delete cascade,
  tool_name text not null,
  scope jsonb not null default '{}'::jsonb,
  max_calls integer not null default 0 check (max_calls >= 0),
  approval_required boolean not null default true,
  enabled boolean not null default false,
  unique(agent_id, tool_name)
);

create table if not exists public.omega_notifications (
  notification_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text not null,
  severity text not null default 'info' check (severity in ('info','success','warning','critical')),
  channel text not null default 'in_app' check (channel in ('in_app','email','sms','push')),
  status text not null default 'queued' check (status in ('queued','sent','delivered','read','failed','cancelled')),
  source_event_id uuid,
  idempotency_key text not null unique,
  sent_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists omega_notifications_user_idx on public.omega_notifications(user_id, created_at desc);

alter table public.omega_referral_codes enable row level security;
alter table public.omega_referral_clicks enable row level security;
alter table public.omega_referral_attributions enable row level security;
alter table public.omega_referral_conversions enable row level security;
alter table public.omega_referral_rewards enable row level security;
alter table public.omega_fraud_signals enable row level security;
alter table public.omega_achievement_definitions enable row level security;
alter table public.omega_user_achievements enable row level security;
alter table public.omega_achievement_verifications enable row level security;
alter table public.omega_certificates enable row level security;
alter table public.omega_agent_tasks enable row level security;
alter table public.omega_agent_task_events enable row level security;
alter table public.omega_agent_tool_grants enable row level security;
alter table public.omega_notifications enable row level security;

drop policy if exists omega_referral_codes_owner_read on public.omega_referral_codes;
create policy omega_referral_codes_owner_read on public.omega_referral_codes for select to authenticated
using ((select auth.uid()) = owner_user_id);

drop policy if exists omega_referral_attributions_owner_read on public.omega_referral_attributions;
create policy omega_referral_attributions_owner_read on public.omega_referral_attributions for select to authenticated
using ((select auth.uid()) = referred_user_id or (select auth.uid()) = (
  select c.owner_user_id from public.omega_referral_codes c where c.referral_code = omega_referral_attributions.referral_code));

drop policy if exists omega_referral_rewards_owner_read on public.omega_referral_rewards;
create policy omega_referral_rewards_owner_read on public.omega_referral_rewards for select to authenticated
using ((select auth.uid()) = referrer_user_id or (select auth.uid()) = referred_user_id);

drop policy if exists omega_achievement_defs_read on public.omega_achievement_definitions;
create policy omega_achievement_defs_read on public.omega_achievement_definitions for select to authenticated
using (lifecycle = 'active');

drop policy if exists omega_user_achievements_owner_read on public.omega_user_achievements;
create policy omega_user_achievements_owner_read on public.omega_user_achievements for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists omega_certificates_owner_read on public.omega_certificates;
create policy omega_certificates_owner_read on public.omega_certificates for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists omega_agent_tasks_owner_read on public.omega_agent_tasks;
create policy omega_agent_tasks_owner_read on public.omega_agent_tasks for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists omega_agent_task_events_owner_read on public.omega_agent_task_events;
create policy omega_agent_task_events_owner_read on public.omega_agent_task_events for select to authenticated
using ((select auth.uid()) = (select t.user_id from public.omega_agent_tasks t where t.task_id = omega_agent_task_events.task_id));

drop policy if exists omega_notifications_owner_read on public.omega_notifications;
create policy omega_notifications_owner_read on public.omega_notifications for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists omega_notifications_owner_update on public.omega_notifications;
create policy omega_notifications_owner_update on public.omega_notifications for update to authenticated
using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.omega_referral_codes, public.omega_referral_clicks, public.omega_referral_attributions, public.omega_referral_conversions, public.omega_referral_rewards, public.omega_fraud_signals from anon;
revoke all on public.omega_achievement_definitions, public.omega_user_achievements, public.omega_achievement_verifications, public.omega_certificates from anon;
revoke all on public.omega_agent_tasks, public.omega_agent_task_events, public.omega_agent_tool_grants from anon;
revoke all on public.omega_notifications from anon;

commit;
