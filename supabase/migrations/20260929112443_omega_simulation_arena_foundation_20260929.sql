-- Ω SYD OMEGA 91717 — deterministic Simulation Arena persistence
-- Simulation output is never historical fact. Each run is explicitly versioned,
-- seeded, member-owned and labelled SIMULATED by the UI.

create table if not exists public.omega_simulation_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  model_key text not null check (length(model_key) between 1 and 80),
  model_version text not null check (length(model_version) between 1 and 40),
  deterministic_seed bigint not null,
  input_snapshot jsonb not null,
  result_snapshot jsonb not null,
  created_at timestamptz not null default now()
);

alter table public.omega_simulation_runs enable row level security;

drop policy if exists omega_simulation_runs_select_own on public.omega_simulation_runs;
create policy omega_simulation_runs_select_own
on public.omega_simulation_runs
for select
to authenticated
using ((select auth.uid()) = user_id);

revoke all on table public.omega_simulation_runs from anon, authenticated;
grant select on table public.omega_simulation_runs to authenticated;

create index if not exists omega_simulation_runs_user_created_idx
on public.omega_simulation_runs (user_id, created_at desc);

create or replace function public.omega_record_simulation_run(
  p_model_key text,
  p_model_version text,
  p_deterministic_seed bigint,
  p_input_snapshot jsonb,
  p_result_snapshot jsonb
)
returns public.omega_simulation_runs
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_row public.omega_simulation_runs;
begin
  if v_user_id is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;
  if p_model_key is null or length(p_model_key) not between 1 and 80 then
    raise exception 'invalid_model_key' using errcode = '22023';
  end if;
  if p_model_version is null or length(p_model_version) not between 1 and 40 then
    raise exception 'invalid_model_version' using errcode = '22023';
  end if;
  if p_input_snapshot is null or jsonb_typeof(p_input_snapshot) <> 'object' then
    raise exception 'invalid_input_snapshot' using errcode = '22023';
  end if;
  if p_result_snapshot is null or jsonb_typeof(p_result_snapshot) <> 'object' then
    raise exception 'invalid_result_snapshot' using errcode = '22023';
  end if;
  if octet_length(p_input_snapshot::text) > 12000 then
    raise exception 'input_snapshot_too_large' using errcode = '22023';
  end if;
  if octet_length(p_result_snapshot::text) > 12000 then
    raise exception 'result_snapshot_too_large' using errcode = '22023';
  end if;

  insert into public.omega_simulation_runs(
    user_id, model_key, model_version, deterministic_seed,
    input_snapshot, result_snapshot
  )
  values (
    v_user_id, p_model_key, p_model_version, p_deterministic_seed,
    p_input_snapshot, p_result_snapshot
  )
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.omega_record_simulation_run(text,text,bigint,jsonb,jsonb) from public, anon;
grant execute on function public.omega_record_simulation_run(text,text,bigint,jsonb,jsonb) to authenticated;
