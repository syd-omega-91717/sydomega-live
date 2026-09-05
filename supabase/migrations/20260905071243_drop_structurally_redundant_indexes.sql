/* Applied live 2026-09-05 via apply_migration as version 20260905071243.

   Supabase performance advisor 0005_unused_index reported 191 indexes.
   "Unused" at this scale mostly reflects near-zero traffic (9 profiles) and is
   not actionable -- an index on a table nobody has queried yet is not thereby
   wrong.

   REDUNDANT is a different and stronger claim, and it is structural rather
   than statistical: an index whose column list is a leading prefix of another
   index on the same table can never be chosen over the wider one, at any
   traffic level. Those are real dead weight -- they cost every INSERT, UPDATE
   and DELETE, plus storage, and buy nothing. 29 such indexes existed.

   The set is RE-DERIVED at execution time rather than hardcoded, so this
   cannot drop an index that is not actually redundant when it runs, and a
   typo cannot drop the wrong object. Re-running it is a no-op.

   Never dropped: unique indexes, primary keys, anything backing a constraint
   (they enforce correctness, not just speed), partial indexes (a predicate
   makes the prefix comparison meaningless) and expression indexes (attnum 0).

   NOTE ON indkey: `indkey::smallint[]` is ZERO-based. The first version of
   this rule sliced it with 1-based bounds, compared the wrong elements and
   reported a serene zero redundant indexes -- CLAUDE.md 8.4's "verify a 0
   findings result is real". It was caught by hand-checking codex_bookmarks,
   where a (user_id) index plainly sat under a (user_id, url) unique index.
   Going through text yields a 1-based array. */
DO $$
DECLARE r record; n int := 0;
BEGIN
  FOR r IN
    WITH idx AS (
      SELECT rel.relname AS tbl,
             c.relname   AS idx_name,
             string_to_array(i.indkey::text,' ')::smallint[] AS cols,
             i.indisunique AS uniq,
             i.indisprimary AS pk,
             EXISTS (SELECT 1 FROM pg_constraint k WHERE k.conindid = i.indexrelid) AS backs_constraint
      FROM pg_index i
      JOIN pg_class c   ON c.oid = i.indexrelid
      JOIN pg_class rel ON rel.oid = i.indrelid
      JOIN pg_namespace n2 ON n2.oid = rel.relnamespace
      WHERE n2.nspname = 'public'
        AND i.indpred IS NULL
        AND 0 <> ALL (string_to_array(i.indkey::text,' ')::smallint[])
    )
    SELECT DISTINCT a.idx_name
    FROM idx a
    JOIN idx b
      ON a.tbl = b.tbl
     AND a.idx_name <> b.idx_name
     AND array_length(b.cols,1) >= array_length(a.cols,1)
     AND b.cols[1:array_length(a.cols,1)] = a.cols
    WHERE NOT a.uniq AND NOT a.pk AND NOT a.backs_constraint
  LOOP
    EXECUTE format('DROP INDEX IF EXISTS public.%I', r.idx_name);
    n := n + 1;
  END LOOP;
  RAISE NOTICE 'dropped % redundant index(es)', n;
END $$;
