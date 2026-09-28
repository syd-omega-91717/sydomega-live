(() => {
  "use strict";

  const state = { sb: null, userId: null };

  const reality = (value) => String(value || "UNAVAILABLE").toUpperCase();
  const el = (tag, text) => {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = String(text);
    return node;
  };

  function setStatus(kind, message) {
    const status = document.querySelector("[data-evidence-status]");
    if (!status) return;
    status.dataset.state = kind;
    status.textContent = message;
  }

  function renderSummary(counts) {
    const host = document.querySelector("[data-evidence-summary]");
    if (!host) return;
    host.replaceChildren();
    [
      ["EVENTS", counts.events, "Persisted platform events"],
      ["EVIDENCE", counts.evidence, "Capability evidence records"],
      ["TASKS", counts.tasks, "Completed task records"],
      ["GRAPH", counts.graph, "Graph evidence records"]
    ].forEach(([label, value, detail]) => {
      const card = el("article");
      card.className = "omega-evidence-card";
      card.append(el("strong", label), el("b", value), el("span", detail));
      host.append(card);
    });
  }

  function renderRows(rows) {
    const host = document.querySelector("[data-evidence-chain]");
    if (!host) return;
    host.replaceChildren();
    if (!rows.length) {
      host.append(el("p", "No evidence chain is available for the current member."));
      return;
    }
    rows.forEach((row) => {
      const article = el("article");
      article.className = "omega-evidence-row";
      article.append(
        el("strong", row.type),
        el("span", row.label),
        el("small", row.when)
      );
      host.append(article);
    });
  }

  async function getClient() {
    if (window.__omegaSb) return window.__omegaSb;
    if (window.supabase?.createClient) {
      return window.supabase.createClient(
        "https://ydqhzvvoyufiiqvzcjns.supabase.co",
        "sb_publishable_4L5Qy5vQ9pQm8hM0QmQ"
      );
    }
    try {
      const mod = await import("/vendor/supabase-js.js");
      return mod.createClient(
        "https://ydqhzvvoyufiiqvzcjns.supabase.co",
        "sb_publishable_4L5Qy5vQ9pQm8hM0QmQ"
      );
    } catch {
      return null;
    }
  }

  async function load() {
    state.sb = await getClient();
    if (!state.sb) {
      setStatus("UNAVAILABLE", "Supabase client unavailable.");
      renderSummary({ events: "—", evidence: "—", tasks: "—", graph: "—" });
      return;
    }

    const { data: auth } = await state.sb.auth.getUser();
    state.userId = auth?.user?.id || null;
    if (!state.userId) {
      setStatus("UNAVAILABLE", "Sign in to view member-scoped evidence.");
      renderSummary({ events: "—", evidence: "—", tasks: "—", graph: "—" });
      return;
    }

    const queries = await Promise.all([
      state.sb.from("omega_platform_events").select("id,event_type,route,created_at").eq("actor_user_id", state.userId).order("created_at", { ascending: false }).limit(50),
      state.sb.from("omega_platform_evidence").select("id,capability_id,check_name,result,recorded_at").order("recorded_at", { ascending: false }).limit(50),
      state.sb.from("task_completions").select("id,task,task_name,completed_at,created_at").eq("user_id", state.userId).order("created_at", { ascending: false }).limit(50),
      state.sb.from("graph_evidence").select("id,source_type,source_table,source_row_id,extraction_timestamp").eq("user_id", state.userId).order("extraction_timestamp", { ascending: false }).limit(50)
    ]);

    const [events, evidence, tasks, graph] = queries;
    const errors = queries.filter((q) => q.error).map((q) => q.error);
    if (errors.length) {
      setStatus("PARTIAL", "Some evidence sources could not be read.");
    } else {
      setStatus("LIVE", "Member-scoped evidence graph is live.");
    }

    renderSummary({
      events: events.data?.length ?? 0,
      evidence: evidence.data?.length ?? 0,
      tasks: tasks.data?.length ?? 0,
      graph: graph.data?.length ?? 0
    });

    const rows = [
      ...(events.data || []).map((x) => ({ type: "EVENT", label: x.event_type, when: x.created_at })),
      ...(evidence.data || []).map((x) => ({ type: "CAPABILITY EVIDENCE", label: x.capability_id + " · " + x.result, when: x.recorded_at })),
      ...(tasks.data || []).map((x) => ({ type: "TASK", label: x.task_name || x.task, when: x.completed_at || x.created_at })),
      ...(graph.data || []).map((x) => ({ type: "GRAPH EVIDENCE", label: x.source_type + " · " + (x.source_table || "source"), when: x.extraction_timestamp }))
    ];
    rows.sort((a, b) => String(b.when).localeCompare(String(a.when)));
    renderRows(rows.slice(0, 40));
  }

  document.addEventListener("DOMContentLoaded", load);
})();