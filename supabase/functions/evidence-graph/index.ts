import { withSupabase } from "npm:@supabase/server@^1";

const LIMIT = 9;

export default {
  fetch: withSupabase({ auth: "user" }, async (_req, ctx) => {
    const startedAt = new Date().toISOString();
    const userId = ctx.userClaims?.sub;

    if (!userId) {
      return Response.json(
        { ok: false, generated_at: startedAt, error: "authentication_required" },
        { status: 401, headers: { "Cache-Control": "no-store" } }
      );
    }

    const [events, evidence, tasks, graphEvidence] = await Promise.all([
      ctx.supabase
        .from("omega_platform_events")
        .select("id,event_type,route,metadata,created_at")
        .eq("actor_user_id", userId)
        .order("created_at", { ascending: false })
        .limit(LIMIT),
      ctx.supabaseAdmin
        .from("omega_platform_evidence")
        .select("id,capability_id,evidence_level,check_name,result,evidence,commit_sha,workflow_run_id,recorded_at")
        .order("recorded_at", { ascending: false })
        .limit(LIMIT),
      ctx.supabase
        .from("task_completions")
        .select("id,kind,task,completed_at,axis,increment,task_name,task_type,axis_type,description,points_earned,created_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false })
        .limit(LIMIT),
      ctx.supabase
        .from("graph_evidence")
        .select("id,source_type,source_table,source_row_id,source_url,extracted_text,extraction_confidence,extraction_method,ai_model_used,extraction_timestamp,human_verified,reasoning_notes")
        .eq("user_id", userId)
        .order("extraction_timestamp", { ascending: false })
        .limit(LIMIT),
    ]);

    const failures = [
      events.error && "omega_platform_events",
      evidence.error && "omega_platform_evidence",
      tasks.error && "task_completions",
      graphEvidence.error && "graph_evidence",
    ].filter(Boolean);

    if (failures.length) {
      return Response.json(
        {
          ok: false,
          generated_at: startedAt,
          error: "live_data_query_failed",
          failed_sources: failures,
        },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    const [eventCount, evidenceCount, taskCount, graphCount] = await Promise.all([
      ctx.supabase
        .from("omega_platform_events")
        .select("*", { count: "exact", head: true })
        .eq("actor_user_id", userId),
      ctx.supabaseAdmin
        .from("omega_platform_evidence")
        .select("*", { count: "exact", head: true }),
      ctx.supabase
        .from("task_completions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
      ctx.supabase
        .from("graph_evidence")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId),
    ]);

    const countFailures = [
      eventCount.error && "omega_platform_events",
      evidenceCount.error && "omega_platform_evidence",
      taskCount.error && "task_completions",
      graphCount.error && "graph_evidence",
    ].filter(Boolean);

    if (countFailures.length) {
      return Response.json(
        {
          ok: false,
          generated_at: startedAt,
          error: "live_count_query_failed",
          failed_sources: countFailures,
        },
        { status: 502, headers: { "Cache-Control": "no-store" } }
      );
    }

    return Response.json(
      {
        ok: true,
        generated_at: startedAt,
        source_state: {
          omega_platform_events: { state: "LIVE", rows: eventCount.count ?? 0 },
          omega_platform_evidence: { state: "LIVE", rows: evidenceCount.count ?? 0, scope: "PLATFORM" },
          task_completions: { state: "LIVE", rows: taskCount.count ?? 0 },
          graph_evidence: {
            state: (graphCount.count ?? 0) === 0 ? "EMPTY" : "LIVE",
            rows: graphCount.count ?? 0,
            meaning:
              (graphCount.count ?? 0) === 0
                ? "The graph-evidence table is reachable and currently contains no rows for this member."
                : "Graph evidence rows are available for this member.",
          },
        },
        events: events.data ?? [],
        evidence: evidence.data ?? [],
        tasks: tasks.data ?? [],
        graph_evidence: graphEvidence.data ?? [],
      },
      { headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=30" } }
    );
  }),
};
