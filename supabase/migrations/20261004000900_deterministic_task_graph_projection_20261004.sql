CREATE OR REPLACE FUNCTION public.project_task_completion_to_graph(p_task_id bigint)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE r public.task_completions%ROWTYPE; v_task_entity uuid; v_axis_entity uuid; v_relationship uuid; v_evidence uuid;
BEGIN
 SELECT * INTO r FROM public.task_completions WHERE id=p_task_id; IF NOT FOUND THEN RETURN; END IF;
 v_task_entity:=public.upsert_graph_entity(r.user_id,'event','task_completion:'||r.id::text,coalesce(nullif(r.task_name,''),r.task),coalesce(r.description,r.task),jsonb_build_object('source_table','task_completions','source_row_id',r.id::text,'kind',r.kind,'axis',r.axis),1.0,'verified_task_completion');
 IF r.axis IS NOT NULL AND btrim(r.axis)<>'' THEN
  v_axis_entity:=public.upsert_graph_entity(r.user_id,'concept','progression_axis:'||lower(btrim(r.axis)),'Progression axis '||upper(btrim(r.axis)),'Explicit axis recorded on the task completion.',jsonb_build_object('source_table','task_completions','source_field','axis'),1.0,'verified_task_completion');
  v_relationship:=public.add_graph_relationship(r.user_id,v_task_entity,v_axis_entity,'relates_to',1.0,1.0,'verified_task_completion');
 END IF;
 SELECT id INTO v_evidence FROM public.graph_evidence WHERE user_id=r.user_id AND source_table='task_completions' AND source_row_id=r.id::text AND source_type='verified_task_completion' LIMIT 1;
 IF v_evidence IS NULL THEN
  INSERT INTO public.graph_evidence(user_id,graph_entity_id,graph_relationship_id,source_type,source_table,source_row_id,extracted_text,extraction_confidence,extraction_method,ai_model_used,extraction_timestamp,human_verified,reasoning_notes)
  VALUES(r.user_id,v_task_entity,v_relationship,'verified_task_completion','task_completions',r.id::text,coalesce(r.description,r.task),1.0,'deterministic_projection',NULL,coalesce(r.completed_at,r.created_at,now()),false,'Projected only from an explicit task-completion record; not AI-generated and not human-verified.')
  RETURNING id INTO v_evidence;
 END IF;
 INSERT INTO public.graph_events(user_id,event_type,entity_id,relationship_id,evidence_id,occurred_at,recorded_at,change_summary,source_event_id)
 SELECT r.user_id,'task_completion_projected',v_task_entity,v_relationship,v_evidence,coalesce(r.completed_at,r.created_at,now()),now(),'Projected explicit task completion into the evidence graph.','task-completion:'||r.id::text
 WHERE NOT EXISTS(SELECT 1 FROM public.graph_events ge WHERE ge.user_id=r.user_id AND ge.source_event_id='task-completion:'||r.id::text);
END $$;
REVOKE ALL ON FUNCTION public.project_task_completion_to_graph(bigint) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.project_task_completion_to_graph(bigint) TO service_role;
CREATE OR REPLACE FUNCTION public.sync_task_completion_to_graph()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN PERFORM public.project_task_completion_to_graph(NEW.id); RETURN NEW; END $$;
REVOKE ALL ON FUNCTION public.sync_task_completion_to_graph() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_task_completion_to_graph() TO service_role;
DROP TRIGGER IF EXISTS task_completion_graph_projection ON public.task_completions;
CREATE TRIGGER task_completion_graph_projection AFTER INSERT OR UPDATE OF task,task_name,description,axis,completed_at ON public.task_completions FOR EACH ROW EXECUTE FUNCTION public.sync_task_completion_to_graph();

