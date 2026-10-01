(() => {
  "use strict";

  /* ── State ── */
  const state = { sb: null, userId: null, nodes: [], edges: [], selected: null, hovered: null };
  let canvas, ctx, cssW = 0, cssH = 0, dragNode = null, dragOffX = 0, dragOffY = 0;
  let panX = 0, panY = 0, panStart = null, scale = 1;
  let animating = true;

  const CAT_COLOR = {
    hub:      "#C9A84C",
    event:    "#5BC0EB",
    evidence: "#20A39E",
    task:     "#9BC53D",
    graph:    "#A663CC"
  };
  const CAT_RADIUS = { hub: 34, event: 22, evidence: 22, task: 22, graph: 22 };

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

  /* ── Graph construction ──
     Honest topology: a single MEMBER hub node, with every real row from
     each of the four sources as a satellite connected to that hub.
     No cross-source relationship is invented — the underlying tables carry
     no foreign keys between event_type/capability_id/task/source_type, so
     a star topology is the only structure the data actually supports. */
  function buildGraph(events, evidence, tasks, graph) {
    const nodes = [{ id: "hub", label: "YOU", desc: "Member-scoped evidence hub.", cat: "hub", x: 0, y: 0, vx: 0, vy: 0, fixed: true }];
    const edges = [];
    let n = 0;
    const place = (cat, list, mapRow) => {
      list.forEach((row) => {
        const id = cat + "-" + (row.id ?? n);
        const angle = (n * 137.508) * (Math.PI / 180); // golden-angle spiral seed
        const r = 60 + n * 6;
        nodes.push({
          id, cat,
          label: mapRow(row).label,
          desc: mapRow(row).when || "",
          x: Math.cos(angle) * r, y: Math.sin(angle) * r,
          vx: 0, vy: 0
        });
        edges.push({ source: "hub", target: id });
        n++;
      });
    };
    place("event", events, (x) => ({ label: x.event_type || "event", when: x.created_at }));
    place("evidence", evidence, (x) => ({ label: (x.capability_id || "capability") + " · " + (x.result || "?"), when: x.recorded_at }));
    place("task", tasks, (x) => ({ label: x.task_name || x.task || "task", when: x.completed_at || x.created_at }));
    place("graph", graph, (x) => ({ label: (x.source_type || "source") + " · " + (x.source_table || ""), when: x.extraction_timestamp }));
    return { nodes, edges };
  }

  /* ── Force simulation (identical model to atlas.html's proven engine) ── */
  const K_SPRING = 0.04, L_REST = 90, K_REPEL = 2400, DAMP = 0.85;
  function simulate() {
    const nodes = state.nodes, edges = state.edges;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x, dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = K_REPEL / (dist * dist);
      nodes[i].vx -= f * dx / dist; nodes[i].vy -= f * dy / dist;
      nodes[j].vx += f * dx / dist; nodes[j].vy += f * dy / dist;
    }
    edges.forEach((e) => {
      const s = nodes.find((n) => n.id === e.source), t = nodes.find((n) => n.id === e.target);
      if (!s || !t) return;
      const dx = t.x - s.x, dy = t.y - s.y, dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = K_SPRING * (dist - L_REST);
      if (!s.fixed) { s.vx += f * dx / dist; s.vy += f * dy / dist; }
      if (!t.fixed) { t.vx -= f * dx / dist; t.vy -= f * dy / dist; }
    });
    nodes.forEach((n) => { if (!n.fixed) { n.vx -= n.x * 0.003; n.vy -= n.y * 0.003; } });
    nodes.forEach((n) => {
      if (n === dragNode || n.fixed) return;
      n.vx *= DAMP; n.vy *= DAMP;
      n.x += n.vx; n.y += n.vy;
    });
  }

  function worldToScreen(x, y) { return { x: (x + panX) * scale + cssW / 2, y: (y + panY) * scale + cssH / 2 }; }
  function screenToWorld(sx, sy) { return { x: (sx - cssW / 2) / scale - panX, y: (sy - cssH / 2) / scale - panY }; }

  function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, cssW, cssH);
    const gold = getComputedStyle(document.documentElement).getPropertyValue("--gold").trim() || "#C9A84C";

    state.edges.forEach((e) => {
      const s = state.nodes.find((n) => n.id === e.source), t = state.nodes.find((n) => n.id === e.target);
      if (!s || !t) return;
      const sp = worldToScreen(s.x, s.y), tp = worldToScreen(t.x, t.y);
      ctx.beginPath(); ctx.moveTo(sp.x, sp.y); ctx.lineTo(tp.x, tp.y);
      ctx.strokeStyle = "rgba(201,168,76,.14)"; ctx.lineWidth = 1; ctx.stroke();
    });

    state.nodes.forEach((n) => {
      const p = worldToScreen(n.x, n.y);
      const r = (CAT_RADIUS[n.cat] || 20) * scale;
      const color = CAT_COLOR[n.cat] || gold;
      const isSel = n === state.selected, isHov = n === state.hovered;
      if (isSel || isHov) {
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2);
        const grd = ctx.createRadialGradient(p.x, p.y, r, p.x, p.y, r + 10);
        grd.addColorStop(0, color + "55"); grd.addColorStop(1, "transparent");
        ctx.fillStyle = grd; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = isSel ? color + "44" : color + "22"; ctx.fill();
      ctx.strokeStyle = isSel ? color : isHov ? color + "aa" : color + "55";
      ctx.lineWidth = isSel ? 2 : 1; ctx.stroke();
      if (n.cat === "hub") {
        const fontSize = Math.max(9, Math.min(13, 11 * scale));
        ctx.font = `${fontSize}px monospace`; ctx.fillStyle = color;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(n.label, p.x, p.y);
      }
    });
  }

  function loop() { if (animating) { simulate(); draw(); } requestAnimationFrame(loop); }

  function getNodeAt(sx, sy) {
    const w = screenToWorld(sx, sy);
    return state.nodes.find((n) => {
      const dx = n.x - w.x, dy = n.y - w.y, r = (CAT_RADIUS[n.cat] || 20) / scale;
      return dx * dx + dy * dy < r * r;
    });
  }

  function showPanel(node) {
    const panel = document.querySelector("[data-evidence-panel]");
    if (!panel) return;
    panel.classList.add("open");
    panel.querySelector("[data-panel-title]").textContent = node.label;
    panel.querySelector("[data-panel-body]").textContent = node.desc || "No timestamp recorded.";
    panel.querySelector("[data-panel-type]").textContent = node.cat.toUpperCase();
  }
  function hidePanel() {
    const panel = document.querySelector("[data-evidence-panel]");
    if (panel) panel.classList.remove("open");
  }

  function bindCanvas() {
    canvas = document.querySelector("[data-evidence-canvas]");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    const resize = () => {
      const wrap = canvas.parentElement;
      const dpr = Math.max(2, window.devicePixelRatio || 1);
      cssW = wrap.clientWidth; cssH = wrap.clientHeight || 480;
      canvas.width = cssW * dpr; canvas.height = cssH * dpr;
      canvas.style.width = cssW + "px"; canvas.style.height = cssH + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    window.addEventListener("resize", resize);
    resize();

    canvas.addEventListener("mousedown", (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      const node = getNodeAt(sx, sy);
      if (node) {
        state.selected = node; dragNode = node;
        const w = screenToWorld(sx, sy);
        dragOffX = node.x - w.x; dragOffY = node.y - w.y;
        showPanel(node);
      } else {
        state.selected = null; hidePanel();
        panStart = { sx, sy, px: panX, py: panY };
      }
    });
    canvas.addEventListener("mousemove", (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
      if (dragNode) {
        const w = screenToWorld(sx, sy);
        dragNode.x = w.x + dragOffX; dragNode.y = w.y + dragOffY;
        dragNode.vx = 0; dragNode.vy = 0;
      } else if (panStart) {
        panX = panStart.px + (sx - panStart.sx) / scale;
        panY = panStart.py + (sy - panStart.sy) / scale;
      }
      state.hovered = getNodeAt(sx, sy);
      canvas.style.cursor = state.hovered ? "pointer" : (dragNode || panStart ? "grabbing" : "grab");
    });
    canvas.addEventListener("mouseup", () => { dragNode = null; panStart = null; });
    canvas.addEventListener("wheel", (e) => {
      e.preventDefault();
      scale = Math.min(3, Math.max(0.3, scale * (e.deltaY < 0 ? 1.1 : 0.9)));
    }, { passive: false });

    resize();
    loop();
  }

  /* One client per page: bg.js owns it (window.OmegaSB.get -> window.__omegaSb).
     Never construct a client here — see prior fix history for why. */
  async function getClient() {
    if (window.__omegaSb) return window.__omegaSb;
    try { if (window.OmegaSB?.get) return await window.OmegaSB.get(); } catch {}
    return null;
  }

  async function load() {
    bindCanvas();
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
      } else {
        setStatus("UNAVAILABLE", "Sign in to view member-scoped evidence.");
      }
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
    const failedNames = ["events", "evidence", "tasks", "graph"].filter((_, i) => queries[i].error);
    if (failedNames.length) {
      setStatus("PARTIAL", "Some evidence sources could not be read: " + failedNames.join(", ") + ".");
    } else {
      setStatus("LIVE", "Member-scoped evidence graph is live.");
    }

    /* A failed source is unknown, not zero: rendering 0 would assert an
       empty record that was never read (CLAUDE.md 8.1 class 9). */
    const count = (q) => (q.error ? "—" : (q.data?.length ?? 0));
    renderSummary({ events: count(events), evidence: count(evidence), tasks: count(tasks), graph: count(graph) });

    const { nodes, edges } = buildGraph(events.data || [], evidence.data || [], tasks.data || [], graph.data || []);
    state.nodes = nodes; state.edges = edges;

    const rowHost = document.querySelector("[data-evidence-chain]");
    if (rowHost) {
      rowHost.replaceChildren();
      if (nodes.length <= 1) {
        rowHost.append(el("p", "No evidence chain is available for the current member."));
      }
    }
  }

  document.addEventListener("DOMContentLoaded", load);
})();
