/* Applied live 2026-09-05 via Supabase migration version 20260905080109.

   Purpose: close the Supabase performance advisor finding for unindexed
   foreign keys without guessing at table-specific schemas. The migration
   derives every public foreign-key column set from pg_catalog and creates a
   covering B-tree index only when no valid non-partial, non-expression index
   already has that exact leading column set.

   This is intentionally separate from unused-index cleanup. An unused index
   is workload evidence, not proof of structural redundancy; deleting those
   indexes blindly can damage future query plans. */
DO $$
DECLARE
  r record;
  idx_name text;
  cols text;
BEGIN
  FOR r IN
    SELECT
      n.nspname AS schema_name,
      c.relname AS table_name,
      con.conname AS constraint_name,
      array_agg(a.attname ORDER BY k.ord) AS column_names
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    CROSS JOIN LATERAL unnest(con.conkey) WITH ORDINALITY AS k(attnum, ord)
    JOIN pg_attribute a ON a.attrelid = c.oid AND a.attnum = k.attnum
    WHERE con.contype = 'f'
      AND n.nspname = 'public'
    GROUP BY n.nspname, c.relname, con.conname
  LOOP
    SELECT string_agg(format('%I', x), ', ')
      INTO cols
      FROM unnest(r.column_names) AS u(x);

    IF NOT EXISTS (
      SELECT 1
      FROM pg_index i
      WHERE i.indrelid = format('%I.%I', r.schema_name, r.table_name)::regclass
        AND i.indisvalid
        AND i.indpred IS NULL
        AND i.indexprs IS NULL
        AND (
          SELECT array_agg(att.attname ORDER BY ord)
          FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
          JOIN pg_attribute att ON att.attrelid = i.indrelid AND att.attnum = k.attnum
          WHERE k.ord <= array_length(r.column_names, 1)
        ) = r.column_names
    ) THEN
      idx_name := left(r.table_name || '_' || r.constraint_name || '_idx', 60);
      IF EXISTS (SELECT 1 FROM pg_class WHERE relname = idx_name AND relkind = 'i') THEN
        idx_name := left(r.table_name || '_' || md5(r.constraint_name) || '_fkidx', 60);
      END IF;
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS %I ON %I.%I (%s)',
        idx_name, r.schema_name, r.table_name, cols
      );
    END IF;
  END LOOP;
END $$;
