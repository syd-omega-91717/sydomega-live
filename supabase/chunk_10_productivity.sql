/* ==========================================================================
   CHUNK 10 — PRODUCTIVITY & SOVEREIGNTY TABLES
   · focus_sessions   — deep work session records
   · habit_logs       — daily habit completion tracking
   · okr_objectives   — quarterly OKR objectives
   · okr_key_results  — key results per objective
   · wealth_snapshots — net worth periodic snapshots
   ========================================================================== */

/* ── FOCUS SESSIONS ── */
CREATE TABLE IF NOT EXISTS public.focus_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_name      text NOT NULL DEFAULT 'Untitled' CHECK (char_length(task_name) <= 200),
  mode           text NOT NULL DEFAULT 'DEEP WORK'
                   CHECK (mode IN ('DEEP WORK','ULTRADIAN','FLOW STATE','BREAK','CUSTOM')),
  duration_secs  integer NOT NULL CHECK (duration_secs >= 0),
  target_secs    integer NOT NULL CHECK (target_secs > 0),
  distractions   integer NOT NULL DEFAULT 0 CHECK (distractions >= 0),
  completed_at   timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS focus_sessions_user_id_idx ON public.focus_sessions(user_id);
CREATE INDEX IF NOT EXISTS focus_sessions_completed_at_idx ON public.focus_sessions(completed_at DESC);

ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='focus_sessions' AND policyname='focus_own') THEN
    CREATE POLICY focus_own ON public.focus_sessions FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


/* ── HABIT LOGS ── */
CREATE TABLE IF NOT EXISTS public.habit_logs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id   text NOT NULL,
  habit_name text NOT NULL CHECK (char_length(habit_name) <= 100),
  log_date   date NOT NULL DEFAULT CURRENT_DATE,
  completed  boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, habit_id, log_date)
);

CREATE INDEX IF NOT EXISTS habit_logs_user_date ON public.habit_logs(user_id, log_date DESC);

ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='habit_logs' AND policyname='habit_logs_own') THEN
    CREATE POLICY habit_logs_own ON public.habit_logs FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


/* ── OKR OBJECTIVES ── */
CREATE TABLE IF NOT EXISTS public.okr_objectives (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quarter     text NOT NULL CHECK (quarter ~ '^Q[1-4] \d{4}$'),
  title       text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 200),
  description text,
  category    text NOT NULL DEFAULT 'sovereignty'
                CHECK (category IN ('sovereignty','wealth','mastery','health','relationships','impact')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS okr_objectives_user_quarter ON public.okr_objectives(user_id, quarter);

ALTER TABLE public.okr_objectives ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='okr_objectives' AND policyname='okr_obj_own') THEN
    CREATE POLICY okr_obj_own ON public.okr_objectives FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


/* ── OKR KEY RESULTS ── */
CREATE TABLE IF NOT EXISTS public.okr_key_results (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id   uuid NOT NULL REFERENCES public.okr_objectives(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title          text NOT NULL CHECK (char_length(title) BETWEEN 3 AND 200),
  start_value    numeric NOT NULL DEFAULT 0,
  target_value   numeric NOT NULL,
  current_value  numeric NOT NULL DEFAULT 0,
  unit           text NOT NULL DEFAULT '',
  updated_at     timestamptz NOT NULL DEFAULT now(),
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS okr_krs_objective ON public.okr_key_results(objective_id);
CREATE INDEX IF NOT EXISTS okr_krs_user ON public.okr_key_results(user_id);

ALTER TABLE public.okr_key_results ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='okr_key_results' AND policyname='okr_kr_own') THEN
    CREATE POLICY okr_kr_own ON public.okr_key_results FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


/* ── WEALTH SNAPSHOTS ── */
CREATE TABLE IF NOT EXISTS public.wealth_snapshots (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  net_worth   numeric NOT NULL,
  assets_json jsonb,
  snapshot_at timestamptz NOT NULL DEFAULT now(),
  note        text
);

CREATE INDEX IF NOT EXISTS wealth_snapshots_user ON public.wealth_snapshots(user_id, snapshot_at DESC);

ALTER TABLE public.wealth_snapshots ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wealth_snapshots' AND policyname='wealth_own') THEN
    CREATE POLICY wealth_own ON public.wealth_snapshots FOR ALL
      USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;


/* ── GRANT PERMISSIONS ── */
GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.okr_objectives TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.okr_key_results TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wealth_snapshots TO authenticated;
