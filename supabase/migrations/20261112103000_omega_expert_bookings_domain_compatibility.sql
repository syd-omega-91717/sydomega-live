-- The consultancy runtime adapter reads expert_bookings.domain.
-- Production has this column, but a clean migration replay exposed that the
-- canonical fresh-install history did not create it. Add it without changing
-- existing booking rows or their access policies.
begin;

alter table public.expert_bookings
  add column if not exists domain text;

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema='public'
      and table_name='expert_bookings'
      and column_name='domain'
      and data_type='text'
  ) then
    raise exception 'expert_bookings_domain_compatibility_column_missing';
  end if;
end;
$$;

commit;
