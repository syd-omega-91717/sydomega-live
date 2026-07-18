-- ============================================================================
-- SYD OMEGA 91717 -- LEGACY HONORS FIX (run this ONCE, then re-run MASTER)
-- Older certificates/trophies/medals tables (from another tool) have NOT-NULL
-- name columns. Our seeds fill only the _num columns. This relaxes those legacy
-- constraints so seeding succeeds. Idempotent + safe.
-- ============================================================================
DO $fix$
BEGIN
  BEGIN ALTER TABLE public.certificates ALTER COLUMN cert_name   DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.trophies     ALTER COLUMN trophy_name DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.medals       ALTER COLUMN medal_name  DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.certificates ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.trophies     ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
  BEGIN ALTER TABLE public.medals       ALTER COLUMN name        DROP NOT NULL; EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL; END;
END $fix$;
