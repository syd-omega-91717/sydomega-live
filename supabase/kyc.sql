-- SYD OMEGA 91717 — KYC / Passport columns on profiles (idempotent)
alter table public.profiles add column if not exists kyc_status text default 'none';
alter table public.profiles add column if not exists kyc_doc_path text;
alter table public.profiles add column if not exists kyc_submitted_at timestamptz;
