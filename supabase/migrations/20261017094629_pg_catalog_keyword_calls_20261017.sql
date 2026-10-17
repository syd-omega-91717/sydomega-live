-- Ω SYD OMEGA 91717 — four runtime functions called TRIM as a catalog function
-- TRIM is SQL syntax, not a function in pg_catalog, so every
-- `pg_catalog.trim(x)` raises 42883 "function pg_catalog.trim(text) does not
-- exist" when that line runs (plpgsql bodies are only checked at call time,
-- so CREATE succeeded). Same defect as post_ledger_transaction
-- (20261017093316). Live, 2026-10-17, 15 calls in four functions:
--   omega_private.create_consult_intake  ×6  — every consult intake
--   omega_private.create_service_order   ×2  — every service order
--   private.omega_watchlist_upsert       ×2  — every watchlist save
--   public.omega_runtime_dispatch        ×5  — module_manifest, module_state,
--     module_read (incl. watchlist.read) and issue_referral_code
-- All four are reached through omega-runtime-gateway → omega_runtime_dispatch.
-- 0 rows ever in omega_investment_watchlists, omega_service_orders and
-- omega_referral_codes.
--
-- Every call is single-argument (`pg_catalog.trim(p_x)`), for which
-- pg_catalog.btrim is the exact function TRIM(x) compiles to. The body is
-- rewritten from the function's own stored definition rather than retyped,
-- so nothing else can change; CREATE OR REPLACE keeps owner, ACL, SECURITY
-- DEFINER and search_path. Idempotent: an already-fixed body is left alone.
-- The final check fails the migration if any function outside the system
-- schemas still calls a SQL keyword through pg_catalog.

begin;

do $$
declare
  v_fn regprocedure;
  v_def text;
  v_fixed text;
begin
  foreach v_fn in array array[
    'omega_private.create_consult_intake(uuid,text,text,text,text,text,boolean,text)',
    'omega_private.create_service_order(uuid,text,text,jsonb)',
    'private.omega_watchlist_upsert(uuid,text,text,text,text,jsonb)',
    'public.omega_runtime_dispatch(uuid,text,jsonb)'
  ]::regprocedure[]
  loop
    v_def := pg_catalog.pg_get_functiondef(v_fn);
    v_fixed := pg_catalog.replace(v_def, 'pg_catalog.trim(', 'pg_catalog.btrim(');
    if v_fixed <> v_def then
      execute v_fixed;
    end if;
  end loop;

  if exists (
    select 1
      from pg_catalog.pg_proc p
      join pg_catalog.pg_namespace n on n.oid = p.pronamespace
     where n.nspname not in ('pg_catalog', 'information_schema')
       and n.nspname not like 'pg\_%'
       -- CASE, not AND: pg_get_functiondef raises on aggregates, and the
       -- planner may evaluate a WHERE clause's conjuncts in any order.
       and case when p.prokind in ('f', 'p')
                then pg_catalog.pg_get_functiondef(p.oid)
                     operator(pg_catalog.~*) 'pg_catalog\.(trim|coalesce|nullif|greatest|least)\s*\('
                else false end
  ) then
    raise exception 'sql_keyword_called_as_pg_catalog_function_remains';
  end if;
end
$$;

commit;
