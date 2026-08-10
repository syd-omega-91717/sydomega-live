-- matrix_engine.sql (the "rich" schema — what complete_task()'s live body expects)
CREATE TABLE IF NOT EXISTS public.task_completions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_name text NOT NULL, task_type text NOT NULL DEFAULT 'knowledge',
  axis_type text NOT NULL DEFAULT 'a' CHECK (axis_type IN ('a','b','c')),
  description text, points_earned numeric(10,3) NOT NULL DEFAULT 0.001,
  axis_a_before numeric(10,3), axis_b_before numeric(10,3), axis_c_before numeric(10,3),
  axis_a_after numeric(10,3), axis_b_after numeric(10,3), axis_c_after numeric(10,3),
  auth_after numeric(12,6), completed_at timestamptz NOT NULL DEFAULT now(), metadata jsonb
);

-- migration_runner.sql / omega_backend_sync.sql / omega_master_deploy.sql (a much older, simpler shape)
CREATE TABLE IF NOT EXISTS public.task_completions(
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  task text, kind text, completed_at timestamptz DEFAULT now(), created_at timestamptz DEFAULT now());
