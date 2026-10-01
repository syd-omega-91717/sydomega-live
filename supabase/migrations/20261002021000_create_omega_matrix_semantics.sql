-- SYD OMEGA 91717
-- Semantic scaffolding for the canonical 729-node matrix.
-- This deliberately does not fabricate node-specific objectives, achievements or rewards.

begin;

create table if not exists public.omega_matrix_node_semantics (
  node_index integer primary key references public.omega_matrix_nodes(node_index) on delete cascade,
  semantic_status text not null default 'DESIGNED'
    check (semantic_status in ('SPECIFIED','DESIGNED','BUILT','INTEGRATED','TESTED','VERIFIED')),
  stage_band text not null,
  domain text not null,
  objective text not null,
  evidence_requirement jsonb not null default '{}'::jsonb,
  prerequisite_policy text not null default 'SOURCE_REQUIRED',
  reward_policy jsonb not null default '{}'::jsonb,
  source_refs jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.omega_matrix_node_semantics enable row level security;

drop policy if exists omega_matrix_node_semantics_read on public.omega_matrix_node_semantics;
create policy omega_matrix_node_semantics_read
  on public.omega_matrix_node_semantics
  for select to authenticated
  using (true);

revoke all on public.omega_matrix_node_semantics from anon;

insert into public.omega_matrix_node_semantics
(node_index, stage_band, domain, objective, evidence_requirement, prerequisite_policy, reward_policy, source_refs)
select
  n.node_index,
  case
    when n.stage between 1 and 3 then 'SEEKER_FOUNDATION'
    when n.stage between 4 and 6 then 'INITIATE_AGENTIC_DELEGATION'
    else 'SOVEREIGN_TOTAL_CAPABILITY'
  end,
  'PROGRESSION',
  'Complete the governed progression objective for coordinate ' || n.node_key ||
    '; source-specific objective content remains required before this node can be marked BUILT.',
  jsonb_build_object(
    'verification','EVIDENCE_REQUIRED',
    'completion','VERIFICATION_REQUIRED',
    'fabricated_completion_allowed',false
  ),
  'SOURCE_REQUIRED',
  jsonb_build_object('reward_status','UNSPECIFIED_UNTIL_VERIFIED'),
  jsonb_build_array(
    jsonb_build_object('kind','canonical_coordinate','node_key',n.node_key,'status','STRUCTURAL_SOURCE')
  )
from public.omega_matrix_nodes n
on conflict (node_index) do update set
  stage_band=excluded.stage_band,
  domain=excluded.domain,
  objective=excluded.objective,
  evidence_requirement=excluded.evidence_requirement,
  prerequisite_policy=excluded.prerequisite_policy,
  reward_policy=excluded.reward_policy,
  source_refs=excluded.source_refs,
  updated_at=now();

commit;
