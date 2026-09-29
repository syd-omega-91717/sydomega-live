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
      ["EVENTS", counts.events, "Your persisted platform events", "MEMBER"],
      ["EVIDENCE", counts.evidence, "Platform-wide capability checks — not owned by you", "PLATFORM"],
      ["TASKS", counts.tasks, "Your completed task records", "MEMBER"],
      ["GRAPH", counts.graph, "Your graph evidence records", "MEMBER"]
    ].forEach(([label, value, detail, scope]) => {
      const card = el("article");
      card.className = "omega-evidence-card";
      card.dataset.scope = scope;
      card.append(el("em", scope), el("strong", label), el("b", value), el("span", detail));
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

  /* One client per page: bg.js owns it (window.OmegaSB.get -> window.__omegaSb).
     This module used to build its own with a publishable key that does not
     exist on the project, so auth.getUser() failed and a signed-in member was
     told to sign in, and every read failed. Never construct a client here. */
  async function getClient() {
    if (window.__omegaSb) return window.__omegaSb;
    try {
      if (window.OmegaSB?.get) return await window.OmegaSB.get();
    } catch {}
    return null;
  }

  async function load() {
    state.sb = await getClient();
    if (!state.sb) {
      setStatus("UNAVAILABLE", "Supabase client unavailable.");
      renderSummary({ events: "—", evidence: "—", tasks: "—", graph: "—" });
      return;
    }

    const { data: auth, error: authError } = await state.sb.auth.getUser();
    state.userId = auth?.user?.id || null;
    if (!state.userId) {
      if (authError && authError.name !== "AuthSessionMissingError") {
        setStatus("UNAVAILABLE", "Identity could not be verified. Evidence is not shown.");
        renderSummary({ events: "—", evidence: "—", tasks: "—", graph: "—" });
        return;
      }
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

    /* A failed source is unknown, not zero: rendering 0 would assert an
       empty record that was never read (CLAUDE.md 8.1 class 9). */
    const count = (q) => (q.error ? "—" : (q.data?.length ?? 0));
    renderSummary({
      events: count(events),
      evidence: count(evidence),
      tasks: count(tasks),
      graph: count(graph)
    });

    const rows = [
      ...(events.data || []).map((x) => ({ type: "EVENT", label: x.event_type, when: x.created_at })),
      ...(evidence.data || []).map((x) => ({ type: "PLATFORM EVIDENCE", label: x.capability_id + " · " + x.result, when: x.recorded_at })),
      ...(tasks.data || []).map((x) => ({ type: "TASK", label: x.task_name || x.task, when: x.completed_at || x.created_at })),
      ...(graph.data || []).map((x) => ({ type: "GRAPH EVIDENCE", label: x.source_type + " · " + (x.source_table || "source"), when: x.extraction_timestamp }))
    ];
    rows.sort((a, b) => String(b.when).localeCompare(String(a.when)));
    renderRows(rows.slice(0, 40));
  }

  document.addEventListener("DOMContentLoaded", load);
})();