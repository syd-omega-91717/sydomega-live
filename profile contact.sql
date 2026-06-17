-- SYD OMEGA 91717 — phone + country for recovery & identity (idempotent)
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists country text;
