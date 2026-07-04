-- SYD OMEGA 91717 — platform terms acceptance + per-engagement confidentiality/commission (idempotent)
alter table public.profiles add column if not exists terms_accepted boolean not null default false;
alter table public.profiles add column if not exists terms_accepted_at timestamptz;
alter table public.consult_requests add column if not exists commission_rate numeric not null default 9.17;
alter table public.consult_requests add column if not exists confidentiality_accepted boolean not null default false;
alter table public.commission_contracts add column if not exists confidentiality_accepted boolean not null default false;
