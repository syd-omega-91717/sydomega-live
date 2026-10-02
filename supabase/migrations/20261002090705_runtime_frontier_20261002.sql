begin;

create table if not exists public.omega_media_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null,
  provider text not null default 'external',
  status text not null default 'QUEUED' check (status in ('QUEUED','RUNNING','SUCCEEDED','FAILED','BLOCKED_PROVIDER','CANCELLED')),
  job_type text not null,
  request jsonb not null default '{}'::jsonb,
  provider_job_id text,
  result jsonb,
  error_code text,
  error_detail text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,idempotency_key)
);
create index if not exists omega_media_jobs_user_created_idx on public.omega_media_jobs(user_id,created_at desc);
alter table public.omega_media_jobs enable row level security;
drop policy if exists omega_media_jobs_self_read on public.omega_media_jobs;
create policy omega_media_jobs_self_read on public.omega_media_jobs for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.omega_media_jobs from anon;
grant select on public.omega_media_jobs to authenticated;
grant all on public.omega_media_jobs to service_role;

create table if not exists public.omega_investment_watchlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  symbol text not null,
  asset_class text not null default 'equity',
  market text,
  notes text,
  alert_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,symbol,asset_class,market)
);
create index if not exists omega_investment_watchlists_user_idx on public.omega_investment_watchlists(user_id,updated_at desc);
alter table public.omega_investment_watchlists enable row level security;
drop policy if exists omega_investment_watchlists_self_all on public.omega_investment_watchlists;
create policy omega_investment_watchlists_self_all on public.omega_investment_watchlists for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
revoke all on public.omega_investment_watchlists from anon;
grant select,insert,update,delete on public.omega_investment_watchlists to authenticated;
grant all on public.omega_investment_watchlists to service_role;

create table if not exists public.omega_legal_documents (
  document_type text primary key check (document_type in ('terms','privacy')),
  version text not null,
  status text not null default 'DRAFT' check (status in ('DRAFT','PUBLISHED','RETIRED')),
  effective_at timestamptz,
  title text not null,
  body_markdown text not null,
  source_uri text,
  content_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.omega_legal_documents enable row level security;
drop policy if exists omega_legal_documents_public_read on public.omega_legal_documents;
create policy omega_legal_documents_public_read on public.omega_legal_documents for select to anon,authenticated using (status='PUBLISHED');
revoke insert,update,delete on public.omega_legal_documents from anon,authenticated;
grant select on public.omega_legal_documents to anon,authenticated;
grant all on public.omega_legal_documents to service_role;

create table if not exists public.omega_blockchain_ownership_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  chain_id integer not null,
  contract_address text not null,
  token_standard text not null check (token_standard in ('ERC721','ERC1155')),
  token_id numeric not null,
  wallet_address text not null,
  observed_owner text,
  balance numeric,
  rpc_endpoint text not null,
  verification_status text not null check (verification_status in ('VERIFIED','NOT_OWNER','NOT_FOUND','RPC_ERROR','INVALID_INPUT')),
  provider_block_number bigint,
  proof jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists omega_blockchain_ownership_user_idx on public.omega_blockchain_ownership_verifications(user_id,created_at desc);
alter table public.omega_blockchain_ownership_verifications enable row level security;
drop policy if exists omega_blockchain_ownership_self_read on public.omega_blockchain_ownership_verifications;
create policy omega_blockchain_ownership_self_read on public.omega_blockchain_ownership_verifications for select to authenticated using ((select auth.uid())=user_id);
revoke all on public.omega_blockchain_ownership_verifications from anon;
grant select on public.omega_blockchain_ownership_verifications to authenticated;
grant all on public.omega_blockchain_ownership_verifications to service_role;

create or replace function private.omega_media_job_create(p_user_id uuid,p_job_type text,p_request jsonb,p_idempotency_key text,p_provider text default 'external')
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.omega_media_jobs;
begin
 if p_user_id is null or p_job_type is null or p_idempotency_key is null then raise exception 'invalid_media_job'; end if;
 insert into public.omega_media_jobs(user_id,idempotency_key,provider,job_type,request)
 values(p_user_id,p_idempotency_key,coalesce(nullif(p_provider,''),'external'),p_job_type,coalesce(p_request,'{}'::jsonb))
 on conflict(user_id,idempotency_key) do update set updated_at=now()
 returning * into v;
 return jsonb_build_object('id',v.id,'status',v.status,'provider',v.provider,'job_type',v.job_type,'created_at',v.created_at);
end $$;
revoke all on function private.omega_media_job_create(uuid,text,jsonb,text,text) from public,anon,authenticated;

create or replace function private.omega_watchlist_upsert(p_user_id uuid,p_symbol text,p_asset_class text default 'equity',p_market text default null,p_notes text default null,p_alert_rules jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v public.omega_investment_watchlists;
begin
 if p_user_id is null or nullif(pg_catalog.trim(p_symbol),'') is null then raise exception 'symbol_required'; end if;
 insert into public.omega_investment_watchlists(user_id,symbol,asset_class,market,notes,alert_rules)
 values(p_user_id,upper(pg_catalog.trim(p_symbol)),coalesce(nullif(p_asset_class,''),'equity'),nullif(p_market,''),p_notes,coalesce(p_alert_rules,'{}'::jsonb))
 on conflict(user_id,symbol,asset_class,market) do update set notes=excluded.notes,alert_rules=excluded.alert_rules,updated_at=now()
 returning * into v;
 return to_jsonb(v);
end $$;
revoke all on function private.omega_watchlist_upsert(uuid,text,text,text,text,jsonb) from public,anon,authenticated;

create or replace function public.record_blockchain_ownership_verification(p_user_id uuid,p_verification jsonb)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare v public.omega_blockchain_ownership_verifications;
begin
 if p_user_id is null or p_verification is null then raise exception 'verification_required'; end if;
 insert into public.omega_blockchain_ownership_verifications
 (user_id,chain_id,contract_address,token_standard,token_id,wallet_address,observed_owner,balance,rpc_endpoint,verification_status,provider_block_number,proof)
 values
 (p_user_id,(p_verification->>'chain_id')::integer,p_verification->>'contract_address',p_verification->>'token_standard',(p_verification->>'token_id')::numeric,p_verification->>'wallet_address',p_verification->>'observed_owner',nullif(p_verification->>'balance','')::numeric,p_verification->>'rpc_endpoint',p_verification->>'verification_status',nullif(p_verification->>'provider_block_number','')::bigint,coalesce(p_verification->'proof','{}'::jsonb))
 returning * into v;
 return to_jsonb(v);
end $$;
revoke all on function public.record_blockchain_ownership_verification(uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_blockchain_ownership_verification(uuid,jsonb) to service_role;

update public.omega_module_runtime_actions set lifecycle='INTEGRATED'
where (module_id,action_name) in
(('MEDIA','jobs.read'),('INVESTMENT','watchlist.read'),('LEGAL','terms.read'),('LEGAL','privacy.read'),('LEGAL','consent.read'),('BLOCKCHAIN_NFT','assets.read'),('BLOCKCHAIN_NFT','ownership.verify'));

commit;