/* ==========================================================================
   Ω SYD OMEGA 91717 — omega-life-log.js  (life.html only)

   LIFE: one daily log in place of ten tracker pages. Every entry is a row in
   public.life_entries (migration 20261017234857), so a trend is a query, not
   an array trapped in one browser. Plan: docs/plans/LIFE_CORE_PLAN.md.

   OWNERSHIP. KINDS below is the one copy of each kind's unit, one-tap step and
   source page (CLAUDE.md 8.1 class 8). The table's check constraint holds the
   same ten names; nothing else may define them.

   PRIVACY. RLS returns only the member's own rows -- the owner has no read
   branch, by owner decision. The encrypted journal is never imported.

   DORMANT. While platform_settings.life_core_enabled is not a confirmed true
   (CLAUDE.md 9), the log reads and displays but every write control is
   disabled with the reason shown; each tile still links to its tracker. The
   flag is read through get_platform_flag and fails closed.

   WRITES. Supabase resolves to {data,error} and does not throw (8.1 class 1),
   so every insert/delete asks for the affected rows back and changes the tile
   only when .error is null AND a row came back -- an RLS-filtered no-op
   returns zero rows without an error.
   ========================================================================== */
(function () {
  'use strict';
  if (window.OmegaLifeLog) return;

  var FLAG = 'life_core_enabled';
  var DAYS = 14;

  /* agg: how a day's entries become one number. sum adds them, last keeps the
     latest, avg averages them. step: what one tap logs. pick: fixed choices.
     dial: a value the member sets before logging (sleep hours, body kg). */
  var KINDS = [
    { k: 'mood',      label: 'MOOD',      glyph: '◐', unit: '/10', agg: 'avg',  pick: [2, 4, 6, 8, 10], href: '/mood.html' },
    { k: 'sleep',     label: 'SLEEP',     glyph: '☾', unit: 'h',   agg: 'last', dial: { def: 7.5, step: 0.5, min: 0, max: 16, dp: 1 }, href: '/sleep.html' },
    { k: 'water',     label: 'WATER',     glyph: '≈', unit: 'ml',  agg: 'sum',  step: 250, href: '/water.html' },
    { k: 'workout',   label: 'TRAINING',  glyph: '⚔︎', unit: 'sessions', agg: 'sum', step: 1, href: '/workout.html' },
    { k: 'meditate',  label: 'STILLNESS', glyph: '◎', unit: 'min', agg: 'sum',  step: 5, href: '/meditate.html' },
    { k: 'breath',    label: 'BREATH',    glyph: '∿', unit: 'min', agg: 'sum',  step: 3, href: '/breath.html' },
    { k: 'gratitude', label: 'GRATITUDE', glyph: '✧', unit: 'items', agg: 'sum', step: 1, note: true, href: '/gratitude.html' },
    { k: 'body',      label: 'BODY',      glyph: '⚖︎', unit: 'kg',  agg: 'last', dial: { def: 70, step: 0.1, min: 20, max: 300, dp: 1 }, href: '/body.html' },
    { k: 'fasting',   label: 'FASTING',   glyph: '◷', unit: 'h',   agg: 'sum',  dial: { def: 16, step: 1, min: 1, max: 72, dp: 0 }, href: '/fasting.html' },
    { k: 'habit',     label: 'HABITS',    glyph: '◈', unit: 'done', agg: 'sum', step: 1, href: '/habits.html' }
  ];
  var BY = {};
  KINDS.forEach(function (d) { BY[d.k] = d; });

  var state = { sb: null, uid: null, enabled: false, rows: [], day: null, busy: {}, dial: {} };
  var root, els = {};

  /* ---------- dates: local calendar days, YYYY-MM-DD ---------- */
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function today() { return iso(new Date()); }
  function shift(dayStr, n) { var p = dayStr.split('-'); return iso(new Date(+p[0], +p[1] - 1, +p[2] + n)); }
  function window14() { var t = today(), out = []; for (var i = DAYS - 1; i >= 0; i--) out.push(shift(t, -i)); return out; }
  function dayOf(v) {
    if (v == null) return null;
    if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
    var d = new Date(typeof v === 'number' ? v : String(v));
    return isNaN(d.getTime()) ? null : iso(d);
  }

  /* ---------- DOM helpers (textContent only: no markup from data) ---------- */
  function el(tag, cls, text, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function fmt(v, dp) {
    if (v == null || !isFinite(v)) return '—';
    var f = Math.pow(10, dp == null ? 1 : dp);
    var r = Math.round(v * f) / f;
    return r >= 10000 ? (Math.round(r / 100) / 10) + 'k' : String(r);
  }

  /* ---------- aggregation ---------- */
  function rowsFor(kind, day) {
    return state.rows.filter(function (r) { return r.kind === kind && r.day === day; });
  }
  function agg(kind, day) {
    var rs = rowsFor(kind, day).filter(function (r) { return r.value != null && isFinite(+r.value); });
    if (!rs.length) return null;
    var how = BY[kind].agg;
    if (how === 'last') return +rs[rs.length - 1].value;
    var s = rs.reduce(function (a, r) { return a + (+r.value); }, 0);
    return how === 'avg' ? s / rs.length : s;
  }
  function series(kind) {
    return window14().map(function (d) { return agg(kind, d); }).filter(function (v) { return v != null; });
  }
  function streak() {
    var have = {};
    state.rows.forEach(function (r) { have[r.day] = true; });
    var d = have[today()] ? today() : shift(today(), -1), n = 0;
    while (have[d] && n < DAYS) { n++; d = shift(d, -1); }
    return n;
  }

  /* ---------- style (once) ---------- */
  function style() {
    if (document.getElementById('oll-style')) return;
    var s = document.createElement('style');
    s.id = 'oll-style';
    s.textContent = [
      '.oll{margin:0 0 28px;display:grid;gap:14px}',
      '.oll-top{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px}',
      '.oll-title{font-family:var(--D,serif);letter-spacing:.12em;font-size:1rem;margin:0;color:var(--gold,#d4af37)}',
      '.oll-stat{font-family:var(--M,monospace);font-size:.72rem;letter-spacing:.14em;color:var(--muted,#9aa)}',
      '.oll-stat b{color:var(--ink,#eee);font-size:1rem;margin-right:4px}',
      '.oll-state{font-family:var(--M,monospace);font-size:.7rem;letter-spacing:.12em;padding:8px 12px;border:1px solid rgba(212,175,55,.35);border-radius:8px;color:var(--ink,#eee)}',
      '.oll-state[hidden]{display:none}',
      '.oll-days{display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px;scrollbar-width:thin}',
      '.oll-day{flex:0 0 auto;min-width:44px;min-height:52px;display:grid;place-items:center;gap:2px;padding:6px 4px;border-radius:10px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.03);color:var(--ink,#eee);font-family:var(--M,monospace);font-size:.62rem;letter-spacing:.08em;cursor:pointer;overflow:visible}',
      '.oll-day b{font-size:.9rem;letter-spacing:0}',
      '.oll-day i{display:block;width:6px;height:6px;border-radius:50%;background:transparent}',
      '.oll-day.has i{background:var(--gold,#d4af37)}',
      '.oll-day[aria-pressed="true"]{border-color:var(--gold,#d4af37);background:rgba(212,175,55,.14)}',
      '.oll-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(158px,1fr));gap:10px}',
      '.oll-tile{position:relative;display:grid;gap:8px;align-content:start;padding:14px;border-radius:14px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.035)}',
      '.oll-tile.on{border-color:rgba(212,175,55,.45)}',
      '.oll-tile.flash{animation:oll-flash .6s ease-out}',
      '@keyframes oll-flash{0%{box-shadow:0 0 0 0 rgba(212,175,55,.55)}100%{box-shadow:0 0 0 14px rgba(212,175,55,0)}}',
      '@media (prefers-reduced-motion:reduce){.oll-tile.flash{animation:none}}',
      '.oll-head{display:flex;align-items:center;gap:8px;font-family:var(--M,monospace);font-size:.66rem;letter-spacing:.16em;color:var(--muted,#9aa)}',
      '.oll-head span:first-child{font-size:1.1rem;color:var(--gold,#d4af37);letter-spacing:0}',
      '.oll-head a{margin-left:auto;color:var(--muted,#9aa);text-decoration:none;font-size:.9rem}',
      '.oll-val{font-family:var(--R,sans-serif);font-size:1.7rem;font-weight:700;line-height:1;color:var(--ink,#eee)}',
      '.oll-val small{font-size:.7rem;font-weight:400;margin-left:4px;color:var(--muted,#9aa);letter-spacing:.08em}',
      '.oll-act{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
      '.oll-act button{min-height:36px;min-width:36px;padding:6px 10px;border-radius:9px;border:1px solid rgba(212,175,55,.45);background:rgba(212,175,55,.1);color:var(--ink,#eee);font-family:var(--M,monospace);font-size:.72rem;letter-spacing:.06em;cursor:pointer;overflow:visible;white-space:nowrap}',
      '.oll-act button:disabled{opacity:.42;cursor:not-allowed}',
      '.oll-act button.ghost{border-color:rgba(255,255,255,.14);background:none;color:var(--muted,#9aa)}',
      '.oll-act output{font-family:var(--M,monospace);font-size:.8rem;min-width:3.2em;text-align:center}',
      '.oll-act input{flex:1 1 90px;min-width:0;min-height:36px;padding:6px 8px;border-radius:9px}',
      '.oll-msg{min-height:1em;font-family:var(--M,monospace);font-size:.62rem;letter-spacing:.08em;color:var(--muted,#9aa)}',
      '.oll-msg.err{color:var(--crim,#e06060)}',
      '.oll-foot{display:flex;flex-wrap:wrap;gap:10px;align-items:center}',
      '.oll-foot button{min-height:38px;padding:8px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:none;color:var(--ink,#eee);font-family:var(--M,monospace);font-size:.7rem;letter-spacing:.12em;cursor:pointer;overflow:visible}',
      '.oll-foot button:disabled{opacity:.42;cursor:not-allowed}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- skeleton ---------- */
  function build() {
    root.textContent = '';
    root.classList.add('oll');
    root.setAttribute('aria-label', 'Daily log');
    var top = el('div', 'oll-top', null, root);
    el('h2', 'oll-title', 'TODAY’S LOG', top);
    els.logged = el('span', 'oll-stat', null, top);
    els.streak = el('span', 'oll-stat', null, top);
    els.state = el('div', 'oll-state', null, root);
    els.state.setAttribute('role', 'status');
    els.days = el('div', 'oll-days', null, root);
    els.days.setAttribute('role', 'group');
    els.days.setAttribute('aria-label', 'Choose a day');
    els.grid = el('div', 'oll-grid', null, root);
    els.tiles = {};
    KINDS.forEach(function (d) { els.tiles[d.k] = tile(d); });
    var foot = el('div', 'oll-foot', null, root);
    els.importBtn = el('button', null, 'IMPORT FROM THIS BROWSER', foot);
    els.importBtn.type = 'button';
    els.importBtn.addEventListener('click', importLocal);
    els.importMsg = el('span', 'oll-msg', null, foot);
  }

  function tile(d) {
    var t = el('article', 'oll-tile', null, els.grid);
    t.setAttribute('data-kind', d.k);
    var h = el('div', 'oll-head', null, t);
    el('span', null, d.glyph, h).setAttribute('aria-hidden', 'true');
    el('span', null, d.label, h);
    var a = el('a', null, '↗', h);
    a.href = d.href;
    a.setAttribute('aria-label', d.label + ' tracker');
    var v = el('div', 'oll-val', null, t);
    var spark = el('div', null, null, t);
    spark.setAttribute('data-omega-spark', '');
    spark.setAttribute('data-spark-label', d.label + ' · ' + DAYS + ' DAYS');
    spark.setAttribute('data-spark-unit', d.unit);
    var act = el('div', 'oll-act', null, t);
    var ctl = { tile: t, val: v, spark: spark, buttons: [] };
    function btn(text, label, fn, cls) {
      var b = el('button', cls || null, text, act);
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.addEventListener('click', fn);
      ctl.buttons.push(b);
      return b;
    }
    if (d.pick) {
      d.pick.forEach(function (p) { btn(String(p), d.label + ' ' + p + ' of 10', function () { log(d.k, p); }); });
    } else if (d.dial) {
      state.dial[d.k] = d.dial.def;
      btn('−', 'Less', function () { nudge(d.k, -1); }, 'ghost');
      ctl.out = el('output', null, null, act);
      btn('+', 'More', function () { nudge(d.k, 1); }, 'ghost');
      btn('LOG', 'Log ' + d.label, function () { log(d.k, state.dial[d.k]); });
    } else {
      if (d.note) {
        ctl.note = el('input', 'inp', null, act);
        ctl.note.type = 'text';
        ctl.note.maxLength = 280;
        ctl.note.placeholder = 'one thing';
        ctl.note.setAttribute('aria-label', 'Gratitude note');
        ctl.note.addEventListener('keydown', function (e) { if (e.key === 'Enter') log(d.k, d.step); });
        ctl.buttons.push(ctl.note);
      }
      btn('+' + d.step, 'Add ' + d.step + ' ' + d.unit, function () { log(d.k, d.step); });
    }
    ctl.undo = btn('UNDO', 'Remove the latest ' + d.label + ' entry for this day', function () { undo(d.k); }, 'ghost');
    ctl.msg = el('div', 'oll-msg', null, t);
    ctl.msg.setAttribute('aria-live', 'polite');
    return ctl;
  }

  function nudge(kind, dir) {
    var dl = BY[kind].dial, f = Math.pow(10, dl.dp);
    var v = Math.round((state.dial[kind] + dir * dl.step) * f) / f;
    state.dial[kind] = Math.min(dl.max, Math.max(dl.min, v));
    paintTile(kind);
  }

  /* ---------- paint ---------- */
  function paint() {
    var days = window14(), has = {};
    state.rows.forEach(function (r) { has[r.day] = true; });
    els.days.textContent = '';
    days.forEach(function (d) {
      var p = d.split('-'), date = new Date(+p[0], +p[1] - 1, +p[2]);
      var b = el('button', 'oll-day' + (has[d] ? ' has' : ''), null, els.days);
      b.type = 'button';
      el('span', null, date.toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2).toUpperCase(), b);
      el('b', null, String(date.getDate()), b);
      el('i', null, null, b);
      b.setAttribute('aria-pressed', d === state.day ? 'true' : 'false');
      b.setAttribute('aria-label', date.toDateString() + (has[d] ? ', has entries' : ''));
      b.addEventListener('click', function () { state.day = d; paint(); });
    });
    var logged = KINDS.filter(function (d) { return rowsFor(d.k, state.day).length; }).length;
    els.logged.textContent = '';
    el('b', null, logged + '/' + KINDS.length, els.logged);
    els.logged.appendChild(document.createTextNode(state.day === today() ? 'LOGGED TODAY' : 'LOGGED ' + state.day));
    els.streak.textContent = '';
    el('b', null, String(streak()), els.streak);
    els.streak.appendChild(document.createTextNode('DAY STREAK'));
    KINDS.forEach(function (d) { paintTile(d.k); });
    els.importBtn.disabled = !state.enabled || !state.uid;
  }

  function paintTile(kind) {
    var d = BY[kind], c = els.tiles[kind], v = agg(kind, state.day);
    c.val.textContent = v == null ? '—' : fmt(v, d.k === 'mood' ? 1 : (d.dial ? d.dial.dp : 0));
    el('small', null, v == null ? 'no entry' : d.unit, c.val);
    c.tile.classList.toggle('on', v != null);
    c.spark.setAttribute('data-spark-values', JSON.stringify(series(kind)));
    if (c.out) c.out.textContent = fmt(state.dial[kind], d.dial.dp) + d.unit;
    var off = !state.enabled || !state.uid;
    c.buttons.forEach(function (b) {
      var busy = !!state.busy[kind];
      b.disabled = off || busy || (b === c.undo && !rowsFor(kind, state.day).length);
      b.title = off ? (state.uid ? 'Logging opens when LIFE is switched on' : 'Sign in to log') : '';
    });
  }

  function say(kind, text, err) {
    var m = els.tiles[kind].msg;
    m.textContent = text || '';
    m.classList.toggle('err', !!err);
  }
  function flash(kind) {
    var t = els.tiles[kind].tile;
    t.classList.remove('flash');
    void t.offsetWidth;
    t.classList.add('flash');
  }

  /* ---------- writes ---------- */
  async function log(kind, value) {
    if (!state.enabled || !state.uid || state.busy[kind]) return;
    var c = els.tiles[kind], note = c.note ? c.note.value.trim() : '';
    state.busy[kind] = true; paintTile(kind); say(kind, 'saving…');
    var row = { user_id: state.uid, kind: kind, day: state.day, value: value, source: 'life' };
    if (note) row.note = note.slice(0, 2000);
    var r = await state.sb.from('life_entries').insert(row).select('id,kind,day,value,note,created_at');
    state.busy[kind] = false;
    if (r.error || !r.data || !r.data.length) {
      say(kind, 'NOT SAVED · ' + (r.error ? (r.error.code || r.error.message) : 'no row returned'), true);
      paintTile(kind);
      return;
    }
    state.rows.push(r.data[0]);
    if (c.note) c.note.value = '';
    say(kind, 'saved');
    paint(); flash(kind);
  }

  async function undo(kind) {
    if (!state.enabled || !state.uid || state.busy[kind]) return;
    var rs = rowsFor(kind, state.day);
    if (!rs.length) return;
    var last = rs[rs.length - 1];
    state.busy[kind] = true; paintTile(kind); say(kind, 'removing…');
    var r = await state.sb.from('life_entries').delete().eq('id', last.id).select('id');
    state.busy[kind] = false;
    if (r.error || !r.data || !r.data.length) {
      say(kind, 'NOT REMOVED · ' + (r.error ? (r.error.code || r.error.message) : 'no row matched'), true);
      paintTile(kind);
      return;
    }
    state.rows = state.rows.filter(function (x) { return x.id !== last.id; });
    say(kind, 'removed');
    paint();
  }

  /* ---------- import: explicit, idempotent, never deletes local data ---------- */
  function readLocal(key) {
    try { var v = JSON.parse(localStorage.getItem(key) || 'null'); return v; } catch (e) { return null; }
  }
  function num(v) { var n = +v; return isFinite(n) ? n : null; }
  function localRows() {
    var out = [];
    function push(kind, ref, day, value, note, data) {
      if (!day || !/^\d{4}-\d{2}-\d{2}$/.test(day) || ref == null) return;
      if (value != null && !isFinite(value)) return;
      var r = { user_id: state.uid, kind: kind, day: day, value: value, source: 'import', client_ref: (kind + ':' + ref).slice(0, 120), data: data || {} };
      if (note) r.note = String(note).slice(0, 2000);
      out.push(r);
    }
    function list(key) { var v = readLocal(key); return Array.isArray(v) ? v.filter(function (e) { return e && typeof e === 'object'; }) : []; }
    list('omega_mood_log').forEach(function (e) {
      push('mood', e.id || e.ts, dayOf(e.ts), num(e.valence), e.note, { state: e.state || null, energy: num(e.energy), stress: num(e.stress) });
    });
    list('omega_sleep_log').forEach(function (e) {
      push('sleep', e.id || e.date, dayOf(e.date), num(e.hours), null, { quality: e.quality == null ? null : e.quality });
    });
    list('omega_water_log').forEach(function (e) { push('water', e.id || e.ts, dayOf(e.ts), num(e.ml)); });
    list('omega_workout_log').forEach(function (e) {
      push('workout', e.id || e.ts, dayOf(e.ts), 1, e.notes, { name: e.name || null, exercises: Array.isArray(e.exercises) ? e.exercises.length : 0 });
    });
    list('omega_meditate_log').forEach(function (e) {
      var d = dayOf(e.date), s = num(e.duration);
      push('meditate', e.id || e.date, d, s == null ? null : Math.round(s / 6) / 10, null, { technique: e.tech || null });
    });
    list('omega_breath_log').forEach(function (e) {
      var s = num(e.duration);
      push('breath', e.id || e.ts, dayOf(e.ts), s == null ? null : Math.round(s / 6) / 10, null, { technique: e.technique || null, cycles: num(e.cycles) });
    });
    list('omega_gratitude_log').forEach(function (e) {
      var items = Array.isArray(e.items) ? e.items.filter(Boolean) : [];
      push('gratitude', e.ts || e.date, dayOf(e.date), items.length || 1, e.note || items.join(' · '));
    });
    list('omega_body_log').forEach(function (e) {
      push('body', e.id || e.date, dayOf(e.date), num(e.weight), null, { bf: num(e.bf), waist: num(e.waist) });
    });
    list('omega_fasting_log').forEach(function (e) {
      var s = num(e.elapsed);
      push('fasting', e.id || e.start, dayOf(e.start), s == null ? null : Math.round(s / 360) / 10, null, { protocol: e.proto || null, completed: !!e.completed });
    });
    var hl = readLocal('omega_habit_logs_v2');
    if (hl && typeof hl === 'object' && !Array.isArray(hl)) {
      Object.keys(hl).forEach(function (day) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !hl[day] || typeof hl[day] !== 'object') return;
        Object.keys(hl[day]).forEach(function (id) { if (hl[day][id]) push('habit', day + ':' + id, day, 1); });
      });
    }
    return out;
  }

  async function importLocal() {
    if (!state.enabled || !state.uid) return;
    var rows = localRows();
    if (!rows.length) { els.importMsg.textContent = 'Nothing to import from this browser.'; return; }
    els.importBtn.disabled = true;
    els.importMsg.classList.remove('err');
    var added = 0;
    for (var i = 0; i < rows.length; i += 200) {
      els.importMsg.textContent = 'importing ' + Math.min(i + 200, rows.length) + '/' + rows.length + '…';
      var r = await state.sb.from('life_entries')
        .upsert(rows.slice(i, i + 200), { onConflict: 'user_id,kind,client_ref', ignoreDuplicates: true })
        .select('id');
      if (r.error) {
        els.importMsg.textContent = 'IMPORT STOPPED · ' + (r.error.code || r.error.message) + ' · ' + added + ' added before it';
        els.importMsg.classList.add('err');
        els.importBtn.disabled = false;
        return;
      }
      added += (r.data || []).length;
    }
    els.importMsg.textContent = added + ' added · ' + (rows.length - added) + ' already here · this browser keeps its copy';
    els.importBtn.disabled = false;
    await load();
  }

  /* ---------- reads ---------- */
  async function load() {
    var r = await state.sb.from('life_entries')
      .select('id,kind,day,value,note,created_at')
      .gte('day', shift(today(), -(DAYS - 1)))
      .order('created_at', { ascending: true })
      .limit(5000);
    if (r.error) {
      els.state.hidden = false;
      els.state.textContent = 'LOG UNAVAILABLE · ' + (r.error.code || r.error.message);
      return false;
    }
    state.rows = r.data || [];
    paint();
    return true;
  }

  async function flag() {
    try {
      var r = await state.sb.rpc('get_platform_flag', { p_key: FLAG });
      return !r.error && r.data === true;
    } catch (e) { return false; }
  }

  async function client() {
    if (window.OmegaSB && typeof window.OmegaSB.get === 'function') return window.OmegaSB.get();
    return window.__omegaSb || null;
  }

  async function boot() {
    root = document.querySelector('[data-omega-life-log]');
    if (!root) return;
    style();
    build();
    state.day = today();
    paint();
    els.days.scrollLeft = els.days.scrollWidth;
    els.state.textContent = 'CHECKING YOUR SESSION…';
    try { state.sb = await client(); } catch (e) { state.sb = null; }
    if (!state.sb) { els.state.textContent = 'LOG UNAVAILABLE · DATABASE CLIENT DID NOT LOAD'; return; }
    var s = null;
    try { s = (await state.sb.auth.getSession()).data.session; } catch (e) { s = null; }
    if (!s || !s.user) { els.state.textContent = 'SIGN IN TO SEE YOUR LOG'; return; }
    state.uid = s.user.id;
    state.enabled = await flag();
    els.state.hidden = state.enabled;
    els.state.textContent = state.enabled ? '' :
      'LOGGING OPENS WHEN LIFE IS SWITCHED ON. UNTIL THEN, ↗ ON EACH TILE OPENS ITS TRACKER.';
    await load();
  }

  window.OmegaLifeLog = { kinds: KINDS.map(function (d) { return d.k; }), status: function () {
    return { enabled: state.enabled, signedIn: !!state.uid, rows: state.rows.length, day: state.day };
  } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
