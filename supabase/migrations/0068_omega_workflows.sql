-- ============================================================================
-- Ω SYD OMEGA 91717 — WORKFLOW ENGINE PERSISTENCE
-- Stores workflow definitions, executions, steps, and audit trail
-- Inspired by: AWS Step Functions, Temporal.io, Salesforce Flow
-- ============================================================================

-- ── WORKFLOW DEFINITIONS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_definitions(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id  text        NOT NULL UNIQUE,
  name         text        NOT NULL,
  description  text,
  steps        text[]      NOT NULL DEFAULT '{}',
  triggers     text[]      DEFAULT '{}',
  is_active    boolean     DEFAULT true,
  version      text        DEFAULT '1.0',
  created_at   timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members read workflows" ON public.workflow_definitions;
CREATE POLICY "members read workflows" ON public.workflow_definitions FOR SELECT TO authenticated USING(is_active=true);

INSERT INTO public.workflow_definitions(workflow_id,name,description,steps,triggers) VALUES
  ('onboarding','Sovereign Onboarding','Complete member onboarding after zodiac selection',
   ARRAY['select_sign','assign_element_agent','set_initial_axes','send_welcome','record_event'],
   ARRAY['member.created']),
  ('gate_unlock','Gate Unlock Ceremony','Ceremonial gate unlock when authority crosses threshold',
   ARRAY['verify_auth','compute_gate','show_celebration','record_achievement','notify_owner'],
   ARRAY['auth.gate_crossed']),
  ('task_complete','Task Completion','Full task pipeline with gate check',
   ARRAY['validate_task','increment_axis','recompute_auth','check_gate','emit_events','log_activity'],
   ARRAY['member.task_completed']),
  ('dedication_award','Dedication Award','Award when daily dedication target reached',
   ARRAY['verify_duration','award_axis_c','show_celebration','log_dedication'],
   ARRAY['dedication.target_reached']),
  ('report_generate','Progress Report','Generate member progress report',
   ARRAY['query_profile','query_tasks','build_report','cache_result'],
   ARRAY['report.requested'])
ON CONFLICT(workflow_id) DO NOTHING;

-- ── WORKFLOW EXECUTIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.workflow_executions(
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id  text        NOT NULL UNIQUE,
  workflow_id  text        NOT NULL REFERENCES public.workflow_definitions(workflow_id),
  user_id      uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  status       text        NOT NULL DEFAULT 'running',
  input        jsonb       DEFAULT '{}',
  output       jsonb       DEFAULT '{}',
  steps_log    jsonb       DEFAULT '[]',
  started_at   timestamptz NOT NULL DEFAULT now(),
  ended_at     timestamptz,
  duration_ms  int,
  error_msg    text,
  CONSTRAINT status_ck CHECK(status IN('running','completed','failed','cancelled'))
);
CREATE INDEX IF NOT EXISTS idx_wf_exec_user ON public.workflow_executions(user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_wf_exec_wf   ON public.workflow_executions(workflow_id, status, started_at DESC);
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "member sees own executions" ON public.workflow_executions;
CREATE POLICY "member sees own executions" ON public.workflow_executions FOR SELECT USING(user_id=auth.uid());
DROP POLICY IF EXISTS "member inserts executions" ON public.workflow_executions;
CREATE POLICY "member inserts executions" ON public.workflow_executions FOR INSERT TO authenticated WITH CHECK(user_id=auth.uid());
DROP POLICY IF EXISTS "owner sees all executions" ON public.workflow_executions;
CREATE POLICY "owner sees all executions" ON public.workflow_executions FOR SELECT USING(public.is_platform_owner());

-- ── LOG WORKFLOW EXECUTION RPC ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.log_workflow_execution(
  p_instance_id text,
  p_workflow_id  text,
  p_status       text,
  p_output       jsonb DEFAULT '{}',
  p_duration_ms  int   DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.workflow_executions(instance_id,workflow_id,user_id,status,output,ended_at,duration_ms)
  VALUES(p_instance_id,p_workflow_id,auth.uid(),p_status,p_output,CASE WHEN p_status<>'running' THEN now() ELSE NULL END,p_duration_ms)
  ON CONFLICT(instance_id) DO UPDATE SET status=EXCLUDED.status,output=EXCLUDED.output,ended_at=EXCLUDED.ended_at,duration_ms=EXCLUDED.duration_ms;
  RETURN jsonb_build_object('ok',true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.log_workflow_execution(text,text,text,jsonb,int) TO authenticated;

-- ── WORKFLOW ANALYTICS VIEW ───────────────────────────────────────────────
CREATE OR REPLACE VIEW public.workflow_analytics AS
SELECT
  wd.name,
  COUNT(we.id)                   AS total_executions,
  COUNT(*) FILTER(WHERE we.status='completed') AS completed,
  COUNT(*) FILTER(WHERE we.status='failed')    AS failed,
  ROUND(AVG(we.duration_ms))     AS avg_duration_ms,
  MAX(we.started_at)             AS last_executed
FROM public.workflow_definitions wd
LEFT JOIN public.workflow_executions we ON we.workflow_id=wd.workflow_id
GROUP BY wd.workflow_id,wd.name ORDER BY total_executions DESC;
