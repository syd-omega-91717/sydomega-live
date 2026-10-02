begin;

-- Target-project reconciliation checkpoint.
-- The executable schema primitives are supplied by the canonical 20261002
-- product migrations already tracked in this repository. This checkpoint is
-- deliberately fail-closed: it never fabricates rows and proves that the
-- target database contains the expected structural product layer.

do $$
begin
  if to_regclass('public.omega_agents') is null then
    raise exception 'omega_agents missing: apply canonical agent registry migration first';
  end if;
  if to_regclass('public.omega_matrix_nodes') is null then
    raise exception 'omega_matrix_nodes missing: apply canonical 729-node migration first';
  end if;
  if to_regclass('public.omega_matrix_node_semantics') is null then
    raise exception 'omega_matrix_node_semantics missing: apply canonical semantic migration first';
  end if;
  if to_regclass('public.omega_referral_codes') is null then
    raise exception 'omega_referral_codes missing: apply canonical referral migration first';
  end if;
  if to_regclass('public.omega_achievement_definitions') is null then
    raise exception 'omega_achievement_definitions missing: apply canonical achievement migration first';
  end if;
  if to_regclass('public.omega_agent_tasks') is null then
    raise exception 'omega_agent_tasks missing: apply canonical agent task migration first';
  end if;
  if to_regclass('public.omega_notifications') is null then
    raise exception 'omega_notifications missing: apply canonical notification migration first';
  end if;
end $$;

do $$
declare
  v_agents bigint;
  v_nodes bigint;
  v_semantics bigint;
begin
  select count(*) into v_agents from public.omega_agents;
  select count(*) into v_nodes from public.omega_matrix_nodes;
  select count(*) into v_semantics from public.omega_matrix_node_semantics;

  if v_agents <> 12 then
    raise exception 'expected 12 governed agents, found %', v_agents;
  end if;
  if v_nodes <> 729 then
    raise exception 'expected 729 progression nodes, found %', v_nodes;
  end if;
  if v_semantics <> 729 then
    raise exception 'expected 729 progression semantic records, found %', v_semantics;
  end if;
end $$;

commit;
