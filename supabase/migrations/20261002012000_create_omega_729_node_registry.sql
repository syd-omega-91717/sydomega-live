-- Ω SYD OMEGA 91717
-- Canonical 9×9×9 progression node registry (729 deterministic nodes).
-- Structural product layer only: semantic content, prerequisites,
-- verification evidence and rewards remain explicit fields and are not
-- fabricated as completed user achievements.

create table if not exists public.omega_matrix_nodes (
  node_index integer primary key check (node_index between 1 and 729),
  node_key text not null unique,
  coordinate_a smallint not null check (coordinate_a between 1 and 9),
  coordinate_b smallint not null check (coordinate_b between 1 and 9),
  coordinate_c smallint not null check (coordinate_c between 1 and 9),
  stage smallint not null check (stage between 1 and 9),
  title text not null,
  description text not null,
  prerequisite_node_indices integer[] not null default '{}',
  verification_type text not null default 'EVIDENCE_REQUIRED',
  completion_rule jsonb not null default '{}'::jsonb,
  reward_policy jsonb not null default '{}'::jsonb,
  status text not null default 'SPECIFIED'
    check (status in ('SPECIFIED','DESIGNED','BUILT','INTEGRATED','TESTED','DEPLOYED','VERIFIED','BLOCKED')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.omega_matrix_nodes (
  node_index,node_key,coordinate_a,coordinate_b,coordinate_c,stage,title,description
)
select
  ((a-1)*81)+((b-1)*9)+c,
  format('OMEGA-%s-%s-%s',a,b,c),
  a,b,c,
  greatest(a,b,c),
  format('Omega Progression Node %s.%s.%s',a,b,c),
  format('Deterministic 9x9x9 progression coordinate A%s / B%s / C%s. Semantic objective, evidence and reward remain explicitly governed data.',a,b,c)
from generate_series(1,9) a
cross join generate_series(1,9) b
cross join generate_series(1,9) c
on conflict (node_index) do nothing;

create index if not exists omega_matrix_nodes_stage_idx
  on public.omega_matrix_nodes(stage);
create index if not exists omega_matrix_nodes_coordinates_idx
  on public.omega_matrix_nodes(coordinate_a,coordinate_b,coordinate_c);

alter table public.omega_matrix_nodes enable row level security;

drop policy if exists omega_matrix_nodes_authenticated_read on public.omega_matrix_nodes;
create policy omega_matrix_nodes_authenticated_read
on public.omega_matrix_nodes
for select
to authenticated
using (true);

revoke all on public.omega_matrix_nodes from anon;
grant select on public.omega_matrix_nodes to authenticated;
grant all on public.omega_matrix_nodes to service_role;

comment on table public.omega_matrix_nodes is
  'Canonical 729-node 9x9x9 progression registry. Node existence is not user completion or achievement evidence.';
